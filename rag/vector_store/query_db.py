from sqlalchemy.ext.asyncio import AsyncSession
from langchain_core.tools import tool
from rag.embeddings.get_embeddings_client import get_embeddings_client
from sqlalchemy import text


def make_retrieve_tool(db: AsyncSession):
    """
    Factory that closes over `db` and returns a proper LangChain tool.
    The LLM only sees query / top_k / project_id — no DB session leaking into the schema.
    """

    @tool
    async def retrieve_chunks(
        query: str,
        project_id: int,
        top_k,
    ) -> list[dict]:
        """ALWAYS use this tool to answer any question. Search the vector database
        for relevant chunks from uploaded documents before responding.
        Never answer from memory — always retrieve first.

        Args:
            query: Search query based on the user's question.
            project_id: Project whose documents should be searched.
            top_k: Number of chunks to retrieve (default 1).
        """
        query_vector = await get_embeddings_client().aembed_query(query)
        vector_str = f"[{','.join(str(v) for v in query_vector)}]"

        sql = text("""
            SELECT
                dc.id          AS chunk_id,
                dc.content,
                dc.page_number,
                dc.chunk_index,
                d.filename,
                d.file_path,
                1 - (de.embedding <=> CAST(:query_vec AS vector)) AS similarity
            FROM document_embeddings de
            JOIN document_chunks dc ON dc.id  = de.chunk_id
            JOIN documents d        ON d.id   = de.document_id
            WHERE d.project_id = :project_id
            ORDER BY de.embedding <=> CAST(:query_vec AS vector)
            LIMIT :top_k
        """)

        result = await db.execute(sql, {
            "query_vec":  vector_str,
            "project_id": project_id,
            "top_k":      top_k,
        })

        rows = result.mappings().all()
        return [dict(row) for row in rows]

    return retrieve_chunks
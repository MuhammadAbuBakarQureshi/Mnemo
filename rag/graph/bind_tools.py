from langchain_groq import ChatGroq
from sqlalchemy.ext.asyncio import AsyncSession

from rag.vector_store.query_db import make_retrieve_tool

from dotenv import load_dotenv
import os

load_dotenv()



try:

    def build_llm_with_tools(db: AsyncSession) -> ChatGroq:

        llm_name = os.getenv("LLM_NAME")
        llm = ChatGroq(model=llm_name)

        retrieve_tool = make_retrieve_tool(db)          # db captured in closure
        llm_with_tools = llm.bind_tools([retrieve_tool])

        return llm_with_tools, [retrieve_tool]
    

except Exception as e:

    print(f"Building LLM with tools Error: {e}")

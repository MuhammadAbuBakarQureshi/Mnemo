import os
import json
import asyncio

from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode, tools_condition
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.database import AsyncSessionLocal


from rag.graph.bind_tools import build_llm_with_tools
from rag.graph.state import AgentState


try:

    def build_rag_graph(db: AsyncSession):

        llm_with_tools, tools = build_llm_with_tools(db)  # ← unpack once, both close over below

        async def agent(state: AgentState) -> AgentState:
            response = await llm_with_tools.ainvoke(state["messages"])
            return {"messages": [response]}

        tool_node = ToolNode(tools)

        graph = StateGraph(AgentState)
        graph.add_node("agent", agent)
        graph.add_node("tools", tool_node)
        graph.set_entry_point("agent")
        graph.add_conditional_edges("agent", tools_condition)  # tool calls → tools, else → END
        graph.add_edge("tools", "agent")                       # after tools → back to agent

        return graph.compile()

except Exception as e:

    print(f"Build rag Error: {e}")



def get_tool_calls(rag_res):

    tool_calls = []

    for message in rag_res['messages']:

        try:

            if message.content[0] == '[':

                tool_calls.append(message)

        except Exception as e:

            pass


    retrieve_chunks_metadata = []

    for tool_call in tool_calls:

        chunks = json.loads(tool_call.content)
        
        for chunk in chunks:

            retrieve_chunks_metadata.append({
                "page_number" : chunk["page_number"],
                "filename": chunk["filename"],
                "similarity": chunk["similarity"] * 100,
                "content": chunk["content"]
            })

    return retrieve_chunks_metadata


def display_response(result):


    print(f"AI: {result["messages"][-1].content}")

    print(f"\n\nTokens : {result["messages"][-1].usage_metadata}")

    # chunks

    try:

        if result['messages'][-3].tool_calls:

            chunks = json.loads(result["messages"][-2].content)

            print(f"\n\nchunks: \n{chunks}")

            print(chunks[0]["chunk_id"])

            print(f"\nNumber of chunks retrieve: {len(chunks)}")
            print(f"Chunk index: {chunks[0]["chunk_index"]}")
            print(f"Page number: {chunks[0]["page_number"]}")
            print(f"File: {chunks[0]["filename"]}")
            print(f"Similarity: {chunks[0]["similarity"]}")

            return f"{chunks[0]["filename"]} . Page.{chunks[0]["page_number"]} . {chunks[0]["similarity"]*100:.2f}%"
        else:

            print(f"No Tool calls made")

    except Exception as e:

        print(f"No Tool calls made")

    finally:

        # seperation

        print(os.get_terminal_size().columns * "-")




try:


    def to_langchain_messages(messages: list) -> list:
        converted = []
        for m in messages:
            if m.role == "human":
                converted.append(HumanMessage(content=m.content))
            elif m.role == "ai":
                converted.append(AIMessage(content=m.content))
        return converted


    async def run_rag(project_id: int, messages: list, db: AsyncSession):
        
        graph = build_rag_graph(db)
    
        print(f"\n\n\n\t\t\tMessage: \n\n{messages}\n\n\n")
        
        messages = to_langchain_messages(messages=messages)

        print(f"\n\n\n\t\t\tMessage: \n\n{messages}\n\n\n")
       

        system_message = SystemMessage(content=(
            f"pass this project_id {project_id} to retrieve_chunks\n\n"
            "You are a helpful assistant with access to a retrieve_chunks tool that searches "
            "the user's uploaded documents. You must never answer document-related questions "
            "from your own memory or general knowledge — only from what retrieve_chunks returns.\n\n"
            "Decide first whether the user's message actually requires document knowledge:\n"
            "- If the message is conversational (greetings, small talk, telling you their name, "
            "thanks, general chit-chat, or anything not asking about the documents) — respond "
            "naturally and briefly like a normal conversation. Do NOT call retrieve_chunks and do "
            "NOT mention documents, sources, or searching at all.\n"
            "- If the message asks about anything that could be in the documents (skills, "
            "experience, projects, file content, etc.) — you MUST call retrieve_chunks with a "
            "relevant search query before answering. Never answer this kind of question from memory, "
            "even if you think you know the answer.\n\n"
            "When you use retrieve_chunks:\n"
            "1. If it returns no relevant information, say plainly that you don't have information "
            "on that topic in the current documents. Do NOT guess, do NOT fall back on general "
            "knowledge, and do NOT make up an answer to fill the gap.\n"
            "2. If it returns relevant information, answer the question directly and naturally, as "
            "if you already knew the answer. Write in plain prose.\n"
            "3. Do NOT describe your search process (e.g. 'the top chunk has a similarity of...', "
            "'based on the search query...', 'based on my sources...', 'chunk 1 says...'). Do NOT "
            "mention similarity scores, chunk numbers, project_id, or filenames unless the user "
            "explicitly asks where the information came from.\n"
            "4. Synthesize the retrieved content into a single coherent answer, not a list of "
            "per-chunk summaries or a per-document breakdown.\n"
            "5. Stay within the scope of the uploaded documents. If asked something clearly outside "
            "that scope (general trivia, coding help, opinions), say this assistant only answers "
            "questions about the uploaded documents, rather than answering from general knowledge."
        ))

        state = AgentState(messages=messages)

        state['messages'] = [system_message] + state['messages']

        state = await graph.ainvoke(state)

        context = get_tool_calls(state)

        return state, context
    
except Exception as e:

    print(f"Run Rag Error: {e}")






























# try:

#     async def rag_loop():

#         messages = []

#         async with AsyncSessionLocal() as db:

#             user_input = input("You: ")
#             while(user_input != "/bye"):
                
#                 messages.append({
#                     "role": "human",
#                     "content": user_input
#                 })

#                 result = await run_rag(project_id= 7, messages=messages, db=db)

#                 messages.append({
#                     "role": "ai",
#                     "content": result["messages"][-1].content
#                 })

#                 display_response(result)

#                 user_input = input("\nYou: ")

# except Exception as e:

#     print(f"Rag Loop Error: {e}")

# def run():

#     asyncio.run(rag_loop())


# run()
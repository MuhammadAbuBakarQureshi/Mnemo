from typing import Sequence, Annotated, TypedDict, Union
from langchain_core.messages import ToolMessage, HumanMessage, SystemMessage, BaseMessage, AIMessage
from langchain_core.tools import tool
from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode
from langgraph.graph.message import add_messages
from IPython.display import display, Image

from dotenv import load_dotenv

load_dotenv()

class AgentState(TypedDict):
    messages: Annotated[list, add_messages]


llm_name = "llama-3.3-70b-versatile"
llm = ChatGroq(model=llm_name)


def agent(state: AgentState) -> AgentState:

    response = llm.invoke(state['messages'])

    return {'messages': [response]}

graph = StateGraph(AgentState)

graph.add_node("agent", agent)

graph.add_edge(START, "agent")
graph.add_edge("agent", END)

app = graph.compile()

def chat_with_ai(messages, system_prompt):

    try:

        system_prompt = SystemMessage(system_prompt)

        state = AgentState(messages=messages)

        state['messages'] = [system_prompt] + state['messages']

        state = app.invoke(state)
    
        return state
    
    except Exception as e:

        print(f"LangGraph model invoke: {e}")


# db_messages = [{'role': 'human', 'content': 'hi, how are you'}, {'role': 'ai', 'content': 'I am fine what about you'}, {'role': 'human', 'content': 'fine'}, {'role': 'ai', 'content': 'what can i help you with'}, {"role": "human", "content": "you know best place in islamabad give only one word"}, {"role": "ai", "content": "Margalla"}]

# db_messages = []

# new_message = {"role": "human", "content": "Margalla hills"}
# db_messages.append(new_message)

# state = chat_with_ai(messages=db_messages, system_prompt=f"""Generate a concise 3-5 word chat title based on the user's message. 
#                Return ONLY the title, no punctuation, no explanation.
#                Example: "Python Async Error Help" """)

# print(state['messages'])
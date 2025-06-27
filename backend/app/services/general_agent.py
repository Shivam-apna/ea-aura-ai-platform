from langchain_groq import ChatGroq
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from app.groq_config import get_groq_config

class GeneralAgent:
    def __init__(self):
        groq_config = get_groq_config()
        self.llm = ChatGroq(
            groq_api_key=groq_config["api_key"],
            model_name="llama3-70b-8192",
            base_url="https://api.groq.com",  # should be "https://api.groq.com"
        )
        self.prompt = PromptTemplate.from_template("Answer the user's question as clearly as possible:\n\nQuestion: {query}")
        self.chain = LLMChain(llm=self.llm, prompt=self.prompt)

    def run(self, query: str) -> str:
        return self.chain.run(query=query)

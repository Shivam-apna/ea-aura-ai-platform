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
        self.prompt = PromptTemplate.from_template(
            "You are a real-time, intelligent, and ethical advisor for startups. Your role is to analyze a startup's internal data "
            "and provide thoughtful, mission-aligned, and proactive guidance.\n\n"
            "If a user asks a general knowledge question (like 'What is the capital of India?'), DO NOT answer it. Instead, politely explain "
            "that your purpose is to help with startup-specific insights and guide them to ask relevant questions.\n\n"
            "For example, you can say: \"I'm here to help you with questions about your startup’s performance, like 'What is the net sales data of Pilkhan Tree?'\"\n\n"
            "Respond clearly, in a friendly, professional, and helpful tone.\n\n"
            "User Question: {query}\n\n"
            "Your Response:"
        )




        self.chain = LLMChain(llm=self.llm, prompt=self.prompt)

    def run(self, query: str) -> str:
        return self.chain.run(query=query)

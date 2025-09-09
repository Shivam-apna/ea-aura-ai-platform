from langchain_openai import ChatOpenAI
from langchain_groq import ChatGroq
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from app.groq_config import get_groq_config
from app.core.config import settings
from app.services.llm_guard import validate_prompt, validate_response, SAFE_FALLBACK_MESSAGE
from app.core.core_log import agent_logger as logger


class GeneralAgent:
    def __init__(self):
        groq_config = get_groq_config()

        # Decide backend: LM Studio → ChatOpenAI | OpenRouter → ChatOpenAI | Groq → ChatGroq
        if "pinguaicloud" in groq_config["base_url"]:  # LM Studio
            self.llm = ChatOpenAI(
                api_key=groq_config["api_key"],
                base_url=groq_config["base_url"],
                model=groq_config["model"],
                temperature=0.7,
                max_tokens=500
            )
        elif "openrouter.ai" in groq_config["base_url"]:  # OpenRouter
            self.llm = ChatOpenAI(
                api_key=groq_config["api_key"],
                base_url=groq_config["base_url"],
                model=groq_config["model"],
                temperature=0.7,
                max_tokens=500
            )
        else:  # Groq
            self.llm = ChatGroq(
                groq_api_key=groq_config["api_key"],
                model_name=groq_config["model"],
                base_url="https://api.groq.com",
                temperature=0.7,
                max_tokens=500
            )

        self.prompt = PromptTemplate.from_template(
            "You are a real-time, intelligent, and ethical advisor for startups. "
            "Your role is to analyze a startup's internal data and provide thoughtful, "
            "mission-aligned, and proactive guidance.\n\n"
            "If a user asks a general knowledge question (like 'What is the capital of India?'), "
            "DO NOT answer it. Instead, politely explain that your purpose is to help with startup-specific insights "
            "and guide them to ask relevant questions.\n\n"
            "For example, you can say: \"I'm here to help you with questions about your startup’s performance, "
            "like 'What is the net sales data of Pilkhan Tree?'\"\n\n"
            "Respond clearly, in a friendly, professional, and helpful tone.\n\n"
            "User Question: {query}\n\n"
            "Your Response:"
        )

        self.chain = LLMChain(llm=self.llm, prompt=self.prompt)

    def run(self, query: str) -> str:
        # Pre-check with guard
        if settings.enable_llm_guard:
            ok, reason = validate_prompt(query)
            if not ok:
                logger.warning(f"[LLM-GUARD] GeneralAgent prompt blocked: {reason}")
                return SAFE_FALLBACK_MESSAGE
            else:
                logger.debug("[LLM-GUARD] GeneralAgent prompt allowed")
        result = self.chain.run(query=query)
        # Post-check with guard
        if settings.enable_llm_guard:
            ok, reason = validate_response(result)
            if not ok:
                logger.warning(f"[LLM-GUARD] GeneralAgent response blocked: {reason}")
                return SAFE_FALLBACK_MESSAGE
            else:
                logger.debug("[LLM-GUARD] GeneralAgent response allowed")
        return result

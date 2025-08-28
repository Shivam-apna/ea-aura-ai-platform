from langchain_openai import ChatOpenAI
from langchain_groq import ChatGroq
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from app.groq_config import get_groq_config
from app.core.config import settings
from app.core.core_log import agent_logger as logger
import json
from typing import Dict, Any, List, Union


class NextStepAnalyser:
    def __init__(self):
        groq_config = get_groq_config()

        # Decide backend: LM Studio → ChatOpenAI | Groq → ChatGroq
        if "pinguaicloud" in groq_config["base_url"]:  # LM Studio
            self.llm = ChatOpenAI(
                api_key=groq_config["api_key"],
                base_url=groq_config["base_url"],
                model=groq_config["model"],
                temperature=0.3,  # Lower temperature for more consistent predictions
                max_tokens=800
            )
        else:  # Groq
            self.llm = ChatGroq(
                groq_api_key=groq_config["api_key"],
                model_name=groq_config["model"],
                base_url="https://api.groq.com",
                temperature=0.3,  # Lower temperature for more consistent predictions
                max_tokens=800
            )

        self.prompt = PromptTemplate.from_template(
            "You are a business strategy consultant specializing in actionable recommendations for startups and businesses. "
            "Your role is to analyze data trends and provide specific, implementable next steps to improve business performance.\n\n"
            
            "ANALYSIS FRAMEWORK:\n"
            "1. Examine the data pattern and current performance\n"
            "2. Identify key areas for improvement based on the metrics\n"
            "3. Consider the business context from the chart title and data type\n"
            "4. Provide 4-6 specific, actionable next steps\n"
            "5. Focus on practical business actions, not predictions\n\n"
            
            "INPUT DATA:\n"
            "Chart Title: {title}\n"
            "Chart Type: {chart_type}\n"
            "X-axis Label: {x_label}\n"
            "Y-axis Label: {y_label}\n"
            "X-axis Values: {x_values}\n"
            "Y-axis Values: {y_values}\n"
            "Data Points Count: {data_count}\n\n"
            
            "REQUIRED OUTPUT FORMAT:\n"
            "You must respond with ONLY a valid JSON object in this exact structure:\n"
            "Do not add any specticial characters to the title it will be sting only.\n\n"
            "{{\n"
            "  \"Next Steps to Boost {title}\": \"Based on AI analysis and key performance drivers, here are recommended actions you can take to improve {title} performance.\",\n"
            "  \"step_1\": {{\n"
            "    \"title\": \"Action Title\",\n"
            "    \"description\": \"Detailed explanation of what to do and why\"\n"
            "  }},\n"
            "  \"step_2\": {{\n"
            "    \"title\": \"Action Title\",\n"
            "    \"description\": \"Detailed explanation of what to do and why\"\n"
            "  }},\n"
            "  \"step_3\": {{\n"
            "    \"title\": \"Action Title\",\n"
            "    \"description\": \"Detailed explanation of what to do and why\"\n"
            "  }},\n"
            "  \"step_4\": {{\n"
            "    \"title\": \"Action Title\",\n"
            "    \"description\": \"Detailed explanation of what to do and why\"\n"
            "  }},\n"
            "  \"step_5\": {{\n"
            "    \"title\": \"Action Title\",\n"
            "    \"description\": \"Detailed explanation of what to do and why\"\n"
            "  }}\n"
            "}}\n\n"
            
            "IMPORTANT GUIDELINES:\n"
            "- Generate 4-6 actionable steps (step_1 through step_5 or step_6)\n"
            "- Each step should be specific and implementable\n"
            "- Focus on business actions like marketing, operations, customer service, etc.\n"
            "- Tailor recommendations to the specific metric/title provided\n"
            "- Use the data patterns to inform your recommendations\n"
            "- Keep descriptions practical and concise\n"
            "- Return ONLY valid JSON, no additional text\n\n"
            
            "Examples of good action titles:\n"
            "- \"Strengthen Marketing Campaigns\"\n"
            "- \"Optimize Customer Acquisition\"\n"
            "- \"Improve Product Quality\"\n"
            "- \"Enhance Customer Retention\"\n"
            "- \"Streamline Operations\"\n"
            "- \"Expand Market Reach\"\n\n"
            
            "Analyze the data and provide actionable next steps in JSON format:"
        )

        self.chain = LLMChain(llm=self.llm, prompt=self.prompt)

    def _prepare_data_summary(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Prepare and validate input data for analysis"""
        try:
            # Extract and validate required fields
            title = data.get('title', 'Business Performance')
            chart_type = data.get('plot_type', 'Chart')
            x_label = data.get('x_label', 'Time')
            y_label = data.get('y_label', 'Value')
            x_values = data.get('x_values', [])
            y_values = data.get('y_values', [])
            
            # Convert to lists if they're strings (for safety)
            if isinstance(x_values, str):
                x_values = json.loads(x_values) if x_values.startswith('[') else x_values.split(',')
            if isinstance(y_values, str):
                y_values = json.loads(y_values) if y_values.startswith('[') else y_values.split(',')
            
            # Calculate data count
            data_count = min(len(x_values), len(y_values))
            
            return {
                'title': title,
                'chart_type': chart_type,
                'x_label': x_label,
                'y_label': y_label,
                'x_values': str(x_values[:10]) if len(x_values) > 10 else str(x_values),
                'y_values': str(y_values[:10]) if len(y_values) > 10 else str(y_values),
                'data_count': data_count
            }
        except Exception as e:
            logger.error(f"Error preparing data summary: {str(e)}")
            raise ValueError(f"Invalid data format: {str(e)}")

    def _validate_json_response(self, response: str) -> Dict[str, Any]:
        """Validate and clean JSON response from LLM"""
        try:
            # Try to find JSON in the response
            start_idx = response.find('{')
            end_idx = response.rfind('}') + 1
            
            if start_idx != -1 and end_idx != -1:
                json_str = response[start_idx:end_idx]
                parsed_json = json.loads(json_str)
                return parsed_json
            else:
                # Fallback: create a basic next steps response
                title = "Business Performance"  # Default title
                return {
                    f"Next Steps to Boost {title}": "Based on data analysis, here are recommended actions to improve performance.",
                    "step_1": {
                        "title": "Analyze Current Performance",
                        "description": "Review your current metrics and identify areas that need improvement based on the data trends."
                    },
                    "step_2": {
                        "title": "Optimize Key Processes",
                        "description": "Focus on streamlining operations and improving efficiency in your core business processes."
                    },
                    "step_3": {
                        "title": "Enhance Customer Experience",
                        "description": "Implement customer feedback mechanisms and improve service quality to boost satisfaction."
                    },
                    "step_4": {
                        "title": "Monitor and Measure",
                        "description": "Set up regular monitoring and measurement systems to track progress and make data-driven decisions."
                    }
                }
        except json.JSONDecodeError as e:
            logger.warning(f"JSON parsing failed: {str(e)}")
            return {
                "error": f"Analysis failed: {str(e)}"
            }

    def analyze(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Main analysis method"""
        try:
            # Prepare data for analysis
            prepared_data = self._prepare_data_summary(data)
            
            # Run the analysis directly without LLM guard checks
            result = self.chain.run(
                title=prepared_data['title'],
                chart_type=prepared_data['chart_type'],
                x_label=prepared_data['x_label'],
                y_label=prepared_data['y_label'],
                x_values=prepared_data['x_values'],
                y_values=prepared_data['y_values'],
                data_count=prepared_data['data_count']
            )

            # Validate and structure the response
            structured_result = self._validate_json_response(result)
            structured_result["status"] = "success"
            
            return structured_result

        except Exception as e:
            logger.error(f"NextStepAnalyser analysis failed: {str(e)}")
            return {
                "error": f"Analysis failed: {str(e)}"
            }

    def run(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Wrapper method for backward compatibility"""
        return self.analyze(data)


# Helper functions to maintain compatibility with existing code
def get_next_step_analysis(chart_data: Dict[str, Any]) -> Dict[str, Any]:
    """Main function to get next step analysis"""
    agent = NextStepAnalyser()
    return agent.analyze(chart_data)


def analyze_next_steps(chart_data: Dict[str, Any]) -> Dict[str, Any]:
    """Alternative helper function name for next step analysis"""
    agent = NextStepAnalyser()
    return agent.analyze(chart_data)


# Create a global instance for easy importing (optional)
next_step_analyser = NextStepAnalyser()
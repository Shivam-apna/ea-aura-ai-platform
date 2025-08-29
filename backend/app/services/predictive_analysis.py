# backend/app/services/predictive_analysis.py

import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Any
import numpy as np
from langchain_openai import ChatOpenAI
from langchain_groq import ChatGroq
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from app.groq_config import get_groq_config
from app.utils.agent_config_loader import get_all_predective_config
from app.core.core_log import logger
import re


class PredictiveAnalysisAgent:
    def __init__(self):
        groq_config = get_groq_config()

        if "pinguaicloud" in groq_config["base_url"]:
                clean_base_url = groq_config["base_url"].rstrip('/')
                if not clean_base_url.endswith('/v1'):
                    clean_base_url += '/v1'
                
                self.llm = ChatOpenAI(
                    api_key=groq_config["api_key"],
                    base_url=clean_base_url,
                    model=groq_config["model"],
                    temperature=0.2,
                    max_tokens=4000
                )
                logger.info(f"Using LM Studio with base_url: {clean_base_url}")
        else:
            self.llm = ChatGroq(
                groq_api_key=groq_config["api_key"],
                model_name=groq_config["model"],
                temperature=0.2,
                max_tokens=4000
            )
            logger.info("Using Groq API")

        # Load dynamic prompts from JSON file
        self.prompts_data = self._load_prompts()
        
        # Default fallback prompt (your original prompt)
        self.default_prompt = """You are an expert data analyst specialized in time series forecasting and predictive analytics.

            Given the following chart data, analyze the historical trends and predict the next 5 months using advanced statistical forecasting methods.

            Historical Chart Data:
            - Title: {title}
            - Chart Type: {plot_type}
            - X-axis (Dates): {x_values}
            - Y-axis ({y_label}): {y_values}
            - X-axis Label: {x_label}
            - Y-axis Label: {y_label}
            - Data Points (N): Count the data points to determine method

            FORECASTING METHODOLOGY (choose by history length N):
            - If N ≥ 24 months: Use Holt–Winters (ETS A,A,A) with m=12 (additive seasonality)
            * Level: ℓ_t = α(y_t − s_{{t−m}}) + (1−α)(ℓ_{{t−1}}+b_{{t−1}})
            * Trend: b_t = β(ℓ_t − ℓ_{{t−1}}) + (1−β)b_{{t−1}}
            * Seasonality: s_t = γ(y_t − ℓ_t) + (1−γ)s_{{t−m}}
            * Forecast h: ŷ_{{t+h}} = ℓ_t + h·b_t + s_{{t−m+h mod m}}

            - If 12 ≤ N < 24: Use Holt's Linear (ETS A,A,N)
            * Level: ℓ_t = αy_t + (1−α)(ℓ_{{t−1}}+b_{{t−1}})
            * Trend: b_t = β(ℓ_t − ℓ_{{t−1}}) + (1−β)b_{{t−1}}
            * Forecast h: ŷ_{{t+h}} = ℓ_t + h·b_t

            - If N < 12: Use Simple Exponential Smoothing (ETS A,N,N)
            * Level: ℓ_t = αy_t + (1−α)ℓ_{{t−1}}
            * Forecast h: ŷ_{{t+h}} = ℓ_t

            Hyperparameters: α, β, γ ∈ {{0.05, 0.10, ..., 0.50}}; choose set minimizing MAPE on the last 30% (time-ordered split).

            UNCERTAINTY CALCULATION (next 5 months → h = 1,2,3,4,5):
            - Point forecast = P50 (median forecast)
            - Calculate residuals e_t = y_t − ŷ_t on fitted portion
            - Robust scale σ = MAD × 1.4826
            - σ_h = σ · sqrt(h)
            - P10 = P50 − 1.2816·σ_h (10th percentile - cautious lower bound)
            - P90 = P50 + 1.2816·σ_h (90th percentile - optimistic upper bound)

            SEASONALITY INDEX:
            - If N ≥ 24: For month M, index[M] = mean(sales for M) / overall mean(sales)
            - Otherwise: Compute from last ≤12 months; if <6 months, use 5-month centered moving average
            - Rescale indices so mean = 1.00

            Instructions:
            1. Determine appropriate forecasting method based on N (data length)
            2. Apply the statistical method with optimized parameters
            3. Generate exactly 5 future data points (next 5 months from last date)
            4. Calculate P10, P50, P90 forecasts and maintain realistic values
            5. The main prediction_result should use P50 values, but provide all variants

            CRITICAL JSON FORMATTING RULES:
            - Use ONLY double quotes for all strings, arrays, and object keys
            - Never use single quotes anywhere in the JSON
            - Ensure all arrays and objects are properly closed with matching brackets
            - Do not include any text outside the JSON object

            DATE GENERATION RULES:
            - You MUST generate exactly 5 new dates, each one month after the previous date.
            - Start from the last date in x_values.
            - Use the same format as x_values (e.g., "YYYY-MM-DD").
            - Example: if the last date is "2022-03-01", then the 5 new dates must be:
            ["2022-04-01", "2022-05-01", "2022-06-01", "2022-07-01", "2022-08-01"].
            - NEVER repeat the same month, and do not skip months.

            VALUE GENERATION RULES:

            - Generate 5 new P50 values based on the chosen forecasting method.

            IMPORTANT: Return ONLY a valid JSON object in this exact format:

            {{
            "prediction_result": {{
                "title": "ForecastP50",
                "plotType": "{plot_type}",
                "description": "Actual {title} vs most likely (p50) forecast for the next five months.",
                "x": [all original dates + 5 new predicted dates of next five months],
                "y": [all original values + 5 new P50 predicted values],
                "xLabel": "{x_label}",
                "yLabel": "{y_label}",
                "prediction_metadata": {{
                    "predicted_dates": [5 new dates (each 1 month apart, sequential after last x date)],
                    "predicted_values": [5 new P50 values],
                    "predicted_values_p10": [5 new P10 values],
                    "predicted_values_p90": [5 new P90 values],
                    "confidence_level": "high/medium/low",
                    "trend_analysis": "Statistical forecast using [method_name] with MAPE: [value]% and optimized parameters",
                }}
            }},
            "popup": {{
                "title": "AI Statistical Forecast – {title} (Next 5 months)",
                "subtitle": "What this advanced prediction means",
                "intro": "This forecast uses statistical methods (determined by data length N) with uncertainty quantification and optimized parameters.",
                "bullets": [
                    "P50: most likely (median) forecast using optimal statistical method.",
                ],
                "howToUse": "Start with the P50 Forecast as your primary baseline for planning. The P50 represents the most likely outcome, meaning there is an equal 50% chance that actual results will be higher or lower than this forecast. Using P50 helps create a balanced and realistic plan without being overly optimistic or conservative."

            }}
            }}

            Apply the appropriate statistical forecasting method and generate precise 5-month forecasts with uncertainty bands.
            Historical Data Analysis:
            """

    def _load_prompts(self) -> Dict[str, str]:
        """Load prompts from agent config loader"""
        try:
            # Get prompts from the config loader
            prompts_data = get_all_predective_config()
            
            if prompts_data and isinstance(prompts_data, dict):
                logger.info("Loaded prompts from agent config", extra={
                    "prompt_keys": list(prompts_data.keys()),
                    "total_prompts": len(prompts_data)
                })
                return prompts_data
            else:
                logger.warning("No prompts found in agent config, using default prompt only")
                return {}
                
        except Exception as e:
            logger.error(f"Error loading prompts from agent config: {str(e)}")
            return {}
    def _normalize_kpi_name(self, name: str) -> str:
        """Normalize KPI name by keeping only letters, removing everything else"""
        if not name:
            return ""
        return re.sub(r'[^a-z]', '', name.lower())

    def _get_prompt_for_title(self, title: str) -> str:
        """Get appropriate prompt based on normalized title matching"""
        if not title or not self.prompts_data:
            logger.info("Using default prompt (no title or no prompts loaded)")
            return self.default_prompt
            
        # Normalize input title
        normalized_input = self._normalize_kpi_name(title)
        
        logger.info(f"Looking for prompt match", extra={
            "original_title": title,
            "normalized_input": normalized_input,
            "available_keys": list(self.prompts_data.keys())
        })
        
        # Find matching prompt by normalized comparison
        for prompt_key in self.prompts_data.keys():
            normalized_key = self._normalize_kpi_name(prompt_key)
            
            # Exact match
            if normalized_key == normalized_input:
                logger.info(f"EXACT MATCH: '{prompt_key}' matches '{title}'")
                return self.prompts_data[prompt_key]
            
            # Containment match (key contained in input)
            if normalized_key and normalized_key in normalized_input:
                logger.info(f"CONTAINMENT MATCH: '{prompt_key}' found in '{title}'")
                return self.prompts_data[prompt_key]
                
        # No match found
        logger.info(f"NO MATCH: Using default prompt for '{title}'")
        return self.default_prompt

    def _parse_date(self, date_str: str) -> datetime:
        """Parse date string to datetime object"""
        try:
            return datetime.strptime(date_str, '%Y-%m-%d')
        except ValueError:
            try:
                return datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
            except ValueError:
                # If parsing fails, try other common formats
                formats = ['%m/%d/%Y', '%d/%m/%Y', '%Y/%m/%d']
                for fmt in formats:
                    try:
                        return datetime.strptime(date_str, fmt)
                    except ValueError:
                        continue
                raise ValueError(f"Unable to parse date: {date_str}")

    def _generate_future_dates(self, last_date_str: str, num_months: int = 5) -> List[str]:
        """Generate future dates based on the last date"""
        try:
            last_date = self._parse_date(last_date_str)
            future_dates = []
            
            for i in range(1, num_months + 1):
                # Add months (approximately 30 days each)
                future_date = last_date + timedelta(days=30 * i)
                future_dates.append(future_date.strftime('%Y-%m-%d'))
            
            return future_dates
        except Exception as e:
            logger.error(f"Error generating future dates: {str(e)}")
            # Fallback: generate simple sequential dates
            future_dates = []
            base_date = datetime.now()
            for i in range(1, num_months + 1):
                future_date = base_date + timedelta(days=30 * i)
                future_dates.append(future_date.strftime('%Y-%m-%d'))
            return future_dates

    def _clean_json_response(self, response: str) -> str:
        """Clean and extract JSON from LLM response"""
        # Remove code fences and any text outside JSON
        response = re.sub(r"```(?:json)?", "", response, flags=re.IGNORECASE).strip()
        response = re.sub(r"```", "", response).strip()
        
        # Find JSON object boundaries first
        start_idx = response.find('{')
        if start_idx == -1:
            return None
            
        # Find the matching closing brace
        brace_count = 0
        end_idx = -1
        
        for i in range(start_idx, len(response)):
            if response[i] == '{':
                brace_count += 1
            elif response[i] == '}':
                brace_count -= 1
                if brace_count == 0:
                    end_idx = i + 1
                    break
        
        if end_idx == -1:
            return None
        
        # Extract only the JSON part
        json_str = response[start_idx:end_idx]
        
        # Fix single quotes in JSON (but be careful about quotes inside strings)
        # This regex replaces single quotes that are likely JSON delimiters
        json_str = re.sub(r"(?<!\\)'(?=\s*[:\],}]|$)", '"', json_str)  # After keys/values
        json_str = re.sub(r"(?<=[{\[,:])\s*'", '"', json_str)  # Before keys/values
        
        return json_str.strip()

    def predict_next_months(self, chart_data: Dict[str, Any]) -> Dict[str, Any]:
        """Main prediction function with dynamic prompts"""
        try:
            logger.info("Starting predictive analysis", extra={
                "chart_title": chart_data.get("title"),
                "data_points": len(chart_data.get("x", [])),
                "chart_type": chart_data.get("plotType")
            })

            # Extract data from chart_data
            title = chart_data.get("title", "Prediction")
            plot_type = chart_data.get("plotType", "line")
            x_values = chart_data.get("x", [])
            y_values = chart_data.get("y", [])
            x_label = chart_data.get("xLabel", "Date")
            y_label = chart_data.get("yLabel", "Value")

            # Validate input data
            if not x_values or not y_values or len(x_values) != len(y_values):
                return {
                    "error": "Invalid chart data: x and y arrays must be non-empty and of the same length"
                }

            # Get the appropriate prompt based on title
            selected_prompt = self._get_prompt_for_title(title)
            
            # Create prompt template with the selected prompt
            prompt_template = PromptTemplate.from_template(selected_prompt)
            
            # Create chain with dynamic prompt
            chain = LLMChain(llm=self.llm, prompt=prompt_template)
            
            
            logger.info("Using dynamic prompt", extra={
                "title": title,
                "prompt_source": "custom" if selected_prompt != self.default_prompt else "default",
                "prompt_length": len(selected_prompt)
            })

            # Run prediction with dynamic prompt
            response = chain.run(
                title=title,
                plot_type=plot_type,
                x_values=str(x_values),
                y_values=str(y_values),
                x_label=x_label,
                y_label=y_label
            )

            logger.info("LLM prediction completed", extra={
                "response_length": len(response),
                "chart_title": title
            })

            # Clean and parse JSON response
            cleaned_response = self._clean_json_response(response)

            try:
                response_dict = json.loads(cleaned_response)

                prediction_result = response_dict.get("prediction_result", {})
                popup = response_dict.get("popup", {})

                # Validate prediction_result structure
                required_keys = ["title", "plotType", "x", "y", "xLabel", "yLabel"]
                if not all(key in prediction_result for key in required_keys):
                    return {
                        "error": "LLM response is incomplete or invalid",
                        "raw_response": response
                    }

                logger.info("Prediction completed successfully", extra={
                    "total_data_points": len(prediction_result.get("x", [])),
                    "predicted_points": 5,
                    "confidence": prediction_result.get("prediction_metadata", {}).get("confidence_level", "medium")
                })

                return {
                    "prediction_result": prediction_result,
                    "popup": popup
                }

            except json.JSONDecodeError as e:
                logger.error(f"JSON parsing failed: {str(e)}", extra={
                    "raw_response": response[:500],
                    "cleaned_response": cleaned_response[:500]
                })
                return {
                    "error": f"JSON parsing failed: {str(e)}",
                    "raw_response": response
                }

        except Exception as e:
            logger.exception("Prediction failed", extra={
                "error": str(e),
                "chart_title": chart_data.get("title")
            })
            return {
                "error": f"Prediction failed: {str(e)}"
            }

# Helper functions to maintain compatibility with existing code
def get_predictive_analysis(chart_data: Dict[str, Any]) -> Dict[str, Any]:
    """Main function to get predictive analysis"""
    agent = PredictiveAnalysisAgent()
    return agent.predict_next_months(chart_data)


def generate_predictive_report(chart_data: Dict[str, Any], tenant_id: str, 
                             metric_key: str, chart_type: str) -> str:
    """Generate a detailed predictive report and save to file"""
    try:
        # Create reports directory
        reports_dir = f"reports/{tenant_id}"
        os.makedirs(reports_dir, exist_ok=True)
        
        # Generate report filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_filename = f"predictive_report_{metric_key}_{timestamp}.json"
        report_path = os.path.join(reports_dir, report_filename)
        
        # Create detailed report
        prediction_metadata = chart_data.get("prediction_metadata", {})
        
        report = {
            "report_info": {
                "tenant_id": tenant_id,
                "metric_key": metric_key,
                "chart_type": chart_type,
                "generated_at": datetime.now().isoformat(),
                "report_type": "predictive_analysis"
            },
            "analysis_summary": {
                "title": chart_data.get("title"),
                "total_data_points": len(chart_data.get("x", [])),
                "historical_points": len(chart_data.get("x", [])) - 5,
                "predicted_points": 5,
                "confidence_level": prediction_metadata.get("confidence_level", "medium"),
                "trend_analysis": prediction_metadata.get("trend_analysis", "Trend analysis performed")
            },
            "predicted_data": {
                "dates": prediction_metadata.get("predicted_dates", []),
                "values": prediction_metadata.get("predicted_values", []),
                "methodology": "LLM-based trend analysis with fallback linear regression"
            },
            "chart_data": chart_data,
            "recommendations": [
                "Monitor actual vs predicted values for accuracy assessment",
                "Consider external factors that may influence future trends",
                "Update predictions monthly with new data points"
            ]
        }
        
        # Save report to file
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        logger.info(f"Predictive report saved: {report_path}")
        return report_path
        
    except Exception as e:
        logger.exception(f"Failed to generate predictive report: {str(e)}")
        return f"Error generating report: {str(e)}"
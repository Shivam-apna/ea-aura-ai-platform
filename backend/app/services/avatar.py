import os
import httpx
from pathlib import Path
from groq import Groq
from vault.client import get_vault_secret

def summarize_text_with_llama3(text: str) -> str:
    """
    Use LLaMA3 (llama3-70b-8192) model to summarize the input text.
    """
    # Get API key from vault or environment
    try:
        api_key = get_vault_secret(secret_path="groq", key="api_key")
    except:
        api_key = os.getenv("GROQ_API_KEY")
    
    if not api_key:
        raise Exception("Groq API key not found in vault or environment variables")
    
    # Initialize Groq client
    client = Groq(api_key=api_key)
    
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are an expert summarizer. Summarize the input text clearly and concisely for a voiceover script. Always expand any abbreviations into their full forms. Ensure the tone is professional and easy to understand.Add one line of insight it is good or poor. Do not copy text directly—rephrase it into a smooth narration style. Start your output with: 'Here is a clear and concise summary of the response.'"},
                {"role": "user", "content": text}
            ],
            temperature=0.5
        )
        
        summary = response.choices[0].message.content
        return summary.strip()
    except Exception as e:
        raise Exception(f"Summarization request failed: {str(e)}")


def generate_speech(
    text: str,
    tenant_id: str,
    voice: str = "Fritz-PlayAI",
    model: str = "playai-tts",
    response_format: str = "wav"
) -> str:
    """
    Generate TTS audio using summarized input and return local audio file path.
    Uses Groq TTS with fallback to local text file if TTS fails.
    """
    # Step 1: Summarize input text using llama3
    summarized_text = summarize_text_with_llama3(text)

    # Step 2: Prepare audio output directory
    temp_dir = Path("temp_audio")
    temp_dir.mkdir(exist_ok=True)

    # Clean up previous files
    for file in temp_dir.glob("*"):
        try:
            file.unlink()
        except Exception as e:
            print(f"Failed to delete {file}: {e}")

    # Step 3: Try Groq TTS with fallback to text file
    file_name = f"{tenant_id}_{os.urandom(6).hex()}"
    
    # Try Groq TTS
    try:
        return _try_groq_tts(summarized_text, temp_dir, file_name, model, voice, response_format)
    except Exception as groq_error:
        print(f"Groq TTS failed: {groq_error}")
    
    # Final fallback: return text file with summarized content
    return _create_text_fallback(summarized_text, temp_dir, file_name)




def _try_groq_tts(text: str, temp_dir: Path, file_name: str, model: str, voice: str, response_format: str) -> str:
    """
    Try Groq TTS API with error handling for terms acceptance
    """
    # Get API key from vault or environment
    try:
        api_key = get_vault_secret(secret_path="groq", key="api_key")
    except:
        api_key = os.getenv("GROQ_API_KEY")
    
    if not api_key:
        raise Exception("Groq API key not found")
    
    tts_url = "https://api.groq.com/openai/v1/audio/speech"
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": model,
        "voice": voice,
        "input": text,
        "response_format": response_format
    }

    response = httpx.post(tts_url, json=payload, headers=headers)

    if response.status_code == 400:
        error_data = response.json()
        if "model_terms_required" in error_data.get("error", {}).get("code", ""):
            raise Exception(f"Groq TTS model requires terms acceptance: {error_data['error']['message']}")
    
    if response.status_code != 200:
        raise Exception(f"Groq TTS request failed: {response.status_code} - {response.text}")

    # Save the audio to file
    audio_path = temp_dir / f"{file_name}.{response_format}"
    with open(audio_path, "wb") as f:
        f.write(response.content)

    return str(audio_path)


def _create_text_fallback(text: str, temp_dir: Path, file_name: str) -> str:
    """
    Create a text file as fallback when TTS is not available
    """
    text_path = temp_dir / f"{file_name}_summary.txt"
    
    with open(text_path, "w", encoding="utf-8") as f:
        f.write("=== AUDIO SUMMARY (TTS NOT AVAILABLE) ===\n\n")
        f.write(text)
        f.write("\n\n=== END SUMMARY ===")
    
    print(f"TTS not available, created text summary: {text_path}")
    return str(text_path)


#only the tts model code

# import os
# import httpx
# from pathlib import Path
# from app.groq_config import get_groq_config

# def generate_speech(
#     text: str,
#     tenant_id: str,
#     voice: str = "Fritz-PlayAI",   # You can change voice as needed
#     model: str = "playai-tts",
#     response_format: str = "wav"
# ) -> str:
#     """
#     Generate TTS audio using Groq-compatible OpenAI API and return local audio file path.
#     Deletes any existing audio files in temp_audio before creating a new one.
#     """
#     groq_config = get_groq_config()
#     api_key = groq_config["api_key"]
#     base_url = "https://api.groq.com/openai/v1/audio/speech"  # Exact endpoint

#     headers = {
#         "Authorization": f"Bearer {api_key}",
#         "Content-Type": "application/json"
#     }

#     payload = {
#         "model": model,
#         "voice": voice,
#         "input": text,
#         "response_format": response_format
#     }

#     # Create or clean temp_audio directory
#     temp_dir = Path("temp_audio")
#     temp_dir.mkdir(exist_ok=True)

#     # Delete all existing files in temp_audio
#     for file in temp_dir.glob("*"):
#         try:
#             file.unlink()
#         except Exception as e:
#             print(f"Failed to delete {file}: {e}")

#     # Send TTS request
#     response = httpx.post(base_url, json=payload, headers=headers)

#     if response.status_code != 200:
#         raise Exception(f"TTS request failed: {response.status_code} - {response.text}")

#     # Save audio file
#     file_name = f"{tenant_id}_{os.urandom(6).hex()}.{response_format}"
#     audio_path = temp_dir / file_name

#     with open(audio_path, "wb") as f:
#         f.write(response.content)

#     return str(audio_path)

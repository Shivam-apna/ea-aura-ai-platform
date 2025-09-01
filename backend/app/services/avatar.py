import os
import httpx
from pathlib import Path
from app.groq_config import get_groq_config

def summarize_text_with_llama3(text: str) -> str:
    """
    Use LLaMA3 (llama3-70b-8192) model to summarize the input text.
    """
    groq_config = get_groq_config()
    api_key = groq_config["api_key"]
    base_url = "https://api.groq.com/openai/v1/chat/completions"

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "llama3-70b-8192",
        "messages": [
            {"role": "system", "content": "You are an expert summarizer. Summarize the input text clearly and concisely for a voiceover script. Always expand any abbreviations into their full forms. Ensure the tone is professional and easy to understand.Add one line of insight it is good or poor. Do not copy text directly—rephrase it into a smooth narration style. Start your output with: 'Here is a clear and concise summary of the response.'"},
            {"role": "user", "content": text}
        ],
        "temperature": 0.5
    }

    response = httpx.post(base_url, json=payload, headers=headers)

    if response.status_code != 200:
        raise Exception(f"Summarization request failed: {response.status_code} - {response.text}")

    summary = response.json()["choices"][0]["message"]["content"]
    return summary.strip()


def generate_speech(
    text: str,
    tenant_id: str,
    voice: str = "Fritz-PlayAI",
    model: str = "playai-tts",
    response_format: str = "wav"
) -> str:
    """
    Generate TTS audio using summarized input and return local audio file path.
    """
    groq_config = get_groq_config()
    api_key = groq_config["api_key"]
    tts_url = "https://api.groq.com/openai/v1/audio/speech"

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

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

    # Step 3: Send TTS request using summarized text
    payload = {
        "model": model,
        "voice": voice,
        "input": summarized_text,
        "response_format": response_format
    }

    response = httpx.post(tts_url, json=payload, headers=headers)

    if response.status_code != 200:
        raise Exception(f"TTS request failed: {response.status_code} - {response.text}")

    # Save the audio to file
    file_name = f"{tenant_id}_{os.urandom(6).hex()}.{response_format}"
    audio_path = temp_dir / file_name

    with open(audio_path, "wb") as f:
        f.write(response.content)

    return str(audio_path)


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

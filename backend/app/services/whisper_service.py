"""
OpenAI Whisper Transcription Service
"""
import os
from openai import OpenAI
from app.config import settings

client = OpenAI(api_key=settings.OPENAI_API_KEY)


def transcribe_audio(audio_file, filename: str = "audio.webm") -> dict:
    """
    Transcribe audio using OpenAI Whisper API.

    Args:
        audio_file: File-like object containing audio data
        filename: Name for the file (must have proper extension)

    Returns:
        dict with 'text' (transcription) and 'duration' (seconds estimate)
    """
    try:
        # Check if API key is configured
        if not settings.OPENAI_API_KEY:
            raise Exception("OpenAI API key not configured. Please set OPENAI_API_KEY in Railway environment variables.")

        # Whisper API call
        transcript = client.audio.transcriptions.create(
            model="whisper-1",
            file=(filename, audio_file, "audio/webm"),
            response_format="verbose_json"  # Get duration info
        )

        return {
            "text": transcript.text,
            "duration": transcript.duration if hasattr(transcript, 'duration') else 0,
            "language": transcript.language if hasattr(transcript, 'language') else None
        }

    except Exception as e:
        error_msg = str(e)
        print(f"Whisper transcription error: {error_msg}")

        # Provide helpful error messages
        if "api_key" in error_msg.lower() or "authentication" in error_msg.lower():
            raise Exception("OpenAI API authentication failed. Check that OPENAI_API_KEY is set correctly in Railway.")
        elif "quota" in error_msg.lower() or "billing" in error_msg.lower():
            raise Exception("OpenAI API quota exceeded. Check your OpenAI billing and usage limits.")
        else:
            raise Exception(f"Transcription failed: {error_msg}")

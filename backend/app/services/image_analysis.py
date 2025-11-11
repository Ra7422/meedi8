"""
Image Analysis Service
Analyzes uploaded images using Claude Vision API
"""
import os
from anthropic import Anthropic
from app.config import settings

client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)

async def analyze_image(image_url: str, filename: str) -> dict:
    """
    Analyze an image using Claude Vision API.

    Args:
        image_url: S3 URL of the uploaded image
        filename: Original filename for context

    Returns:
        dict with 'description' (str), 'input_tokens' (int), 'output_tokens' (int), 'model' (str)
    """
    try:
        # Create prompt for mediation context
        prompt = (
            f"This image ({filename}) was uploaded during a mediation session. "
            "Please describe what you see in this image objectively and concisely. "
            "Focus on the content that might be relevant to a conflict resolution conversation. "
            "Keep your description brief (2-3 sentences) and factual."
        )

        # Call Claude with vision capabilities
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",  # Vision-capable model
            max_tokens=300,  # Keep description concise
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "url",
                            "url": image_url
                        }
                    },
                    {
                        "type": "text",
                        "text": prompt
                    }
                ]
            }]
        )

        # Extract description from response
        description = response.content[0].text if response.content else "Image uploaded."

        # Return analysis with usage info
        return {
            "description": description,
            "input_tokens": response.usage.input_tokens,
            "output_tokens": response.usage.output_tokens,
            "model": response.model
        }

    except Exception as e:
        print(f"Image analysis error: {e}")
        # Return fallback description if analysis fails
        return {
            "description": f"Image uploaded: {filename}",
            "input_tokens": 0,
            "output_tokens": 0,
            "model": None
        }

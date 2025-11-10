"""
Cost tracking for all API usage
Pricing as of Nov 2024:
- Claude Sonnet 4: Input $3/M tokens, Output $15/M tokens
- OpenAI Whisper: $0.006 per minute
- OpenAI TTS: $15 per million characters
"""
from decimal import Decimal
from sqlalchemy.orm import Session
from app.models.subscription import ApiCost


def calculate_anthropic_cost(input_tokens: int, output_tokens: int, model: str = "claude-sonnet-4-20250514") -> float:
    """Calculate cost in USD for Claude API call"""
    INPUT_COST_PER_MILLION = 3.0
    OUTPUT_COST_PER_MILLION = 15.0

    input_cost = (input_tokens / 1_000_000) * INPUT_COST_PER_MILLION
    output_cost = (output_tokens / 1_000_000) * OUTPUT_COST_PER_MILLION

    return input_cost + output_cost


def calculate_whisper_cost(audio_seconds: float) -> float:
    """Calculate cost for OpenAI Whisper transcription"""
    # $0.006 per minute
    minutes = audio_seconds / 60.0
    return minutes * 0.006


def calculate_tts_cost(characters: int) -> float:
    """Calculate cost for OpenAI TTS"""
    # $15 per million characters
    return (characters / 1_000_000) * 15.0


def extract_usage(response) -> dict:
    """
    Extract token usage from Claude API response.

    Returns:
        Dict with input_tokens, output_tokens, cost_usd, model
    """
    usage = response.usage

    return {
        "input_tokens": usage.input_tokens,
        "output_tokens": usage.output_tokens,
        "cost_usd": calculate_anthropic_cost(usage.input_tokens, usage.output_tokens),
        "model": response.model
    }


def track_api_cost(
    db: Session,
    user_id: int,
    service_type: str,
    cost_usd: float,
    room_id: int = None,
    turn_id: int = None,
    input_tokens: int = 0,
    output_tokens: int = 0,
    audio_seconds: float = 0.0,
    model: str = None
):
    """
    Track API cost in database for profitability analysis.

    service_type: 'anthropic', 'openai_whisper', 'openai_tts'
    """
    api_cost = ApiCost(
        user_id=user_id,
        room_id=room_id,
        turn_id=turn_id,
        service_type=service_type,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        audio_seconds=Decimal(str(audio_seconds)),
        cost_usd=Decimal(str(cost_usd)),
        model=model
    )
    db.add(api_cost)
    db.commit()
    return api_cost

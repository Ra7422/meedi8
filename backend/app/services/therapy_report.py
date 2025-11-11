"""
Professional Therapy Report Generation Service
Uses OpenAI GPT-4 to create comprehensive clinical assessments from Solo sessions
"""
import os
from typing import Dict, List
from openai import OpenAI
from app.config import settings

client = OpenAI(api_key=settings.OPENAI_API_KEY)

# Professional therapist prompt for clinical assessment
THERAPY_REPORT_PROMPT = """You are a licensed therapist and clinical psychologist conducting a professional assessment. Review the following self-reflection session transcript and clarity summary.

Provide a comprehensive professional report with:

1. CLINICAL SUMMARY
   - Brief overview of presenting concerns
   - Emotional state and affect observed through language

2. KEY THEMES IDENTIFIED
   - Recurring patterns in thoughts/behaviors
   - Relationship dynamics
   - Coping mechanisms (healthy and unhealthy)

3. AREAS OF STRENGTH
   - Positive coping skills demonstrated
   - Emotional awareness and insight
   - Growth potential

4. AREAS REQUIRING SUPPORT
   - Concerns that warrant professional attention
   - Risk factors (if any - anxiety, depression, relational distress)
   - Specific therapeutic interventions that could help

5. PROFESSIONAL RECOMMENDATIONS
   - Type of therapy recommended (CBT, DBT, couples therapy, etc.)
   - Urgency level (low/moderate/high)
   - Specific goals for therapy
   - Self-care strategies

6. THERAPIST NOTES
   - Additional observations
   - Questions for intake session
   - Treatment considerations

Maintain professional, compassionate tone. Be specific and actionable. Format as markdown with clear sections."""


def generate_professional_report(clarity_summary: str, conversation_turns: List[Dict]) -> Dict:
    """
    Generate a professional therapy report from Solo session data

    Args:
        clarity_summary: The AI-generated clarity summary from Solo session
        conversation_turns: List of conversation exchanges [{"role": "user/assistant", "content": "..."}]

    Returns:
        Dict with structured report sections:
        {
            "full_report": str,  # Complete markdown report
            "clinical_summary": str,
            "key_themes": str,
            "strengths": str,
            "support_areas": str,
            "recommendations": str,
            "therapist_notes": str,
            "urgency_level": str,  # "low", "moderate", or "high"
            "cost_info": dict  # Usage and cost tracking
        }
    """

    # Build conversation transcript
    transcript_lines = []
    for turn in conversation_turns:
        role = turn.get("role", "user")
        content = turn.get("content", "")

        if role == "assistant":
            transcript_lines.append(f"AI Coach: {content}")
        else:
            transcript_lines.append(f"Client: {content}")

    conversation_transcript = "\n\n".join(transcript_lines)

    # Build the full prompt
    user_prompt = f"""CONVERSATION TRANSCRIPT:
{conversation_transcript}

SELF-REFLECTION CLARITY SUMMARY:
{clarity_summary}

Please provide a comprehensive professional therapy report based on the above."""

    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": THERAPY_REPORT_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=2000
        )

        full_report = response.choices[0].message.content

        # Extract token usage and calculate cost
        usage = response.usage
        input_tokens = usage.prompt_tokens
        output_tokens = usage.completion_tokens

        # GPT-4 pricing (as of 2024): $0.03 per 1K input tokens, $0.06 per 1K output tokens
        INPUT_COST = 0.03 / 1000
        OUTPUT_COST = 0.06 / 1000
        cost_usd = (input_tokens * INPUT_COST) + (output_tokens * OUTPUT_COST)

        # Parse structured sections from the report
        sections = _parse_report_sections(full_report)

        return {
            "full_report": full_report,
            "clinical_summary": sections.get("clinical_summary", ""),
            "key_themes": sections.get("key_themes", ""),
            "strengths": sections.get("strengths", ""),
            "support_areas": sections.get("support_areas", ""),
            "recommendations": sections.get("recommendations", ""),
            "therapist_notes": sections.get("therapist_notes", ""),
            "urgency_level": _extract_urgency_level(sections.get("recommendations", "")),
            "cost_info": {
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "total_tokens": input_tokens + output_tokens,
                "cost_usd": round(cost_usd, 4),
                "model": "gpt-4"
            }
        }

    except Exception as e:
        print(f"Error generating therapy report: {e}")
        import traceback
        traceback.print_exc()

        # Return error response
        return {
            "full_report": "Error generating report. Please try again.",
            "clinical_summary": "",
            "key_themes": "",
            "strengths": "",
            "support_areas": "",
            "recommendations": "",
            "therapist_notes": "",
            "urgency_level": "unknown",
            "cost_info": {
                "input_tokens": 0,
                "output_tokens": 0,
                "total_tokens": 0,
                "cost_usd": 0.0,
                "model": "gpt-4"
            },
            "error": str(e)
        }


def _parse_report_sections(full_report: str) -> Dict[str, str]:
    """
    Parse markdown report into structured sections

    Returns:
        Dict with keys: clinical_summary, key_themes, strengths, support_areas, recommendations, therapist_notes
    """
    sections = {
        "clinical_summary": "",
        "key_themes": "",
        "strengths": "",
        "support_areas": "",
        "recommendations": "",
        "therapist_notes": ""
    }

    # Define section headers to look for
    section_markers = {
        "clinical_summary": ["1. CLINICAL SUMMARY", "CLINICAL SUMMARY"],
        "key_themes": ["2. KEY THEMES IDENTIFIED", "KEY THEMES IDENTIFIED"],
        "strengths": ["3. AREAS OF STRENGTH", "AREAS OF STRENGTH"],
        "support_areas": ["4. AREAS REQUIRING SUPPORT", "AREAS REQUIRING SUPPORT"],
        "recommendations": ["5. PROFESSIONAL RECOMMENDATIONS", "PROFESSIONAL RECOMMENDATIONS"],
        "therapist_notes": ["6. THERAPIST NOTES", "THERAPIST NOTES"]
    }

    lines = full_report.split('\n')
    current_section = None
    current_content = []

    for line in lines:
        line_stripped = line.strip()

        # Check if this line starts a new section
        section_found = False
        for section_key, markers in section_markers.items():
            if any(marker in line_stripped for marker in markers):
                # Save previous section
                if current_section:
                    sections[current_section] = '\n'.join(current_content).strip()

                # Start new section
                current_section = section_key
                current_content = []
                section_found = True
                break

        # Add line to current section (if not a section header)
        if not section_found and current_section:
            current_content.append(line)

    # Save last section
    if current_section:
        sections[current_section] = '\n'.join(current_content).strip()

    return sections


def _extract_urgency_level(recommendations_text: str) -> str:
    """
    Extract urgency level from recommendations section

    Returns:
        "low", "moderate", "high", or "unknown"
    """
    recommendations_lower = recommendations_text.lower()

    if "urgency" in recommendations_lower:
        if "high" in recommendations_lower:
            return "high"
        elif "moderate" in recommendations_lower:
            return "moderate"
        elif "low" in recommendations_lower:
            return "low"

    # Default to moderate if urgency not explicitly stated
    return "moderate"

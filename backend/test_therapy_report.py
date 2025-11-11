"""
Test script for therapy report generation
Run with: python test_therapy_report.py
"""
from app.services.therapy_report import generate_professional_report

# Example Solo session data
clarity_summary = """
KEY INSIGHTS:
- Feeling overwhelmed by work deadlines and struggling with work-life balance
- Pattern of saying yes to everything and not setting boundaries
- Tendency to prioritize others' needs over own self-care
- Difficulty asking for help due to fear of appearing incompetent

SUGGESTED ACTIONS:
- Practice saying "no" to non-essential commitments
- Set specific work hours and communicate boundaries to team
- Schedule regular self-care time (exercise, hobbies, rest)
- Identify 1-2 trusted colleagues to delegate tasks to

POSSIBLE ACTIONS:
[talk_to_manager] Have an honest conversation with manager about workload
[set_boundary] Implement "no work emails after 7pm" rule
[seek_support] Join a support group or start therapy
[self_care] Block out 30 minutes daily for personal time
"""

conversation_turns = [
    {"role": "user", "content": "I'm feeling really burned out at work. I can't keep up with everything and I'm exhausted all the time."},
    {"role": "assistant", "content": "I hear that you're feeling exhausted and overwhelmed. That sounds really hard. Can you tell me more about what's been happening at work?"},
    {"role": "user", "content": "I just have so many projects and everyone keeps asking me to do more. I can't say no because I don't want to let people down."},
    {"role": "assistant", "content": "It sounds like you're carrying a lot of responsibility and feel pressure to meet everyone's expectations. What happens when you think about saying no to someone?"},
    {"role": "user", "content": "I feel guilty, like I'm being selfish or lazy. And I worry they'll think I'm not capable or committed."},
    {"role": "assistant", "content": "That fear of being judged makes sense. What would you need to feel okay with setting boundaries?"},
    {"role": "user", "content": "I think I need to realize that taking care of myself isn't selfish. And that saying no to some things means I can do better on what really matters."},
    {"role": "assistant", "content": "That's a powerful insight. What's one small boundary you could set this week?"},
    {"role": "user", "content": "Maybe I could stop checking work emails after dinner. That would give me some time to actually relax."},
    {"role": "assistant", "content": "That sounds like a meaningful step. How do you feel about trying that?"},
    {"role": "user", "content": "Nervous but also relieved. I think I need to do this."}
]

if __name__ == "__main__":
    print("=" * 80)
    print("PROFESSIONAL THERAPY REPORT GENERATION TEST")
    print("=" * 80)
    print()

    print("Generating report...")
    print()

    result = generate_professional_report(clarity_summary, conversation_turns)

    if "error" in result:
        print(f"ERROR: {result['error']}")
    else:
        print("=" * 80)
        print("FULL REPORT")
        print("=" * 80)
        print(result["full_report"])
        print()
        print("=" * 80)
        print("METADATA")
        print("=" * 80)
        print(f"Urgency Level: {result['urgency_level']}")
        print()
        print("Cost Information:")
        cost_info = result["cost_info"]
        print(f"  Input tokens: {cost_info['input_tokens']}")
        print(f"  Output tokens: {cost_info['output_tokens']}")
        print(f"  Total tokens: {cost_info['total_tokens']}")
        print(f"  Cost: ${cost_info['cost_usd']:.4f}")
        print(f"  Model: {cost_info['model']}")
        print()
        print("=" * 80)
        print("STRUCTURED SECTIONS")
        print("=" * 80)
        print()
        print("CLINICAL SUMMARY:")
        print(result["clinical_summary"])
        print()
        print("-" * 80)
        print("KEY THEMES:")
        print(result["key_themes"])
        print()
        print("-" * 80)
        print("STRENGTHS:")
        print(result["strengths"])
        print()
        print("-" * 80)
        print("SUPPORT AREAS:")
        print(result["support_areas"])
        print()
        print("-" * 80)
        print("RECOMMENDATIONS:")
        print(result["recommendations"])
        print()
        print("-" * 80)
        print("THERAPIST NOTES:")
        print(result["therapist_notes"])
        print()
        print("=" * 80)
        print("TEST COMPLETED SUCCESSFULLY")
        print("=" * 80)

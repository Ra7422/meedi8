"""
Professional Therapy Report PDF Generation Service for Resolved Mediation Rooms
Uses ReportLab for PDF generation and Claude API for report content
"""
import os
import io
from datetime import datetime
from typing import Dict, List, Optional
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Image, Table, TableStyle
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from anthropic import Anthropic
from app.config import settings

# Initialize Anthropic client
anthropic_client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)

# Professional therapy report prompt for Claude
THERAPY_REPORT_PROMPT = """Based on this mediation transcript, generate a professional therapy-style report suitable for case documentation or mediation review.

Write in a professional, clinical tone appropriate for a licensed therapist or mediator's case file.

Include the following sections:

## PRESENTING ISSUES
Write 2-3 paragraphs summarizing the original conflict from both perspectives. What brought these individuals to mediation? What were their core concerns?

## CONVERSATION SUMMARY
Provide a 3-4 paragraph narrative of the key moments from the mediation dialogue. What topics were discussed? How did the conversation evolve? What turning points occurred?

## OBSERVATIONS
Analyze communication patterns and emotional dynamics you observed (2-3 paragraphs):
- How did each person communicate their needs?
- What communication styles were present (assertive, defensive, collaborative)?
- Were there moments of empathy or breakthrough understanding?
- Any patterns of conflict escalation or de-escalation?

## ASSESSMENT
Evaluate the progress made (2-3 paragraphs):
- What breakthroughs were achieved?
- How effectively did they find common ground?
- What resolution or agreement was reached?
- What does this reveal about their relationship dynamics?

## RECOMMENDATIONS
Provide 2-3 paragraphs of actionable next steps:
- How can they maintain the progress made?
- What skills should they continue practicing (active listening, empathy, etc.)?
- When should they consider seeking professional therapy or additional mediation?
- Include a link to professional therapy resources: https://meedi8.vercel.app/therapy

Keep the report professional, constructive, and focused on growth opportunities. Be specific with examples from the transcript where appropriate."""


def generate_report_content_with_claude(
    room_title: str,
    category: str,
    user1_name: str,
    user2_name: str,
    user1_summary: str,
    user2_summary: str,
    transcript: List[Dict],
    resolution_text: str
) -> Dict:
    """
    Generate professional report content using Claude API

    Args:
        room_title: Title of the mediation room
        category: Category (work, family, romance, money, other)
        user1_name: First user's name
        user2_name: Second user's name
        user1_summary: User 1's perspective summary
        user2_summary: User 2's perspective summary
        transcript: List of conversation turns
        resolution_text: Final agreement text

    Returns:
        Dict with report sections and metadata
    """

    # Build transcript text
    transcript_lines = []
    for msg in transcript:
        role = msg.get('role', 'user')
        content = msg.get('content', '')

        if role == 'assistant':
            transcript_lines.append(f"AI Mediator: {content}")
        elif role == 'resolution':
            transcript_lines.append(f"\n[AGREEMENT REACHED]\n{content}")
        else:
            # Determine speaker name
            user_id = msg.get('userId', 0)
            speaker = user1_name if msg.get('isUser1', True) else user2_name
            transcript_lines.append(f"{speaker}: {content}")

    conversation_transcript = "\n\n".join(transcript_lines)

    # Build full context for Claude
    user_prompt = f"""MEDIATION CASE: {room_title}
CATEGORY: {category}

=== ORIGINAL PERSPECTIVES ===

{user1_name}'s Perspective:
{user1_summary}

{user2_name}'s Perspective:
{user2_summary}

=== MEDIATION TRANSCRIPT ===

{conversation_transcript}

=== FINAL AGREEMENT ===

{resolution_text}

---

Please generate a comprehensive professional therapy report based on the above mediation session."""

    try:
        # Call Claude API
        response = anthropic_client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=4000,
            temperature=0.7,
            messages=[
                {
                    "role": "user",
                    "content": f"{THERAPY_REPORT_PROMPT}\n\n{user_prompt}"
                }
            ]
        )

        # Extract content
        report_content = response.content[0].text

        # Calculate cost
        input_tokens = response.usage.input_tokens
        output_tokens = response.usage.output_tokens

        # Claude Sonnet 4.5 pricing: $0.003 per 1K input, $0.015 per 1K output
        INPUT_COST = 0.003 / 1000
        OUTPUT_COST = 0.015 / 1000
        cost_usd = (input_tokens * INPUT_COST) + (output_tokens * OUTPUT_COST)

        return {
            "report_content": report_content,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "cost_usd": round(cost_usd, 4),
            "model": "claude-sonnet-4-5-20250929"
        }

    except Exception as e:
        print(f"Error generating report content with Claude: {e}")
        import traceback
        traceback.print_exc()
        raise


def create_pdf_report(
    room_id: int,
    room_title: str,
    category: str,
    created_at: datetime,
    user1_name: str,
    user2_name: str,
    report_content: str,
    resolution_text: str
) -> bytes:
    """
    Generate a professional PDF report using ReportLab

    Args:
        room_id: Room ID
        room_title: Title of the mediation
        category: Category of conflict
        created_at: Date of mediation
        user1_name: First participant (anonymized as needed)
        user2_name: Second participant (anonymized as needed)
        report_content: Claude-generated report content
        resolution_text: Final agreement

    Returns:
        bytes: PDF file content
    """

    # Create PDF buffer
    buffer = io.BytesIO()

    # Create document
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=100,
        bottomMargin=72,
    )

    # Container for the 'Flowable' objects
    elements = []

    # Define styles
    styles = getSampleStyleSheet()

    # Custom styles for professional look
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#7DD3C0'),
        spaceAfter=30,
        alignment=TA_CENTER,
        fontName='Times-Bold'
    )

    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.HexColor('#065f46'),
        spaceAfter=12,
        spaceBefore=20,
        fontName='Times-Bold'
    )

    subheading_style = ParagraphStyle(
        'CustomSubHeading',
        parent=styles['Heading3'],
        fontSize=12,
        textColor=colors.HexColor('#374151'),
        spaceAfter=8,
        spaceBefore=12,
        fontName='Times-Bold'
    )

    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['BodyText'],
        fontSize=11,
        leading=16,
        alignment=TA_JUSTIFY,
        spaceAfter=12,
        fontName='Times-Roman'
    )

    info_style = ParagraphStyle(
        'InfoStyle',
        parent=styles['BodyText'],
        fontSize=10,
        leading=14,
        alignment=TA_LEFT,
        spaceAfter=6,
        fontName='Times-Roman',
        textColor=colors.HexColor('#6b7280')
    )

    # Add logo (use PNG version since SVG is complex)
    logo_path = "/Users/adambrown/code/Meedi8/frontend/public/assets/logo/meedi8-logo.png"
    if os.path.exists(logo_path):
        try:
            logo = Image(logo_path, width=2*inch, height=0.6*inch)
            logo.hAlign = 'CENTER'
            elements.append(logo)
            elements.append(Spacer(1, 0.3*inch))
        except Exception as e:
            print(f"Warning: Could not load logo: {e}")

    # Title
    elements.append(Paragraph("Professional Mediation Report", title_style))
    elements.append(Spacer(1, 0.2*inch))

    # Session Information Box
    session_data = [
        ["Session Date:", created_at.strftime("%B %d, %Y")],
        ["Category:", category.title()],
        ["Participants:", f"User 1, User 2 (anonymized)"],
        ["Session ID:", f"#{room_id}"],
        ["Report Generated:", datetime.now().strftime("%B %d, %Y at %I:%M %p")]
    ]

    session_table = Table(session_data, colWidths=[2*inch, 4*inch])
    session_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f9fafb')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#374151')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Times-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Times-Roman'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))

    elements.append(session_table)
    elements.append(Spacer(1, 0.3*inch))

    # Parse and format report content sections
    sections = report_content.split('\n## ')

    for section in sections:
        if not section.strip():
            continue

        lines = section.split('\n', 1)
        section_title = lines[0].replace('#', '').strip()
        section_content = lines[1].strip() if len(lines) > 1 else ""

        # Add section heading
        elements.append(Paragraph(section_title, heading_style))

        # Add section content paragraphs
        paragraphs = section_content.split('\n\n')
        for para in paragraphs:
            if para.strip():
                # Remove any markdown formatting
                clean_para = para.replace('**', '').replace('*', '').strip()
                if clean_para.startswith('- '):
                    # Handle bullet points
                    clean_para = '• ' + clean_para[2:]
                elements.append(Paragraph(clean_para, body_style))

        elements.append(Spacer(1, 0.15*inch))

    # Add final agreement section
    elements.append(Paragraph("Final Agreement", heading_style))
    elements.append(Paragraph(resolution_text, body_style))
    elements.append(Spacer(1, 0.3*inch))

    # Footer disclaimer
    disclaimer = """<i>This report is generated by Meedi8's AI-powered mediation system for documentation purposes.
    It should not be considered a substitute for professional therapy or legal mediation services.
    For ongoing relationship support, consider consulting a licensed therapist or mediator.</i>"""

    disclaimer_style = ParagraphStyle(
        'Disclaimer',
        parent=styles['BodyText'],
        fontSize=9,
        leading=12,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#9ca3af'),
        fontName='Times-Italic'
    )

    elements.append(Spacer(1, 0.3*inch))
    elements.append(Paragraph(disclaimer, disclaimer_style))

    # Add page numbers
    def add_page_number(canvas, doc):
        page_num = canvas.getPageNumber()
        text = f"Page {page_num}"
        canvas.saveState()
        canvas.setFont('Times-Roman', 9)
        canvas.setFillColor(colors.HexColor('#9ca3af'))
        canvas.drawRightString(7.5*inch, 0.5*inch, text)
        canvas.restoreState()

    # Build PDF
    doc.build(elements, onFirstPage=add_page_number, onLaterPages=add_page_number)

    # Get PDF content
    pdf_content = buffer.getvalue()
    buffer.close()

    return pdf_content

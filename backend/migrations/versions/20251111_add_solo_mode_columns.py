"""add solo mode columns to rooms

Revision ID: add_solo_mode
Revises: nullable_room_id
Create Date: 2025-11-11 15:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'add_solo_mode'
down_revision: Union[str, Sequence[str], None] = 'nullable_room_id'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add Solo mode columns to rooms table."""
    # Add room_type column (mediation vs solo)
    op.add_column('rooms', sa.Column('room_type', sa.String(length=20), nullable=False, server_default='mediation'))

    # Solo mode: Clarity summary and action steps
    op.add_column('rooms', sa.Column('clarity_summary', sa.Text(), nullable=True))
    op.add_column('rooms', sa.Column('key_insights', sa.JSON(), nullable=True))
    op.add_column('rooms', sa.Column('suggested_actions', sa.JSON(), nullable=True))
    op.add_column('rooms', sa.Column('action_taken', sa.String(length=500), nullable=True))

    # Solo to Mediation conversion tracking
    op.add_column('rooms', sa.Column('converted_from_solo', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('rooms', sa.Column('converted_at', sa.DateTime(timezone=True), nullable=True))

    # Professional therapy report (Solo mode only)
    op.add_column('rooms', sa.Column('professional_report', sa.Text(), nullable=True))
    op.add_column('rooms', sa.Column('report_generated_at', sa.DateTime(timezone=True), nullable=True))

    # Create index on room_type for faster queries
    op.create_index('ix_rooms_room_type', 'rooms', ['room_type'])


def downgrade() -> None:
    """Remove Solo mode columns from rooms table."""
    op.drop_index('ix_rooms_room_type', table_name='rooms')
    op.drop_column('rooms', 'report_generated_at')
    op.drop_column('rooms', 'professional_report')
    op.drop_column('rooms', 'converted_at')
    op.drop_column('rooms', 'converted_from_solo')
    op.drop_column('rooms', 'action_taken')
    op.drop_column('rooms', 'suggested_actions')
    op.drop_column('rooms', 'key_insights')
    op.drop_column('rooms', 'clarity_summary')
    op.drop_column('rooms', 'room_type')

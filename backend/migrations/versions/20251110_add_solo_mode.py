"""add solo mode

Revision ID: 20251110_solo
Revises: 9109a861e034
Create Date: 2025-11-10 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '20251110_solo'
down_revision: Union[str, Sequence[str], None] = '9109a861e034'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - Add Solo mode columns to rooms table."""
    # Add room_type column (default 'mediation' for existing rooms)
    op.add_column('rooms', sa.Column('room_type', sa.String(length=20), nullable=False, server_default='mediation'))
    op.create_index(op.f('ix_rooms_room_type'), 'rooms', ['room_type'], unique=False)

    # Add clarity summary and insights columns
    op.add_column('rooms', sa.Column('clarity_summary', sa.Text(), nullable=True))
    op.add_column('rooms', sa.Column('key_insights', sa.JSON(), nullable=True))
    op.add_column('rooms', sa.Column('suggested_actions', sa.JSON(), nullable=True))
    op.add_column('rooms', sa.Column('action_taken', sa.String(length=500), nullable=True))

    # Add conversion tracking columns
    op.add_column('rooms', sa.Column('converted_from_solo', sa.Boolean(), nullable=False, server_default='0'))
    op.add_column('rooms', sa.Column('converted_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    """Downgrade schema - Remove Solo mode columns from rooms table."""
    # Remove columns in reverse order
    op.drop_column('rooms', 'converted_at')
    op.drop_column('rooms', 'converted_from_solo')
    op.drop_column('rooms', 'action_taken')
    op.drop_column('rooms', 'suggested_actions')
    op.drop_column('rooms', 'key_insights')
    op.drop_column('rooms', 'clarity_summary')

    # Remove index and column
    op.drop_index(op.f('ix_rooms_room_type'), table_name='rooms')
    op.drop_column('rooms', 'room_type')

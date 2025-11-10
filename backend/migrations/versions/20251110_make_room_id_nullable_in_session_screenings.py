"""make room_id nullable in session_screenings

Revision ID: nullable_room_id
Revises: add_screening_flag
Create Date: 2025-11-10 17:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'nullable_room_id'
down_revision: Union[str, Sequence[str], None] = 'add_screening_flag'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Make room_id nullable in session_screenings table for first-time screening."""
    # PostgreSQL
    op.alter_column('session_screenings', 'room_id',
                    existing_type=sa.Integer(),
                    nullable=True)


def downgrade() -> None:
    """Revert room_id to NOT NULL in session_screenings table."""
    op.alter_column('session_screenings', 'room_id',
                    existing_type=sa.Integer(),
                    nullable=False)

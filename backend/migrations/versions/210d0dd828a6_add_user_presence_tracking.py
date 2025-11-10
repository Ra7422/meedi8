"""add_user_presence_tracking

Revision ID: 210d0dd828a6
Revises: 9109a861e034
Create Date: 2025-11-09 08:53:15.709688

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '210d0dd828a6'
down_revision: Union[str, Sequence[str], None] = '9109a861e034'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('rooms', sa.Column('user1_last_seen_main_room', sa.DateTime(timezone=True), nullable=True))
    op.add_column('rooms', sa.Column('user2_last_seen_main_room', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('rooms', 'user2_last_seen_main_room')
    op.drop_column('rooms', 'user1_last_seen_main_room')

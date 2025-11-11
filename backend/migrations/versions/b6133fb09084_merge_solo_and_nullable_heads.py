"""merge solo and nullable heads

Revision ID: b6133fb09084
Revises: 20251110_solo, nullable_room_id
Create Date: 2025-11-10 21:19:58.921826

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b6133fb09084'
down_revision: Union[str, Sequence[str], None] = ('20251110_solo', 'nullable_room_id')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass

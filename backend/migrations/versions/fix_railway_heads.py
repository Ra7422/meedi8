"""Fix Railway migration heads by removing b6133fb09084

Revision ID: fix_railway_heads
Revises: 4a31d56e5a87
Create Date: 2025-11-11 11:10:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fix_railway_heads'
down_revision: Union[str, Sequence[str], None] = '4a31d56e5a87'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Remove the problematic b6133fb09084 revision from alembic_version table."""
    # Delete the b6133fb09084 revision if it exists in Railway's database
    op.execute("DELETE FROM alembic_version WHERE version_num = 'b6133fb09084'")


def downgrade() -> None:
    """Downgrade not supported for this fix."""
    pass

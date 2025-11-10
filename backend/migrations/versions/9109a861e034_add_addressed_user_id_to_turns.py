"""add addressed_user_id to turns

Revision ID: 9109a861e034
Revises: 71b141593884
Create Date: 2025-11-07 16:33:38.387627

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9109a861e034'
down_revision: Union[str, Sequence[str], None] = '71b141593884'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - Add addressed_user_id column to turns table."""
    # Only add the addressed_user_id column to existing turns table
    op.add_column('turns', sa.Column('addressed_user_id', sa.Integer(), nullable=True))
    op.create_foreign_key(None, 'turns', 'users', ['addressed_user_id'], ['id'], ondelete='SET NULL')


def downgrade() -> None:
    """Downgrade schema - Remove addressed_user_id column from turns table."""
    # Remove the foreign key and column
    op.drop_constraint(None, 'turns', type_='foreignkey')
    op.drop_column('turns', 'addressed_user_id')

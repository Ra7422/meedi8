"""add turn tracking columns

Revision ID: add_turn_tracking_columns
Revises: add_resolution_columns
Create Date: 2025-11-01
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'add_turn_tracking_columns'
down_revision = 'add_resolution_columns'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('turns', sa.Column('input_tokens', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('turns', sa.Column('output_tokens', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('turns', sa.Column('cost_usd', sa.Numeric(10, 6), nullable=False, server_default='0.0'))
    op.add_column('turns', sa.Column('model', sa.String(50), nullable=True))

def downgrade():
    op.drop_column('turns', 'input_tokens')
    op.drop_column('turns', 'output_tokens')
    op.drop_column('turns', 'cost_usd')
    op.drop_column('turns', 'model')

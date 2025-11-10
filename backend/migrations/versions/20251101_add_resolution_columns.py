"""add resolution columns

Revision ID: add_resolution_columns
Revises: add_mediation_phases
Create Date: 2025-11-01
"""
from alembic import op
import sqlalchemy as sa

revision = 'add_resolution_columns'
down_revision = 'add_mediation_phases'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('rooms', sa.Column('resolution_text', sa.Text(), nullable=True))
    op.add_column('rooms', sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('rooms', sa.Column('check_in_date', sa.Date(), nullable=True))

def downgrade():
    op.drop_column('rooms', 'resolution_text')
    op.drop_column('rooms', 'resolved_at')
    op.drop_column('rooms', 'check_in_date')

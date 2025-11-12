"""add professional_report_url to rooms

Revision ID: add_professional_report_url
Revises: add_attachments
Create Date: 2025-11-12

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_professional_report_url'
down_revision = 'add_attachments'
branch_labels = None
depends_on = None


def upgrade():
    # Add professional_report_url column to rooms table
    op.add_column('rooms', sa.Column('professional_report_url', sa.String(500), nullable=True))


def downgrade():
    # Remove professional_report_url column from rooms table
    op.drop_column('rooms', 'professional_report_url')

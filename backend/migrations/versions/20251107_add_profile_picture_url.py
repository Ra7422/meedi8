"""add profile_picture_url

Revision ID: add_profile_picture_url
Revises: add_stripe_fields
Create Date: 2025-11-07
"""
from alembic import op
import sqlalchemy as sa

revision = 'add_profile_picture_url'
down_revision = 'add_stripe_fields'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('users', sa.Column('profile_picture_url', sa.String(500), nullable=True))

def downgrade():
    op.drop_column('users', 'profile_picture_url')

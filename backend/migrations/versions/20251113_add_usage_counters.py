"""Add usage counters to subscriptions

Revision ID: add_usage_counters
Revises: add_professional_report_url
Create Date: 2025-11-13
"""
from alembic import op
import sqlalchemy as sa

revision = 'add_usage_counters'
down_revision = 'add_professional_report_url'

def upgrade():
    # Add room usage tracking
    op.add_column('subscriptions', sa.Column('rooms_created_this_month', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('subscriptions', sa.Column('month_reset_date', sa.DateTime(), nullable=True))

    # Add professional report tracking
    op.add_column('subscriptions', sa.Column('reports_generated_this_month', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('subscriptions', sa.Column('reports_limit_per_month', sa.Integer(), nullable=False, server_default='0'))

    # Initialize month_reset_date for existing subscriptions
    op.execute("""
        UPDATE subscriptions
        SET month_reset_date = DATE_TRUNC('month', CURRENT_TIMESTAMP)
        WHERE month_reset_date IS NULL
    """)

def downgrade():
    op.drop_column('subscriptions', 'reports_limit_per_month')
    op.drop_column('subscriptions', 'reports_generated_this_month')
    op.drop_column('subscriptions', 'month_reset_date')
    op.drop_column('subscriptions', 'rooms_created_this_month')

"""add stripe fields

Revision ID: add_stripe_fields
Revises: add_subscriptions_and_api_costs
Create Date: 2025-11-04
"""
from alembic import op
import sqlalchemy as sa

revision = 'add_stripe_fields'
down_revision = 'add_subscriptions_and_api_costs'
branch_labels = None
depends_on = None

def upgrade():
    # Add Stripe customer ID to users
    op.add_column('users', sa.Column('stripe_customer_id', sa.String(255), nullable=True))
    op.create_index('ix_users_stripe_customer_id', 'users', ['stripe_customer_id'], unique=True)

    # Add Stripe subscription fields to subscriptions
    op.add_column('subscriptions', sa.Column('stripe_subscription_id', sa.String(255), nullable=True))
    op.add_column('subscriptions', sa.Column('stripe_price_id', sa.String(255), nullable=True))
    op.create_index('ix_subscriptions_stripe_subscription_id', 'subscriptions', ['stripe_subscription_id'], unique=True)

def downgrade():
    op.drop_index('ix_subscriptions_stripe_subscription_id', table_name='subscriptions')
    op.drop_column('subscriptions', 'stripe_price_id')
    op.drop_column('subscriptions', 'stripe_subscription_id')

    op.drop_index('ix_users_stripe_customer_id', table_name='users')
    op.drop_column('users', 'stripe_customer_id')

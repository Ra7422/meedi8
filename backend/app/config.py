from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    APP_ENV: str = "dev"
    DATABASE_URL: str = "sqlite:///./dev.db"

    SECRET_KEY: str = "dev-secret-change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120  # 2 hours - mediation sessions can be long

    # API Keys
    ANTHROPIC_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    STRIPE_SECRET_KEY: str = ""
    STRIPE_PUBLISHABLE_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""

    # OAuth
    TELEGRAM_BOT_TOKEN: str = ""

    # Cloudflare Turnstile
    TURNSTILE_SECRET_KEY: str = ""

    # Vercel/Railway API tokens for env var management
    VERCEL_TOKEN: str = ""
    VERCEL_PROJECT_ID: str = ""
    VERCEL_TEAM_ID: str = ""  # Optional, for team projects
    RAILWAY_TOKEN: str = ""
    RAILWAY_PROJECT_ID: str = ""
    RAILWAY_ENVIRONMENT_ID: str = ""
    RAILWAY_SERVICE_ID: str = ""

    # Gemini
    GEMINI_API_KEY: str = ""

    # SendGrid
    SENDGRID_API_KEY: str = ""

    # AWS
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_S3_BUCKET: str = ""

    # Stripe Price IDs (Test Mode)
    STRIPE_PRICE_PLUS_MONTHLY: str = "price_1ST4GSIFSfYvttlAuK48AVkK"
    STRIPE_PRICE_PLUS_YEARLY: str = "price_1ST4HPIFSfYvttlA7wcumfd8"
    STRIPE_PRICE_PRO_MONTHLY: str = "price_1ST4EQIFSfYvttlACMstQcuO"
    STRIPE_PRICE_PRO_YEARLY: str = "price_1ST4FDIFSfYvttlAyIghPKBf"

    # One-time products
    STRIPE_PRICE_COMPREHENSIVE_REPORT: str = ""  # Set in Railway env - $9.99 one-time

    # Stripe Price IDs (Live Mode - for reference when switching to production)
    # STRIPE_PRICE_PLUS_MONTHLY: str = "price_1ST3SOI6BakpcqZhMdACodvT"
    # STRIPE_PRICE_PLUS_YEARLY: str = "price_1ST3RqI6BakpcqZhg8F3UcAd"
    # STRIPE_PRICE_PRO_MONTHLY: str = "price_1ST3W6I6BakpcqZhLTITlNHJ"
    # STRIPE_PRICE_PRO_YEARLY: str = "price_1ST3W6I6BakpcqZhYykzYUG9"

    # Frontend URL for redirects
    FRONTEND_URL: str = "https://meedi8.com"

    # comma-separated
    CORS_ORIGINS: str = (
        "http://localhost:5173,"
        "http://localhost:5174,"
        "http://localhost:5175,"
        "http://127.0.0.1:5173,"
        "http://127.0.0.1:5174,"
        "http://127.0.0.1:5175,"
        "http://localhost:3000,"
        "https://meedi8.com,"
        "https://www.meedi8.com,"
        "https://meedi8.vercel.app,"
        "https://clean-air-med.vercel.app,"
        "https://clean-air-med-git-main-adams-projects-16943c9b.vercel.app,"
        "https://clean-air-pf59n9qld-adams-projects-16943c9b.vercel.app"
    )

    class Config:
        env_file = ".env"
        extra = "ignore"

    @property
    def cors_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

settings = Settings()

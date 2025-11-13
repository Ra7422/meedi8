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

    # Stripe Price IDs
    STRIPE_PRICE_PLUS_MONTHLY: str = "price_1SPo09HXmcf1Lx99xoAB0lEZ"
    STRIPE_PRICE_PLUS_YEARLY: str = "price_1SPo3yHXmcf1Lx99XOiPRSv2"
    STRIPE_PRICE_PRO_MONTHLY: str = "price_1SPo14HXmcf1Lx99PCT2Nxvh"
    STRIPE_PRICE_PRO_YEARLY: str = "price_1SPo3HHXmcf1Lx99a91O2NNp"

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

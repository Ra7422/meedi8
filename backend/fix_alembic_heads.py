#!/usr/bin/env python3
"""
Emergency script to fix Railway's alembic_version table.
Removes the b6133fb09084 revision that's causing multiple heads.
"""
import os
import sys
from sqlalchemy import create_engine, text

def fix_alembic_heads():
    # Get DATABASE_URL from environment
    database_url = os.getenv('DATABASE_URL')

    if not database_url:
        print("ERROR: DATABASE_URL environment variable not set")
        sys.exit(1)

    print(f"Connecting to database...")
    engine = create_engine(database_url)

    try:
        with engine.connect() as conn:
            # Show current heads
            print("\nCurrent alembic_version entries:")
            result = conn.execute(text("SELECT version_num FROM alembic_version"))
            for row in result:
                print(f"  - {row[0]}")

            # Delete the problematic b6133fb09084 revision
            print("\nDeleting b6133fb09084 revision...")
            result = conn.execute(text("DELETE FROM alembic_version WHERE version_num = 'b6133fb09084'"))
            conn.commit()
            print(f"✅ Deleted {result.rowcount} row(s)")

            # Show remaining heads
            print("\nRemaining alembic_version entries:")
            result = conn.execute(text("SELECT version_num FROM alembic_version"))
            for row in result:
                print(f"  - {row[0]}")

            print("\n✅ Fix completed successfully!")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    fix_alembic_heads()

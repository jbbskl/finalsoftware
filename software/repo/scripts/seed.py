#!/usr/bin/env python3

import os
import sys
import asyncio
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext

# Add the parent directory to the path so we can import our models
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.api.models import User, Organization

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

async def main():
    print("🌱 Starting seed script...")
    
    # Database setup
    database_url = os.getenv("DATABASE_URL", "postgresql+psycopg://app:app@localhost:5432/app")
    engine = create_engine(database_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    with SessionLocal() as db:
        try:
            # Create admin user
            admin_user = db.query(User).filter(User.email == "admin@example.com").first()
            if not admin_user:
                admin_user = User(
                    email="admin@example.com",
                    password_hash=hash_password("Admin123!"),
                    role="admin"
                )
                db.add(admin_user)
                print("✅ Created admin user: admin@example.com")
            else:
                print("ℹ️  Admin user already exists: admin@example.com")
            
            # Create creator user
            creator_user = db.query(User).filter(User.email == "creator@example.com").first()
            if not creator_user:
                creator_user = User(
                    email="creator@example.com",
                    password_hash=hash_password("Creator123!"),
                    role="creator"
                )
                db.add(creator_user)
                print("✅ Created creator user: creator@example.com")
            else:
                print("ℹ️  Creator user already exists: creator@example.com")
            
            # Create agency user
            agency_user = db.query(User).filter(User.email == "agency@example.com").first()
            if not agency_user:
                agency_user = User(
                    email="agency@example.com",
                    password_hash=hash_password("Agency123!"),
                    role="agency"
                )
                db.add(agency_user)
                print("✅ Created agency user: agency@example.com")
            else:
                print("ℹ️  Agency user already exists: agency@example.com")
            
            # Create organization for agency user
            if agency_user:
                org = db.query(Organization).filter(Organization.name == "Test Agency").first()
                if not org:
                    org = Organization(
                        name="Test Agency",
                        owner_id=agency_user.id
                    )
                    db.add(org)
                    print("✅ Created organization: Test Agency")
                else:
                    print("ℹ️  Organization already exists: Test Agency")
            
            db.commit()
            print("🎉 Seed script completed successfully!")
            print("\nTest users created:")
            print("Admin:   admin@example.com / Admin123!")
            print("Creator: creator@example.com / Creator123!")
            print("Agency:  agency@example.com / Agency123!")
            
        except Exception as e:
            print(f"❌ Seed script failed: {e}")
            db.rollback()
            sys.exit(1)
        finally:
            db.close()

if __name__ == "__main__":
    asyncio.run(main())
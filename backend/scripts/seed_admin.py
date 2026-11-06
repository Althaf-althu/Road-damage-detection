#!/usr/bin/env python3
"""
Admin User Seeder
==================
Creates the initial admin user for the Kerala PWD authority console.

Usage:
    python seed_admin.py
    python seed_admin.py --email admin@roadwatch.local --name "System Administrator"

Run this once after docker-compose up.
"""

import sys
import os
import argparse
import logging

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.user import User
from app.services.auth_service import hash_password

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgrespassword@localhost:5432/road_damage_db"
)

DEFAULT_ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@roadwatch.local")
DEFAULT_ADMIN_NAME = os.getenv("ADMIN_NAME", "System Administrator")
DEFAULT_ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "ChangeMe@2026!")


def seed_admin(email: str, name: str, password: str, role: str = "admin", update_existing: bool = True):
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    Session = sessionmaker(bind=engine)

    with Session() as session:
        existing = session.query(User).filter(User.email == email).first()
        if existing:
            if update_existing:
                existing.password_hash = hash_password(password)
                existing.full_name = name
                existing.role = role
                existing.is_active = True
                session.commit()
                logger.info("=" * 50)
                logger.info(f"✅ Existing user credentials updated successfully!")
                logger.info(f"   Email:    {email}")
                logger.info(f"   Role:     {role}")
                logger.info("=" * 50)
                return
            else:
                logger.info(f"Admin user already exists: {email} (role: {existing.role})")
                return

        admin = User(
            email=email,
            password_hash=hash_password(password),
            full_name=name,
            role=role,
            is_active=True,
        )
        session.add(admin)
        session.commit()

    logger.info("=" * 50)
    logger.info("✅ Admin user created successfully!")
    logger.info(f"   Email:    {email}")
    logger.info(f"   Role:     {role}")
    logger.info("=" * 50)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed initial admin user")
    parser.add_argument("--email", default=DEFAULT_ADMIN_EMAIL)
    parser.add_argument("--name", default=DEFAULT_ADMIN_NAME)
    parser.add_argument("--password", default=DEFAULT_ADMIN_PASSWORD)
    parser.add_argument("--role", default="admin", choices=["admin", "supervisor", "inspector"])
    args = parser.parse_args()

    seed_admin(args.email, args.name, args.password, args.role)


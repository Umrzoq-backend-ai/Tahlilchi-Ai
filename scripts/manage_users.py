"""Run as the service OS user. Passwords are read from the terminal, never argv."""

import argparse
from getpass import getpass

from app.auth import AuthService, Credentials
from app.config import Settings
from app.errors import AppError
from app.store import Store
from pydantic import ValidationError


def main():
    parser = argparse.ArgumentParser(description="Data Analyst hisoblarini boshqarish")
    parser.add_argument(
        "action", choices=["create-admin", "create-user", "reset-password"]
    )
    parser.add_argument("username")
    parser.add_argument(
        "--claim-legacy",
        action="store_true",
        help="Birinchi adminga eski egasiz datasetlarni biriktirish",
    )
    args = parser.parse_args()
    if args.claim_legacy and args.action != "create-admin":
        parser.error("--claim-legacy faqat create-admin bilan ishlaydi")
    password = getpass("Yangi parol (kamida 12 belgi): ")
    if password != getpass("Parolni takrorlang: "):
        parser.exit(1, "Parollar mos emas.\n")
    try:
        credentials = Credentials(username=args.username, password=password)
    except ValidationError:
        parser.exit(
            1,
            "Login 3..64 lotin harfi/raqam/_.-, parol 12..128 belgi bo‘lishi kerak.\n",
        )
    settings = Settings.from_env()
    auth = AuthService(Store(settings.data_dir), settings)
    try:
        if args.action == "reset-password":
            auth.reset_password(credentials)
            print("Parol yangilandi. Barcha oldingi sessiyalar bekor qilindi.")
        else:
            if args.action == "create-user" and auth.needs_setup():
                parser.exit(1, "Avval create-admin bilan administrator yarating.\n")
            user = auth.create_user(
                credentials,
                first=args.action == "create-admin",
                claim_legacy=args.claim_legacy,
            )
            print(f"Hisob yaratildi: {user['username']} ({user['role']})")
    except AppError as exc:
        parser.exit(1, exc.message + "\n")


if __name__ == "__main__":
    main()

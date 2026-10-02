"""Create the first production admin from temporary environment variables."""

import os

from app.auth import AuthService, Credentials
from app.config import Settings
from app.store import Store
from pydantic import ValidationError


def main() -> None:
    username = os.environ.get("ANALYST_BOOTSTRAP_USERNAME", "").strip()
    password = os.environ.get("ANALYST_BOOTSTRAP_PASSWORD", "")
    if not username and not password:
        return
    if not username or not password:
        raise SystemExit(
            "ANALYST_BOOTSTRAP_USERNAME and ANALYST_BOOTSTRAP_PASSWORD must both be set"
        )

    settings = Settings.from_env()
    auth = AuthService(Store(settings.data_dir), settings)
    if not auth.needs_setup():
        print("Admin bootstrap skipped: an account already exists.")
        return

    try:
        credentials = Credentials(username=username, password=password)
    except ValidationError as exc:
        raise SystemExit(
            "Invalid bootstrap credentials: username must be 3..64 safe characters "
            "and password must be 12..128 characters"
        ) from exc

    user = auth.create_user(credentials, first=True, claim_legacy=True)
    print(f"Initial administrator created: {user['username']}")


if __name__ == "__main__":
    main()

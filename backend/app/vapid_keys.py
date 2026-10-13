"""Печатает ключи Web Push для .env.

Запуск из каталога backend: python -m app.vapid_keys
"""

from base64 import urlsafe_b64encode


def main() -> None:
    from cryptography.hazmat.primitives import serialization
    from py_vapid import Vapid

    vapid = Vapid()
    vapid.generate_keys()
    raw_public = vapid.public_key.public_bytes(
        serialization.Encoding.X962,
        serialization.PublicFormat.UncompressedPoint,
    )
    raw_private = vapid.private_key.private_numbers().private_value.to_bytes(32, "big")
    public = urlsafe_b64encode(raw_public).decode("ascii").rstrip("=")
    private = urlsafe_b64encode(raw_private).decode("ascii").rstrip("=")
    print(f"VAPID_PUBLIC_KEY={public}")
    print(f"VAPID_PRIVATE_KEY={private}")
    print("VAPID_SUBJECT=mailto:diary@example.com")


if __name__ == "__main__":
    main()

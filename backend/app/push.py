import json
import logging
from datetime import date

from pywebpush import WebPushException, webpush
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import PushSubscription

logger = logging.getLogger("app.push")


def notify_task_received(
    db: Session,
    *,
    recipient_id: str,
    sender_name: str,
    title: str,
    day: date,
    task_id: str,
) -> None:
    settings = get_settings()
    private_key = settings.vapid_private_key.replace("\\n", "\n").strip()
    subject = settings.vapid_subject.strip()
    if not private_key or not subject.startswith(("mailto:", "https://")):
        logger.info("Push не отправлен: на сервере не задан ключ VAPID")
        return

    subscriptions = list(
        db.scalars(select(PushSubscription).where(PushSubscription.user_id == recipient_id))
    )
    if not subscriptions:
        logger.info("Push не отправлен: получатель не включил уведомления")
        return

    payload = json.dumps(
        {
            "title": "Новое дело",
            "body": f"{sender_name}: {title}",
            "url": f"/?date={day.isoformat()}",
            "date": day.isoformat(),
            "tag": f"task-{task_id}",
        },
        ensure_ascii=False,
    )
    stale: list[PushSubscription] = []
    for subscription in subscriptions:
        try:
            webpush(
                subscription_info={
                    "endpoint": subscription.endpoint,
                    "keys": {"p256dh": subscription.p256dh, "auth": subscription.auth},
                },
                data=payload,
                vapid_private_key=private_key,
                vapid_claims={"sub": subject},
                ttl=86_400,
            )
        except WebPushException as exc:
            status = getattr(getattr(exc, "response", None), "status_code", None)
            if status in (404, 410):
                stale.append(subscription)
            else:
                logger.warning("Не удалось отправить уведомление: %s", exc)
        except Exception:
            logger.warning("Не удалось отправить уведомление", exc_info=True)

    if not stale:
        return
    try:
        for subscription in stale:
            db.delete(subscription)
        db.commit()
    except Exception:
        logger.warning("Не удалось забыть просроченную подписку", exc_info=True)
        db.rollback()

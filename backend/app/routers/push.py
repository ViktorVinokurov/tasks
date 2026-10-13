from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.deps import CurrentUser
from app.models import PushSubscription
from app.schemas import PushSubscriptionDelete, PushSubscriptionWrite, VapidRead
from app.support import new_id, utcnow

router = APIRouter(prefix="/push", tags=["Уведомления"])


@router.get("/vapid", response_model=VapidRead)
def read_vapid_key(_user: CurrentUser) -> VapidRead:
    public_key = get_settings().vapid_public_key.strip()
    if not public_key:
        raise HTTPException(status_code=404, detail="Уведомления на сервере не настроены")
    return VapidRead(public_key=public_key)


@router.put("/subscription", status_code=204)
def save_subscription(
    payload: PushSubscriptionWrite,
    user: CurrentUser,
    db: Session = Depends(get_db),
) -> Response:
    subscription = db.scalar(select(PushSubscription).where(PushSubscription.endpoint == payload.endpoint))
    if subscription is None:
        db.add(
            PushSubscription(
                id=new_id(),
                user_id=user.id,
                endpoint=payload.endpoint,
                p256dh=payload.keys.p256dh,
                auth=payload.keys.auth,
                created_at=utcnow(),
            )
        )
    else:
        subscription.user_id = user.id
        subscription.p256dh = payload.keys.p256dh
        subscription.auth = payload.keys.auth
    db.commit()
    return Response(status_code=204)


@router.delete("/subscription", status_code=204)
def delete_subscription(
    payload: PushSubscriptionDelete,
    user: CurrentUser,
    db: Session = Depends(get_db),
) -> Response:
    subscription = db.scalar(
        select(PushSubscription).where(
            PushSubscription.endpoint == payload.endpoint,
            PushSubscription.user_id == user.id,
        )
    )
    if subscription is not None:
        db.delete(subscription)
        db.commit()
    return Response(status_code=204)

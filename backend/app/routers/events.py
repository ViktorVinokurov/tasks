import asyncio

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.database import SessionLocal
from app.live import subscription
from app.models import User
from app.security import read_user_id

router = APIRouter(tags=["События"])

_AUTH_SECONDS = 10
_PING_SECONDS = 15
AUTH_CLOSE = 4401


def _user_id(token: str) -> str | None:
    user_id = read_user_id(token)
    if user_id is None:
        return None
    db = SessionLocal()
    try:
        user = db.get(User, user_id)
        return user.id if user is not None else None
    finally:
        db.close()


async def _reject(websocket: WebSocket) -> None:
    try:
        await websocket.close(code=AUTH_CLOSE)
    except RuntimeError:
        return


@router.websocket("/ws")
async def diary_socket(websocket: WebSocket) -> None:
    await websocket.accept()
    try:
        message = await asyncio.wait_for(websocket.receive_json(), timeout=_AUTH_SECONDS)
    except (TimeoutError, WebSocketDisconnect, ValueError, RuntimeError, KeyError):
        await _reject(websocket)
        return

    token = message.get("token") if isinstance(message, dict) and message.get("type") == "auth" else None
    user_id = await asyncio.to_thread(_user_id, token) if isinstance(token, str) else None
    if user_id is None:
        await _reject(websocket)
        return

    try:
        async with subscription(user_id) as queue:
            await websocket.send_json({"type": "ready"})
            while True:
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=_PING_SECONDS)
                except TimeoutError:
                    await websocket.send_json({"type": "ping"})
                    continue
                await websocket.send_json(event)
    except WebSocketDisconnect:
        return

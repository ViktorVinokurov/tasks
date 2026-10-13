import asyncio
import json

_loop: asyncio.AbstractEventLoop | None = None
_subscribers: dict[str, set[asyncio.Queue[dict]]] = {}


def bind_loop(loop: asyncio.AbstractEventLoop | None) -> None:
    global _loop
    _loop = loop


def publish(user_id: str, event: dict) -> None:
    loop = _loop
    if loop is None or loop.is_closed():
        return
    loop.call_soon_threadsafe(_enqueue, user_id, event)


def _enqueue(user_id: str, event: dict) -> None:
    for queue in list(_subscribers.get(user_id, ())):
        queue.put_nowait(event)


def _frame(event: dict) -> str:
    return f"data: {json.dumps(event, ensure_ascii=False)}\n\n"


async def stream(user_id: str):
    queue: asyncio.Queue[dict] = asyncio.Queue()
    _subscribers.setdefault(user_id, set()).add(queue)
    try:
        yield _frame({"type": "ready"})
        while True:
            try:
                event = await asyncio.wait_for(queue.get(), timeout=15)
            except asyncio.TimeoutError:
                yield ": ping\n\n"
                continue
            yield _frame(event)
    finally:
        listeners = _subscribers.get(user_id)
        if listeners is not None:
            listeners.discard(queue)
            if not listeners:
                _subscribers.pop(user_id, None)

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.deps import CurrentUser
from app.live import stream

router = APIRouter(tags=["События"])


@router.get("/events")
async def read_events(user: CurrentUser) -> StreamingResponse:
    return StreamingResponse(
        stream(user.id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
        },
    )

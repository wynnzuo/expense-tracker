import asyncio

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.stt import SpeechToTextError, transcribe_audio

router = APIRouter()


@router.post("/voice")
async def transcribe_voice(file: UploadFile = File(...)) -> dict[str, str]:
    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="空音频文件，无法转写。")

    try:
        # STT 是同步的（WebSocket 连接），放到线程池避免阻塞事件循环
        transcript = await asyncio.to_thread(
            transcribe_audio,
            audio_bytes=audio_bytes,
            filename=file.filename or "recording.webm",
            content_type=file.content_type,
        )
    except SpeechToTextError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return {"transcript": transcript}

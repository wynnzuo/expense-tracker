import os
import tempfile
from pathlib import Path

from app.logging_utils import get_logger

logger = get_logger("app.stt")


class SpeechToTextError(Exception):
    pass


def transcribe_audio(*, audio_bytes: bytes, filename: str, content_type: str | None) -> str:
    api_key = os.getenv("STT_API_KEY", "").strip() or os.getenv("LLM_API_KEY", "").strip()
    model = os.getenv("STT_MODEL", "").strip()

    if not api_key or not model:
        raise SpeechToTextError("STT 未配置，请在 .env 中填写 STT_MODEL 和 STT_API_KEY。")

    if any("一" <= c <= "鿿" for c in api_key):
        raise SpeechToTextError("STT_API_KEY 包含中文占位符，请填写真实的 API Key。")

    # 音频格式检测
    ext = Path(filename).suffix.lower()
    if ext == ".webm":
        fmt = "opus"
        rate = 48000
    elif ext == ".wav":
        fmt = "wav"
        rate = 16000
    elif ext == ".mp3":
        fmt = "mp3"
        rate = 16000
    else:
        fmt = "opus"
        rate = 48000

    # 保存到临时文件
    tmp = tempfile.NamedTemporaryFile(suffix=ext, delete=False)
    try:
        tmp.write(audio_bytes)
        tmp.close()
        audio_path = tmp.name

        logger.info("stt starting | model=%s | format=%s | size=%d", model, fmt, len(audio_bytes))

        # 使用 DashScope Recognition API
        from dashscope.audio.asr.recognition import Recognition, RecognitionCallback, RecognitionResult

        result_holder: list[str | None] = [None]
        error_holder: list[str | None] = [None]

        class _Callback(RecognitionCallback):
            def on_complete(self, result: RecognitionResult) -> None:
                sentence = result.get_sentence()
                if sentence:
                    result_holder[0] = sentence.get("text", "").strip()
                logger.debug("stt on_complete | sentence=%s", result_holder[0])

            def on_error(self, error: str) -> None:
                error_holder[0] = error
                logger.error("stt on_error | error=%s", error)

            def on_open(self) -> None:
                logger.debug("stt connection opened")

            def on_close(self) -> None:
                logger.debug("stt connection closed")

            def on_event(self, result: RecognitionResult) -> None:
                pass

        rec = Recognition(
            model=model,
            callback=_Callback(),
            format=fmt,
            sample_rate=rate,
        )
        rec_result = rec.call(file=audio_path, api_key=api_key)

        # 优先从 callback 获取结果
        if result_holder[0]:
            logger.info("stt completed | text=%s", result_holder[0])
            return result_holder[0]

        # 回退从 call 返回值获取
        sentence = rec_result.get_sentence()
        if sentence:
            text = sentence.get("text", "").strip()
            if text:
                logger.info("stt fallback result | text=%s", text)
                return text

        if error_holder[0]:
            raise SpeechToTextError(f"语音转写失败：{error_holder[0]}")

        raise SpeechToTextError("语音转写失败：返回为空，没有拿到转写文本。")

    except SpeechToTextError:
        raise
    except Exception as exc:
        logger.error("stt exception | error=%s", exc)
        raise SpeechToTextError(f"语音转写出错：{exc}") from exc
    finally:
        try:
            os.unlink(audio_path)
        except Exception:
            pass

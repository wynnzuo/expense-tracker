import os
import struct
import subprocess
import tempfile
import wave
from pathlib import Path

from app.logging_utils import get_logger

logger = get_logger("app.stt")


class SpeechToTextError(Exception):
    pass


def _is_silent_wav(wav_path: str) -> bool:
    """检查 WAV 文件是否过于安静（可能没有语音）。"""
    try:
        with wave.open(wav_path, "rb") as w:
            frames = w.getnframes()
            if frames == 0:
                return True
            raw = w.readframes(min(frames, 16000))  # 只看前 1 秒
            samples = struct.unpack(f"<{len(raw)//2}h", raw[: len(raw) // 2 * 2])
            peak = max(abs(s) for s in samples) / 32768
            return peak < 0.01  # 峰值低于 1% 认为太安静
    except Exception:
        return False  # 无法判断时放行


def _convert_to_wav(input_path: str) -> str:
    """用 ffmpeg 将任意音频转为 DashScope 需要的 16kHz 单声道 WAV。"""
    output = tempfile.NamedTemporaryFile(suffix=".wav", delete=False).name
    cmd = [
        "ffmpeg", "-y", "-i", input_path,
        "-ar", "16000", "-ac", "1", "-sample_fmt", "s16",
        output,
    ]
    try:
        subprocess.run(cmd, capture_output=True, check=True, timeout=30)
        logger.debug("audio converted to wav | input=%s", Path(input_path).name)
        return output
    except subprocess.CalledProcessError as exc:
        raise SpeechToTextError(
            f"音频转换失败：{exc.stderr.decode(errors='ignore')[:200]}"
        ) from exc


def transcribe_audio(*, audio_bytes: bytes, filename: str, content_type: str | None) -> str:
    api_key = os.getenv("STT_API_KEY", "").strip() or os.getenv("LLM_API_KEY", "").strip()
    model = os.getenv("STT_MODEL", "").strip()

    if not api_key or not model:
        raise SpeechToTextError("STT 未配置，请在 .env 中填写 STT_MODEL 和 STT_API_KEY。")

    if any("一" <= c <= "鿿" for c in api_key):
        raise SpeechToTextError("STT_API_KEY 包含中文占位符，请填写真实的 API Key。")

    ext = Path(filename).suffix.lower()
    tmp_input = tempfile.NamedTemporaryFile(suffix=ext, delete=False)
    tmp_wav: str | None = None

    try:
        tmp_input.write(audio_bytes)
        tmp_input.close()
        raw_path = tmp_input.name

        # 转成 16kHz WAV
        tmp_wav = _convert_to_wav(raw_path)

        # 检查音频是否有声音
        if _is_silent_wav(tmp_wav):
            raise SpeechToTextError("音频太安静，请靠近麦克风重新录音。")

        logger.info("stt starting | model=%s | size=%d | wav=%s", model, len(audio_bytes), tmp_wav)

        from dashscope.audio.asr.recognition import Recognition, RecognitionCallback, RecognitionResult

        result_holder: list[str | None] = [None]
        error_holder: list[str | None] = [None]

        class _Callback(RecognitionCallback):
            def on_complete(self, result: RecognitionResult) -> None:
                sentence = result.get_sentence()
                if sentence:
                    if isinstance(sentence, list):
                        texts = [s.get("text", "") for s in sentence if isinstance(s, dict)]
                        result_holder[0] = "".join(texts).strip()
                    elif isinstance(sentence, dict):
                        result_holder[0] = sentence.get("text", "").strip()
                logger.debug("stt on_complete | text=%s", result_holder[0])

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
            format="wav",
            sample_rate=16000,
        )
        logger.debug("stt invoking recognition api...")
        rec_result = rec.call(file=tmp_wav, api_key=api_key)
        logger.debug("stt recognition api returned")

        # 优先从回调拿结果
        if result_holder[0]:
            logger.info("stt completed | text=%s", result_holder[0])
            return result_holder[0]

        # 回退：从 rec.call 返回值提取
        if rec_result:
            sentence = rec_result.get_sentence()
            if sentence:
                if isinstance(sentence, list):
                    texts = [s.get("text", "") for s in sentence if isinstance(s, dict)]
                    full = "".join(texts).strip()
                elif isinstance(sentence, dict):
                    full = sentence.get("text", "").strip()
                else:
                    full = ""
                if full:
                    logger.info("stt fallback result | text=%s", full)
                    return full

        # 再等一会看回调会不会触发
        import time
        deadline = time.time() + 5
        while time.time() < deadline:
            if result_holder[0] is not None:
                logger.info("stt delayed result | text=%s", result_holder[0])
                return result_holder[0]
            time.sleep(0.05)

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
            os.unlink(tmp_input.name)
        except Exception:
            pass
        if tmp_wav:
            try:
                os.unlink(tmp_wav)
            except Exception:
                pass

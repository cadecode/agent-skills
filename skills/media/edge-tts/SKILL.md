---
name: edge-tts
description: Text-to-speech conversion using `uvx edge-tts` for generating audio from text. Use when (1) User requests audio/voice output with the "tts" trigger or keyword. (2) Content needs to be spoken rather than read (multitasking, accessibility, driving, cooking). (3) User wants a specific voice, speed, pitch, or format for TTS output.
author: "@aahl"
---

# Edge-TTS

Generate high-quality text-to-speech audio using Microsoft Edge's neural TTS service via the `uvx edge-tts` command.
Supports multiple languages, voices, adjustable speed/pitch, and subtitle generation.

## Dependencies

遵循 skill-deps 规范安装。当前已全部就绪。

### 环境路径

| 路径 | 用途 |
|------|------|
| `<skill-dir>/.venv/Scripts/python` | Python 隔离环境解释器 (uv) |
| `<skill-dir>/.venv/Scripts/edge-tts` | TTS 命令行入口 |
| `<skill-dir>/pyproject.toml` | Python 依赖声明 |
| `<skill-dir>/uv.lock` | 锁定版本 |

### Python — 核心

| 包 | 用途 | 验证命令 |
|----|------|---------|
| `edge-tts` | 微软 Edge 在线 TTS | `.venv/Scripts/python -c "import edge_tts; print(edge_tts.__version__)"` |

### Python — 传递依赖

| 包 | 用途 | 验证命令 |
|----|------|---------|
| `aiohttp` / `certifi` / `tabulate` / `typing-extensions` | 由 edge-tts 声明，uv.lock 锁定 | `.venv/Scripts/python -c "import aiohttp, certifi, tabulate, typing_extensions; print('OK')"` |

> Python 依赖使用 uv 管理（`uv sync` 可重建环境）。
> 下文示例使用 `uvx edge-tts`；已装好本地环境时，把 `uvx edge-tts` 换成 `.venv/Scripts/edge-tts` 更快（免去每次解析依赖），两者参数完全一致。

## Usage
```shell
uvx edge-tts --text "{msg}" --write-media {tempdir}/{filename}.mp3

# With subtitles
uvx edge-tts --text "{msg}" --write-media {tempdir}/{filename}.mp3 --write-subtitles -
```

## Changing rate(speed), volume and pitch
```shell
uvx edge-tts --text "{msg}" --write-media {tempdir}/{filename}.mp3 --rate=+50%
uvx edge-tts --text "{msg}" --write-media {tempdir}/{filename}.mp3 --volume=+50% --pitch=-50Hz
```

## Changing the voice
```shell
uvx edge-tts --text "{msg}" --write-media {tempdir}/{filename}.mp3 --voice zh-CN-XiaoxiaoNeural
```

## Available voices
```
Name                               Gender    ContentCategories      VoicePersonalities
en-GB-LibbyNeural                  Female    General                Friendly, Positive
en-GB-RyanNeural                   Male      General                Friendly, Positive
en-GB-SoniaNeural                  Female    General                Friendly, Positive
en-GB-ThomasNeural                 Male      General                Friendly, Positive
en-HK-SamNeural                    Male      General                Friendly, Positive
en-HK-YanNeural                    Female    General                Friendly, Positive
en-US-AnaNeural                    Female    Cartoon, Conversation  Cute
en-US-AndrewMultilingualNeural     Male      Conversation, Copilot  Warm, Confident, Authentic, Honest
en-US-AndrewNeural                 Male      Conversation, Copilot  Warm, Confident, Authentic, Honest
en-US-AriaNeural                   Female    News, Novel            Positive, Confident
en-US-AvaMultilingualNeural        Female    Conversation, Copilot  Expressive, Caring, Pleasant, Friendly
en-US-AvaNeural                    Female    Conversation, Copilot  Expressive, Caring, Pleasant, Friendly
en-US-BrianMultilingualNeural      Male      Conversation, Copilot  Approachable, Casual, Sincere
en-US-BrianNeural                  Male      Conversation, Copilot  Approachable, Casual, Sincere
en-US-ChristopherNeural            Male      News, Novel            Reliable, Authority
en-US-EmmaMultilingualNeural       Female    Conversation, Copilot  Cheerful, Clear, Conversational
en-US-EmmaNeural                   Female    Conversation, Copilot  Cheerful, Clear, Conversational
en-US-EricNeural                   Male      News, Novel            Rational
en-US-GuyNeural                    Male      News, Novel            Passion
en-US-JennyNeural                  Female    General                Friendly, Considerate, Comfort
en-US-MichelleNeural               Female    News, Novel            Friendly, Pleasant
en-US-RogerNeural                  Male      News, Novel            Lively
en-US-SteffanNeural                Male      News, Novel            Rational
fr-FR-DeniseNeural                 Female    General                Friendly, Positive
fr-FR-HenriNeural                  Male      General                Friendly, Positive
zh-CN-XiaoxiaoNeural               Female    News, Novel            Warm
zh-CN-YunjianNeural                Male      Sports,  Novel         Passion
zh-CN-liaoning-XiaobeiNeural       Female    Dialect                Humorous
zh-CN-shaanxi-XiaoniNeural         Female    Dialect                Bright
zh-HK-HiuGaaiNeural                Female    General                Friendly, Positive
zh-HK-WanLungNeural                Male      General                Friendly, Positive
zh-TW-HsiaoChenNeural              Female    General                Friendly, Positive
zh-TW-YunJheNeural                 Male      General                Friendly, Positive
```

Retrieve all available voices using shell commands:
```shell
uvx edge-tts --list-voices
```

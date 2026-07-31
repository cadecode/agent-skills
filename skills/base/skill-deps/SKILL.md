---
name: skill-deps
description: >
  依赖管理规范 — 用于任何 skill 需要安装 Python/Node 依赖或下载工具的场景。
  Python 优先使用 uv（.venv + pyproject.toml），降级使用 venv + pip；Node 使用 pnpm 本地安装。
  HTTP/URL 来源需人工确认。安装完成后在 SKILL.md 中写入 Dependencies 章节固化依赖说明。
  Make sure to use this skill even if the user just mentions "install", "missing package", "setup",
  "dependencies", "venv", "pnpm add", "pip install", "uv add", "No module named", or "package not found".
author: @cadecode
---
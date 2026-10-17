---
name: env-info
description: >
  开发环境配置参考：工具路径、版本、包管理器偏好、镜像源。
  核心规则：pnpm 优于 npm/yarn，uv 优于 pip，本地/虚拟环境优于全局。
  Use when user mentions "environment", "which tool", "path", "version", "install",
  "pip install", "npm install", "装个包", "加个依赖", "add package", "-g", "镜像",
  "registry", "index-url", "source", or what's available.
author: "@cadecode"
---

# Env Info

> 本文件描述当前机器：**Debian 13 (trixie) x86_64**

## 规则

- **pnpm** 优于 npm/yarn，**uv** 优于 pip
- 优先本地：Python 用 `.venv` / `uv venv`；Node.js 用项目 `node_modules` + `pnpx`，不用 `-g`
- 替换：`npm install` → `pnpm install`，`pip install` → `uv add`，`python -m venv` → `uv venv`
- **镜像已全局配好** → 不要额外加 `--registry` / `-i` / `--index-url` 参数

## 工具

| 工具 | 版本 | 路径 |
|------|------|------|
| OS | Debian 13 (trixie) x86_64 / kernel 6.12 | — |
| Shell | bash 5.2.37 + oh-my-posh | — |
| Node.js | v24.21.0 | `~/.nvm/versions/node/v24.21.0/bin/node` |
| npm | 11.19.0 | 同上 |
| pnpm | 12.5.1 | `~/.local/share/pnpm/bin/pnpm`（`PNPM_HOME`） |
| corepack | 0.36.0 | nvm node bin |
| nvm | 0.40.3 | `~/.nvm`，`default → 24` |
| Python（系统） | 3.13.5 | `/usr/bin/python3` ⚠️ PEP 668 |
| pip | 25.1.1 | `/usr/bin/pip3` ⚠️ 需 `--break-system-packages` |
| Python（uv 托管） | 3.13.16 / 3.14.8 | `~/.local/share/uv/python/` |
| uv | 0.13.0 | `~/.local/bin/uv` |
| pi | 0.84.2 | `~/.local/share/pnpm/bin/pi` |
| ripgrep | 15.2.0 | `~/.pi/agent/bin/rg` |
| fd | 10.5.0 | `~/.pi/agent/bin/fd` |
| git | 2.47.3 | `/usr/bin/git`（apt，2026-10-17 安装） |
| curl / wget | 8.14.1 / 1.25.0 | `/usr/bin/` |

**未安装**：JDK、Maven、Go、Rust、Docker、VS Code、jq、tmux、zsh

> git 已配置：`~/.gitconfig` 有 `user.name` / `user.email`（Cade Li <cade.li@qq.com>）与 `credential.helper = store`（凭证在 `~/.git-credentials`，权限 600，**不要提交**）

## 镜像源（已配好，直接用）

| 生态 | 源 | 配置位置 |
|---|---|---|
| apt | `mirrors.ustc.edu.cn` | `/etc/apt/sources.list.d/` |
| npm / pnpm | `registry.npmmirror.com` | npm / pnpm config |
| nvm（Node 下载） | `npmmirror.com/mirrors/node` | `~/.bashrc` → `NVM_NODEJS_ORG_MIRROR` |
| pip | `pypi.tuna.tsinghua.edu.cn/simple` | `~/.config/pip/pip.conf` |
| uv（PyPI 索引） | `pypi.tuna.tsinghua.edu.cn/simple` | `~/.config/uv/uv.toml` → `index-url` |
| uv（Python 下载） | 南大 `mirror.nju.edu.cn/github-release/astral-sh/python-build-standalone` | `~/.config/uv/uv.toml` → `python-install-mirror` |

## 注意

- **系统 Python 有 PEP 668**，`pip install` 必被拦 → **用 `uv`，别用 pip**
- 万不得已用 pip：`pip install --user --break-system-packages <pkg>`
- **uv 配置全在 `~/.config/uv/uv.toml`** → 不要再设 `UV_*` 环境变量（重复，且会覆盖文件配置）
- uv.toml 的键是 **`index-url`**；`default-index` 只是 CLI flag，写进 toml 会解析失败
- `uv venv` 默认**不含 pip**，需要时加 `--seed`
- ⚠️ **`python3` 与 `python3.13` 不是同一个 Python**：
  - `python3` → `/usr/bin/python3`（系统 3.13.5）
  - `python3.13` / `python3.14` → `~/.local/bin/`（uv 托管，3.13.16 / 3.14.8）
  - **Linux 上只有 `python3`，没有 `python`**
- Node 由 **nvm** 管理：`npm i -g` 装进当前 node 版本目录，**切版本就丢** → 优先 pnpm
- `pi` 及 npm 全局包都在 `~/.local/share/pnpm/bin`（已在 PATH）
- `uv` 是 pip 装的 → `uv self update` 不可用，升级用
  `pip install --user --break-system-packages -U uv`
- 依赖装到**项目本地**，不要 `-g`

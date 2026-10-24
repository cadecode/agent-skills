# tavily-search（已停用）

> **状态：已停用** — 2026-10-25 从 `skills/search/` 移至 `skills/deprecated/`，Pi 不再扫描到它。
> 替代方案：`pi-web-access` 插件的 `web_search({ provider: "tavily" })` 与 `fetch_content`。

## 原有能力（`tvly` CLI，Python/uv 隔离环境）

| 子命令 | 用途 | 插件是否覆盖 |
|---|---|---|
| `tvly search` | 网页搜索：`--depth`（basic/advanced）、`--topic news`、`--time-range`、`--include-domain` / `--exclude-domain`、`--max-results` | ✅ `web_search` |
| `tvly extract` | 从 URL 提取正文 | ✅ `fetch_content`（更强：PDF/视频/GitHub） |
| `tvly crawl` | 从起始 URL 爬整站 | ❌ **无替代** |
| `tvly map` | 列出站点全部 URL（不取正文） | ❌ **无替代** |
| `tvly research` | 深度调研（run / status / poll） | ❌ **无替代** |

如果将来需要 `crawl` / `map` / `research`，这是恢复本技能的唯一理由。

## 为什么停用

`search` 与 `extract` 已被插件覆盖，且插件额外提供并发聚合、顺序 fallback、结果缓存与 `findText` 二次检索。本技能的 description 极长且带 "search the web / find me / look up" 等触发词，与 `web_search` 高度重叠，会在自动选择时造成路由歧义，并多消耗一次工具往返（`bash` → 读 `SKILL.md` → 跑 CLI）。

## API Key

原 key 存于 `~/.tavily/config.json`（`api_key` 字段，由 `tvly login --api-key` 写入），**已迁移**至 `~/.pi/agent/web-search.json` 的 `tavilyApiKey`。`~/.tavily/config.json` 仅为 CLI 自身凭证存储，可安全删除。

## 恢复方法

```bash
git mv skills/deprecated/tavily-search skills/search/tavily-search
cd skills/search/tavily-search
uv sync                        # 必须：.venv 不入库，且 Windows 控制台脚本内嵌绝对路径
.venv/Scripts/tvly --status    # 验证认证状态（key 仍在 ~/.tavily/config.json）
```

`~/.agents/skills/search` 是指向本仓库 `skills/search` 的符号链接，移回即重新被 Pi 扫描；随后 `/reload` 或重启会话生效。

> 若只想临时用一次而不恢复自动加载，直接读 `SKILL.md` 照文中命令执行即可。

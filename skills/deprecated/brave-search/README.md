# brave-search（已停用）

> **状态：已停用** — 2026-10-25 从 `skills/search/` 移至 `skills/deprecated/`，Pi 不再扫描到它。
> 替代方案：`pi-web-access` 插件的 `web_search({ provider: "brave" })` 与 `fetch_content`。

## 原有能力

- `search.js` — Brave Search API 网页搜索
  - `-n <num>` 结果条数（默认 5，最大 20）
  - `--content` 附带页面正文（markdown）
  - `--country <code>` 指定国家（如 `DE`）
  - `--freshness` 时间过滤：`pd` / `pw` / `pm` / `py` 或 `YYYY-MM-DDtoYYYY-MM-DD`
- `content.js <url>` — 基于 `@mozilla/readability` + `turndown` 提取可读正文
- 依赖：`@mozilla/readability`、`jsdom`、`turndown`、`turndown-plugin-gfm`（pnpm 本地安装，见 `package.json`，`node_modules/` 不入库）

## 为什么停用

插件已完全覆盖搜索与正文提取能力，且功能更强（并发聚合、fallback 路由、PDF/GitHub/YouTube 提取、SSRF 防护、结果缓存与 `findText`）。本技能仅剩两个插件没有的差异点，实际使用频率极低：

1. `--country` 指定国家搜索（插件的 `domainFilter` / `recencyFilter` 不覆盖）
2. `--freshness` 支持任意日期区间（插件仅 `day` / `week` / `month` / `year`）

保留的代价是每次会话都把描述写进 system prompt，并与 `web_search` 的触发语义重叠。

## API Key

原明文 key 存于本目录 `config.json`（`braveApiKey` 字段），**已迁移**至 `~/.pi/agent/web-search.json` 的 `braveApiKey`。本目录的 `config.json` 仅为历史遗留，可安全删除。

## 注意：网络问题

`api.search.brave.com` 在本机遭 DNS 污染，直连超时。详情与 hosts 修复方式见上级 [README](../README.md#已知网络问题brave-search-与-brave-provider-共有)。未修 hosts 前，本技能与插件的 Brave provider 均不可用。

## 恢复方法

```bash
git mv skills/deprecated/brave-search skills/search/brave-search
cd skills/search/brave-search && pnpm install   # node_modules 不入库，需重建
```

`~/.agents/skills/search` 是指向本仓库 `skills/search` 的符号链接，移回即重新被 Pi 扫描；随后 `/reload` 或重启会话生效。

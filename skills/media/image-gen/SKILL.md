---
name: image-gen
displayName: "Image Gen — 出图 / 改图"
description: >
  出图与改图：用 OpenAI 兼容的 Images 接口调用 gpt-image-2 生成图片，或拿参考图编辑。
  Use when the user asks to 出图 / 生成图片 / 画一张 / 来张图，to 改图 / 换背景 / 风格化一张现有图，
  or names gpt-image-2 / ChatGPT Images 2 explicitly.
author: "@cadecode"
license: MIT
---

# Image Gen — 出图 / 改图

`gpt-image-2` 的长处是**画面里要出现准确文字**：海报标题、包装标签、信息图、多语言招牌。纯风格化不是它的长项。

地址与密钥都不在仓库里：`$IMAGE_API_BASE`（到 `/v1` 为止）+ `$IMAGE_API_KEY`，或用 `--provider` 从 `auth.json` 取。

## 步骤

1. **干跑**——先不花钱，确认请求长什么样：

   ```bash
   node scripts/gen-image.js --base "$IMAGE_API_BASE" --prompt "<用户原话>" --out <绝对路径> --dry-run
   ```

   完成判据：打印的 `endpoint` 与 `transport` 符合预期（文生图 = `/images/generations` + JSON；带 `--ref` = `/images/edits` + multipart）。

2. **出图**——去掉 `--dry-run` 原样重跑。

   完成判据：stdout 只有一行绝对路径，文件存在且非空；尺寸与耗时在 stderr。

3. **交付**——把图显示或附给用户。

   完成判据：用户看见了图，而不是只拿到一个路径。

改图只需在第 1 步加 `--ref <图>`（可重复）。

## 参考

### 参数

| 参数 | 说明 |
|------|------|
| `--prompt` | 必填。**原样透传用户的话**：不翻译、不润色、不擅自加风格词 |
| `--out` | 必填。产物路径，父目录自动创建 |
| `--base` | 必填，或 `$IMAGE_API_BASE` |
| `--ref` | 参考图，可重复；有它就走 `/images/edits` |
| `--model` | 默认 `gpt-image-2` |
| `--provider` | 从 `auth.json` 取密钥时的条目名 |
| `--size` | 透传，服务端可能忽略（见「已知坑」） |
| `--timeout-sec` | 默认 300。单张约 30 秒 |

### 退出码

| 码 | 含义 |
|----|------|
| 0 | 成功，路径在 stdout |
| 2 | 参数错误：缺 `--prompt` / `--out` / `--base`，或未知参数 |
| 3 | 找不到密钥 |
| 4 | `--ref` 文件不存在 |
| 5 | 请求失败：非 2xx、回包非 JSON、超时 |
| 7 | 回包无图片（既无 `b64_json` 也无 `url`），多为内容被拒或额度问题 |

失败时只说清是哪一层出错，不要把整段 stderr 甩给用户。

### 接口契约

| 项 | 值 |
|---|---|
| 文生图 | `POST {base}/images/generations`，JSON `{model, prompt}` |
| 改图 | `POST {base}/images/edits`，multipart：`model` / `prompt` / `image`（多图 `image[]`） |
| 回包 | `data[0].b64_json`（PNG）+ `data[0].url` + `usage` |
| 默认尺寸 | 1254×1254 |
| 单张体积 / 耗时 | 约 1.1 MB / 26–31 s |

**已知坑（都实测过）：**

- `size`、`quality`、`background`、`response_format` 传**非法值也返回 200**——未知参数被静默吞掉。别以为传了 `size` 就按那个尺寸出图；要别的尺寸只能出图后裁。
- 回包常同时给 `b64_json` 和 `url`；脚本优先用 `b64_json`，不依赖回源链接可达。
- 单参考用 `image`，多参考用 `image[]`；多参考路径尚未真实验证。

### 提示词

- **主体 + 场景 + 光线**三件事说清楚，比堆形容词有效：「哑光陶瓷水瓶放在暖色亚麻布上，柔和窗光」优于「好看的产品图」。
- **画面文字用引号写死，越短越好**。`"OPEN STUDIO"` 行，整段文案会糊；多语言要点明文字体系（日文假名 / 西里尔 / 阿拉伯语从右到左）。
- 构图词有实际含义：`rule of thirds`、`close-up`、`centered subject`、`shallow depth of field`。
- 改图要**点名什么不能变**：「保持人物姿态与面部」「保留包装上的 logo 与字体」；空间改动用方向词：「标题从右上移到下方居中」。
- 一次只动一个变量，其余一字不改，构图才稳。
- 别写互相打架的指令（「不要文字」+「标签上写 AQUA+」），模型只会随机满足一个；风格锚点最多两个，堆多了互相抵消。

### 什么时候别用

- 图表、流程图、UI 示意 → 写 HTML/SVG，更清晰且可控。
- 超写实人像 → 不是这个模型的强项，换模型而不是硬调词。
- 占位图 → 纯色或渐变，别烧钱。

### 可信度

| 结论 | 状态 |
|---|---|
| 文生图连通，返回 `b64_json` + `url` + `usage`，默认 1254×1254 | ✅ 真实调用 |
| `/images/edits` 端点存在（缺图返回 `image file is required`） | ✅ 探针 |
| 脚本解码与落盘（真实回包回放，字节一致） | ✅ 离线验证 |
| 合法 `size` 是否改变输出 | ⚠️ 未验证 |
| 单图 / 多图改图的真实产出 | ⚠️ 未验证 |

## 安全

- 密钥只来自环境变量或 `auth.json`：不落盘、不打印、不进仓库；`.gitignore` 已挡住 `.env*`、`*.key`、`auth*.json`、`secrets*`、`out/`。
- 只向 `--base` 指定主机发请求；`--base` 可被覆盖，指向不受信地址前先想清楚。
- 参考图会上传到该主机，别拿敏感图片做试验。

---

> 提示词部分思路参考 `agentspace-so/agent-skills` 的 gpt-image-2 skill（MIT），按本机链路重写。

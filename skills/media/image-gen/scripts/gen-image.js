#!/usr/bin/env node
/**
 * gen-image.js — text-to-image & image edit via an OpenAI-compatible Images API.
 *
 * 用法、参数、退出码：`node scripts/gen-image.js --help`（与 SKILL.md 保持同一口径）。
 * 端点必须由外部给出：--base 或 $IMAGE_API_BASE；仓库不内置任何服务商地址。
 * 密钥：$IMAGE_API_KEY -> $OPENAI_API_KEY -> <pi agent dir>/auth.json#<provider>。
 * stdout 只有产物绝对路径；stderr 只有进度；从不输出密钥或图片字节。
 */
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const DEFAULT_MODEL = process.env.IMAGE_MODEL || "gpt-image-2";
const DEFAULT_PROVIDER = process.env.IMAGE_API_PROVIDER || "";
const DEFAULT_TIMEOUT = 300;

const USAGE = `gen-image.js — 出图 / 改图

  node scripts/gen-image.js --base <url> --prompt "<文本>" --out <路径.png> [选项]

必填
  --prompt <text>        用户原话，不要擅自改写
  --out <path>           产物路径，父目录自动创建
  --base <url>           OpenAI 兼容 base（到 /v1 为止），也可用 $IMAGE_API_BASE

可选
  --ref <path>           参考图，可重复；给参考图时走 /images/edits
  --model <id>           默认 ${DEFAULT_MODEL}
  --provider <name>      从 auth.json 取密钥时的 provider 名（或用 $IMAGE_API_KEY）
  --size <WxH>           透传 size 字段（服务端可能忽略，见 SKILL.md）
  --timeout-sec <n>      默认 ${DEFAULT_TIMEOUT}
  --dry-run              只打印将发出的请求，不联网、不花钱
  -h, --help             显示本帮助

退出码
  0 成功   2 参数错误   3 找不到密钥   4 参考图不存在   5 请求失败   7 回包无图片
`;

function fail(code, msg) {
  process.stderr.write(msg.endsWith("\n") ? msg : msg + "\n");
  process.exit(code);
}

function parseArgs(argv) {
  const o = {
    prompt: "", out: "", refs: [], size: "",
    base: process.env.IMAGE_API_BASE || "",
    model: DEFAULT_MODEL,
    provider: DEFAULT_PROVIDER,
    timeoutSec: DEFAULT_TIMEOUT,
    dryRun: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const next = () => {
      const v = argv[++i];
      if (v === undefined) fail(2, `缺少取值: ${flag}`);
      return v;
    };
    switch (flag) {
      case "--prompt": o.prompt = next(); break;
      case "--out": o.out = next(); break;
      case "--ref": o.refs.push(next()); break;
      case "--size": o.size = next(); break;
      case "--model": o.model = next(); break;
      case "--base": o.base = next(); break;
      case "--provider": o.provider = next(); break;
      case "--timeout-sec": o.timeoutSec = Number(next()) || DEFAULT_TIMEOUT; break;
      case "--dry-run": o.dryRun = true; break;
      case "-h": case "--help": process.stdout.write(USAGE); process.exit(0); break;
      default: fail(2, `未知参数: ${flag}\n\n${USAGE}`);
    }
  }
  if (!o.prompt.trim()) fail(2, "--prompt 不能为空");
  if (!o.out) fail(2, "--out 未指定");
  if (!o.base) fail(2, "未指定接口地址：给 --base <url> 或设 $IMAGE_API_BASE（本仓库不内置服务商地址）");
  for (const r of o.refs) if (!fs.existsSync(r)) fail(4, `参考图不存在: ${r}`);
  o.base = o.base.replace(/\/+$/, "");
  return o;
}

function agentDir() {
  return process.env.PI_CODING_AGENT_DIR || path.join(os.homedir(), ".pi", "agent");
}

function resolveKey(provider) {
  if (process.env.IMAGE_API_KEY) return { key: process.env.IMAGE_API_KEY, from: "$IMAGE_API_KEY" };
  if (process.env.OPENAI_API_KEY) return { key: process.env.OPENAI_API_KEY, from: "$OPENAI_API_KEY" };
  if (!provider) {
    fail(3, "没有密钥：设 $IMAGE_API_KEY，或用 --provider 指定 auth.json 中的条目名");
  }
  const authPath = path.join(agentDir(), "auth.json");
  let auth;
  try {
    auth = JSON.parse(fs.readFileSync(authPath, "utf8"));
  } catch (_) {
    fail(3, `没有密钥：既无 $IMAGE_API_KEY，也读不到 ${authPath}`);
  }
  const entry = auth[provider];
  const key = entry && (entry.key || entry.apiKey || entry.access || entry.token);
  if (!key) fail(3, `没有密钥：${authPath} 中找不到 provider "${provider}"`);
  return { key, from: `${authPath}#${provider}` };
}

async function errorText(res) {
  let raw = "";
  try { raw = await res.text(); } catch (_) { /* ignore */ }
  try {
    const j = JSON.parse(raw);
    const m = (j.error && (j.error.message || j.error.code)) || j.message;
    if (m) return `HTTP ${res.status}: ${m}`;
  } catch (_) { /* not json */ }
  return `HTTP ${res.status}: ${raw.slice(0, 300)}`;
}

async function main() {
  const o = parseArgs(process.argv.slice(2));
  const isEdit = o.refs.length > 0;
  const endpoint = `${o.base}/images/${isEdit ? "edits" : "generations"}`;
  const { key, from } = resolveKey(o.provider);

  if (o.dryRun) {
    const plan = {
      endpoint, method: "POST",
      transport: isEdit ? "multipart/form-data" : "application/json",
      auth: `Bearer <${from}>`, model: o.model, prompt: o.prompt,
      size: o.size || "(服务端默认)",
      refs: isEdit ? o.refs : undefined, timeoutSec: o.timeoutSec,
    };
    process.stderr.write("[dry-run] 未发送任何请求：\n" + JSON.stringify(plan, null, 2) + "\n");
    return;
  }

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), o.timeoutSec * 1000);
  const started = Date.now();
  let res;
  try {
    if (!isEdit) {
      const body = { model: o.model, prompt: o.prompt };
      if (o.size) body.size = o.size;
      res = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: ac.signal,
      });
    } else {
      const form = new FormData();
      form.set("model", o.model);
      form.set("prompt", o.prompt);
      if (o.size) form.set("size", o.size);
      // 单张用 image，多张用 image[]（多参考未做真实调用验证）
      const field = o.refs.length === 1 ? "image" : "image[]";
      for (const p of o.refs) {
        form.append(field, new Blob([fs.readFileSync(p)]), path.basename(p) || "ref.png");
      }
      res = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}` },
        body: form,
        signal: ac.signal,
      });
    }
  } catch (e) {
    clearTimeout(timer);
    fail(5, e.name === "AbortError"
      ? `请求超时（${o.timeoutSec}s）。服务端可能仍在生成，可调大 --timeout-sec`
      : `请求失败: ${e.message}`);
  }
  clearTimeout(timer);

  if (!res.ok) fail(5, await errorText(res));

  let payload;
  try {
    payload = await res.json();
  } catch (e) {
    fail(5, `回包不是合法 JSON: ${e.message}`);
  }

  const item = (payload.data && payload.data[0]) || {};
  let bytes = null;
  if (item.b64_json) {
    bytes = Buffer.from(item.b64_json, "base64");
  } else if (item.url) {
    process.stderr.write("[info] 回包无 b64_json，改为下载 url\n");
    const r = await fetch(item.url, { signal: AbortSignal.timeout(120_000) });
    if (!r.ok) fail(5, `下载图片失败: HTTP ${r.status}`);
    bytes = Buffer.from(await r.arrayBuffer());
  }
  if (!bytes || !bytes.length) fail(7, "回包里没有图片（既无 b64_json 也无 url）");

  const outPath = path.resolve(o.out);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, bytes);

  const dims = bytes.slice(1, 4).toString() === "PNG"
    ? `${bytes.readUInt32BE(16)}×${bytes.readUInt32BE(20)}`
    : `未知格式 (magic ${bytes.slice(0, 4).toString("hex")})`;
  const secs = ((Date.now() - started) / 1000).toFixed(1);
  process.stderr.write(`[ok] ${dims}  ${(bytes.length / 1024).toFixed(0)} KB  ${secs}s  model=${payload.model || o.model}  key=${from}\n`);
  process.stdout.write(outPath + "\n");
}

main().catch((e) => fail(5, `未预期的错误: ${e.message}`));

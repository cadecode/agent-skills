# agent-skills

个人 AI 代理技能集合，按主题分类，38 个技能全部带作者署名，支持 `npx skills` 一键安装。

## 快速开始

```bash
# 查看可用的技能
npx skills add cadecode/agent-skills -l --full-depth

# 安装全部（全局）
npx skills add cadecode/agent-skills --full-depth --all

# 安装指定技能
npx skills add cadecode/agent-skills --full-depth -s code-review -s tdd
```

> **`--full-depth` 必须加**：mattpocock 的技能在三级子目录下（如 `skills/mattpocock/engineering/code-review/`），不加会被扫描器跳过。

## 目录结构

```
skills/
├── base/          # 常用基础技能（6）：环境、依赖、提交信息、技能管理
├── coding/        # 编码（1）：frontend-design
├── docs/          # Office 文档（4）：docx、pdf、pptx、xlsx
├── search/        # 搜索（2）：brave-search、tavily-search
├── writing/       # 写作（3）：doc-coauthoring、edit-article、internal-comms
├── mattpocock/    # @mattpocock 技能集（22）
│   ├── engineering/    # 代码工程：code-review、tdd、triage 等 17 个
│   └── productivity/   # 生产力：grill-me、handoff、teach 等 5 个
├── experimental/  # 实验中的技能（不稳定）
└── deprecated/    # 已废弃的技能存档
```

每个分类目录内有 README，列出该分类的技能与一句话说明。

## 安装说明

以下命令等价（本地路径或 GitHub 仓库）：

```bash
# 全局安装
npx skills add cadecode/agent-skills --full-depth --all -g

# 项目级安装
npx skills add cadecode/agent-skills --full-depth --all -p

# 本地路径（开发时测试）
npx skills add /path/to/agent-skills --full-depth --all

# 只装部分技能
npx skills add cadecode/agent-skills --full-depth -s env-info -s git-commit-msg
```

## 实验与废弃目录

| 目录 | 用途 |
|------|------|
| `experimental/` | 新想法的试运行区，结构完整但不保证稳定 |
| `deprecated/` | 被替代或不再维护的技能的存档，保留供参考 |

各目录内 README 有更详细说明。

## 开发

```bash
# 检查所有技能是否有 author 署名（有缺失时退出码 1）
python scripts/check_authors.py

# 按作者统计 / 查询
python scripts/check_authors.py stats
python scripts/check_authors.py list --author mattpocock
```

### 署名约定

- 个人作者用 `@` 前缀且**必须加引号**：`author: "@cadecode"`
- 公司/组织直接写名：`author: anthropic`、`author: tavily-ai`
- 引号是 YAML 规范要求——不加引号 `npx skills` 无法解析该技能

# agent-skills

常用 Skill 配置——按主题分类的 AI 代理技能集合，覆盖开发环境、文档处理、搜索与编程工作流，支持 `npx skills` 按分类或单个安装。

## 目录结构

```
skills/
├── base/          # 常用基础（6）：环境、依赖、提交信息、技能管理
├── coding/        # 编码（1）：frontend-design
├── docs/          # Office 文档（4）：docx、pdf、pptx、xlsx
├── search/        # 搜索（2）：brave-search、tavily-search
├── writing/       # 写作（3）：doc-coauthoring、edit-article、internal-comms
├── media/         # 媒体与可视化（5）：语音合成、图像生成、视频合成、架构图、可编辑 draw.io
├── mattpocock/    # @mattpocock 技能集（22）：engineering 17 + productivity 5
├── experimental/  # 实验中的技能
└── deprecated/    # 已废弃的技能存档
```

## 安装

安装某个分类（以 base 为例）：

```bash
npx skills add cadecode/agent-skills/skills/base --full-depth
```

> `--full-depth` 必须加：mattpocock 的技能在三级子目录下，不加会被扫描器跳过。
> 安装全部技能：`npx skills add cadecode/agent-skills --full-depth`
> 只装部分技能：`npx skills add cadecode/agent-skills --full-depth -s code-review -s tdd`

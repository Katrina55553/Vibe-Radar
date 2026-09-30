# Vibe Coding 雷达

面向 Vibe Coding 新手的项目发现站。项目榜收录「最好玩、最好用、最好搓（硬件）」三条路线各 99 项，共 297 项；GitHub 动态榜每周同步 Trending 周榜和仓库公开信息，帮助你从想法快速走到可验证的 MVP。

## 功能

- **项目榜**：按路线浏览或搜索 297 个静态精选项目，每条路线每次加载 12 项。
- **开工推荐**：根据目标、可用时间、项目形态和经验，实时推荐 3 个项目。
- **项目详情**：查看 MVP、参考来源和三维评分，并生成可复制的开工 Prompt。
- **本地收藏**：点赞结果保存在浏览器 `localStorage` 中。
- **GitHub 动态榜**：按 7 日新增 Star、累计 Star 或最近活跃排序，并支持语言筛选和关键词搜索。
- **一键开工**：从动态榜直接复制项目的 `git clone` 命令。

## 页面

| 路径 | 内容 |
| --- | --- |
| `/` | 297 项静态项目榜与个性化推荐 |
| `/github` | 每周更新的 GitHub 热门项目候选榜 |

页面切换使用浏览器 History API。部署到静态托管服务时，需要将未知路径回退到 `index.html`，以支持直接访问 `/github`。

## 本地开发

建议使用 Node.js 22。

```bash
npm ci
npm run dev
```

Vite 启动后会在终端输出本地访问地址。

## 可用命令

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 执行 TypeScript 检查并构建生产版本 |
| `npm run preview` | 本地预览生产构建 |
| `npm test` | 运行 Vitest 测试 |
| `npm run test:watch` | 以监听模式运行测试 |
| `npm run update:github` | 拉取数据并更新 GitHub 动态榜快照 |
| `npm run update:github:dry` | 校验最新数据，但不写入快照 |

提交前建议运行：

```bash
npm test
npm run build
```

## GitHub 动态榜数据

更新脚本抓取 GitHub Trending 周榜，以页面中的 `stars this week` 作为 7 日新增 Star；随后通过 GitHub API 补全描述、Topics、语言、累计 Star 和活跃时间，并过滤 fork、归档及不可用仓库。

- 最多发布 24 个项目，实际数量取决于当周有效候选数。
- 有效候选少于 10 个时会终止更新，避免发布不完整榜单。
- 快照写入 `src/data/github.snapshot.json`。
- 本地更新可选设置 `GITHUB_TOKEN` 或 `GH_TOKEN`，以获得更高的 API 请求额度。

`.github/workflows/update-github-radar.yml` 会在每周五 08:07（Asia/Shanghai）自动更新。工作流使用仓库内置的 `GITHUB_TOKEN`，无需配置额外 Secret；数据发生变化时会自动提交新快照。

### 手动触发更新

1. 打开 [Update GitHub radar](https://github.com/Katrina55553/Vibe-Radar/actions/workflows/update-github-radar.yml)。
2. 点击 **Run workflow**。
3. 选择 `main` 分支并确认运行。
4. 等待工作流通过；没有生成 Artifacts 属于正常情况。

## 项目结构

```text
.
├─ .github/workflows/       # CI 与 GitHub 动态榜定时更新
├─ scripts/                 # Trending 抓取、GitHub API 补全与数据校验
├─ src/
│  ├─ components/           # 页面、榜单、推荐器和弹窗组件
│  ├─ data/                 # 静态项目数据与 GitHub 快照
│  ├─ domain/               # 项目分类、评分、搜索和推荐规则
│  ├─ hooks/                # 浏览器持久化 Hook
│  ├─ styles/               # 全局样式
│  └─ test/                 # 测试环境配置
├─ index.html
└─ vite.config.ts
```

## 技术栈

React 19 · TypeScript 7 · Vite 8 · Vitest 5 · Testing Library

## 数据说明

静态项目榜为人工整理的启发式精选，分数与推荐用于辅助选题，不代表项目质量的绝对评价。GitHub 动态榜来自 GitHub 的公开页面和公开仓库信息，与 GitHub 官方无隶属关系。

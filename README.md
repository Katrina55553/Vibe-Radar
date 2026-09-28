# Vibe Coding 雷达

基于 React 19、Vite 8 和 TypeScript 的静态项目榜单。

## 开发

```bash
npm install
npm run dev
```

## 验证

```bash
npm test
npm run build
```

## GitHub 动态榜数据

榜单直接抓取 GitHub Trending 周榜页面，使用页面中的 `stars this week` 作为 7 日新增 Star。再通过 GitHub API 补全项目信息、过滤 fork、归档和失效仓库，最终发布最多 24 个项目。实际数量取决于当周 Trending 页面返回的有效项目数。

`.github/workflows/update-github-radar.yml` 会在每周五 08:07（Asia/Shanghai）更新榜单。不需要 Google Cloud、Apify 账号或额外 Secret。

### 首次或手动更新

1. 打开仓库的 [Update GitHub radar](https://github.com/Katrina55553/Vibe-Radar/actions/workflows/update-github-radar.yml) 页面。
2. 点击右侧的 **Run workflow**。
3. Branch 选择 **main**，再次点击 **Run workflow**。
4. 等待运行状态变为绿色的 **Success**。

工作流会抓取周榜、运行测试并更新 `src/data/github.snapshot.json`。数据变化时，它会使用仓库内置的 `GITHUB_TOKEN` 自动提交快照；`Artifacts` 显示为空是正常现象。

首次运行完成后无需重复配置，后续会按计划自动更新。也可以随时通过上述入口手动刷新。

### 本地更新

本地可直接运行：

```bash
npm run update:github
```

`npm run update:github:dry` 会完成同样的数据校验，但不改写快照文件。

## 目录

- `src/components`：页面与交互组件
- `src/data`：项目榜、明星项目和筛选选项
- `scripts`：GitHub Trending 抓取、仓库信息补全与数据校验
- `src/domain`：分类、评分、搜索和推荐规则
- `src/hooks`：浏览器持久化 Hook
- `src/styles`：全局视觉样式

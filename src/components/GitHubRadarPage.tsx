import { useMemo, useState } from 'react'
import { githubSnapshot, type GitHubCandidate } from '../data/github'

type SortKey = 'growth' | 'stars' | 'updated'

const number = new Intl.NumberFormat('zh-CN')
const relativeTime = new Intl.RelativeTimeFormat('zh-CN', { numeric: 'auto' })

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value))
}

function relativeDate(value: string) {
  const days = Math.round((new Date(value).getTime() - Date.now()) / 86_400_000)
  if (Math.abs(days) < 1) return '今天更新'
  return relativeTime.format(days, 'day') + '更新'
}

const languageKits: Record<string, { name: string; detail: string }> = {
  Python: { name: 'Python Workspace', detail: 'venv · pytest · 依赖隔离' },
  TypeScript: { name: 'Node.js Toolchain', detail: 'pnpm · typecheck · test' },
  JavaScript: { name: 'Node.js Toolchain', detail: 'npm · lint · test' },
  Swift: { name: 'Xcode', detail: '本地构建 · Simulator' },
  Kotlin: { name: 'Android Studio', detail: 'Gradle · Emulator' },
  Go: { name: 'Go Toolchain', detail: 'go mod · go test' },
  HTML: { name: 'Browser DevTools', detail: '本地预览 · 响应式检查' },
}

function starterKit(item: GitHubCandidate) {
  return languageKits[item.language] ?? { name: `${item.language} Toolchain`, detail: '按 README 配置本地环境' }
}

function mvpText(item: GitHubCandidate) {
  if (item.language === 'Python') return '先创建虚拟环境并按 README 安装依赖，跑通最小 Demo 或测试，再改一个参数观察结果。'
  if (item.language === 'TypeScript' || item.language === 'JavaScript') return '先核对 Node 与包管理器版本，安装依赖并跑通 dev/test，再从一个可见交互开始修改。'
  if (item.language === 'Swift') return '先确认系统与 Xcode 版本要求，在 Simulator 跑通示例，再从一个独立界面或配置项开始。'
  if (item.language === 'Kotlin') return '先阅读权限与安装说明，在 Emulator 跑通应用，再验证一个最小功能路径。'
  if (item.language === 'Go') return '先执行 go mod download 与 go test，跑通本地入口后再替换一个小模块。'
  return '先阅读 README 与安装要求，跑通最小示例或测试，再完成一个可验证的小改动。'
}

function sortCandidates(items: GitHubCandidate[], sort: SortKey) {
  return [...items].sort((a, b) => {
    if (sort === 'stars') return b.stars - a.stars
    if (sort === 'updated') return Date.parse(b.pushedAt) - Date.parse(a.pushedAt)
    return (b.weeklyGrowth ?? -1) - (a.weeklyGrowth ?? -1) || b.stars - a.stars
  })
}

export function growthRateLabel(item: Pick<GitHubCandidate, 'stars' | 'weeklyGrowth'>) {
  if (item.weeklyGrowth === null) return '—'
  const previousStars = item.stars - item.weeklyGrowth
  if (previousStars <= 0) return '新项目'
  return `+${(item.weeklyGrowth / previousStars * 100).toFixed(1)}%`
}

export function GitHubRadarPage() {
  const [sort, setSort] = useState<SortKey>('growth')
  const [query, setQuery] = useState('')
  const [language, setLanguage] = useState('全部')
  const [copiedRepo, setCopiedRepo] = useState('')

  const languages = useMemo(() => ['全部', ...new Set(githubSnapshot.candidates.map((item) => item.language))], [])
  const candidates = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    const filtered = githubSnapshot.candidates.filter((item) => {
      const matchesLanguage = language === '全部' || item.language === language
      const haystack = `${item.repo} ${item.description} ${item.language} ${item.topics.join(' ')}`.toLocaleLowerCase()
      return matchesLanguage && (!normalizedQuery || haystack.includes(normalizedQuery))
    })
    return sortCandidates(filtered, sort)
  }, [language, query, sort])
  const hasWeeklyRanking = githubSnapshot.source === 'github-trending-weekly'

  async function copyStartCommand(item: GitHubCandidate) {
    try {
      await navigator.clipboard.writeText(`git clone ${item.url}.git`)
      setCopiedRepo(item.repo)
    } catch {
      setCopiedRepo('')
    }
  }

  return (
    <div className="github-page">
      <a className="skip" href="#candidate-list">跳到候选列表</a>
      <header className="site github-header">
        <div className="wrap">
          <a className="logo" href="?"><span className="dot" />Vibe Coding 雷达</a>
          <nav className="pages" aria-label="页面切换">
            <a href="?">项目榜</a>
            <a className="active" href="?view=github">GitHub 动态榜</a>
          </nav>
        </div>
      </header>

      <main>
        <section className="github-hero wrap">
          <div className="github-title">
            <p className="eyebrow mono">GitHub Trending · this week</p>
            <div className="github-title-row">
              <h1>GitHub <span className="radar">动态榜</span></h1>
              <div className="github-intro">
                <p className="lede">根据 GitHub Trending 周榜与页面公开的本周新增 Star，发现当下最受关注的开源项目。项目描述、Topics、语言与活跃时间来自 GitHub 公开数据。</p>
                <div className="sync-line">
                  <span className="sync-dot" />
                  <strong>{hasWeeklyRanking ? '7 日热度数据已就绪' : '仓库数据已就绪'}</strong>
                  <span>{formatDate(githubSnapshot.generatedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="github-board wrap" id="candidate-list">
          <div className="github-board-head">
            <div>
              <p className="mono">Candidate queue</p>
              <h2>新项目候选</h2>
              <p>当前显示 {candidates.length} 个项目，默认按过去 7 天新增 Star 排名。</p>
            </div>
            <div className="snapshot-stamp"><span>LAST SYNC</span><b>{formatDate(githubSnapshot.generatedAt)}</b></div>
          </div>

          <div className="github-controls">
            <div className="sort-tabs" role="group" aria-label="候选排序">
              <button className={sort === 'growth' ? 'on' : ''} onClick={() => setSort('growth')}>7 日新增</button>
              <button className={sort === 'stars' ? 'on' : ''} onClick={() => setSort('stars')}>Star 最多</button>
              <button className={sort === 'updated' ? 'on' : ''} onClick={() => setSort('updated')}>最近活跃</button>
            </div>
            <label className="github-select">
              <span>语言</span>
              <select value={language} onChange={(event) => setLanguage(event.target.value)}>
                {languages.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="github-search">
              <span aria-hidden="true">⌕</span>
              <input type="search" placeholder="搜索仓库、描述、Topic" value={query} onChange={(event) => setQuery(event.target.value)} />
            </label>
          </div>

          <div className="candidate-list">
            {candidates.map((item, index) => {
              const kit = starterKit(item)
              return (
                <article className="candidate-row" key={item.repo}>
                  <div className="candidate-card-head">
                    <div className="candidate-rank">#{index + 1}</div>
                    <strong>近 7 天热门 GitHub 项目</strong>
                    {item.weeklyGrowth !== null && <span className="candidate-signal">+{number.format(item.weeklyGrowth)} Stars</span>}
                    {index < 3 && <span className="candidate-hot">HOT</span>}
                  </div>

                  <div className="candidate-main">
                    <h3><a href={item.url} target="_blank" rel="noopener noreferrer">{item.repo}</a></h3>
                    <p>{item.description}</p>
                    <div className="candidate-facts">
                      <span>累计 {number.format(item.stars)} Stars</span>
                      <span className={`language language-${item.language.toLowerCase()}`}><i />{item.language}</span>
                      <span>{relativeDate(item.pushedAt)}</span>
                    </div>
                    <div className="candidate-topics">
                      {item.topics.slice(0, 2).map((topic) => <span key={topic}>{topic}</span>)}
                    </div>
                  </div>

                  <div className="candidate-mvp">
                    <strong>MVP</strong>
                    <p>{mvpText(item)}</p>
                  </div>

                  <div className="candidate-kit">
                    <div className="candidate-kit-head"><strong>推荐开工栈</strong><span>完整清单</span></div>
                    <div className="candidate-kit-item"><b>GitHub CLI</b><small>克隆项目 · 查看 Issues</small></div>
                    <div className="candidate-kit-item"><b>{kit.name}</b><small>{kit.detail}</small></div>
                  </div>

                  <div className="candidate-card-foot">
                    <div className="candidate-total"><span>累计 STAR</span><strong>{number.format(item.stars)}</strong></div>
                    <button className="candidate-start" onClick={() => void copyStartCommand(item)} aria-label={`复制 ${item.repo} 的克隆命令`}>
                      <b>{copiedRepo === item.repo ? '已复制' : '一键开工'}</b><small>复制 git clone</small>
                    </button>
                    <a className="candidate-source" href={item.url} target="_blank" rel="noopener noreferrer">
                      <b>看来源</b><small>GitHub ↗</small>
                    </a>
                  </div>

                  <div className="candidate-meta" aria-label="项目数据">
                    {item.weeklyGrowth !== null && <>
                      <span>7 日新增 <b>+{number.format(item.weeklyGrowth)}</b></span>
                      <span>增长率 <b>{growthRateLabel(item)}</b></span>
                    </>}
                    <span>同步 <b>{formatDate(item.pushedAt)}</b></span>
                  </div>
                </article>
              )
            })}
            {candidates.length === 0 && <div className="github-empty">没有符合条件的候选项目</div>}
          </div>
        </section>

        <section className="pipeline wrap" aria-label="数据更新流程">
          <span className="mono">Update pipeline</span>
          <div><b>GitHub Trending</b><i>→</i><b>本周新增 Star</b><i>→</i><b>GitHub 资料</b><i>→</i><b>自动排序</b><i>→</i><b>发布页面</b></div>
        </section>
      </main>

      <footer className="site"><div className="wrap"><span>数据来自 GitHub 公开仓库信息</span><span className="brand">Vibe Coding 雷达 · GitHub 动态榜</span></div></footer>
    </div>
  )
}

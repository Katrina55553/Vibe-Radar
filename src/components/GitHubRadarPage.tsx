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

function sortCandidates(items: GitHubCandidate[], sort: SortKey) {
  return [...items].sort((a, b) => {
    if (sort === 'stars') return b.stars - a.stars
    if (sort === 'updated') return Date.parse(b.pushedAt) - Date.parse(a.pushedAt)
    return b.weeklyGrowth - a.weeklyGrowth
  })
}

export function GitHubRadarPage() {
  const [sort, setSort] = useState<SortKey>('growth')
  const [query, setQuery] = useState('')
  const [language, setLanguage] = useState('全部')

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

  const totalStars = githubSnapshot.candidates.reduce((sum, item) => sum + item.stars, 0)
  const totalGrowth = githubSnapshot.candidates.reduce((sum, item) => sum + item.weeklyGrowth, 0)
  const hottestRepo = sortCandidates(githubSnapshot.candidates, 'growth')[0]?.repo ?? '—'

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
            <p className="eyebrow mono">Live repository signals · snapshot based</p>
            <h1>GitHub<br /><span className="radar">动态榜</span></h1>
            <p className="lede">从仓库公开数据中捕捉正在上升的新项目。累计 Star、增长、描述、Topics、语言与活跃时间来自同一份可自动替换的数据快照。</p>
            <div className="sync-line">
              <span className="sync-dot" />
              <strong>数据快照已就绪</strong>
              <span>{formatDate(githubSnapshot.generatedAt)}</span>
            </div>
          </div>

          <aside className="signal-panel" aria-label="GitHub 数据概览">
            <div className="signal-head"><span className="mono">Signal overview</span><span className="live-pill">LIVE DATA</span></div>
            <div className="signal-grid">
              <div><span>候选项目</span><strong>{githubSnapshot.candidates.length}</strong></div>
              <div><span>累计 Stars</span><strong>{number.format(totalStars)}</strong></div>
              <div><span>本周增长</span><strong className="growth">+{number.format(totalGrowth)}</strong></div>
              <div><span>最热项目</span><strong className="repo-stat">{hottestRepo}</strong></div>
            </div>
            <p>增长值来自当前快照与 {formatDate(githubSnapshot.previousSnapshotAt)} 基线的差值。</p>
          </aside>
        </section>

        <section className="github-board wrap" id="candidate-list">
          <div className="github-board-head">
            <div>
              <p className="mono">Candidate queue</p>
              <h2>新项目候选</h2>
              <p>当前显示 {candidates.length} 个项目，名次会随排序规则自动重排。</p>
            </div>
            <div className="snapshot-stamp"><span>LAST SYNC</span><b>{formatDate(githubSnapshot.generatedAt)}</b></div>
          </div>

          <div className="github-controls">
            <div className="sort-tabs" role="group" aria-label="候选排序">
              <button className={sort === 'growth' ? 'on' : ''} onClick={() => setSort('growth')}>增长最快</button>
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
              const growthRate = item.weeklyGrowth / Math.max(1, item.stars - item.weeklyGrowth) * 100
              return (
                <article className="candidate-row" key={item.repo}>
                  <div className="candidate-rank"><span>RANK</span><strong>{String(index + 1).padStart(2, '0')}</strong></div>
                  <div className="candidate-main">
                    <div className="candidate-name-row">
                      <h3><a href={item.url} target="_blank" rel="noopener noreferrer">{item.repo}</a></h3>
                      <span className={`language language-${item.language.toLowerCase()}`}><i />{item.language}</span>
                    </div>
                    <p>{item.description}</p>
                    <div className="candidate-topics">
                      {item.topics.length > 0
                        ? item.topics.slice(0, 6).map((topic) => <span key={topic}>{topic}</span>)
                        : <span className="muted-topic">暂无 Topics</span>}
                    </div>
                  </div>
                  <div className="candidate-metrics">
                    <div><span>累计 STAR</span><strong>★ {number.format(item.stars)}</strong></div>
                    <div><span>本周增长</span><strong className="growth">+{number.format(item.weeklyGrowth)}</strong><small>+{growthRate.toFixed(1)}%</small></div>
                    <div><span>活跃状态</span><strong className="activity">{relativeDate(item.pushedAt)}</strong><small>{formatDate(item.pushedAt)}</small></div>
                  </div>
                  <a className="repo-link" href={item.url} target="_blank" rel="noopener noreferrer" aria-label={`打开 ${item.repo}`}>↗</a>
                </article>
              )
            })}
            {candidates.length === 0 && <div className="github-empty">没有符合条件的候选项目</div>}
          </div>
        </section>

        <section className="pipeline wrap" aria-label="数据更新流程">
          <span className="mono">Update pipeline</span>
          <div><b>GitHub API</b><i>→</i><b>每周快照</b><i>→</i><b>计算增长</b><i>→</i><b>自动排序</b><i>→</i><b>发布页面</b></div>
        </section>
      </main>

      <footer className="site"><div className="wrap"><span>数据来自 GitHub 公开仓库信息</span><span className="brand">Vibe Coding 雷达 · GitHub 动态榜</span></div></footer>
    </div>
  )
}

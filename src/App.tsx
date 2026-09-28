import { useCallback, useEffect, useMemo, useState } from 'react'
import { ProjectBoard, type BoardTab } from './components/ProjectBoard'
import { ProjectModal } from './components/ProjectModal'
import { ProjectPicker } from './components/ProjectPicker'
import { GitHubRadarPage } from './components/GitHubRadarPage'
import { defaultPicks } from './data/content'
import { projectInputs } from './data/projects'
import { enrichProject, type Project } from './domain/project'
import { useLocalStorage } from './hooks/useLocalStorage'

const projects = projectInputs.map(enrichProject)
const validTabs = new Set<BoardTab>(['all', 'play', 'use', 'make'])

function initialTab(): BoardTab {
  const tab = new URLSearchParams(location.search).get('tab') as BoardTab | null
  return tab && validTabs.has(tab) ? tab : 'all'
}

function ProjectRadarApp() {
  const [picks, setPicks] = useState(defaultPicks)
  const [tab, setTab] = useState<BoardTab>(initialTab)
  const [query, setQuery] = useState('')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [likedIds, setLikedIds] = useLocalStorage<Record<string, true>>('vcr-likes', {})
  const [weeklyDismissed, setWeeklyDismissed] = useLocalStorage('vcr-weekly-20260926', false)
  const [weeklyVisible, setWeeklyVisible] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (weeklyDismissed) return
    const timer = window.setTimeout(() => setWeeklyVisible(true), 1200)
    return () => window.clearTimeout(timer)
  }, [weeklyDismissed])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 2200)
    return () => window.clearTimeout(timer)
  }, [toast])

  const closeModal = useCallback(() => setSelectedProject(null), [])
  const totalLikes = useMemo(() => projects.reduce((sum, project) => sum + project.likes, 0) + Object.keys(likedIds).length, [likedIds])

  function changeTab(nextTab: BoardTab) {
    setTab(nextTab)
    const url = new URL(location.href)
    if (nextTab === 'all') url.searchParams.delete('tab')
    else url.searchParams.set('tab', nextTab)
    history.replaceState(null, '', url)
  }

  function toggleLike(project: Project) {
    const id = `${project.track}#${project.rank}`
    setLikedIds((current) => {
      const next = { ...current }
      if (next[id]) delete next[id]
      else next[id] = true
      return next
    })
  }

  function dismissWeekly() {
    setWeeklyVisible(false)
    setWeeklyDismissed(true)
  }

  return (
    <>
      <a className="skip" href="#board">跳到榜单</a>
      <header className="site"><div className="wrap"><a className="logo" href="#top"><span className="dot" />Vibe Coding 雷达</a><nav className="pages" aria-label="页面切换"><a href="#board" className="active">项目榜</a><a href="#picker">帮我选</a><a className="mobile-visible" href="?view=github">GitHub 动态榜</a></nav></div></header>

      <main id="top">
        <div className="wrap hero">
          <div>
            <p className="eyebrow mono">Beginner-friendly project board · 更新 2026/09/28</p>
            <h1>Vibe Coding<br /><span className="radar">雷达</span></h1>
            <p className="lede">给刚开始 Coding 的新手，把<b>好玩、好用、好搓（硬件）</b>三条路线整理成一张 297 项可分享榜单：每个项目都有 MVP、体验标签、参考来源和三维评分。现在还能按时间、目标和经验生成适合你的开工清单。</p>
            <div className="update-note"><strong>每周五 08:00 更新</strong><span>新星项目与常青项目库同步核验</span></div>
            <div className="cta-row"><a className="btn primary" href="#picker">帮我选项目 ↓</a><a className="btn" href="#board">直接看榜单</a></div>
          </div>
          <aside className="stats" aria-label="榜单概览"><h3 className="mono">Selection Overview</h3><div className="grid">
            <div className="stat"><div className="k">SELECTION INDEX</div><div className="v">{projects.length}</div></div><div className="stat"><div className="k">TRACKS</div><div className="v">3<em>+1</em></div></div><div className="stat"><div className="k">TOP SCORE</div><div className="v"><em>98</em></div></div><div className="stat"><div className="k">MVP SPAN</div><div className="v">1-14d</div></div><div className="stat"><div className="k">RISING</div><div className="v">10</div></div><div className="stat"><div className="k">LIKED</div><div className="v">{totalLikes}</div></div>
          </div></aside>
        </div>

        <ProjectPicker projects={projects} picks={picks} onChange={setPicks} onOpen={setSelectedProject} />
        <ProjectBoard projects={projects} tab={tab} query={query} likedIds={likedIds} onTabChange={changeTab} onQueryChange={setQuery} onToggleLike={toggleLike} onOpen={setSelectedProject} />
      </main>

      <footer className="site"><div className="wrap"><button className="footer-link" onClick={() => setWeeklyVisible(true)}>更新日志</button><span>每周五 08:00 定时刷新</span><span className="brand">Vibe Coding 雷达</span></div></footer>
      <ProjectModal
        project={selectedProject}
        onClose={closeModal}
        onCopyResult={(copied) => setToast(copied ? 'Prompt 已复制，去粘贴给你的 AI 编程助手吧' : '复制失败，请手动选中 Prompt 复制')}
      />

      {weeklyVisible && <div className="weekly show"><div className="wd"><span className="date mono">2026-09-26</span><button onClick={dismissWeekly} aria-label="关闭更新提醒">×</button></div><h4>本周项目榜更新</h4><p>本周新建项目补齐新手第一步，新星信号同步核验。</p><ul><li>新增 Laya、ZCode 等 10 个上升项目</li><li>新星榜同步更新，常青项目库保持不变</li><li>Star 为核验时累计值，不代表精确 7 日增量</li></ul><div className="wact"><button className="btn" onClick={dismissWeekly}>知道了</button></div></div>}
      <div className={`toast${toast ? ' show' : ''}`} role="status">{toast}</div>
    </>
  )
}

export default function App() {
  return new URLSearchParams(location.search).get('view') === 'github' ? <GitHubRadarPage /> : <ProjectRadarApp />
}

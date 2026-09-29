import { useCallback, useEffect, useMemo, useState } from 'react'
import { ProjectBoard, type BoardTab } from './components/ProjectBoard'
import { ProjectModal } from './components/ProjectModal'
import { ProjectPicker } from './components/ProjectPicker'
import { GitHubRadarPage } from './components/GitHubRadarPage'
import { SiteHeader, type AppRoute } from './components/SiteHeader'
import { defaultPicks } from './data/content'
import { projectInputs } from './data/projects'
import { enrichProject, type Project } from './domain/project'
import { useLocalStorage } from './hooks/useLocalStorage'

const projects = projectInputs.map(enrichProject)
const validTabs = new Set<BoardTab>(['all', 'play', 'use', 'make'])
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '')

function initialTab(): BoardTab {
  const tab = new URLSearchParams(location.search).get('tab') as BoardTab | null
  return tab && validTabs.has(tab) ? tab : 'all'
}

interface RoutedPageProps {
  onNavigate: (route: AppRoute) => void
}

function ProjectRadarApp({ onNavigate }: RoutedPageProps) {
  const [picks, setPicks] = useState(defaultPicks)
  const [tab, setTab] = useState<BoardTab>(initialTab)
  const [query, setQuery] = useState('')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [likedIds, setLikedIds] = useLocalStorage<Record<string, true>>('vcr-likes', {})
  const [toast, setToast] = useState('')

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

  return (
    <>
      <a className="skip" href="#board">跳到榜单</a>
      <SiteHeader route="projects" onNavigate={onNavigate} />

      <main id="top">
        <div className="wrap hero">
          <div>
            <p className="eyebrow mono">Beginner-friendly project board · 297 项静态精选</p>
            <h1>Vibe Coding<br /><span className="radar">雷达</span></h1>
            <p className="lede">给刚开始 Coding 的新手，把<b>好玩、好用、好搓（硬件）</b>三条路线整理成一张 297 项可分享榜单：每个项目都有 MVP、体验标签、参考来源和三维评分。现在还能按时间、目标和经验生成适合你的开工清单。</p>
            <div className="cta-row"><a className="btn primary" href="#picker">帮我选项目 ↓</a><a className="btn" href="#board">直接看榜单</a></div>
          </div>
          <aside className="stats" aria-label="榜单概览"><h3 className="mono">Selection Overview</h3><div className="grid">
            <div className="stat"><div className="k">SELECTION INDEX</div><div className="v">{projects.length}</div></div><div className="stat"><div className="k">TRACKS</div><div className="v">3</div></div><div className="stat"><div className="k">TOP SCORE</div><div className="v"><em>98</em></div></div><div className="stat"><div className="k">MVP SPAN</div><div className="v">1-14d</div></div><div className="stat"><div className="k">CURATED SET</div><div className="v">静态</div></div><div className="stat"><div className="k">LIKED</div><div className="v">{totalLikes}</div></div>
          </div></aside>
        </div>

        <ProjectPicker projects={projects} picks={picks} onChange={setPicks} onOpen={setSelectedProject} />
        <ProjectBoard projects={projects} tab={tab} query={query} likedIds={likedIds} onTabChange={changeTab} onQueryChange={setQuery} onToggleLike={toggleLike} onOpen={setSelectedProject} />
      </main>

      <footer className="site"><div className="wrap"><span>297 个新手友好项目 · 静态精选</span><span className="brand">Vibe Coding 雷达</span></div></footer>
      <ProjectModal
        project={selectedProject}
        onClose={closeModal}
        onCopyResult={(copied) => setToast(copied ? 'Prompt 已复制，去粘贴给你的 AI 编程助手吧' : '复制失败，请手动选中 Prompt 复制')}
      />

      <div className={`toast${toast ? ' show' : ''}`} role="status">{toast}</div>
    </>
  )
}

export default function App() {
  const [route, setRoute] = useState<AppRoute>(() => getRoute())

  useEffect(() => {
    const syncRoute = () => setRoute(getRoute())
    window.addEventListener('popstate', syncRoute)
    return () => window.removeEventListener('popstate', syncRoute)
  }, [])

  function navigate(nextRoute: AppRoute) {
    const nextPath = nextRoute === 'github' ? `${basePath}/github` : `${basePath}/`
    if (route !== nextRoute || location.search || location.hash) history.pushState(null, '', nextPath)
    setRoute(nextRoute)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }

  return route === 'github'
    ? <GitHubRadarPage onNavigate={navigate} />
    : <ProjectRadarApp onNavigate={navigate} />
}

function getRoute(): AppRoute {
  const path = location.pathname.replace(/\/+$/, '')
  return path.endsWith('/github') ? 'github' : 'projects'
}

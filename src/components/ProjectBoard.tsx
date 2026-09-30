import { useEffect, useMemo, useRef, useState } from 'react'
import { matchesQuery } from '../domain/recommendation'
import { tracks, trackMeta, type Project, type TrackKey } from '../domain/project'

export type BoardTab = 'all' | TrackKey

interface Props {
  projects: Project[]
  tab: BoardTab
  query: string
  likedIds: Record<string, true>
  onTabChange: (tab: BoardTab) => void
  onQueryChange: (query: string) => void
  onToggleLike: (project: Project) => void
  onOpen: (project: Project) => void
}

const tabs: Array<[BoardTab, string]> = [['all', '全部'], ['play', '好玩'], ['use', '好用'], ['make', '好搓（硬件）']]
const projectId = (project: Project) => project.id
const pageSize = 12

function initialVisibleCounts() {
  return Object.fromEntries(tracks.map((track) => [track, pageSize])) as Record<(typeof tracks)[number], number>
}

export function ProjectBoard(props: Props) {
  const lanes = useMemo(() => tracks.filter((track) => props.tab === 'all' || trackMeta[track].key === props.tab), [props.tab])
  const [visibleCounts, setVisibleCounts] = useState(initialVisibleCounts)
  const previousQuery = useRef(props.query)
  const projectsByLane = useMemo(() => Object.fromEntries(tracks.map((track) => [
    track,
    props.projects.filter((project) => project.track === track && matchesQuery(project, props.query)),
  ])) as Record<(typeof tracks)[number], Project[]>, [props.projects, props.query])
  const maxRanks = useMemo(() => Object.fromEntries(tracks.map((track) => [
    track,
    Math.max(...props.projects.filter((project) => project.track === track).map((project) => project.rank)),
  ])) as Record<(typeof tracks)[number], number>, [props.projects])

  useEffect(() => {
    if (previousQuery.current === props.query) return
    previousQuery.current = props.query
    setVisibleCounts(initialVisibleCounts())
  }, [props.query])

  function showMore(lane: (typeof tracks)[number]) {
    setVisibleCounts((current) => ({ ...current, [lane]: current[lane] + pageSize }))
  }

  return (
    <section className="block wrap" id="board">
      <div className="sec-head"><span className="mono">Project board</span><h2>按你的目标挑项目</h2></div>
      <div className="board-bar">
        <div className="tabs" role="tablist" aria-label="分组">
          {tabs.map(([tab, label]) => <button role="tab" aria-selected={props.tab === tab} className={`tab${props.tab === tab ? ' on' : ''}`} onClick={() => props.onTabChange(tab)} key={tab}>{label}</button>)}
        </div>
        <div className="search"><label htmlFor="q">SEARCH</label><input id="q" type="search" value={props.query} onChange={(event) => props.onQueryChange(event.target.value)} placeholder="搜项目 / 标签 / 来源…" /></div>
      </div>
      <div className="board-3col">
        {lanes.map((lane) => {
          const meta = trackMeta[lane]
          const projects = projectsByLane[lane]
          const visibleProjects = projects.slice(0, visibleCounts[lane])
          const remaining = projects.length - visibleProjects.length
          return (
            <div className={`lane${lanes.length === 1 ? ' solo' : ''}`} key={lane}>
              <div className={`lane-head ${meta.key}`}><span className="mono">{meta.label}</span><strong>{lane}</strong><em>#1 → #{maxRanks[lane]}</em></div>
              <div className="cards">
                {projects.length === 0 ? <p className="empty">没有匹配的项目</p> : visibleProjects.map((project) => {
                  const id = projectId(project)
                  const liked = Boolean(props.likedIds[id])
                  return (
                    <article className={`card ${meta.key}`} key={id}>
                      <div className="row1"><span className="rk">#{project.rank}</span><span className={`trk ${meta.key}`}>{meta.short}</span><button className={`like${liked ? ' liked' : ''}`} aria-label={`给${project.title}点赞`} onClick={() => props.onToggleLike(project)}>{liked ? '♥' : '赞'} <b>{project.likes + (liked ? 1 : 0)}</b></button></div>
                      <h3>{project.title}</h3><p className="desc">{project.desc}</p>
                      <div className="tags">{project.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
                      <p className="mvp">{project.mvp}</p>
                      <div className="foot"><button className="go" onClick={() => props.onOpen(project)}>一键开工 · 体检+Prompt</button><a className="src" href={project.sourceUrl ?? `https://github.com/search?q=${encodeURIComponent(project.source)}`} target="_blank" rel="noopener noreferrer">看来源 · {project.source} ↗</a></div>
                    </article>
                  )
                })}
                {remaining > 0 && (
                  <button className="load-more" onClick={() => showMore(lane)}>
                    再看 {Math.min(pageSize, remaining)} 个
                    <small>已显示 {visibleProjects.length} / {projects.length}</small>
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

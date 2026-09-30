import { pickGroups } from '../data/content'
import { recommendProjects } from '../domain/recommendation'
import { trackMeta, type PickState, type Project } from '../domain/project'

interface Props {
  projects: Project[]
  picks: PickState
  onChange: (picks: PickState) => void
  onOpen: (project: Project) => void
}

export function ProjectPicker({ projects, picks, onChange, onOpen }: Props) {
  const recommended = recommendProjects(projects, picks)

  return (
    <section className="block wrap" id="picker">
      <div className="picker">
        <span className="mono">Starter picker</span>
        <h2>先挑 3 个最适合你开工的项目</h2>
        <p className="sec-sub">每组选一个，找到适合你的第一步。修改选择后，推荐会即时更新。</p>
        <div className="pick-groups">
          {Object.entries(pickGroups).map(([rawKey, group]) => {
            const key = rawKey as keyof PickState
            return (
              <div className="pick-group" key={key}>
                <div className="glabel">{group.label} OPTIONS</div>
                <div className="chips">
                  {group.options.map((option, index) => (
                    <button
                      className={`chip${picks[key] === option ? ' on' : ''}`}
                      title={`${group.label}：${option}。${group.hints[index] ?? ''}`}
                      onClick={() => onChange({ ...picks, [key]: option })}
                      key={option}
                    ><b>{option}</b></button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        <div className="pick-now">
          {Object.entries(pickGroups).map(([rawKey, group]) => {
            const key = rawKey as keyof PickState
            return <span key={key}><em>{group.label}</em> · <strong>{picks[key]}</strong></span>
          })}
        </div>
        <div className="reco-grid">
          {recommended.map((project, index) => {
            const meta = trackMeta[project.track]
            const matches = [
              project.goal === picks.goal ? `目标“${picks.goal}”` : null,
              project.time === picks.time ? `时间“${picks.time}”` : null,
              project.form === picks.form ? `形式“${picks.form}”` : null,
              project.exp === picks.exp ? `经验“${picks.exp}”` : null,
            ].filter((match): match is string => Boolean(match))
            return (
              <article className="reco-card" key={project.id}>
                <div className="top"><span className="rk">#{index + 1}</span><span className={`trk ${meta.key}`}>{meta.short}</span><span className="score">{project.total}</span></div>
                <h3>{project.title}</h3>
                <p className="why">推荐理由：{matches.length > 0 ? `匹配${matches.join('、')}` : '综合排名靠前'}；先做一个{project.form}形态的 MVP。</p>
                <div className="tags">{project.tags.slice(0, 3).map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
                <div className="reco-actions"><button className="mini-btn solid" onClick={() => onOpen(project)}>一键开工 · 体检+Prompt</button></div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

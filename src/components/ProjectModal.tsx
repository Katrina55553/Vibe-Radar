import { useEffect, useRef } from 'react'
import { trackMeta, type Project } from '../domain/project'

interface Props {
  project: Project | null
  onClose: () => void
  onCopied: () => void
}

function projectPrompt(project: Project) {
  return `我想做一个「${project.title}」。
${project.desc}

请帮我：
1. 先做一次环境体检：列出需要安装的工具、版本要求和检查命令（我的经验：${project.exp}）。
2. 用最小技术栈搭一个能跑起来的 MVP，第一步目标：${project.mvp}
3. 给出分步实现计划和完整可运行代码，每步说明如何验证效果。
时间预算：${project.time}。参考来源：${project.source}。`
}

export function ProjectModal({ project, onClose, onCopied }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!project) return
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKeyDown)
    return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', onKeyDown) }
  }, [project, onClose])

  if (!project) return null
  const meta = trackMeta[project.track]
  const prompt = projectPrompt(project)
  const steps = [project.mvp, `打磨核心体验：把「${project.tags[0]}」和「${project.tags[1]}」做顺手，加一个让人“哇”的细节。`, '导出或分享成果，发给朋友收集第一波反馈，再决定要不要迭代。']

  async function copyPrompt() {
    await navigator.clipboard.writeText(prompt)
    onCopied()
  }

  return (
    <div className="modal-mask show" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="mhead"><h3 id="modal-title">#{project.rank} {project.title}</h3><button ref={closeRef} className="x" onClick={onClose} aria-label="关闭">×</button></div>
        <div className="tags" style={{ marginTop: 10 }}><span className="tag hot">{meta.short}路线</span>{project.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
        <div className="scores">{([['上手友好', project.ease], ['效果直观', project.wow], ['实用价值', project.useful]] as const).map(([label, value]) => <div className="score-row" key={label}><span>{label}</span><span className="bar"><i style={{ width: `${value}%` }} /></span><span className="val">{value}</span></div>)}</div>
        <div className="plabel mono" style={{ fontSize: 11, letterSpacing: '.12em', color: 'var(--ink-2)' }}>MVP 开工路线</div>
        <div className="steps">{steps.map((step, index) => <div className="step" key={step}><b>0{index + 1}</b><span>{step}</span></div>)}</div>
        <div className="prompt-box"><div className="plabel">开工 PROMPT（复制给 AI 编程助手）</div><pre>{prompt}</pre></div>
        <div className="mactions"><button className="btn primary" onClick={() => void copyPrompt()}>复制 Prompt</button><a className="btn" href={`https://github.com/search?q=${encodeURIComponent(project.source)}`} target="_blank" rel="noopener noreferrer">看来源 · {project.source} ↗</a></div>
      </div>
    </div>
  )
}

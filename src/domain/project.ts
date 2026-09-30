export const tracks = ['最好玩的项目', '最好用的项目', '最好搓的项目'] as const
export type Track = (typeof tracks)[number]

export const forms = ['网页互动', '文档/数据', 'AI Agent', '硬件设备'] as const
export const goals = ['拿来演示', '日常自用', '工作提效', '技术探索'] as const
export const times = ['2 小时见效', '周末完成', '一周打磨', '长期迭代'] as const
export const experiences = ['刚开始', '能装依赖', '能接 API', '能折腾硬件'] as const

export type ProjectForm = (typeof forms)[number]
export type ProjectGoal = (typeof goals)[number]
export type ProjectTime = (typeof times)[number]
export type ProjectExperience = (typeof experiences)[number]

export interface ProjectScores {
  ease: number
  wow: number
  useful: number
  total: number
}

export interface ProjectProfile {
  form?: ProjectForm
  goal?: ProjectGoal
  time?: ProjectTime
  exp?: ProjectExperience
}

export interface ProjectInput {
  id?: string
  rank: number
  track: Track
  likes: number
  title: string
  desc: string
  mvp: string
  tags: string[]
  source: string
  sourceUrl?: string
  profile?: ProjectProfile
  scores?: ProjectScores
}

export interface Project extends ProjectInput {
  id: string
  form: ProjectForm
  goal: ProjectGoal
  time: ProjectTime
  exp: ProjectExperience
  ease: number
  wow: number
  useful: number
  total: number
}

export interface PickState {
  time: ProjectTime
  goal: ProjectGoal
  form: ProjectForm
  exp: ProjectExperience
}

export type TrackKey = 'play' | 'use' | 'make'

export interface TrackMeta {
  key: TrackKey
  short: string
  label: string
  lane: Track
}

export const trackMeta: Record<Track, TrackMeta> = {
  最好玩的项目: { key: 'play', short: '好玩', label: 'PLAY', lane: '最好玩的项目' },
  最好用的项目: { key: 'use', short: '好用', label: 'USE', lane: '最好用的项目' },
  最好搓的项目: { key: 'make', short: '好搓', label: 'MAKE', lane: '最好搓的项目' },
}

export function projectIdOf(project: ProjectInput): string {
  if (project.id?.trim()) return project.id.trim()

  const rawSource = project.sourceUrl?.trim() || project.source.trim()
  try {
    const url = new URL(rawSource)
    const path = url.pathname.replace(/\/+$/, '').replace(/\.git$/i, '')
    return `project:${url.hostname.toLocaleLowerCase()}${path.toLocaleLowerCase()}`
  } catch {
    return `project:source:${rawSource.toLocaleLowerCase().replace(/\s+/g, '-')}`
  }
}

export function legacyProjectId(project: Pick<Project, 'track' | 'rank'>): string {
  return `${project.track}#${project.rank}`
}

function formOf(project: ProjectInput): ProjectForm {
  if (trackMeta[project.track].key === 'make') return '硬件设备'
  const text = project.title + project.tags.join('') + project.desc
  if (/AI|Agent|RAG|模型|LLM|智能|语音|OCR|自动化/i.test(text)) return 'AI Agent'
  if (/文档|PDF|表格|搜索|资料|笔记|知识|档案|库|Wiki|SOP|手册|CRM|后台/.test(text)) return '文档/数据'
  return '网页互动'
}

function goalOf(project: ProjectInput): Project['goal'] {
  const text = project.title + project.desc + project.tags.join('') + project.source
  if (/AI|Agent|RAG|LLM|模型|WebGL|Web Audio|Canvas|物理|算法|渲染|着色器|语音|OCR|自动化|机器人|SDR|ESP32|树莓派|传感器|MQTT/i.test(text)) return '技术探索'
  if (trackMeta[project.track].key === 'play') return '拿来演示'
  return /个人|家庭|家人|生活|相册|食谱|财务|密码|订阅|植物|照片/.test(text) ? '日常自用' : '工作提效'
}

function timeOf(project: ProjectInput): ProjectTime {
  const key = trackMeta[project.track].key
  if (key === 'make') return project.rank <= 10 ? '一周打磨' : '长期迭代'
  if (key === 'use') return project.rank <= 12 ? '周末完成' : '一周打磨'
  return project.rank <= 12 ? '2 小时见效' : '周末完成'
}

function experienceOf(project: ProjectInput): ProjectExperience {
  if (trackMeta[project.track].key === 'make') return '能折腾硬件'
  const text = project.tags.join('') + project.desc
  if (/自托管|部署|API|数据库|MQTT|服务|同步|固件|网关|账号/.test(text)) return '能接 API'
  if (trackMeta[project.track].key === 'use' && project.rank <= 10) return '能装依赖'
  return '刚开始'
}

export function enrichProject(input: ProjectInput): Project {
  const id = projectIdOf(input)
  const form = input.profile?.form ?? formOf(input)
  const goal = input.profile?.goal ?? goalOf(input)
  const time = input.profile?.time ?? timeOf(input)
  const exp = input.profile?.exp ?? experienceOf(input)
  const key = trackMeta[input.track].key
  const ease = input.scores?.ease ?? Math.min(98, Math.round(88 - (input.rank - 1) * 1.1 + Math.min(input.likes, 20) * 0.4 + (exp === '刚开始' ? 6 : 0)))
  const wow = input.scores?.wow ?? Math.min(98, Math.round((key === 'play' ? 90 : key === 'use' ? 72 : 80) - (input.rank - 1) * 0.6 + Math.min(input.likes, 30) * 0.3))
  const useful = input.scores?.useful ?? Math.min(98, Math.round((key === 'use' ? 90 : key === 'play' ? 70 : 84) - (input.rank - 1) * 0.6 + Math.min(input.likes, 30) * 0.25))
  const total = input.scores?.total ?? Math.round((ease + wow + useful) / 3)
  return { ...input, id, form, goal, time, exp, ease, wow, useful, total }
}

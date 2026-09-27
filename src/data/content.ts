import type { PickState, ProjectExperience, ProjectForm, ProjectGoal, ProjectTime } from '../domain/project'

export interface StarProject {
  rank: number
  name: string
  stars: string
  desc: string
  tags: string[]
}

export const stars: StarProject[] = [
  { rank: 1, name: 'NandhaKishorM/laya', stars: '23,857', desc: '用本地小模型对文字做选择、打分和是非判断，而不是生成长回答。', tags: ['本周新建累计 23,857', '前沿增长', '效果直观'] },
  { rank: 2, name: 'zai-org/ZCode', stars: '6,743', desc: 'Z.ai 开源的桌面 AI 编程工具，可在自己的项目里试写代码。', tags: ['本周新建累计 6,743', '前沿增长', '效果直观'] },
  { rank: 3, name: 'jev-chat/jev-chat-jarvis', stars: '6,432', desc: '在聊天窗口旁给出回复建议，由你决定是否填入和发送。', tags: ['本周新建累计 6,432', '前沿增长', '进阶挑战'] },
  { rank: 4, name: 'unreallabsai/unreal-agent', stars: '1,897', desc: '异步执行工具调用的 Agent 框架，适合学习任务协调机制。', tags: ['AI 应用编排', '工具调用', '可发布应用'] },
  { rank: 5, name: 'bespokelabsai/nimble', stars: '1,762', desc: '本地结构化决策模型与训练配方，适合做分类和选择任务。', tags: ['本周新建累计 1,762', '前沿增长', '进阶挑战'] },
  { rank: 6, name: 'driceroland/Search', stars: '1,330', desc: '使用系统 WebKit 的轻量 Mac 浏览器，提供独立下载和安装入口。', tags: ['本周新建累计 1,330', '前沿增长'] },
]

export const references = [
  'GitHub · creative-coding topic', 'GitHub · game-development topic', 'GitHub · WebGL topic',
  'GitHub · Canvas topic', 'GitHub · Web Audio topic', 'GitHub · self-hosted topic', 'GitHub · AI agents topic',
  'GitHub · RAG topic', 'GitHub · ESP32 topic', 'GitHub · Raspberry Pi topic', 'GitHub · home-automation topic',
  'GitHub · 3D printing topic', 'GitHub · Home Assistant topic', 'Awesome · self-hosted list', 'GitHub · Trending weekly',
]

interface PickGroup<T extends string> {
  label: string
  options: readonly T[]
  hints: readonly string[]
}

export const pickGroups: {
  time: PickGroup<ProjectTime>
  goal: PickGroup<ProjectGoal>
  form: PickGroup<ProjectForm>
  exp: PickGroup<ProjectExperience>
} = {
  time: { label: '时间', options: ['2 小时见效', '周末完成', '一周打磨', '长期迭代'], hints: ['优先推荐马上能跑起来的轻量项目。', '平衡完成度和惊喜感。', '允许更多集成、部署和打磨。', '适合做成长期使用的小系统。'] },
  goal: { label: '目标', options: ['拿来演示', '日常自用', '工作提效', '技术探索'], hints: ['做一个能给朋友看、让人想亲手试试的作品。', '偏好个人资料、习惯和家庭场景。', '偏好文档、资料整理、流程和效率工具。', '偏好本周增长快、技术味更强的新鲜项目。'] },
  form: { label: '形式', options: ['网页互动', '文档/数据', 'AI Agent', '硬件设备'], hints: ['偏好浏览器、游戏、可视化和可分享界面。', '偏好 PDF、表格、知识库、搜索和资料整理。', '偏好模型、RAG、自动化和工具调用。', '偏好 ESP32、树莓派、传感器和实体反馈。'] },
  exp: { label: '经验', options: ['刚开始', '能装依赖', '能接 API', '能折腾硬件'], hints: ['准备少、步骤清楚，先完成自己的第一个作品。', '可以接受本地环境、包管理和简单部署。', '可以处理账号、密钥、接口和数据库。', '愿意接线、烧录、配网和排查设备。'] },
}

export const defaultPicks: PickState = { time: '周末完成', goal: '拿来演示', form: '网页互动', exp: '刚开始' }

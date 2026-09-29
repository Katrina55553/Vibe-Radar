import type { PickState, ProjectExperience, ProjectForm, ProjectGoal, ProjectTime } from '../domain/project'

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
  goal: { label: '目标', options: ['拿来演示', '日常自用', '工作提效', '技术探索'], hints: ['做一个能给朋友看、让人想亲手试试的作品。', '偏好个人资料、习惯和家庭场景。', '偏好文档、资料整理、流程和效率工具。', '偏好技术味更强、适合深入探索的新鲜项目。'] },
  form: { label: '形式', options: ['网页互动', '文档/数据', 'AI Agent', '硬件设备'], hints: ['偏好浏览器、游戏、可视化和可分享界面。', '偏好 PDF、表格、知识库、搜索和资料整理。', '偏好模型、RAG、自动化和工具调用。', '偏好 ESP32、树莓派、传感器和实体反馈。'] },
  exp: { label: '经验', options: ['刚开始', '能装依赖', '能接 API', '能折腾硬件'], hints: ['准备少、步骤清楚，先完成自己的第一个作品。', '可以接受本地环境、包管理和简单部署。', '可以处理账号、密钥、接口和数据库。', '愿意接线、烧录、配网和排查设备。'] },
}

export const defaultPicks: PickState = { time: '周末完成', goal: '拿来演示', form: '网页互动', exp: '刚开始' }

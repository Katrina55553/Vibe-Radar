import { describe, expect, it } from 'vitest'
import { projectInputs } from '../data/projects'
import { defaultPicks } from '../data/content'
import { enrichProject } from './project'
import { matchesQuery, recommendProjects } from './recommendation'

const projects = projectInputs.map(enrichProject)

describe('project recommendation', () => {
  it('loads 90 ranked projects in each track and preserves imported scores', () => {
    for (const track of ['最好玩的项目', '最好用的项目', '最好搓的项目'] as const) {
      const lane = projects.filter((project) => project.track === track)
      expect(lane).toHaveLength(90)
      expect(lane.map((project) => project.rank)).toEqual(Array.from({ length: 90 }, (_, index) => index + 1))
    }

    const imported = projects.find((project) => project.title === '跨平台近场传输')
    expect(imported).toMatchObject({ rank: 88, ease: 94, wow: 80, useful: 96, total: 88 })
    expect(imported?.sourceUrl).toBe('https://github.com/localsend/localsend')
  })

  it('returns three projects from different tracks first', () => {
    const result = recommendProjects(projects, defaultPicks)
    expect(result).toHaveLength(3)
    expect(new Set(result.map((project) => project.track)).size).toBe(3)
  })

  it('uses the technical-exploration goal to change recommendations', () => {
    const exploration = recommendProjects(projects, { ...defaultPicks, goal: '技术探索' })
    const showcase = recommendProjects(projects, { ...defaultPicks, goal: '拿来演示' })

    expect(projects.some((project) => project.goal === '技术探索')).toBe(true)
    expect(exploration.map((project) => project.title)).not.toEqual(showcase.map((project) => project.title))
    expect(exploration.some((project) => project.goal === '技术探索')).toBe(true)
  })

  it('searches project title, tags, source, description, and MVP', () => {
    const project = projects[0]!
    expect(matchesQuery(project, project.title.slice(0, 3))).toBe(true)
    expect(matchesQuery(project, project.tags[0]!)).toBe(true)
    expect(matchesQuery(project, '肯定不存在的搜索词')).toBe(false)
  })
})

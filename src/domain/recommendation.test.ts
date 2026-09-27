import { describe, expect, it } from 'vitest'
import { projectInputs } from '../data/projects'
import { defaultPicks } from '../data/content'
import { enrichProject } from './project'
import { matchesQuery, recommendProjects } from './recommendation'

const projects = projectInputs.map(enrichProject)

describe('project recommendation', () => {
  it('returns three projects from different tracks first', () => {
    const result = recommendProjects(projects, defaultPicks)
    expect(result).toHaveLength(3)
    expect(new Set(result.map((project) => project.track)).size).toBe(3)
  })

  it('searches project title, tags, source, description, and MVP', () => {
    const project = projects[0]!
    expect(matchesQuery(project, project.title.slice(0, 3))).toBe(true)
    expect(matchesQuery(project, project.tags[0]!)).toBe(true)
    expect(matchesQuery(project, '肯定不存在的搜索词')).toBe(false)
  })
})

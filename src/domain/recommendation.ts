import type { PickState, Project } from './project'

export function matchesQuery(project: Project, query: string): boolean {
  if (!query) return true
  return (project.title + project.desc + project.tags.join('') + project.source + project.mvp)
    .toLocaleLowerCase()
    .includes(query.toLocaleLowerCase())
}

export function recommendProjects(projects: Project[], picks: PickState, limit = 3): Project[] {
  const maxRank = Math.max(...projects.map((project) => project.rank))
  const scored = projects
    .map((project) => {
      let score = 0
      if (project.form === picks.form) score += 4
      if (project.goal === picks.goal) score += 3
      if (project.time === picks.time) score += 2
      if (project.exp === picks.exp) score += 1
      score += (maxRank + 1 - project.rank) * 0.02 + Math.min(project.likes, 40) * 0.02
      return { project, score }
    })
    .sort((a, b) => b.score - a.score)

  const result: Project[] = []
  const usedTracks = new Set<string>()
  for (const item of scored) {
    if (!usedTracks.has(item.project.track)) {
      result.push(item.project)
      usedTracks.add(item.project.track)
    }
    if (result.length === limit) return result
  }
  for (const item of scored) {
    if (!result.includes(item.project)) result.push(item.project)
    if (result.length === limit) break
  }
  return result
}

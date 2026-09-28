import snapshot from './github.snapshot.json'

export interface GitHubCandidate {
  repo: string
  url: string
  stars: number
  weeklyGrowth: number | null
  description: string
  topics: string[]
  language: string
  updatedAt: string
  pushedAt: string
}

export interface GitHubSnapshot {
  generatedAt: string
  periodStart?: string
  source?: string
  candidates: GitHubCandidate[]
}

export const githubSnapshot: GitHubSnapshot = snapshot

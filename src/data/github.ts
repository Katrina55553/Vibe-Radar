import snapshot from './github.snapshot.json'

export interface GitHubCandidate {
  repo: string
  url: string
  stars: number
  weeklyGrowth: number
  description: string
  topics: string[]
  language: string
  updatedAt: string
  pushedAt: string
}

export interface GitHubSnapshot {
  generatedAt: string
  previousSnapshotAt: string
  candidates: GitHubCandidate[]
}

export const githubSnapshot: GitHubSnapshot = snapshot

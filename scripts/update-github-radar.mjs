import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { githubRadarConfig as config } from './github-radar.config.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const snapshotPath = path.join(root, 'src', 'data', 'github.snapshot.json')
const historyPath = path.join(root, 'src', 'data', 'github.history.json')
const dryRun = process.argv.includes('--dry-run')
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN

const day = 86_400_000
const now = new Date()
const nowIso = now.toISOString()
const createdAfter = new Date(now.getTime() - config.lookbackDays * day).toISOString().slice(0, 10)

async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'))
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

async function github(endpoint, attempt = 1) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'vibe-coding-radar',
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`https://api.github.com${endpoint}`, { headers })
  if (response.ok) return response.json()

  const body = await response.text()
  if ((response.status === 429 || response.status >= 500) && attempt < 4) {
    const retryAfter = Number(response.headers.get('retry-after')) || attempt * 5
    console.warn(`GitHub API ${response.status}; retrying in ${retryAfter}s`)
    await sleep(Math.min(retryAfter, 60) * 1000)
    return github(endpoint, attempt + 1)
  }

  const remaining = response.headers.get('x-ratelimit-remaining')
  const reset = response.headers.get('x-ratelimit-reset')
  throw new Error(`GitHub API ${response.status}: ${body.slice(0, 300)} (remaining=${remaining}, reset=${reset})`)
}

async function searchRepositories(query) {
  const params = new URLSearchParams({
    q: query,
    sort: 'stars',
    order: 'desc',
    per_page: '50',
  })
  const result = await github(`/search/repositories?${params}`)
  return result.items ?? []
}

function chooseBaseline(history) {
  const target = now.getTime() - config.growthWindowDays * day
  const snapshots = history.snapshots
    .filter((item) => Date.parse(item.generatedAt) <= now.getTime())
    .sort((a, b) => Math.abs(Date.parse(a.generatedAt) - target) - Math.abs(Date.parse(b.generatedAt) - target))
  return snapshots[0]
}

function toCandidate(repository, baseline) {
  const previousStars = baseline?.stars[repository.full_name]
  const createdDuringWindow = baseline && Date.parse(repository.created_at) >= Date.parse(baseline.generatedAt)
  const weeklyGrowth = previousStars === undefined
    ? createdDuringWindow ? repository.stargazers_count : 0
    : Math.max(0, repository.stargazers_count - previousStars)

  return {
    repo: repository.full_name,
    url: repository.html_url,
    stars: repository.stargazers_count,
    weeklyGrowth,
    description: repository.description || 'GitHub 暂未提供项目描述。',
    topics: (repository.topics ?? []).slice(0, 12),
    language: repository.language || 'Other',
    updatedAt: repository.updated_at,
    pushedAt: repository.pushed_at,
  }
}

function upsertHistory(history, repositories) {
  const stars = Object.fromEntries(repositories.map((repository) => [repository.full_name, repository.stargazers_count]))
  const today = nowIso.slice(0, 10)
  const snapshots = history.snapshots.filter((item) => item.generatedAt.slice(0, 10) !== today)
  snapshots.push({ generatedAt: nowIso, stars })
  snapshots.sort((a, b) => Date.parse(a.generatedAt) - Date.parse(b.generatedAt))
  return { snapshots: snapshots.slice(-config.maxHistorySnapshots) }
}

async function main() {
  const [previousSnapshot, history] = await Promise.all([
    readJson(snapshotPath),
    readJson(historyPath),
  ])
  const repositories = new Map()

  const queries = [
    `created:>=${createdAfter} stars:>=100 archived:false fork:false`,
    ...config.searchTopics.map((topic) => `created:>=${createdAfter} stars:>=${config.minStars} archived:false fork:false topic:${topic}`),
  ]

  for (const query of queries) {
    const results = await searchRepositories(query)
    for (const repository of results) repositories.set(repository.full_name, repository)
  }

  for (const candidate of previousSnapshot.candidates) {
    try {
      const repository = await github(`/repos/${candidate.repo}`)
      repositories.set(repository.full_name, repository)
    } catch (error) {
      console.warn(`Keeping stale data for ${candidate.repo}: ${error.message}`)
    }
  }

  const activeAfter = now.getTime() - 180 * day
  const eligible = [...repositories.values()].filter((repository) =>
    !repository.archived
    && !repository.disabled
    && !repository.fork
    && repository.stargazers_count >= config.minStars
    && Date.parse(repository.pushed_at) >= activeAfter
    && repository.description,
  )
  const baseline = chooseBaseline(history)
  const candidates = eligible
    .map((repository) => toCandidate(repository, baseline))
    .sort((a, b) => b.weeklyGrowth - a.weeklyGrowth || b.stars - a.stars)
    .slice(0, config.maxCandidates)

  if (candidates.length === 0) throw new Error('GitHub search returned no eligible candidates; refusing to replace the current snapshot.')

  const nextSnapshot = {
    generatedAt: nowIso,
    previousSnapshotAt: baseline?.generatedAt ?? nowIso,
    candidates,
  }
  const nextHistory = upsertHistory(history, eligible)

  console.log(`Discovered ${repositories.size} repositories; publishing ${candidates.length} candidates.`)
  console.log(`Growth baseline: ${nextSnapshot.previousSnapshotAt}`)
  console.table(candidates.slice(0, 10).map((item, index) => ({
    rank: index + 1,
    repo: item.repo,
    stars: item.stars,
    growth: item.weeklyGrowth,
  })))

  if (dryRun) {
    console.log('Dry run: data files were not changed.')
    return
  }

  await Promise.all([
    writeFile(snapshotPath, `${JSON.stringify(nextSnapshot, null, 2)}\n`),
    writeFile(historyPath, `${JSON.stringify(nextHistory, null, 2)}\n`),
  ])
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

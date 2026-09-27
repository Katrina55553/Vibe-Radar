import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { githubRadarConfig as config } from './github-radar.config.mjs'
import { chooseBaseline, refreshPreviousCandidates, toCandidate } from './github-radar-core.mjs'

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
  const error = new Error(`GitHub API ${response.status}: ${body.slice(0, 300)} (remaining=${remaining}, reset=${reset})`)
  error.status = response.status
  throw error
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

  await refreshPreviousCandidates(previousSnapshot, repositories, github)

  const activeAfter = now.getTime() - 180 * day
  const eligible = [...repositories.values()].filter((repository) =>
    !repository.archived
    && !repository.disabled
    && !repository.fork
    && repository.stargazers_count >= config.minStars
    && Date.parse(repository.pushed_at) >= activeAfter
    && repository.description,
  )
  const baseline = chooseBaseline(history, now, config.growthWindowDays, config.baselineToleranceDays)
  const candidates = eligible
    .map((repository) => toCandidate(repository, baseline))
    .sort((a, b) => (b.weeklyGrowth ?? -1) - (a.weeklyGrowth ?? -1) || b.stars - a.stars)
    .slice(0, config.maxCandidates)

  if (candidates.length === 0) throw new Error('GitHub search returned no eligible candidates; refusing to replace the current snapshot.')

  const nextSnapshot = {
    generatedAt: nowIso,
    previousSnapshotAt: baseline?.generatedAt ?? null,
    candidates,
  }
  const nextHistory = upsertHistory(history, eligible)

  console.log(`Discovered ${repositories.size} repositories; publishing ${candidates.length} candidates.`)
  console.log(`Growth baseline: ${nextSnapshot.previousSnapshotAt}`)
  console.table(candidates.slice(0, 10).map((item, index) => ({
    rank: index + 1,
    repo: item.repo,
    stars: item.stars,
    growth: item.weeklyGrowth ?? 'unknown',
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

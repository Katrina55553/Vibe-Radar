import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { githubRadarConfig as config } from './github-radar.config.mjs'
import { isTrendingEligible, parseGitHubTrending, toTrendingCandidate } from './github-radar-core.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const snapshotPath = path.join(root, 'src', 'data', 'github.snapshot.json')
const dryRun = process.argv.includes('--dry-run')
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN

const day = 86_400_000
const now = new Date()
const nowIso = now.toISOString()
const periodStart = new Date(now.getTime() - config.growthWindowDays * day).toISOString()

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

async function fetchTrending(attempt = 1) {
  const response = await fetch('https://github.com/trending?since=weekly', {
    headers: {
      Accept: 'text/html',
      'User-Agent': 'vibe-coding-radar',
    },
  })
  if (response.ok) return response.text()

  if ((response.status === 429 || response.status >= 500) && attempt < 4) {
    const retryAfter = Number(response.headers.get('retry-after')) || attempt * 5
    console.warn(`GitHub Trending ${response.status}; retrying in ${retryAfter}s`)
    await sleep(Math.min(retryAfter, 60) * 1000)
    return fetchTrending(attempt + 1)
  }

  throw new Error(`GitHub Trending returned ${response.status}.`)
}

async function main() {
  const ranking = parseGitHubTrending(await fetchTrending())
  if (ranking.length < config.minCandidates) throw new Error(`GitHub Trending returned only ${ranking.length} valid repositories; refusing to publish an incomplete ranking.`)

  const candidates = []
  for (const item of ranking) {
    try {
      const repository = await github(`/repos/${item.repo}`)
      if (isTrendingEligible(repository)) candidates.push(toTrendingCandidate(repository, item.weeklyGrowth))
    } catch (error) {
      if (error?.status !== 404) throw error
      console.warn(`Dropping unavailable repository ${item.repo}`)
    }
    if (candidates.length === config.maxCandidates) break
  }

  if (candidates.length < config.minCandidates) throw new Error(`Only ${candidates.length} eligible repositories remained; refusing to publish an incomplete ranking.`)

  const nextSnapshot = {
    generatedAt: nowIso,
    periodStart,
    source: 'github-trending-weekly',
    candidates: candidates.slice(0, config.maxCandidates),
  }

  console.log(`Loaded ${ranking.length} GitHub Trending repositories; publishing ${nextSnapshot.candidates.length} candidates.`)
  console.log(`Ranking window: ${periodStart} → ${nowIso}`)
  console.table(nextSnapshot.candidates.slice(0, 10).map((item, index) => ({
    rank: index + 1,
    repo: item.repo,
    stars: item.stars,
    sevenDayStars: item.weeklyGrowth,
  })))

  if (dryRun) {
    console.log('Dry run: data files were not changed.')
    return
  }

  await writeFile(snapshotPath, `${JSON.stringify(nextSnapshot, null, 2)}\n`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

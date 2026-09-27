import { describe, expect, it, vi } from 'vitest'
import { chooseBaseline, refreshPreviousCandidates, toCandidate } from './github-radar-core.mjs'

const baseline = {
  generatedAt: '2026-09-20T10:00:00.000Z',
  stars: { 'known/repo': 80 },
}

function repository(overrides = {}) {
  return {
    full_name: 'known/repo',
    html_url: 'https://github.com/known/repo',
    stargazers_count: 100,
    created_at: '2026-09-01T00:00:00.000Z',
    description: 'Known repository',
    topics: ['tooling'],
    language: 'TypeScript',
    updated_at: '2026-09-27T09:00:00.000Z',
    pushed_at: '2026-09-27T08:00:00.000Z',
    archived: false,
    disabled: false,
    fork: false,
    ...overrides,
  }
}

describe('GitHub radar snapshot calculations', () => {
  it('rejects a snapshot that is not close to the requested growth window', () => {
    const now = new Date('2026-09-27T10:00:00.000Z')
    const history = {
      snapshots: [{ generatedAt: '2026-09-26T00:00:00.000Z', stars: {} }],
    }

    expect(chooseBaseline(history, now, 7, 2)).toBeUndefined()
  })

  it('marks growth as unknown when an older repository is absent from the baseline', () => {
    const candidate = toCandidate(repository({ full_name: 'unknown/repo' }), baseline)

    expect(candidate.weeklyGrowth).toBeNull()
  })

  it('uses all stars as growth for a repository created during the window', () => {
    const candidate = toCandidate(repository({
      full_name: 'new/repo',
      created_at: '2026-09-25T00:00:00.000Z',
    }), baseline)

    expect(candidate.weeklyGrowth).toBe(100)
  })

  it('keeps the previous candidate when refreshing its repository fails', async () => {
    const candidate = {
      repo: 'stale/repo',
      url: 'https://github.com/stale/repo',
      stars: 50,
      weeklyGrowth: 5,
      description: 'Last known data',
      topics: ['tooling'],
      language: 'TypeScript',
      updatedAt: '2026-09-26T09:00:00.000Z',
      pushedAt: '2026-09-26T08:00:00.000Z',
    }
    const repositories = new Map()
    const logger = { warn: vi.fn() }

    await refreshPreviousCandidates(
      { generatedAt: '2026-09-26T10:00:00.000Z', candidates: [candidate] },
      repositories,
      vi.fn().mockRejectedValue(new Error('GitHub API 502')),
      logger,
    )

    expect(repositories.get(candidate.repo)).toMatchObject({
      full_name: candidate.repo,
      stargazers_count: candidate.stars,
      description: candidate.description,
    })
    expect(logger.warn).toHaveBeenCalledOnce()
  })

  it('drops a previous candidate when GitHub confirms it no longer exists', async () => {
    const candidate = {
      repo: 'deleted/repo',
      url: 'https://github.com/deleted/repo',
      stars: 50,
      weeklyGrowth: 5,
      description: 'Deleted repository',
      topics: [],
      language: 'Other',
      updatedAt: '2026-09-26T09:00:00.000Z',
      pushedAt: '2026-09-26T08:00:00.000Z',
    }
    const error = Object.assign(new Error('GitHub API 404'), { status: 404 })
    const repositories = new Map()

    await refreshPreviousCandidates(
      { generatedAt: '2026-09-26T10:00:00.000Z', candidates: [candidate] },
      repositories,
      vi.fn().mockRejectedValue(error),
      { warn: vi.fn() },
    )

    expect(repositories.has(candidate.repo)).toBe(false)
  })
})

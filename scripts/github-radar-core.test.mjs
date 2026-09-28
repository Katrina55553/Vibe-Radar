import { describe, expect, it } from 'vitest'
import {
  isTrendingEligible,
  parseGitHubTrending,
  toTrendingCandidate,
} from './github-radar-core.mjs'

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

describe('GitHub Trending weekly ranking', () => {
  it('extracts repositories and weekly stars in page order', () => {
    expect(parseGitHubTrending(`
      <article class="Box-row">
        <h2><a href="/hot/one"><span>hot /</span> one</a></h2>
        <span>1,234 stars this week</span>
      </article>
      <article class="Box-row">
        <h2><a href="/hot/two">hot / two</a></h2>
        <span>450 stars this week</span>
      </article>
    `)).toEqual([
      { repo: 'hot/one', weeklyGrowth: 1234 },
      { repo: 'hot/two', weeklyGrowth: 450 },
    ])
  })

  it('drops rows without a repository or weekly star count', () => {
    expect(parseGitHubTrending(`
      <article class="Box-row"><h2>Missing link</h2></article>
      <article class="Box-row"><h2><a href="/valid/repo">valid/repo</a></h2></article>
    `)).toEqual([])
  })

  it('publishes the seven-day WatchEvent count as weekly growth', () => {
    expect(toTrendingCandidate(repository(), 321)).toMatchObject({
      repo: 'known/repo',
      weeklyGrowth: 321,
      stars: 100,
    })
  })

  it('filters forks and unavailable repositories', () => {
    expect(isTrendingEligible(repository())).toBe(true)
    expect(isTrendingEligible(repository({ fork: true }))).toBe(false)
    expect(isTrendingEligible(repository({ archived: true }))).toBe(false)
    expect(isTrendingEligible(repository({ disabled: true }))).toBe(false)
  })
})

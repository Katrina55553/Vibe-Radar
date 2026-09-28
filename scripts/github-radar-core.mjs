export function parseGitHubTrending(html) {
  if (typeof html !== 'string') throw new TypeError('GitHub Trending response must be HTML.')

  const articles = html.match(/<article\b[\s\S]*?<\/article>/gi) ?? []
  return articles.flatMap((article) => {
    const repo = article.match(/<h2\b[\s\S]*?<a\b[^>]*href="\/([^"?#]+\/[^"?#]+)"/i)?.[1]
      ?.replace(/\s+/g, '')
    const growth = article.match(/([\d,]+)\s+stars?\s+this\s+week/i)?.[1]
    const weeklyGrowth = Number(growth?.replaceAll(',', ''))
    if (!repo || !Number.isSafeInteger(weeklyGrowth) || weeklyGrowth <= 0) return []
    return [{ repo, weeklyGrowth }]
  })
}

export function toTrendingCandidate(repository, weeklyGrowth) {
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

export function isTrendingEligible(repository) {
  return Boolean(repository
    && !repository.archived
    && !repository.disabled
    && !repository.fork)
}

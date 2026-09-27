const day = 86_400_000

export function chooseBaseline(history, now, growthWindowDays, toleranceDays = 2) {
  const target = now.getTime() - growthWindowDays * day
  const snapshots = history.snapshots
    .filter((item) => {
      const age = now.getTime() - Date.parse(item.generatedAt)
      return age >= (growthWindowDays - toleranceDays) * day
        && age <= (growthWindowDays + toleranceDays) * day
    })
    .sort((a, b) => Math.abs(Date.parse(a.generatedAt) - target) - Math.abs(Date.parse(b.generatedAt) - target))
  return snapshots[0]
}

export function toCandidate(repository, baseline) {
  const previousStars = baseline?.stars[repository.full_name]
  const createdDuringWindow = baseline && Date.parse(repository.created_at) >= Date.parse(baseline.generatedAt)
  const weeklyGrowth = previousStars === undefined
    ? createdDuringWindow ? repository.stargazers_count : null
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

function repositoryFromCandidate(candidate) {
  return {
    full_name: candidate.repo,
    html_url: candidate.url,
    stargazers_count: candidate.stars,
    // The snapshot does not retain repository creation time. Use an old date so
    // missing baseline data stays "unknown" instead of looking like new growth.
    created_at: '1970-01-01T00:00:00.000Z',
    description: candidate.description,
    topics: candidate.topics,
    language: candidate.language,
    updated_at: candidate.updatedAt,
    pushed_at: candidate.pushedAt,
    archived: false,
    disabled: false,
    fork: false,
  }
}

export async function refreshPreviousCandidates(previousSnapshot, repositories, github, logger = console) {
  for (const candidate of previousSnapshot.candidates) {
    try {
      const repository = await github(`/repos/${candidate.repo}`)
      repositories.set(repository.full_name, repository)
    } catch (error) {
      if (error?.status === 404) {
        logger.warn(`Dropping unavailable repository ${candidate.repo}`)
        continue
      }
      if (!repositories.has(candidate.repo)) {
        repositories.set(candidate.repo, repositoryFromCandidate(candidate))
      }
      logger.warn(`Using last known data for ${candidate.repo}: ${error.message}`)
    }
  }
}

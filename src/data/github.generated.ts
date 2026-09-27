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

// This file is the output boundary for the future scheduled GitHub sync.
// The first snapshot is seeded from the GitHub API and the 2026-09-26 data already in the project.
export const githubSnapshot: GitHubSnapshot = {
  generatedAt: '2026-09-27T10:10:00Z',
  previousSnapshotAt: '2026-09-26T00:00:00Z',
  candidates: [
    {
      repo: 'NandhaKishorM/laya',
      url: 'https://github.com/NandhaKishorM/laya',
      stars: 26193,
      weeklyGrowth: 2336,
      description: 'Non-autoregressive System 1 decision engine. Typed choice, score and yes/no decisions over any text in a single forward pass, in 100+ languages, with a router that picks the right checkpoint per request.',
      topics: ['calibration', 'classification', 'decision-model', 'huggingface', 'multilingual', 'nlp', 'pytorch', 'zero-shot'],
      language: 'Python',
      updatedAt: '2026-09-27T10:09:11Z',
      pushedAt: '2026-09-26T16:25:54Z',
    },
    {
      repo: 'driceroland/Search',
      url: 'https://github.com/driceroland/Search',
      stars: 2138,
      weeklyGrowth: 808,
      description: 'A small, fast WebKit browser for macOS, by Office Commun.',
      topics: [],
      language: 'Swift',
      updatedAt: '2026-09-27T10:03:54Z',
      pushedAt: '2026-09-27T10:03:49Z',
    },
    {
      repo: 'jev-chat/jev-chat-jarvis',
      url: 'https://github.com/jev-chat/jev-chat-jarvis',
      stars: 6730,
      weeklyGrowth: 298,
      description: '装在手机上的对话副驾：在 QQ / X / 飞书里读懂对方、给出候选回复、一键填入输入框，发不发由你。非侵入，只读屏幕，不 hook 不改包。',
      topics: ['accessibility-service', 'android', 'chat-assistant', 'llm', 'qq'],
      language: 'Kotlin',
      updatedAt: '2026-09-27T09:55:02Z',
      pushedAt: '2026-09-26T16:16:56Z',
    },
    {
      repo: 'zai-org/ZCode',
      url: 'https://github.com/zai-org/ZCode',
      stars: 6864,
      weeklyGrowth: 121,
      description: "Z.ai's coding agent harness. Powerful, intelligent, extensible.",
      topics: [],
      language: 'TypeScript',
      updatedAt: '2026-09-27T10:01:05Z',
      pushedAt: '2026-09-24T06:49:55Z',
    },
    {
      repo: 'bespokelabsai/nimble',
      url: 'https://github.com/bespokelabsai/nimble',
      stars: 1854,
      weeklyGrowth: 92,
      description: 'Local typed decisions, contrastive data curation, and model evaluation.',
      topics: [],
      language: 'Python',
      updatedAt: '2026-09-27T10:01:29Z',
      pushedAt: '2026-09-24T06:05:31Z',
    },
    {
      repo: 'unreallabsai/unreal-agent',
      url: 'https://github.com/unreallabsai/unreal-agent',
      stars: 1975,
      weeklyGrowth: 78,
      description: 'Async-first agent harness.',
      topics: [],
      language: 'Go',
      updatedAt: '2026-09-27T09:14:03Z',
      pushedAt: '2026-09-23T19:08:26Z',
    },
  ],
}

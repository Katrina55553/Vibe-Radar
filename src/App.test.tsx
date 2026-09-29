import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import App from './App'
import { githubSnapshot } from './data/github'
import { growthRateLabel } from './components/GitHubRadarPage'

describe('App', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    Reflect.deleteProperty(navigator, 'clipboard')
  })

  beforeEach(() => {
    localStorage.clear()
    history.replaceState(null, '', '/')
  })

  it('filters projects and opens and closes project details', () => {
    const { container } = render(<App />)
    expect(screen.getByRole('heading', { name: /Vibe Coding.*雷达/ })).toBeInTheDocument()
    expect(container.querySelector('.stats .v')).toHaveTextContent('297')
    expect(container.querySelectorAll('.lane-head em')).toHaveLength(3)
    for (const range of container.querySelectorAll('.lane-head em')) expect(range).toHaveTextContent('#1 → #99')

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'WebGL 流体玩具' } })
    expect(container.querySelectorAll('#board .card')).toHaveLength(1)
    expect(container.querySelector('#board .card h3')).toHaveTextContent('WebGL 流体玩具')

    fireEvent.click(container.querySelector('#board .go')!)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(within(dialog).getByRole('heading', { name: /WebGL 流体玩具/ })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '关闭' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('persists likes through the React state boundary', () => {
    const { container } = render(<App />)
    const button = container.querySelector('#board .like') as HTMLButtonElement
    expect(button).toHaveTextContent('82')
    fireEvent.click(button)
    expect(button).toHaveClass('liked')
    expect(button).toHaveTextContent('83')
  })

  it('keeps rendering when local storage writes are blocked', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage blocked', 'SecurityError')
    })

    expect(() => render(<App />)).not.toThrow()
    expect(screen.getByRole('heading', { name: /Vibe Coding.*雷达/ })).toBeInTheDocument()
  })

  it('reports clipboard failures instead of rejecting silently', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new DOMException('Denied', 'NotAllowedError')) },
    })
    const { container } = render(<App />)
    fireEvent.click(container.querySelector('#board .go')!)

    fireEvent.click(screen.getByRole('button', { name: '复制 Prompt' }))

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('复制失败'))
  })

  it('traps modal focus and restores it to the opener', () => {
    const { container } = render(<App />)
    const opener = container.querySelector('#board .go') as HTMLButtonElement
    opener.focus()
    fireEvent.click(opener)

    const close = screen.getByRole('button', { name: '关闭' })
    const sourceLink = within(screen.getByRole('dialog')).getByRole('link')
    expect(close).toHaveFocus()

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(sourceLink).toHaveFocus()

    fireEvent.keyDown(document, { key: 'Tab' })
    expect(close).toHaveFocus()

    fireEvent.click(close)
    expect(opener).toHaveFocus()
  })

  it('renders and filters the GitHub candidate page', () => {
    history.replaceState(null, '', '/?view=github')
    const { container } = render(<App />)
    const candidate = githubSnapshot.candidates[0]!

    expect(screen.getByRole('heading', { name: /GitHub.*动态榜/ })).toBeInTheDocument()
    expect(screen.getByText('每周五 08:00 更新')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '更新日志' })).toBeInTheDocument()
    expect(container.querySelectorAll('.candidate-row')).toHaveLength(githubSnapshot.candidates.length)
    expect(container.querySelectorAll('.candidate-facts')).toHaveLength(githubSnapshot.candidates.length)
    expect(container.querySelectorAll('.candidate-mvp')).toHaveLength(githubSnapshot.candidates.length)
    expect(container.querySelectorAll('.candidate-kit')).toHaveLength(githubSnapshot.candidates.length)

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: candidate.repo } })
    expect(container.querySelectorAll('.candidate-row')).toHaveLength(1)
    expect(container.querySelector('.candidate-row h3')).toHaveTextContent(candidate.repo)
  })

  it('keeps the static project board free of scheduled-update messaging', () => {
    render(<App />)

    expect(screen.getByText(/297 项静态精选/)).toBeInTheDocument()
    expect(screen.queryByText('每周五 08:00 更新')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '更新日志' })).not.toBeInTheDocument()
  })

  it('keeps the GitHub radar entry visible to the mobile navigation', () => {
    render(<App />)

    expect(screen.getByRole('link', { name: 'GitHub 动态榜' })).toHaveClass('mobile-visible')
  })

  it('labels growth from a zero baseline as a new project instead of a percentage', () => {
    expect(growthRateLabel({ stars: 348, weeklyGrowth: 348 })).toBe('新项目')
  })

  it('copies a clone command from a GitHub candidate card', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    history.replaceState(null, '', '/?view=github')
    render(<App />)
    const candidate = githubSnapshot.candidates[0]!

    fireEvent.click(screen.getByRole('button', { name: `复制 ${candidate.repo} 的克隆命令` }))

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(`git clone ${candidate.url}.git`))
    expect(screen.getByRole('button', { name: `复制 ${candidate.repo} 的克隆命令` })).toHaveTextContent('已复制')
  })
})

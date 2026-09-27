import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import App from './App'

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

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '流体' } })
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

  it('filters the star tab with the visible search field', () => {
    const { container } = render(<App />)

    fireEvent.click(screen.getByRole('tab', { name: '明星项目' }))
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'laya' } })

    expect(container.querySelectorAll('#board .star-card')).toHaveLength(1)
    expect(container.querySelector('#board .star-card h3')).toHaveTextContent('NandhaKishorM/laya')
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

    expect(screen.getByRole('heading', { name: /GitHub.*动态榜/ })).toBeInTheDocument()
    expect(container.querySelectorAll('.candidate-row')).toHaveLength(6)
    expect(container.querySelector('.candidate-row h3')).toHaveTextContent('NandhaKishorM/laya')

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Kotlin' } })
    expect(container.querySelectorAll('.candidate-row')).toHaveLength(1)
    expect(container.querySelector('.candidate-row h3')).toHaveTextContent('jev-chat/jev-chat-jarvis')
  })
})

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import App from './App'

describe('App', () => {
  afterEach(cleanup)

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
})

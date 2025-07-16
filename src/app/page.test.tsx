import { render, screen } from '@testing-library/react'
import HomePage from './page'

describe('HomePage', () => {
  it('renders the main heading', () => {
    render(<HomePage />)
    expect(screen.getByText('CollabPad')).toBeInTheDocument()
  })

  it('renders the description', () => {
    render(<HomePage />)
    expect(screen.getByText(/Real-time collaborative markdown editor/)).toBeInTheDocument()
  })

  it('renders the try editor link', () => {
    render(<HomePage />)
    expect(screen.getByText('Try the Editor')).toBeInTheDocument()
  })
}) 
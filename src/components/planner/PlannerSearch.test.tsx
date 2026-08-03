import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import PlannerSearch from './PlannerSearch'

const SearchHarness = () => {
  const [query, setQuery] = useState('')
  const [favoriteOnly, setFavoriteOnly] = useState(false)
  return (
    <PlannerSearch
      query={query}
      favoriteOnly={favoriteOnly}
      matchedItems={2}
      matchedSections={1}
      onQueryChange={setQuery}
      onFavoriteOnlyChange={setFavoriteOnly}
    />
  )
}

describe('PlannerSearch', () => {
  it('updates and clears the search query', async () => {
    const user = userEvent.setup()
    render(<SearchHarness />)
    const input = screen.getByRole('textbox', { name: 'Szukaj w planerze' })

    await user.type(input, 'photo')
    expect(input).toHaveValue('photo')
    expect(screen.getByText('Znaleziono 2 zadan w 1 sekcjach')).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Wyczysc wyszukiwanie' }))
    expect(input).toHaveValue('')
  })

  it('switches between all tasks and favorite tasks', () => {
    render(<SearchHarness />)
    const favoriteButton = screen.getByRole('button', { name: 'Pokaz tylko polubione' })

    expect(favoriteButton).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(favoriteButton)

    expect(screen.getByRole('button', { name: 'Pokaz wszystkie zadania' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })
})


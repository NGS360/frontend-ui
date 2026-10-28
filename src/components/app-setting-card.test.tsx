import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import { SettingCard } from './app-setting-card'
import type { Setting } from '@/client'

// The card is keyed on setting.key at its call sites, so it is never handed a
// different setting. What does change underneath it is the setting's value,
// after a save sends it round through the API. Cancel resets with no
// argument, so the card has to treat the latest value as its baseline rather
// than the one it mounted with.
function setting(value: string): Setting {
  return {
    key: 'demux.default_tool',
    name: 'Default demultiplexing tool',
    value,
    description: null,
    updated_at: null,
  } as Setting
}

function renderCard(value: string) {
  const onSave = vi.fn()
  const view = render(
    <SettingCard setting={setting(value)} isPending={false} onSave={onSave} />,
  )
  const rerender = (next: string) =>
    view.rerender(
      <SettingCard setting={setting(next)} isPending={false} onSave={onSave} />,
    )
  return { onSave, rerender }
}

const field = () => document.querySelector('input') as HTMLInputElement
const cancel = () => screen.getByText('Cancel').closest('button') as HTMLButtonElement

describe('SettingCard', () => {
  it('cancels back to the saved value, not the one it first rendered with', () => {
    const { rerender } = renderCard('bcl2fastq')

    // Save a new value; the API echoes it back through the prop.
    fireEvent.change(field(), { target: { value: 'bclconvert' } })
    rerender('bclconvert')

    // Type something else, then think better of it.
    fireEvent.change(field(), { target: { value: 'typo' } })
    fireEvent.click(cancel())

    expect(field().value).toBe('bclconvert')
  })

  it('offers no save or cancel until the value differs from the setting', () => {
    renderCard('bcl2fastq')

    expect(screen.queryByText('Cancel')).toBeNull()

    fireEvent.change(field(), { target: { value: 'bclconvert' } })
    expect(screen.queryByText('Cancel')).not.toBeNull()
  })
})

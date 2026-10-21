import { describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'

import type { ProjectPublic } from '@/client'
import { ProjectRestrictionCard } from './project-restriction-card'

function project(overrides: Partial<ProjectPublic> = {}): ProjectPublic {
  return {
    project_id: 'P-19900109-0001',
    name: 'Example',
    created_by: 'alice',
    created_at: null,
    last_modified: null,
    data_folder_uri: null,
    results_folder_uri: null,
    attributes: null,
    restricted: false,
    permissions: [],
    ...overrides,
  }
}

function renderCard(value: ProjectPublic) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <ProjectRestrictionCard project={value} />
    </QueryClientProvider>,
  )
}

// jest-dom matchers are not set up in this project, so assertions go
// through the DOM properties directly. Radix renders the Switch as a
// <button role="switch">, which carries `disabled`.
const toggle = () => screen.getByRole('switch') as HTMLButtonElement

describe('ProjectRestrictionCard', () => {
  it('says which state the project is in, in both states', () => {
    const { unmount } = renderCard(project())
    expect(screen.getByText('Open')).toBeTruthy()
    unmount()

    renderCard(project({ restricted: true }))
    expect(screen.getByText('Restricted')).toBeTruthy()
  })

  it('refuses the switch to a caller who cannot manage members', () => {
    // project:update is deliberately not enough: it is the permission an
    // ordinary contributor holds, and the API asks for manage_members here.
    renderCard(project({ permissions: ['project:update'] }))

    expect(toggle().disabled).toBe(true)
  })

  it('enables it for someone who can manage members', () => {
    renderCard(project({ permissions: ['project:manage_members'] }))

    expect(toggle().disabled).toBe(false)
  })

  it('fails closed when the project carries no permission list', () => {
    // The list routes leave `permissions` unset. A control must not render as
    // usable on that absence -- see use-project-access.
    renderCard(project({ permissions: null }))

    expect(toggle().disabled).toBe(true)
  })

  it('does not send anything when the confirmation is declined', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    renderCard(project({ permissions: ['project:manage_members'] }))

    fireEvent.click(toggle())

    expect(confirm).toHaveBeenCalled()
    expect(fetchSpy).not.toHaveBeenCalled()
    confirm.mockRestore()
    fetchSpy.mockRestore()
  })
})

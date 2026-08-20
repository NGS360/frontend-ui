import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import { PermissionMatrix } from './permission-matrix'
import type { PermissionPublic } from '@/client'

function entry(
  permission: string,
  overrides: Partial<PermissionPublic> = {},
): PermissionPublic {
  const [resource] = permission.split(':')
  return {
    permission,
    resource,
    description: `Do ${permission}`,
    project_scopable: true,
    risk: 'low',
    ...overrides,
  }
}

const CATALOG: Array<PermissionPublic> = [
  entry('sample:read'),
  entry('sample:delete', { risk: 'medium' }),
  entry('setting:update', { project_scopable: false, risk: 'critical' }),
]

describe('PermissionMatrix', () => {
  it('adds a permission without disturbing the others', () => {
    const onChange = vi.fn()
    render(
      <PermissionMatrix catalog={CATALOG} selected={['sample:read']} onChange={onChange} />,
    )

    fireEvent.click(screen.getByLabelText('delete'))

    expect(onChange).toHaveBeenCalledWith(['sample:read', 'sample:delete'])
  })

  it('removes a permission that was held', () => {
    const onChange = vi.fn()
    render(
      <PermissionMatrix catalog={CATALOG} selected={['sample:read']} onChange={onChange} />,
    )

    fireEvent.click(screen.getByLabelText('read'))

    expect(onChange).toHaveBeenCalledWith([])
  })

  it('selects a whole resource at once', () => {
    const onChange = vi.fn()
    render(<PermissionMatrix catalog={CATALOG} selected={[]} onChange={onChange} />)

    fireEvent.click(screen.getByLabelText('Select every sample permission'))

    expect(onChange).toHaveBeenCalledWith(['sample:read', 'sample:delete'])
  })

  it('clearing a resource leaves the other resources alone', () => {
    const onChange = vi.fn()
    render(
      <PermissionMatrix
        catalog={CATALOG}
        selected={['sample:read', 'sample:delete', 'setting:update']}
        onChange={onChange}
      />,
    )

    fireEvent.click(screen.getByLabelText('Select every sample permission'))

    expect(onChange).toHaveBeenCalledWith(['setting:update'])
  })

  it('hides permissions a project role cannot hold', () => {
    // The server rejects a project-scoped role containing setting:update with a
    // 422, so offering it would be offering a mistake.
    render(
      <PermissionMatrix catalog={CATALOG} selected={[]} onChange={vi.fn()} projectScopableOnly />,
    )

    expect((screen.queryByText('setting'))).toBeNull()
    expect((screen.getByText('sample'))).not.toBeNull()
  })

  it('renders read-only when no onChange is given', () => {
    render(<PermissionMatrix catalog={CATALOG} selected={['sample:read']} />)

    expect((screen.queryByRole('checkbox'))).toBeNull()
    expect((screen.getByText('Do sample:read'))).not.toBeNull()
  })

  it('shows only what is held when asked, for an effective-permission view', () => {
    render(
      <PermissionMatrix catalog={CATALOG} selected={['setting:update']} selectedOnly />,
    )

    expect((screen.getByText('setting'))).not.toBeNull()
    expect((screen.queryByText('sample'))).toBeNull()
  })

  it('filters on the description as well as the name', () => {
    render(<PermissionMatrix catalog={CATALOG} selected={[]} onChange={vi.fn()} />)

    fireEvent.change(screen.getByPlaceholderText('Filter permissions'), {
      target: { value: 'setting:update' },
    })

    expect((screen.getByText('setting'))).not.toBeNull()
    expect((screen.queryByText('sample'))).toBeNull()
  })

  it('says so when a filter matches nothing, rather than rendering blank', () => {
    render(<PermissionMatrix catalog={CATALOG} selected={[]} onChange={vi.fn()} />)

    fireEvent.change(screen.getByPlaceholderText('Filter permissions'), {
      target: { value: 'nonesuch' },
    })

    expect((screen.getByText('No permissions match that filter.'))).not.toBeNull()
  })

  it('counts how many of a resource are held', () => {
    render(<PermissionMatrix catalog={CATALOG} selected={['sample:read']} onChange={vi.fn()} />)

    expect((screen.getByText('1 of 2'))).not.toBeNull()
  })
})

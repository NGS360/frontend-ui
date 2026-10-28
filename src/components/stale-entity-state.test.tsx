import { describe, expect, it } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { UpdateProjectForm } from './update-project-form'
import { UpdateVendorForm } from './update-vendor-form'
import type { ReactElement } from 'react'

import type { VendorPublic } from '@/client'

// These forms are not remounted when the entity behind them changes: the
// project form lives on a route whose component survives a param change, and
// the vendor form lives in a table row that is reused when rows are sorted,
// filtered or paged. Seeding react-hook-form from props therefore leaves the
// previous entity's data on screen, and in the vendor case lets it be saved
// over the entity the sheet names.
//
// Each case renders one entity, re-renders with another, then opens the
// dialog and reads the fields back.
function renderSwap(first: ReactElement, second: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const wrap = (ui: ReactElement) => (
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>
  )
  const { rerender } = render(wrap(first))
  rerender(wrap(second))
}

const trigger = <button type="button">Open</button>

function vendor(overrides: Partial<VendorPublic> = {}): VendorPublic {
  return {
    vendor_id: 'acme',
    name: 'Acme Labs',
    description: 'First vendor',
    bucket: 's3://acme-bucket',
    ...overrides,
  } as VendorPublic
}

describe('UpdateProjectForm after the route switches project', () => {
  it('shows the project it is currently given, not the one it mounted with', () => {
    renderSwap(
      <UpdateProjectForm
        trigger={trigger}
        projectId="P-19900109-0001"
        projectName="Project Alpha"
        projectCreatedBy="alice"
        projectAttributes={[{ key: 'tissue', value: 'liver' }]}
      />,
      <UpdateProjectForm
        trigger={trigger}
        projectId="P-19900109-0002"
        projectName="Project Beta"
        projectCreatedBy="bob"
        projectAttributes={[{ key: 'tissue', value: 'kidney' }]}
      />,
    )

    fireEvent.click(screen.getByText('Open'))

    expect(screen.getByLabelText<HTMLInputElement>('Name').value).toBe('Project Beta')
    expect(screen.getByLabelText<HTMLInputElement>('Created by').value).toBe('bob')
  })
})

describe('UpdateVendorForm after its row is reused for another vendor', () => {
  it('shows the vendor it is currently given, not the one it mounted with', () => {
    renderSwap(
      <UpdateVendorForm trigger={trigger} vendor={vendor()} />,
      <UpdateVendorForm
        trigger={trigger}
        vendor={vendor({
          vendor_id: 'globex',
          name: 'Globex Seq',
          description: 'Second vendor',
          bucket: 's3://globex-bucket',
        })}
      />,
    )

    fireEvent.click(screen.getByText('Open'))

    const values = (Array.from(document.querySelectorAll('input')))
      .map((i) => i.value)

    // The id field reads the prop directly and was always right; the editable
    // fields are the ones that used to lag behind, and saving them would have
    // written this vendor's record with the previous vendor's data.
    expect(values).toContain('globex')
    expect(values).toContain('Globex Seq')
    expect(values).toContain('s3://globex-bucket')
    expect(values).not.toContain('Acme Labs')
    expect(values).not.toContain('s3://acme-bucket')
  })
})

import { describe, expect, it } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { UpdateProjectForm } from './update-project-form'

// The attribute rows are a field array inside the form element, so a remove
// button that does not say type="button" submits the project instead of just
// editing the list.
function openDialog(attributes: Array<{ key: string; value: string }>) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <UpdateProjectForm
        trigger={<button type="button">Open</button>}
        projectId="P-19900109-0001"
        projectName="Project Alpha"
        projectCreatedBy="alice"
        projectAttributes={attributes}
      />
    </QueryClientProvider>,
  )
  fireEvent.click(screen.getByText('Open'))
}

const removeButtons = () =>
  Array.from(
    document.querySelectorAll<HTMLButtonElement>('button[id*="remove-attribute"]'),
  )

// The key field renders as a combobox div; the value field is a real input,
// so the values are what the rows can be identified by.
const attributeValues = () =>
  Array.from(
    document.querySelectorAll<HTMLInputElement>('input[id*="attribute-value"]'),
  ).map((input) => input.value)

describe('deleting a project attribute', () => {
  it('does not submit the project', () => {
    openDialog([{ key: 'tissue', value: 'liver' }, { key: 'owner', value: 'bob' }])

    expect(removeButtons()[0].type).toBe('button')
  })

  it('can delete the only attribute a project has', () => {
    openDialog([{ key: 'owner', value: 'bob' }])

    expect(removeButtons()[0].disabled).toBe(false)
    fireEvent.click(removeButtons()[0])

    // The layout always shows a row, so the attribute is cleared rather than
    // the row disappearing. onSubmit drops blank pairs, so nothing is saved.
    expect(attributeValues()).toEqual([''])
  })

  it('leaves nothing to delete on a project with no attributes', () => {
    openDialog([])

    expect(removeButtons()[0].disabled).toBe(true)
  })
})

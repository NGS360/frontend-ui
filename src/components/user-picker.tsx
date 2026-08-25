import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronsUpDown, LoaderCircle } from 'lucide-react'
import { searchUsersOptions } from '@/client/@tanstack/react-query.gen'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useDebounce } from '@/hooks/use-debounce'

interface UserPickerProps {
  id: string
  value: string
  onChange: (username: string) => void
  placeholder?: string
  disabled?: boolean
}

/**
 * Pick a user by typing.
 *
 * Backed by GET /users/search rather than the roster, deliberately: search is
 * the directory lookup, so it can resolve somebody from LDAP who has never
 * signed in here, and granting a role to a person who does not yet have a local
 * row is a real case. It also filters to active accounts, which is right —
 * adding a deactivated user to a project is not a thing anyone means to do.
 *
 * The server requires at least two characters, so nothing is requested before
 * then; `shouldFilter={false}` because the filtering already happened server-side
 * and letting cmdk re-filter would drop results that matched on a field it
 * cannot see, such as the department.
 */
export const UserPicker = ({
  id,
  value,
  onChange,
  placeholder = 'Search for a user',
  disabled = false,
}: UserPickerProps) => {
  const [open, setOpen] = useState(false)
  const [term, setTerm] = useState('')
  const debounced = useDebounce(term, 300)

  const { data, isFetching } = useQuery({
    ...searchUsersOptions({ query: { q: debounced, limit: 20 } }),
    enabled: debounced.trim().length >= 2,
  })

  const results = data?.data ?? []

  return (
    <Popover open={open} onOpenChange={(next) => !disabled && setOpen(next)} modal>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-[260px] justify-between font-normal"
        >
          {value || <span className="text-muted-foreground">{placeholder}</span>}
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder={placeholder} value={term} onValueChange={setTerm} />
          <CommandList>
            {debounced.trim().length < 2 ? (
              <CommandEmpty>Type at least two characters.</CommandEmpty>
            ) : isFetching ? (
              <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Searching...
              </div>
            ) : results.length === 0 ? (
              <CommandEmpty>No users found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {results.map((user) => (
                  <CommandItem
                    key={user.username}
                    value={user.username}
                    onSelect={() => {
                      onChange(user.username)
                      setOpen(false)
                    }}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm">{user.full_name ?? user.username}</span>
                      <span className="text-xs text-muted-foreground">
                        {user.username}
                        {user.department ? ` · ${user.department}` : ''}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

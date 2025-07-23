import { useCallback, useEffect, useState } from 'react'
import { DeleteIcon, ExternalLink, Search } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Popover, PopoverAnchor, PopoverContent } from './ui/popover'
import type { FC, ReactNode } from 'react'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}

// Search item component
interface SearchItemProps {
  children: ReactNode
  onClick?: () => void
}
const SearchItem: FC<SearchItemProps> = ({ children, onClick }) => (
  <div
    onClick={onClick}
    className="hover:bg-muted px-2 py-2 rounded-md truncate block text-sm cursor-pointer"
  >
    {children}
  </div>
)

// Search group component
interface SearchGroupProps {
  children: ReactNode
  heading?: string
}
const SearchGroup: FC<SearchGroupProps> = ({ children, heading }) => (
  <>
    {heading && (
      <div className="flex justify-center">
        <h1 className="px-2 py-1.5 text-xs text-muted-foreground">{heading}</h1>
      </div>
    )}
    {children}
  </>
)

// Define search types (these will later come from OpenAPI)
interface Project {
  id: number
  projectid: string
  projectname: string
}
interface Run {
  id: number
  barcode: string
  experiment_name: string
  s3_run_folder_path: string
}
interface ESResponse {
  projects: Array<Project>
  runs: Array<Run>
}

// Main SearchBar component
export const SearchBar: FC = () => {
  const [input, setInput] = useState('')
  const debouncedInput = useDebounce(input, 300)

  const [searchData, setSearchData] = useState<ESResponse>()
  const [openResults, setOpenResults] = useState(false)

  // Fetch example data
  const fetchES = useCallback(async (query: string) => {
    console.log(`Searching ES for "${query}"`)
    const res = await fetch('data/example_search_data.json')
    if (!res.ok) throw new Error('Fetch failed')
    const data: ESResponse = await res.json()
    setSearchData(data)
  }, [])

  // effect: trigger fetch when debouncedInput changes
  useEffect(() => {
    if (!debouncedInput) {
      setOpenResults(false)
      setSearchData(undefined)
      return
    }
    setOpenResults(true)
    fetchES(debouncedInput)
  }, [debouncedInput, fetchES])

  return (
    <>
      {/* Search bar */}
      <div className="flex gap-2 items-center pl-3 rounded-md h-9 border-1">
        <Search size={16} className="text-muted-foreground" />
        <input
          id="es-input"
          className="w-full text-sm focus:outline-none"
          placeholder="Type a command or search..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <Button
          variant="link"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => setInput('')}
          title="Reset search"
        >
          <DeleteIcon />
        </Button>
      </div>

      {/* Search results */}
      <Popover open={openResults}>
        <PopoverAnchor />
        <PopoverContent
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="w-[var(--radix-popper-anchor-width)] p-1"
        >
          <ScrollArea className="h-75 min-w-0">
            <ScrollBar orientation="vertical" />

            <SearchGroup heading="Projects">
              {searchData?.projects.slice(0, 5).map((p) => (
                <SearchItem key={p.id}>
                  <div className="truncate">{p.projectid}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {p.projectname}
                  </div>
                </SearchItem>
              ))}
              <SearchItem>
                <Link to="/projects" className="flex items-center gap-2">
                  <ExternalLink size={14} className="text-muted-foreground" />
                  <span>View all projects</span>
                </Link>
              </SearchItem>
            </SearchGroup>

            <Separator className="my-0.5" />

            <SearchGroup heading="Runs">
              {searchData?.runs.slice(0, 5).map((r) => (
                <SearchItem key={r.id}>
                  <div className="truncate">{r.barcode}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {r.s3_run_folder_path}
                  </div>
                </SearchItem>
              ))}
              <SearchItem>
                <Link
                  to="/"
                  className="flex items-center gap-2"
                >
                  <ExternalLink size={14} className="text-muted-foreground" />
                  <span>View all runs</span>
                </Link>
              </SearchItem>
            </SearchGroup>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </>
  )
}

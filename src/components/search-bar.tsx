import { useEffect, useState } from 'react'
import { DeleteIcon, ExternalLink, Search } from 'lucide-react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import type { FC, ReactNode } from 'react'
import type { ProjectPublic, SequencingRunPublic } from '@/client'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { searchOptions } from '@/client/@tanstack/react-query.gen'
import { useDebounce } from '@/hooks/use-debounce'
import { Separator } from '@/components/ui/separator'

// Search item component
interface SearchItemProps {
  children: ReactNode
  onClick?: () => void
}
const SearchItem: FC<SearchItemProps> = ({ children, onClick }) => (
  <div
    onClick={onClick}
    className="hover:bg-muted px-2 py-0.5 rounded-md text-sm cursor-pointer"
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

// Main SearchBar component
export const SearchBar: FC = () => {
  const navigate = useNavigate();

  // State to control popover
  const [openResults, setOpenResults] = useState(false);

  // Use react-hook-form to watch for search input changes
  const { register, watch, setValue } = useForm<{ search: string }>();
  const watchedInput = watch('search', '');
  const debouncedInput = useDebounce(watchedInput, 300);

  // Query using debounced input
  const { 
    data: { projects, runs } = { projects: [], runs: [] }
  } = useQuery({
    ...searchOptions({
      query: {
        query: debouncedInput,
        n_results: 5
      }
    }),
    select: (res) => ({
      projects: res.projects.data,
      runs: res.runs.data
    }),
    enabled: !!debouncedInput
  })

  // Trigger popover when debouncedInput changes
  useEffect(() => {
    setOpenResults(!!debouncedInput);
  }, [debouncedInput]);

  return (
    <>
      {/* Search bar */}
      <div className="flex gap-2 items-center pl-3 rounded-md h-9 border-1">
        <Search size={16} className="text-muted-foreground" />
        <input
          id="es-input"
          className="w-full text-sm focus:outline-none"
          placeholder="Type a command or search..."
          {...register('search')}
        />
        <Button
          variant="link"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => setValue('search', '')}
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
          <ScrollArea>
            <div className='max-h-125'>
              <ScrollBar orientation="vertical" />
              <SearchGroup heading="Projects">
                {projects.length
                  ? projects.map((p: ProjectPublic) => (
                    <SearchItem
                      key={p.project_id}
                      onClick={() => navigate({
                        to: '/projects/$project_id',
                        params: { project_id: p.project_id }
                      })}
                    >
                      <span className='text-sm'>
                        {p.project_id}
                      </span>
                      <span className='text-xs text-muted-foreground'> {/* Use line-clamp-1 here to truncate */}
                        {p.name}
                      </span>
                    </SearchItem>
                  ))
                  :
                  <SearchItem>
                    <span className='flex justify-center'>No results.</span>
                  </SearchItem>
                }
                <SearchItem>
                  <Link 
                    className="flex items-center gap-2"
                    to="/projects"
                    search={{ 
                      query: debouncedInput,
                      sort_by: 'name',
                      sort_order: 'asc'
                    }}
                  >
                    <ExternalLink size={14} className="text-muted-foreground" />
                    <span>View all projects</span>
                  </Link>
                </SearchItem>
              </SearchGroup>

              <Separator className="my-0.5" />

              <SearchGroup heading="Runs">
                {runs.length
                  ? runs.map((r: SequencingRunPublic) => (
                    <SearchItem
                      key={r.barcode}
                      onClick={() => navigate({
                        to: '/runs/$run_barcode',
                        params: { run_barcode: r.barcode || "" }
                      })}
                    >
                      <span className='text-sm'>
                        {r.barcode}
                      </span>
                      <span className='text-xs text-muted-foreground'> {/* Use line-clamp-1 here to truncate */}
                        {r.experiment_name}
                      </span>
                    </SearchItem>
                  ))
                  :
                  <SearchItem>
                    <span className='flex justify-center'>No results.</span>
                  </SearchItem>
                }
                <SearchItem>
                  {/* TODO: update to runs page */}
                  <Link
                    className="flex items-center gap-2"
                    to="/runs"
                    search={{ query: debouncedInput }}
                  >
                    <ExternalLink size={14} className="text-muted-foreground" />
                    <span>View all runs</span>
                  </Link>
                </SearchItem>
              </SearchGroup>
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </>
  )
}

import { useEffect, useState } from 'react'
import { DeleteIcon, ExternalLink, Search } from 'lucide-react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useQueries } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import type { FC, ReactNode } from 'react'
import type { SearchObject } from '@/client'
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
    className="hover:bg-muted px-2 py-2 rounded-md text-sm cursor-pointer"
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
// interface Project {
//   id: number
//   projectid: string
//   projectname: string
// }
// interface Run {
//   id: number
//   barcode: string
//   experiment_name: string
//   s3_run_folder_path: string
// }
// interface ESResponse {
//   projects: Array<Project>
//   runs: Array<Run>
// }

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
  const indices = ['projects', 'illumina_runs']
  const [{data: projects}, {data: runs}] = useQueries({
    queries: indices.map((index) => ({
      ...searchOptions({
        query: {
          index: index,
          query: debouncedInput,
          page: 1,
          per_page: 5,
          sort_by: 'name',
          sort_order: 'asc'
        }
      }),
      enabled: !!debouncedInput
    }))
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
          <ScrollArea className='h-75'>
            <ScrollBar orientation="vertical" />
                <SearchGroup heading="Projects">
                  {projects?.items?.length
                    ? projects.items.map((p: SearchObject) => (
                        <SearchItem
                          key={p.id}
                          onClick={() => navigate({
                            to: '/projects/$project_id',
                            params: { project_id: p.id }
                          })}
                        >
                          <div className='flex flex-col gap-1'>
                            <span className='text-sm'>
                              {p.id}
                            </span>
                            <span className='text-xs text-muted-foreground'> {/* Use line-clamp-1 here to truncate */}
                              {p.name}
                            </span>
                            <div className='flex flex-wrap gap-0.5'>
                              {p.attributes?.map((a) => (
                                <div
                                  key={a.key}
                                  className='text-muted-foreground border-1 rounded-full px-2 text-xs'
                                >
                                  <span>
                                    {a.key}: {a.value && a.value.length > 50 ? a.value.slice(0, 50) + "..." : a.value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </SearchItem>
                      )) 
                    : 
                    <SearchItem>
                      <span className='flex justify-center'>No results.</span>
                    </SearchItem>
                  }
                  <SearchItem>
                    <Link to="/projects" className="flex items-center gap-2">
                      <ExternalLink size={14} className="text-muted-foreground" />
                      <span>View all projects</span>
                    </Link>
                  </SearchItem>
                </SearchGroup>

              <Separator className="my-0.5" />

            <SearchGroup heading="Runs">
              {runs?.items?.length
                ? runs.items.map((r: SearchObject) => (
                    <SearchItem
                      key={r.id}
                      onClick={() => navigate({
                        // TODO: Update to run details page
                        to: '/projects/$project_id',
                        params: { project_id: r.id }
                      })}
                    >
                      <div className='flex flex-col gap-1'>
                        <span className='text-sm'>
                          {r.id}
                        </span>
                        <span className='text-xs text-muted-foreground'> {/* Use line-clamp-1 here to truncate */}
                          {r.name}
                        </span>
                        <div className='flex flex-wrap gap-0.5'>
                          {r.attributes?.map((a) => (
                            <div
                              key={a.key}
                              className='text-muted-foreground border-1 rounded-full px-2 text-xs'
                            >
                              <span>
                                {a.key}: {a.value && a.value.length > 50 ? a.value.slice(0, 50) + "..." : a.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </SearchItem>
                  ))
                : 
                <SearchItem>
                  <span className='flex justify-center'>No results.</span>
                </SearchItem>
              }
              <SearchItem>
                {/* TODO: update to runs page */}
                <Link to="/projects" className="flex items-center gap-2"> 
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

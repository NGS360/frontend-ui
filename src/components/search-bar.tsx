import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { DeleteIcon, ExternalLink, Search } from 'lucide-react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import type { FC, ReactNode } from 'react'
import type { Attribute, ProjectPublic, SequencingRunPublic } from '@/client'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { searchOptions } from '@/client/@tanstack/react-query.gen'
import { useDebounce } from '@/hooks/use-debounce'
import { Separator } from '@/components/ui/separator'
import { highlightMatch } from '@/lib/utils'
import { ErrorBanner } from '@/components/error-banner'
import { entityMeta } from '@/lib/entity-icons'

// Search item component
interface SearchItemProps {
  children: ReactNode
  onClick?: () => void
  isHighlighted?: boolean
  onMouseEnter?: () => void
}
const SearchItem: FC<SearchItemProps> = ({ children, onClick, isHighlighted, onMouseEnter }) => (
  <div
    onClick={onClick}
    onMouseEnter={onMouseEnter}
    className={`px-2 py-0.5 rounded-md text-sm cursor-pointer overflow-hidden ${
      isHighlighted ? 'bg-muted' : 'hover:bg-muted'
    }`}
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

// Detail panel component
interface DetailPanelProps {
  detail: {
    label: string
    details: Record<string, string | null>
    attributes?: Array<Attribute> | null
  }
}
const DetailPanel: FC<DetailPanelProps> = ({ detail }) => (
  <>
    <div className="font-medium text-sm mb-2 break-all">{detail.label}</div>
    <dl className="space-y-1">
      {Object.entries(detail.details).map(([key, val]) =>
        val ? (
          <div key={key}>
            <dt className="text-muted-foreground">{key}</dt>
            <dd className="font-medium break-words">{val}</dd>
          </div>
        ) : null
      )}
    </dl>
    {detail.attributes && detail.attributes.length > 0 && (
      <div className="mt-2 pt-2 border-t">
        <span className="text-muted-foreground">Attributes</span>
        <dl className="mt-1 space-y-0.5">
          {detail.attributes.map((attr, i) => (
            <div key={i} className="flex gap-1">
              <dt className="text-muted-foreground shrink-0">{attr.key}:</dt>
              <dd className="break-words">{attr.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    )}
  </>
)

// Main SearchBar component
interface SearchBarProps {
  onResultClick?: () => void
  idPrefix?: string
}

export const SearchBar: FC<SearchBarProps> = ({ onResultClick, idPrefix }) => {
  const navigate = useNavigate();
  const reactId = useId()
  const baseId = idPrefix || `search-bar-${reactId.replace(/:/g, '')}`

  // Measure search bar width to decide whether to show detail panel
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width)
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])
  const showDetailPanel = containerWidth >= 480

  // State to control popover
  const [openResults, setOpenResults] = useState(false);

  // State for keyboard navigation
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const selectedItemRef = useRef<HTMLDivElement>(null);

  // Use react-hook-form to watch for search input changes
  const { register, watch, setValue } = useForm<{ search: string }>();
  const watchedInput = watch('search', '');
  const debouncedInput = useDebounce(watchedInput, 300);

  // Function to handle result click: close popover and clear search
  const handleResultClick = (navigateFn: () => void) => {
    navigateFn();
    setValue('search', '');
    setOpenResults(false);
    onResultClick?.(); // Call the optional callback
  };

  // Query using debounced input
  const {
    data: { projects, runs } = { projects: [], runs: [] },
    error,
    refetch,
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
    enabled: !!debouncedInput,
    retry: false,
  })

  // Trigger popover when debouncedInput changes
  useEffect(() => {
    setOpenResults(!!debouncedInput);
    setSelectedIndex(-1); // Reset selection when search changes
  }, [debouncedInput]);

  // Build navigable items list
  const navigableItems = [
    ...projects.map((p: ProjectPublic) => ({
      type: 'project' as const,
      data: p,
      navigate: () => navigate({
        to: '/projects/$project_id',
        params: { project_id: p.project_id }
      })
    })),
    ...runs.map((r: SequencingRunPublic) => ({
      type: 'run' as const,
      data: r,
      navigate: () => navigate({
        to: '/runs/$run_id',
        params: { run_id: r.run_id }
      })
    }))
  ];

  // Detail panel state
  interface DetailInfo {
    label: string
    type: 'project' | 'run'
    details: Record<string, string | null>
    attributes?: Array<Attribute> | null
  }

  const detailMap = useMemo(() => {
    const map = new Map<number, DetailInfo>()
    projects.forEach((p: ProjectPublic, i: number) => {
      map.set(i, {
        label: p.name || p.project_id,
        type: 'project',
        details: { "Project ID": p.project_id },
        attributes: p.attributes,
      })
    })
    runs.forEach((r: SequencingRunPublic, i: number) => {
      map.set(projects.length + i, {
        label: r.experiment_name || r.run_id,
        type: 'run',
        details: {
          "Run ID": r.run_id,
          "Experiment": r.experiment_name,
          "Date": r.run_date,
          "Flowcell": r.flowcell_id,
        },
        attributes: null,
      })
    })
    return map
  }, [projects, runs])

  const highlightedDetail = selectedIndex >= 0 ? detailMap.get(selectedIndex) ?? null : null

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!openResults || navigableItems.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < navigableItems.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < navigableItems.length) {
          handleResultClick(navigableItems[selectedIndex].navigate);
        }
        break;
      case 'Escape':
        setOpenResults(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Scroll the selected item into view
  useEffect(() => {
    if (selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [selectedIndex]);

  return (
    <>
      {/* Search bar */}
      <div ref={containerRef} id={`${baseId}-container`} className="flex gap-2 items-center pl-3 rounded-md h-9 border-1">
        <Search size={16} className="text-muted-foreground" />
        <input
          id={`${baseId}-input`}
          className="w-full text-sm focus:outline-none"
          placeholder="Search for projects or runs..."
          {...register('search')}
          onKeyDown={handleKeyDown}
        />
        <Button
          id={`${baseId}-clear-button`}
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
          id={`${baseId}-results`}
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="!p-0"
          style={{ width: `${containerWidth}px` }}
        >
          <div className="flex w-full overflow-hidden rounded-md">
            <div className={`${highlightedDetail && showDetailPanel ? "w-3/5" : "w-full"} shrink-0 min-w-0 overflow-y-auto overflow-x-hidden max-h-125 p-1`}>
                {projects.length > 0 && (
                  <>
                    <SearchGroup heading="Projects">
                      {projects.map((p: ProjectPublic, index: number) => (
                        <SearchItem
                          key={p.project_id}
                          onClick={() => handleResultClick(() => navigate({
                            to: '/projects/$project_id',
                            params: { project_id: p.project_id }
                          }))}
                          isHighlighted={selectedIndex === index}
                          onMouseEnter={() => setSelectedIndex(index)}
                        >
                          <div id={`${baseId}-project-${p.project_id}`} ref={selectedIndex === index ? selectedItemRef : null} className="flex items-center gap-2">
                            <entityMeta.project.icon className={`size-4 shrink-0 ${entityMeta.project.colorClass}`} />
                            <div className="min-w-0 truncate">
                              <span className='text-sm'>
                                {highlightMatch(p.project_id, debouncedInput)}
                              </span>
                              <span className='text-xs text-muted-foreground'>
                                {' '}{highlightMatch(p.name || '', debouncedInput)}
                              </span>
                            </div>
                          </div>
                        </SearchItem>
                      ))}
                      <SearchItem>
                        <Link
                          id={`${baseId}-view-all-projects`}
                          className="flex items-center gap-2 text-primary cursor-pointer"
                          to="/projects"
                          search={{
                            query: debouncedInput,
                            sort_by: 'name',
                            sort_order: 'asc'
                          }}
                        >
                          <ExternalLink size={14} />
                          <span>View all projects</span>
                        </Link>
                      </SearchItem>
                    </SearchGroup>

                    {runs.length > 0 && <Separator className="my-0.5" />}
                  </>
                )}

                {runs.length > 0 && (
                  <SearchGroup heading="Runs">
                    {runs.map((r: SequencingRunPublic, index: number) => {
                      const runIndex = projects.length + index;
                      return (
                        <SearchItem
                          key={r.run_id}
                          onClick={() => handleResultClick(() => navigate({
                            to: '/runs/$run_id',
                            params: { run_id: r.run_id }
                          }))}
                          isHighlighted={selectedIndex === runIndex}
                          onMouseEnter={() => setSelectedIndex(runIndex)}
                        >
                          <div id={`${baseId}-run-${r.run_id}`} ref={selectedIndex === runIndex ? selectedItemRef : null} className="flex items-center gap-2">
                            <entityMeta.run.icon className={`size-4 shrink-0 ${entityMeta.run.colorClass}`} />
                            <div className="min-w-0 truncate">
                              <span className='text-sm'>
                                {highlightMatch(r.run_id, debouncedInput)}
                              </span>
                              <span className='text-xs text-muted-foreground'>
                                {' '}{highlightMatch(r.experiment_name || '', debouncedInput)}
                              </span>
                            </div>
                          </div>
                        </SearchItem>
                      );
                    })}
                    <SearchItem>
                      <Link
                        id={`${baseId}-view-all-runs`}
                        className="flex items-center gap-2 text-primary cursor-pointer"
                        to="/runs"
                        search={{ query: debouncedInput }}
                      >
                        <ExternalLink size={14} />
                        <span>View all runs</span>
                      </Link>
                    </SearchItem>
                  </SearchGroup>
                )}

                {error && (
                  <ErrorBanner
                    error={error}
                    onRetry={() => { void refetch() }}
                    className="m-2"
                  />
                )}

                {!error && projects.length === 0 && runs.length === 0 && (
                  <div className="flex justify-center p-4 text-sm text-muted-foreground">
                    No results found.
                  </div>
                )}
            </div>
            {highlightedDetail && showDetailPanel && (
              <div className="w-2/5 min-w-0 border-l p-3 text-xs overflow-y-auto overflow-x-hidden max-h-125">
                <DetailPanel detail={highlightedDetail} />
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </>
  )
}

import { useEffect, useRef, useState } from 'react'
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
import { highlightMatch } from '@/lib/utils'

// Search item component
interface SearchItemProps {
  children: ReactNode
  onClick?: () => void
  isHighlighted?: boolean
}
const SearchItem: FC<SearchItemProps> = ({ children, onClick, isHighlighted }) => (
  <div
    onClick={onClick}
    className={`px-2 py-0.5 rounded-md text-sm cursor-pointer ${
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

// Main SearchBar component
interface SearchBarProps {
  onResultClick?: () => void
}

export const SearchBar: FC<SearchBarProps> = ({ onResultClick }) => {
  const navigate = useNavigate();

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
        to: '/runs/$run_barcode',
        params: { run_barcode: r.barcode || "" }
      })
    }))
  ];

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
      <div className="flex gap-2 items-center pl-3 rounded-md h-9 border-1">
        <Search size={16} className="text-muted-foreground" />
        <input
          id="es-input"
          className="w-full text-sm focus:outline-none"
          placeholder="Search for projects or runs..."
          {...register('search')}
          onKeyDown={handleKeyDown}
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
                      >
                        <div ref={selectedIndex === index ? selectedItemRef : null}>
                          <span className='text-sm'>
                            {highlightMatch(p.project_id, debouncedInput)}
                          </span>
                          <span className='text-xs text-muted-foreground'> {/* Use line-clamp-1 here to truncate */}
                            {highlightMatch(p.name || '', debouncedInput)}
                          </span>
                        </div>
                      </SearchItem>
                    ))}
                    <SearchItem>
                      <Link 
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
                        key={r.barcode}
                        onClick={() => handleResultClick(() => navigate({
                          to: '/runs/$run_barcode',
                          params: { run_barcode: r.barcode || "" }
                        }))}
                        isHighlighted={selectedIndex === runIndex}
                      >
                        <div ref={selectedIndex === runIndex ? selectedItemRef : null}>
                          <span className='text-sm'>
                            {highlightMatch(r.barcode || '', debouncedInput)}
                          </span>
                          <span className='text-xs text-muted-foreground'> {/* Use line-clamp-1 here to truncate */}
                            {highlightMatch(r.experiment_name || '', debouncedInput)}
                          </span>
                        </div>
                      </SearchItem>
                    );
                  })}
                  <SearchItem>
                    {/* TODO: update to runs page */}
                    <Link
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

              {projects.length === 0 && runs.length === 0 && (
                <div className="flex justify-center p-4 text-sm text-muted-foreground">
                  No results found.
                </div>
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </>
  )
}

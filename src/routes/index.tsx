import { createFileRoute } from '@tanstack/react-router'
import { SearchBar } from '@/components/search-bar'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const logoMap = [
    ['N', '#9de073'],
    ['G', '#68706e'],
    ['S', '#25aedd'],
    ['3', '#eb6341'],
    ['6', '#ffc180'],
    ['0', '#9de073'],
  ]

  return (
    <div className="text-center">
      <div className="min-h-[75vh] flex flex-col items-center justify-center gap-6 px-4">
        <h1 className="text-5xl md:text-6xl animate-fade-in-up flex items-center justify-center">
          <span className="mr-3 font-normal text-muted-foreground">Welcome to</span>
          <span className="flex font-bold">
            {logoMap.map(([char, color]) => (
              <span key={char} style={{ color }}>
                {char}
              </span>
            ))}
          </span>
        </h1>
        <h2 className="text-base md:text-lg text-muted-foreground text-wrap max-w-2xl w-[95%] animate-fade-in-up" style={{ animationDelay: '0.1s', opacity: 0, animationFillMode: 'forwards' }}>
          Your comprehensive next-generation sequencing data management platform.
          Search, analyze, and manage your genomic data with ease.
        </h2>
        <div className="max-w-2xl w-[95%] animate-fade-in-up" style={{ animationDelay: '0.2s', opacity: 0, animationFillMode: 'forwards' }}>
          <SearchBar />
        </div>
      </div>
    </div>
  )
}

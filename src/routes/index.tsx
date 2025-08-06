import { createFileRoute } from '@tanstack/react-router'
import { SearchBar } from '@/components/search-bar'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  return (
    <div className="text-center">
      <div className="min-h-[75vh] flex flex-col items-center justify-center gap-4">
        <h1 className="text-4xl font-light">Welcome to NGS360</h1>
        <h2 className="text-sm text-muted-foreground text-wrap max-w-lg w-[95%]">
          Put a really nice tagline here describing what NGS360 does or what
          action the user should take next.
        </h2>
        <div className="max-w-xl w-[95%]">
          <SearchBar />
        </div>
      </div>
    </div>
  )
}

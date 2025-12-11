import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowRight, Database, Folder } from 'lucide-react'
import { SearchBar } from '@/components/search-bar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Footer from '@/components/Footer'

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
    <>
      <div className="text-center relative">
        {/* Large background logo with very low opacity */}
        {/* <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <img 
            src="/img/circos_color.svg" 
            alt="" 
            className="w-[800px] h-[800px] opacity-[0.05] object-contain"
          />
        </div> */}
        
        <div className="min-h-[85vh] flex flex-col items-center justify-center gap-6 px-4 relative z-10">
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
        
        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-[95%] mt-8 animate-fade-in-up" style={{ animationDelay: '0.3s', opacity: 0, animationFillMode: 'forwards' }}>
          <Link to="/runs" className="group">
            <Card className="h-full transition-all duration-300 hover:border-accent3 hover:scale-[1.01] cursor-pointer border-2 shadow-none relative overflow-hidden">
              <CardHeader className="relative z-10">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg">
                    <Database 
                      className="h-6 w-6 text-accent3" 
                    />
                  </div>
                  <CardTitle className="text-2xl font-light">Illumina Runs</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <CardDescription className="text-base text-left">
                  View and manage sequencing runs, access run metrics, sample sheets, and QC data.
                </CardDescription>
                <div className="flex items-center gap-2 mt-4 font-medium group-hover:gap-3 transition-all">
                  <span 
                    style={{
                      background: 'linear-gradient(135deg, #25aedd 0%, #9de073 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    Browse runs
                  </span>
                  <ArrowRight 
                    className="h-4 w-4 text-accent3" 
                  />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/projects" search={{sort_by: undefined, sort_order: undefined}} className="group">
            <Card className="h-full transition-all duration-300 hover:border-accent2 hover:scale-[1.01] cursor-pointer border-2 shadow-none relative overflow-hidden">
              <CardHeader className="relative z-10">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg">
                    <Folder 
                      className="h-6 w-6 text-accent2" 
                    />
                  </div>
                  <CardTitle className="text-2xl font-light">Projects</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <CardDescription className="text-base text-left">
                  Organize NGS data into projects, track progress, and execute analysis workflows on your datasets.
                </CardDescription>
                <div className="flex items-center gap-2 mt-4 font-medium group-hover:gap-3 transition-all">
                  <span 
                    style={{
                      background: 'linear-gradient(135deg, #ffc180 0%, #eb6341 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    View projects
                  </span>
                  <ArrowRight 
                    className="h-4 w-4 text-accent2" 
                  />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

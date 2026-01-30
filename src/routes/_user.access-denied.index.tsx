import { Link, createFileRoute } from '@tanstack/react-router'
import { ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NGS360Logo } from '@/components/ngs360-logo'

export const Route = createFileRoute('/_user/access-denied/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary-2/5 p-4 overflow-hidden">
      {/* Content */}
      <div className="relative z-10 w-full max-w-2xl text-center space-y-8 px-4">
        <div className="flex justify-center mb-8">
          <NGS360Logo />
        </div>
        
        <div className="space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10 mb-4">
            <ShieldAlert className="w-10 h-10 text-destructive" strokeWidth={2} />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Access Denied</h1>
          
          <p className="text-xl text-muted-foreground max-w-xl mx-auto">
            You do not have the required permissions to access this page.
          </p>
          
          <div className="bg-muted/50 backdrop-blur-sm rounded-lg p-6 max-w-lg mx-auto">
            <p className="text-sm text-muted-foreground leading-relaxed">
              The page you are trying to access requires administrator privileges. If you
              believe you should have access to this resource, please contact your system
              administrator for assistance.
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4 max-w-md mx-auto">
          <Button asChild size="lg" className="sm:flex-1">
            <Link to="/">Return to Home</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="sm:flex-1">
            <Link to="/profile">View Profile</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function Footer() {
  return (
    <footer className="mt-auto border-t relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
      <div className="py-6 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center text-sm text-foreground">
          <div className="flex items-center justify-center gap-4 mb-2">
            <a 
              href={`${import.meta.env.VITE_API_URL}docs`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors font-medium"
            >
              Help & Documentation
            </a>
          </div>
          <p className="text-muted-foreground">&copy;{new Date().getFullYear()} NGS360. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

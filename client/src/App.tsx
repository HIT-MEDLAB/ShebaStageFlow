import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'

interface HealthResponse {
  status: string
  timestamp: string
}

async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch('/api/health')
  if (!res.ok) throw new Error('Network response was not ok')
  return res.json()
}

function App() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    enabled: false,
  })

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold tracking-tight">Shiba App</h1>
      <p className="text-muted-foreground">React 19 + Express + Prisma</p>

      <Button onClick={() => refetch()} disabled={isLoading}>
        {isLoading ? 'Checking…' : 'Ping /api/health'}
      </Button>

      {isError && (
        <p className="text-sm text-destructive">
          Could not reach the server. Is it running on port 5000?
        </p>
      )}

      {data && (
        <pre className="rounded-md bg-muted px-4 py-3 text-sm">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </main>
  )
}

export default App

import { Profiles } from '@/apps/profiles'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/profiles/')({
  component: Profiles,
  errorComponent: ({ error }) => {
    console.error('[Profiles Route Error]', error)
    return (
      <div className="p-8">
        <h2 className="text-xl font-bold text-red-600">Render Error</h2>
        <pre className="mt-4 whitespace-pre-wrap text-sm">
          {error?.message}
          {'\n\n'}
          {error?.stack}
        </pre>
      </div>
    )
  },
})

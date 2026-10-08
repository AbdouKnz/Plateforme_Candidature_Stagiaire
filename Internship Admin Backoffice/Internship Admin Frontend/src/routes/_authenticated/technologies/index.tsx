import { Technologies } from '@/apps/technologies'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/technologies/')({
  component: Technologies,
  errorComponent: ({ error }) => {
    console.error('[Technologies Route Error]', error)
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

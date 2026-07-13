import { Subjects } from '@/apps/subjects'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/subjects/')({
  component: Subjects,
  errorComponent: ({ error }) => {
    console.error('[Subjects Route Error]', error)
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

import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: () => {
    const auth = localStorage.getItem('auth-storage')

    if (!auth) {
      throw redirect({ to: '/sign-in' })
    }

    const parsed = JSON.parse(auth)

    const token = parsed?.state?.token

    if (!token) {
      throw redirect({ to: '/sign-in' })
    }
  },
  component: AuthenticatedLayout,
})

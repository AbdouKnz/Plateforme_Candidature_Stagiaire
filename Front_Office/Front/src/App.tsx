import { Routes, Route, Navigate, useLocation } from "react-router-dom"
import { HomePage } from "@/pages/home-page"
import { FormPage } from "@/pages/form-page"
import { ClosedPage } from "@/pages/closed-page"
import { AboutPage } from "@/pages/about-page"
import { PfeBookPage } from "@/pages/pfe-book-page"
import { AdminAccessPage } from "@/pages/admin-access-page"
import { AdminPreviewBanner } from "@/components/admin-preview-banner"
import { useAdminPreview } from "@/hooks/use-admin-preview"
import { useFrontOfficeStatus } from "@/hooks/use-front-office-status"
import { ErrorBoundary } from "@/components/error-boundary"

function AppLayout() {
  const { status, loading } = useFrontOfficeStatus()
  const { unlocked, unlock, lock } = useAdminPreview()
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith("/access/admin")

  // Admin security page: reachable regardless of the public open/closed
  // check. A verified password unlocks the preview (same-tab only).
  if (isAdminRoute) {
    if (unlocked) {
      return <Navigate to="/" replace />
    }
    return <AdminAccessPage onUnlock={unlock} />
  }

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-secondary border-t-transparent" />
      </div>
    )
  }

  // An unlocked admin preview bypasses the closed check on every route.
  const isClosed = status && !status.is_enabled && !unlocked

  return (
    <>
      {unlocked && <AdminPreviewBanner onExit={lock} />}
      <Routes>
        <Route path="/" element={isClosed ? <ClosedPage reopeningDate={status.reopening_date} internshipTitle={status.internship_title} year={status.year} /> : <HomePage />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="/form" element={isClosed ? <ClosedPage reopeningDate={status.reopening_date} internshipTitle={status.internship_title} year={status.year} /> : <FormPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/pfe-book" element={isClosed ? <Navigate to="/" replace /> : <PfeBookPage />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppLayout />
    </ErrorBoundary>
  )
}

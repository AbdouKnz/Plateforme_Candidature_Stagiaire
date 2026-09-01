import { Routes, Route, Navigate, useLocation } from "react-router-dom"
import { HomePage } from "@/pages/home-page"
import { AboutPage } from "@/pages/about-page"
import { FormPage } from "@/pages/form-page"
import { ClosedPage } from "@/pages/closed-page"
import { PfeBookPage } from "@/pages/pfe-book-page"
import { useFrontOfficeStatus } from "@/hooks/use-front-office-status"
import { ErrorBoundary } from "@/components/error-boundary"

function AppLayout() {
  const location = useLocation()
  const { status, loading } = useFrontOfficeStatus()

  // PFE Book is always accessible, even when front-office is closed or loading
  if (location.pathname === "/pfe-book") {
    return (
      <Routes>
        <Route path="/pfe-book" element={<PfeBookPage />} />
      </Routes>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#050505]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-secondary border-t-transparent" />
      </div>
    )
  }

  const isClosed = status && !status.is_enabled

  return (
    <Routes>
      <Route path="/" element={isClosed ? <ClosedPage reopeningDate={status.reopening_date} closedMessage={status.closed_message} /> : <HomePage />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/form" element={isClosed ? <ClosedPage reopeningDate={status.reopening_date} closedMessage={status.closed_message} /> : <FormPage />} />
      <Route path="/pfe-book" element={<PfeBookPage />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppLayout />
    </ErrorBoundary>
  )
}

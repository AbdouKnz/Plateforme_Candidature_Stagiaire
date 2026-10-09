import { StrictMode } from 'react'
import ReactDOM, { type Root } from 'react-dom/client'
import {QueryClientProvider} from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { DirectionProvider } from './context/direction-provider'
import { FontProvider } from './context/font-provider'
import { ThemeProvider } from './context/theme-provider'
import { AlertProvider } from "./context/alert-provider";
import { queryClient } from '@/lib/query-client'
import '@/lib/language/i18n/i18n'

// Generated Routes
import { routeTree } from './routeTree.gen'
// Styles
import './styles/index.css'


// Create a new router instance
export const router = createRouter({
  routeTree,
  basepath: '/backoffice',
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Render the app — reuse a cached root so HMR re-evaluations (or any double
// module evaluation) call root.render() on the existing root instead of
// calling createRoot() twice on the same container (React warns:
// "calling createRoot() on a container that has already been passed to
// createRoot()"). The previous `!rootElement.innerHTML` guard could not
// prevent this: both evaluations run before either commit populates it.
const rootElement = document.getElementById('root')!
const globalRoot = globalThis as unknown as { __backofficeRoot?: Root }
let root = globalRoot.__backofficeRoot
if (!root) {
  root = ReactDOM.createRoot(rootElement)
  globalRoot.__backofficeRoot = root
}
root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <FontProvider>
          <DirectionProvider>
            <AlertProvider>
              <RouterProvider router={router} />
            </AlertProvider>
          </DirectionProvider>
        </FontProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
)

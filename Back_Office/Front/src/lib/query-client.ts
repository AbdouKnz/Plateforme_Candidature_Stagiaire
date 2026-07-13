import { QueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (import.meta.env.DEV) {
          console.log('Query failed:', { failureCount, error })
        }
        
        if (failureCount >= 1 && import.meta.env.DEV) return false
        if (failureCount > 3) return false
        
        if (error instanceof AxiosError) {
          const status = error.response?.status
          if ([401, 403, 404].includes(status ?? 0)) return false
        }
        
        return true
      },
      
      refetchOnWindowFocus: import.meta.env.PROD,
      staleTime: 10 * 1000,
    },
    
    mutations: {
      retry: false,
    },
  },
})
import type { AppProps } from 'next/app'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { UserProvider } from '@/contexts/UserContext'
import { Toaster } from '@/components/ui/toaster'
import '@/styles/globals.css'
import { useState } from 'react'

// Extend Window interface to include content property
declare global {
  interface Window {
    content?: any;
  }
}

if (typeof window !== 'undefined') {
  window.content = window.content || {};
}

export default function App({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: 1,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <Component {...pageProps} />
        <Toaster />
      </UserProvider>
    </QueryClientProvider>
  )
}



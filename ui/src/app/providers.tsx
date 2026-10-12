import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react';
import { RouterProvider } from 'react-router';
import router from './router';

const queryClient = new QueryClient()

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
        {children}
    </QueryClientProvider>
  );
}

export function AppRouterProvider() {
  return (
    <RouterProvider router={router} />
  );
}
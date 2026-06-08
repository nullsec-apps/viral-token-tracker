import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AppShell } from './components/AppShell';
import { TokenDetailPage } from './components/TokenDetailPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1, staleTime: 15_000 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppShell />} />
          <Route path="/token/:address" element={<TokenDetailPage />} />
          <Route path="*" element={<AppShell />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#14091F',
            color: '#F2ECFF',
            border: '1px solid #2A1840',
            fontFamily: 'monospace',
            fontSize: 12,
          },
        }}
      />
    </QueryClientProvider>
  );
}

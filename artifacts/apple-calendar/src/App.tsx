import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { seedIfEmpty, migrateFromApiIfEmpty } from '@/lib/local-store';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { CalendarProvider } from '@/context/calendar-context';
import { CalendarApp } from '@/components/calendar-app';

// Seed default categories & tags on first launch (synchronous)
seedIfEmpty();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

/** Runs the one-time API → localStorage migration, then refreshes all queries. */
function MigrationRunner() {
  const qc = useQueryClient();
  useEffect(() => {
    migrateFromApiIfEmpty().then(migrated => {
      if (migrated) qc.invalidateQueries();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CalendarProvider>
        <TooltipProvider>
          <MigrationRunner />
          <CalendarApp />
          <Toaster />
        </TooltipProvider>
      </CalendarProvider>
    </QueryClientProvider>
  );
}

export default App;

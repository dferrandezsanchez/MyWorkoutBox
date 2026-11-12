import { useQuery } from '@tanstack/react-query';
import { getDashboardOverview } from '@features/dashboard/api/dashboard.api';

export function useDashboardOverview() {
  return useQuery({
    queryKey: ['dashboardOverview'],
    queryFn: getDashboardOverview,
    refetchInterval: 60_000,
  });
}

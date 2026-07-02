"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * Shared hook for nav badge data.
 * Both Sidebar and BottomNav use this — SWR deduplicates by key globally,
 * so only one network request is made regardless of how many components mount.
 * 
 * Poll interval: 30s (was 15s in each component independently)
 */
export function useNavBadges() {
  const { data, mutate } = useSWR('/api/nav-badges', fetcher, {
    refreshInterval: 30000,
    dedupingInterval: 10000, // Dedupe within 10s
  });

  return {
    badges: data?.badges || {} as Record<string, number>,
    mutateBadges: mutate,
  };
}

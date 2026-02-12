import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateLikeRequest, type CreateReportRequest } from "@shared/routes";
import { apiFetch } from "@/lib/api";

// POST /api/likes
export function useLikePet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateLikeRequest) => {
      const res = await apiFetch(api.likes.create.path, {
        method: api.likes.create.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to like pet');
      }
      return api.likes.create.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.matches.list.path] });
    }
  });
}

// GET /api/matches
export function useMatches() {
  return useQuery({
    queryKey: [api.matches.list.path],
    queryFn: async () => {
      const res = await apiFetch(api.matches.list.path);
      if (!res.ok) throw new Error('Failed to fetch matches');
      return api.matches.list.responses[200].parse(await res.json());
    },
  });
}

// GET /api/matches/:id
export function useMatch(id: number) {
  return useQuery({
    queryKey: [api.matches.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.matches.get.path, { id });
      const res = await apiFetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('Failed to fetch match details');
      return api.matches.get.responses[200].parse(await res.json());
    },
  });
}

// POST /api/reports
export function useReportPet() {
  return useMutation({
    mutationFn: async (data: CreateReportRequest) => {
      const res = await apiFetch(api.reports.create.path, {
        method: api.reports.create.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to report pet');
      return api.reports.create.responses[201].parse(await res.json());
    },
  });
}

// POST /api/matches/:id/messages
export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ matchId, content }: { matchId: number; content: string }) => {
      const url = buildUrl(api.messages.create.path, { id: matchId });
      const res = await apiFetch(url, {
        method: api.messages.create.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to send message');
      }
      return api.messages.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, { matchId }) => {
      queryClient.invalidateQueries({ queryKey: [api.matches.get.path, matchId] });
    }
  });
}

// Mock Upload Hook
export function useUpload() {
  return useMutation({
    mutationFn: async (file: File) => {
      // In a real app, we'd use FormData here.
      // For this prototype, we'll wait 1s and return a fake URL
      await new Promise(r => setTimeout(r, 1000));
      return `https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=400&q=80`;
    }
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_PATHS, buildUrl, type CreateLikeRequest, type CreateReportRequest } from "@/lib/api-contract";
import { apiFetch } from "@/lib/api";

export function useLikePet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateLikeRequest) => {
      const res = await apiFetch(API_PATHS.likes.create, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Failed to like pet");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_PATHS.matches.list] });
    }
  });
}

export function useMatches() {
  return useQuery({
    queryKey: [API_PATHS.matches.list],
    queryFn: async () => {
      const res = await apiFetch(API_PATHS.matches.list);
      if (!res.ok) throw new Error("Failed to fetch matches");
      return res.json();
    },
  });
}

export function useMatch(id: number) {
  return useQuery({
    queryKey: [API_PATHS.matches.get, id],
    queryFn: async () => {
      const url = buildUrl(API_PATHS.matches.get, { id });
      const res = await apiFetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch match details");
      return res.json();
    },
  });
}

export function useReportPet() {
  return useMutation({
    mutationFn: async (data: CreateReportRequest) => {
      const res = await apiFetch(API_PATHS.reports.create, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to report pet");
      return res.json();
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ matchId, content }: { matchId: number; content: string }) => {
      const url = buildUrl(API_PATHS.messages.create, { id: matchId });
      const res = await apiFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Failed to send message");
      }
      return res.json();
    },
    onSuccess: (_, { matchId }) => {
      queryClient.invalidateQueries({ queryKey: [API_PATHS.matches.get, matchId] });
    }
  });
}

export function useUpload() {
  return useMutation({
    mutationFn: async (_file: File) => {
      await new Promise(r => setTimeout(r, 1000));
      return `https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=400&q=80`;
    }
  });
}

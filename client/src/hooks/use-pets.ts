import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreatePetRequest, type UpdatePetRequest } from "@shared/routes";
import { apiFetch } from "@/lib/api";

// GET /api/pets
export function usePets(filters?: {
  species?: string;
  breed?: string;
  gender?: string;
  objective?: string;
  region?: string;
  size?: string;
  isDonation?: boolean;
  limit?: number;
  page?: number;
}) {
  return useQuery({
    queryKey: [api.pets.list.path, filters],
    queryFn: async () => {
      let url = api.pets.list.path;
      if (filters) {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== "") params.append(key, String(value));
        });
        url += `?${params.toString()}`;
      }

      const res = await apiFetch(url);
      if (!res.ok) throw new Error('Failed to fetch pets');
      return api.pets.list.responses[200].parse(await res.json());
    },
  });
}

export function useMyPets() {
  return useQuery({
    queryKey: [api.pets.mine.path],
    queryFn: async () => {
      const res = await apiFetch(api.pets.mine.path);
      if (!res.ok) throw new Error("Failed to fetch your pets");
      return api.pets.mine.responses[200].parse(await res.json());
    },
  });
}

export function useMyDefaultPet() {
  return useQuery({
    queryKey: [api.pets.mineDefault.path],
    queryFn: async () => {
      const res = await apiFetch(api.pets.mineDefault.path);
      if (!res.ok) throw new Error("Failed to fetch your default pet");
      return api.pets.mineDefault.responses[200].parse(await res.json());
    },
  });
}

export function useFeed(filters?: {
  species?: string;
  gender?: string;
  objective?: string;
  region?: string;
  size?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: [api.feed.list.path, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters ?? {}).forEach(([key, value]) => {
        if (value !== undefined && value !== "") params.append(key, String(value));
      });
      const query = params.toString();
      const res = await apiFetch(query ? `${api.feed.list.path}?${query}` : api.feed.list.path);
      if (!res.ok) throw new Error("Failed to fetch feed");
      return api.feed.list.responses[200].parse(await res.json());
    },
  });
}

// GET /api/pets/:id
export function usePet(id: number) {
  return useQuery({
    queryKey: [api.pets.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.pets.get.path, { id });
      const res = await apiFetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('Failed to fetch pet');
      return api.pets.get.responses[200].parse(await res.json());
    },
  });
}

// POST /api/pets
export function useCreatePet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreatePetRequest) => {
      const res = await apiFetch(api.pets.create.path, {
        method: api.pets.create.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create pet');
      }
      return api.pets.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.pets.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.pets.mine.path] });
      queryClient.invalidateQueries({ queryKey: [api.feed.list.path] });
    },
  });
}

// PUT /api/pets/:id
export function useUpdatePet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & UpdatePetRequest) => {
      const url = buildUrl(api.pets.update.path, { id });
      const res = await apiFetch(url, {
        method: api.pets.update.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!res.ok) throw new Error('Failed to update pet');
      return api.pets.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.pets.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.pets.mine.path] });
    },
  });
}

// DELETE /api/pets/:id
export function useDeletePet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.pets.delete.path, { id });
      const res = await apiFetch(url, { method: api.pets.delete.method });
      if (!res.ok) throw new Error('Failed to delete pet');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.pets.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.pets.mine.path] });
      queryClient.invalidateQueries({ queryKey: [api.feed.list.path] });
    },
  });
}

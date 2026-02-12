import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreatePetRequest, type UpdatePetRequest, type SetActivePetRequest } from "@shared/routes";
import { apiFetch } from "@/lib/api";

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
    queryKey: [api.pets.mineActive.path],
    queryFn: async () => {
      const res = await apiFetch(api.pets.mineActive.path);
      if (!res.ok) throw new Error("Failed to fetch your active pet");
      return api.pets.mineActive.responses[200].parse(await res.json());
    },
  });
}

export function useSetMyActivePet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: SetActivePetRequest) => {
      const res = await apiFetch(api.pets.setMineActive.path, {
        method: api.pets.setMineActive.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to set active pet');
      }
      return api.pets.setMineActive.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.pets.mine.path] });
      queryClient.invalidateQueries({ queryKey: [api.pets.mineActive.path] });
      queryClient.invalidateQueries({ queryKey: [api.matches.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.feed.list.path] });
    },
  });
}

export function useFeed(filters?: {
  species?: string;
  gender?: string;
  objective?: string;
  region?: string;
  size?: string;
  mode?: "crushes" | "friends";
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
      queryClient.invalidateQueries({ queryKey: [api.pets.mineActive.path] });
      queryClient.invalidateQueries({ queryKey: [api.feed.list.path] });
    },
  });
}

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
      queryClient.invalidateQueries({ queryKey: [api.pets.mineActive.path] });
    },
  });
}

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
      queryClient.invalidateQueries({ queryKey: [api.pets.mineActive.path] });
      queryClient.invalidateQueries({ queryKey: [api.feed.list.path] });
    },
  });
}


export type AdoptionPostInput = {
  name: string;
  species: string;
  breed: string;
  ageLabel: string;
  country: string;
  state: string;
  city: string;
  pedigree: boolean;
  neutered: boolean;
  description: string;
  contact: string;
  status?: "DISPONIVEL" | "ADOTADO";
  photos: string[];
};

export function useAdoptions(page = 1, limit = 12) {
  return useQuery({
    queryKey: [api.adoptions.list.path, page, limit],
    queryFn: async () => {
      const res = await apiFetch(`${api.adoptions.list.path}?page=${page}&limit=${limit}`);
      if (!res.ok) throw new Error("Failed to fetch adoptions");
      return api.adoptions.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateAdoption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: AdoptionPostInput) => {
      const res = await apiFetch(api.adoptions.create.path, {
        method: api.adoptions.create.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, status: data.status ?? "DISPONIVEL" }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error?.error?.message || error.message || 'Failed to create adoption post');
      }
      return api.adoptions.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.adoptions.list.path] });
    },
  });
}

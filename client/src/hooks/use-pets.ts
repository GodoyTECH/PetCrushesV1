import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_PATHS, buildUrl, type CreatePetRequest, type UpdatePetRequest, type SetActivePetRequest } from "@/lib/api-contract";
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
    queryKey: [API_PATHS.pets.list, filters],
    queryFn: async () => {
      let url = API_PATHS.pets.list;
      if (filters) {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== "") params.append(key, String(value));
        });
        url += `?${params.toString()}`;
      }
      const res = await apiFetch(url);
      if (!res.ok) throw new Error("Failed to fetch pets");
      return res.json();
    },
  });
}

export function useMyPets() {
  return useQuery({
    queryKey: [API_PATHS.pets.mine],
    queryFn: async () => {
      const res = await apiFetch(API_PATHS.pets.mine);
      if (!res.ok) throw new Error("Failed to fetch your pets");
      return res.json();
    },
  });
}

export function useMyDefaultPet() {
  return useQuery({
    queryKey: [API_PATHS.pets.mineActive],
    queryFn: async () => {
      const res = await apiFetch(API_PATHS.pets.mineActive);
      if (!res.ok) throw new Error("Failed to fetch your active pet");
      return res.json();
    },
  });
}

export function useSetMyActivePet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: SetActivePetRequest) => {
      const res = await apiFetch(API_PATHS.pets.setMineActive, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Failed to set active pet");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_PATHS.pets.mine] });
      queryClient.invalidateQueries({ queryKey: [API_PATHS.pets.mineActive] });
      queryClient.invalidateQueries({ queryKey: [API_PATHS.matches.list] });
      queryClient.invalidateQueries({ queryKey: [API_PATHS.feed.list] });
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
    queryKey: [API_PATHS.feed.list, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters ?? {}).forEach(([key, value]) => {
        if (value !== undefined && value !== "") params.append(key, String(value));
      });
      const query = params.toString();
      const res = await apiFetch(query ? `${API_PATHS.feed.list}?${query}` : API_PATHS.feed.list);
      if (!res.ok) throw new Error("Failed to fetch feed");
      return res.json();
    },
  });
}

export function usePet(id: number) {
  return useQuery({
    queryKey: [API_PATHS.pets.get, id],
    queryFn: async () => {
      const url = buildUrl(API_PATHS.pets.get, { id });
      const res = await apiFetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch pet");
      return res.json();
    },
  });
}

export function useCreatePet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreatePetRequest) => {
      const res = await apiFetch(API_PATHS.pets.create, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create pet");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_PATHS.pets.list] });
      queryClient.invalidateQueries({ queryKey: [API_PATHS.pets.mine] });
      queryClient.invalidateQueries({ queryKey: [API_PATHS.pets.mineActive] });
      queryClient.invalidateQueries({ queryKey: [API_PATHS.feed.list] });
    },
  });
}

export function useUpdatePet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & UpdatePetRequest) => {
      const url = buildUrl(API_PATHS.pets.update, { id });
      const res = await apiFetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update pet");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_PATHS.pets.list] });
      queryClient.invalidateQueries({ queryKey: [API_PATHS.pets.mine] });
      queryClient.invalidateQueries({ queryKey: [API_PATHS.pets.mineActive] });
    },
  });
}

export function useDeletePet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(API_PATHS.pets.delete, { id });
      const res = await apiFetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete pet");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_PATHS.pets.list] });
      queryClient.invalidateQueries({ queryKey: [API_PATHS.pets.mine] });
      queryClient.invalidateQueries({ queryKey: [API_PATHS.pets.mineActive] });
      queryClient.invalidateQueries({ queryKey: [API_PATHS.feed.list] });
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
    queryKey: [API_PATHS.adoptions.list, page, limit],
    queryFn: async () => {
      const res = await apiFetch(`${API_PATHS.adoptions.list}?page=${page}&limit=${limit}`);
      if (!res.ok) throw new Error("Failed to fetch adoptions");
      return res.json();
    },
  });
}

export function useCreateAdoption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: AdoptionPostInput) => {
      const res = await apiFetch(API_PATHS.adoptions.create, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, status: data.status ?? "DISPONIVEL" }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error?.error?.message || error.message || "Failed to create adoption post");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_PATHS.adoptions.list] });
    },
  });
}

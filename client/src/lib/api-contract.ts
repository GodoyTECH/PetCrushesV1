export const API_PATHS = {
  pets: {
    list: "/api/pets",
    mine: "/api/pets/mine",
    mineActive: "/api/pets/mine/active",
    get: "/api/pets/:id",
    create: "/api/pets",
    update: "/api/pets/:id",
    delete: "/api/pets/:id",
    setMineActive: "/api/pets/mine/active",
  },
  feed: { list: "/api/feed" },
  matches: { list: "/api/matches", get: "/api/matches/:id" },
  likes: { create: "/api/likes", received: "/api/likes/received" },
  reports: { create: "/api/reports" },
  messages: { create: "/api/matches/:id/messages" },
  adoptions: { list: "/api/adoptions", create: "/api/adoptions" },
} as const;

export function buildUrl(path: string, params?: Record<string, string | number>) {
  if (!params) return path;
  return Object.entries(params).reduce((acc, [k, v]) => acc.replace(`:${k}`, encodeURIComponent(String(v))), path);
}

export type CreatePetRequest = {
  displayName: string;
  species: string;
  breed: string;
  gender: "MALE" | "FEMALE";
  size?: "SMALL" | "MEDIUM" | "LARGE" | null;
  colors: string[];
  ageMonths: number;
  pedigree: boolean;
  vaccinated?: boolean;
  trained?: boolean;
  neutered?: boolean;
  healthNotes?: string | null;
  objective: "BREEDING" | "COMPANIONSHIP" | "SOCIALIZATION";
  isDonation?: boolean;
  region: string;
  country?: string;
  state?: string;
  city?: string;
  neighborhood?: string;
  placeId?: string;
  about: string;
  photos: string[];
  videoUrl: string;
};

export type UpdatePetRequest = Partial<CreatePetRequest>;
export type SetActivePetRequest = { petId: number };
export type CreateLikeRequest = { likerPetId: number; targetPetId: number };
export type CreateReportRequest = { targetPetId: number; reason: string };

export const BLOCKED_KEYWORDS = [
  "R$", "$", "vendo", "venda", "valor", "preço", "preco", "pagamento", "pix",
  "cobro", "cobrando", "frete", "parcelado", "entrego", "aceito", "usd", "cash",
];

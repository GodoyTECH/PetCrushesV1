import { z } from 'zod';
import { insertPetSchema, insertUserSchema, insertAdoptionPostSchema, pets, users, matches, messages, reports, adoptionPosts } from './schema';

import { BLOCKED_KEYWORDS } from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  forbidden: z.object({
    message: z.string(),
  }),
};

export { BLOCKED_KEYWORDS };


export const api = {
  auth: {
    requestOtp: {
      method: 'POST' as const,
      path: '/api/auth/request-otp' as const,
      input: z.object({ email: z.string().email() }),
      responses: {
        200: z.object({
          ok: z.boolean(),
          expiresAt: z.string(),
          delivery: z.object({
            delivered: z.boolean(),
            provider: z.enum(["resend", "dev-console"]),
          }),
        }),
        400: errorSchemas.validation,
      },
    },
    exists: {
      method: 'GET' as const,
      path: '/api/auth/exists' as const,
      input: z.object({ email: z.string().email() }),
      responses: {
        200: z.object({ exists: z.boolean() }),
        400: errorSchemas.validation,
      },
    },
    verifyOtp: {
      method: 'POST' as const,
      path: '/api/auth/verify-otp' as const,
      input: z.object({ email: z.string().email(), code: z.string().length(6) }),
      responses: { 200: z.object({ token: z.string(), user: z.custom<typeof users.$inferSelect>(), isNewUser: z.boolean() }), 400: errorSchemas.validation },
    },
    signup: {
      method: 'POST' as const,
      path: '/api/auth/signup' as const,
      input: z.object({ email: z.string().email(), password: z.string().min(8) }),
      responses: { 200: z.object({ token: z.string(), user: z.custom<typeof users.$inferSelect>() }), 400: errorSchemas.validation },
    },
    login: {
      method: 'POST' as const,
      path: '/api/auth/login' as const,
      input: z.object({ email: z.string().email(), password: z.string().min(1) }),
      responses: { 200: z.object({ token: z.string(), user: z.custom<typeof users.$inferSelect>() }), 400: errorSchemas.validation },
    },
    google: {
      method: 'POST' as const,
      path: '/api/auth/google' as const,
      input: z.object({ idToken: z.string().min(10) }),
      responses: { 200: z.object({ token: z.string(), user: z.custom<typeof users.$inferSelect>() }), 400: errorSchemas.validation },
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me' as const,
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.forbidden,
      },
    },
    update: {
        method: 'PATCH' as const,
        path: '/api/auth/me' as const,
        input: insertUserSchema.partial(),
        responses: {
            200: z.custom<typeof users.$inferSelect>(),
            400: errorSchemas.validation,
        }
    }
  },

  users: {
    signup: {
      method: 'POST' as const,
      path: '/api/auth/signup' as const,
      input: z.object({ email: z.string().email(), password: z.string().min(8) }),
      responses: { 200: z.object({ token: z.string(), user: z.custom<typeof users.$inferSelect>() }), 400: errorSchemas.validation },
    },
    login: {
      method: 'POST' as const,
      path: '/api/auth/login' as const,
      input: z.object({ email: z.string().email(), password: z.string().min(1) }),
      responses: { 200: z.object({ token: z.string(), user: z.custom<typeof users.$inferSelect>() }), 400: errorSchemas.validation },
    },
    google: {
      method: 'POST' as const,
      path: '/api/auth/google' as const,
      input: z.object({ idToken: z.string().min(10) }),
      responses: { 200: z.object({ token: z.string(), user: z.custom<typeof users.$inferSelect>() }), 400: errorSchemas.validation },
    },
    me: {
      method: 'GET' as const,
      path: '/api/users/me' as const,
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.forbidden,
      },
    },
    updateMe: {
      method: 'PATCH' as const,
      path: '/api/users/me' as const,
      input: z.object({
        displayName: z.string().min(2).max(120).optional(),
        whatsapp: z.string().min(8).max(32).optional(),
        region: z.string().min(2).max(160).optional(),
        profileImageUrl: z.string().url().optional(),
        firstName: z.string().min(1).max(120).optional(),
        lastName: z.string().min(1).max(120).optional(),
        onboardingCompleted: z.boolean().optional(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  pets: {
    list: {
      method: 'GET' as const,
      path: '/api/pets' as const,
      input: z.object({
        species: z.string().optional(),
        breed: z.string().optional(),
        gender: z.string().optional(),
        objective: z.string().optional(),
        region: z.string().optional(),
        isDonation: z.coerce.boolean().optional(),
        size: z.string().optional(),
        mode: z.enum(["crushes", "friends"]).optional(),
        limit: z.coerce.number().int().min(1).max(50).optional(),
        page: z.coerce.number().int().min(1).optional(),
        cursor: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof pets.$inferSelect>()),
      },
    },

    mine: {
      method: 'GET' as const,
      path: '/api/pets/mine' as const,
      responses: {
        200: z.array(z.custom<typeof pets.$inferSelect>()),
        401: errorSchemas.forbidden,
      },
    },
    mineDefault: {
      method: 'GET' as const,
      path: '/api/pets/mine/default' as const,
      responses: {
        200: z.custom<typeof pets.$inferSelect | null>(),
        401: errorSchemas.forbidden,
      },
    },
    mineActive: {
      method: 'GET' as const,
      path: '/api/pets/mine/active' as const,
      responses: {
        200: z.custom<typeof pets.$inferSelect | null>(),
        401: errorSchemas.forbidden,
      },
    },
    setMineActive: {
      method: 'PATCH' as const,
      path: '/api/pets/mine/active' as const,
      input: z.object({ petId: z.number().int().positive() }),
      responses: {
        200: z.custom<typeof pets.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/pets/:id' as const,
      responses: {
        200: z.custom<typeof pets.$inferSelect & { owner: typeof users.$inferSelect }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/pets' as const,
      input: insertPetSchema.omit({ ownerId: true }),
      responses: {
        201: z.custom<typeof pets.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/pets/:id' as const,
      input: insertPetSchema.omit({ ownerId: true }).partial(),
      responses: {
        200: z.custom<typeof pets.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/pets/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },

  feed: {
    list: {
      method: 'GET' as const,
      path: '/api/feed' as const,
      input: z.object({
        species: z.string().optional(),
        gender: z.string().optional(),
        objective: z.string().optional(),
        region: z.string().optional(),
        size: z.string().optional(),
        mode: z.enum(["crushes", "friends"]).optional(),
        limit: z.coerce.number().int().min(1).max(50).optional(),
        page: z.coerce.number().int().min(1).optional(),
      }).optional(),
      responses: {
        200: z.object({
          items: z.array(z.custom<typeof pets.$inferSelect>()),
          page: z.number(),
          limit: z.number(),
          hasMore: z.boolean(),
        }),
      },
    },
  },
  adoptions: {
    list: {
      method: 'GET' as const,
      path: '/api/adoptions' as const,
      input: z.object({ page: z.coerce.number().int().min(1).optional(), limit: z.coerce.number().int().min(1).max(50).optional() }).optional(),
      responses: { 200: z.object({ items: z.array(z.custom<typeof adoptionPosts.$inferSelect>()), page: z.number(), limit: z.number(), hasMore: z.boolean() }) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/adoptions' as const,
      input: insertAdoptionPostSchema,
      responses: { 201: z.custom<typeof adoptionPosts.$inferSelect>(), 400: errorSchemas.validation },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/adoptions/:id' as const,
      input: insertAdoptionPostSchema.partial(),
      responses: { 200: z.custom<typeof adoptionPosts.$inferSelect>(), 400: errorSchemas.validation, 404: errorSchemas.notFound },
    },
  },

  likes: {
    create: {
      method: 'POST' as const,
      path: '/api/likes' as const,
      input: z.object({
        likerPetId: z.number(),
        targetPetId: z.number(),
      }),
      responses: {
        200: z.object({ matched: z.boolean(), matchId: z.number().optional() }),
        400: errorSchemas.validation,
      },
    },
  },
  matches: {
    list: {
      method: 'GET' as const,
      path: '/api/matches' as const,
      responses: {
        200: z.array(z.custom<typeof matches.$inferSelect & { petA: typeof pets.$inferSelect; petB: typeof pets.$inferSelect }>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/matches/:id' as const,
      responses: {
        200: z.custom<typeof matches.$inferSelect & { petA: typeof pets.$inferSelect; petB: typeof pets.$inferSelect; messages: typeof messages.$inferSelect[] }>(),
        404: errorSchemas.notFound,
      },
    },
  },
  messages: {
    create: {
      method: 'POST' as const,
      path: '/api/matches/:id/messages' as const,
      input: z.object({
        content: z.string(),
      }),
      responses: {
        201: z.custom<typeof messages.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  reports: {
    create: {
      method: 'POST' as const,
      path: '/api/reports' as const,
      input: z.object({
        targetPetId: z.number(),
        reason: z.string(),
      }),
      responses: {
        201: z.custom<typeof reports.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  upload: {
    create: {
        method: 'POST' as const,
        path: '/api/media/upload' as const,
        // Multipart form data, not validated by Zod directly here
        responses: {
            200: z.object({ url: z.string() }),
            400: errorSchemas.validation
        }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}


export type CreatePetRequest = z.infer<typeof api.pets.create.input>;
export type UpdatePetRequest = z.infer<typeof api.pets.update.input>;
export type CreateLikeRequest = z.infer<typeof api.likes.create.input>;
export type CreateReportRequest = z.infer<typeof api.reports.create.input>;
export type SetActivePetRequest = z.infer<typeof api.pets.setMineActive.input>;

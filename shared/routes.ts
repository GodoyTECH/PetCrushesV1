import { z } from 'zod';
import { insertPetSchema, insertUserSchema, pets, users, matches, messages, reports } from './schema';

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
        cursor: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof pets.$inferSelect>()),
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
      input: insertPetSchema,
      responses: {
        201: z.custom<typeof pets.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/pets/:id' as const,
      input: insertPetSchema.partial(),
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
        path: '/api/upload' as const,
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

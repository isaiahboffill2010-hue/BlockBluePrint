import { z } from 'zod';

export const chatRequestSchema = z.object({
  message: z.string().trim().min(1, 'Please enter a message.').max(4000, 'Please keep your message under 4000 characters.'),
  projectId: z.string().uuid().optional().nullable(),
  conversationId: z.string().uuid().optional().nullable()
});

export const intentSchema = z.object({
  intent: z.enum(['conversation', 'minecraft_build_request', 'blueprint_modification', 'minecraft_question', 'app_question']),
  confidence: z.number().min(0).max(1).optional(),
  reason: z.string().optional()
});

export const conversationResponseSchema = z.object({
  type: z.literal('conversation'),
  message: z.string().min(1)
});

export const blueprintMaterialSchema = z.object({
  label: z.string().min(1),
  count: z.number().int().nonnegative()
});

export const blueprintLayerSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  yLevel: z.number().int().optional(),
  materials: z.array(blueprintMaterialSchema).optional().default([]),
  instructions: z.array(z.string()).optional().default([])
});

export const blueprintSectionSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  estimatedTime: z.string().min(1),
  status: z.enum(['pending', 'in_progress', 'complete']).default('pending'),
  layers: z.array(blueprintLayerSchema).default([])
});

export const blueprintResponseSchema = z.object({
  type: z.literal('blueprint'),
  title: z.string().min(1),
  description: z.string().min(1),
  difficulty: z.string().min(1),
  estimatedTime: z.string().min(1),
  estimatedBlocks: z.number().int().nonnegative(),
  dimensions: z.object({
    width: z.number().int().positive(),
    length: z.number().int().positive(),
    height: z.number().int().positive()
  }),
  style: z.string().optional(),
  biomeRecommendation: z.string().optional(),
  materials: z.array(blueprintMaterialSchema).default([]),
  sections: z.array(blueprintSectionSchema).default([])
});

import { z } from 'zod';

export const PatternSchema = z.object({
  id: z.string(),
  category: z.string(),
  regex: z.string(),
  threshold: z.number().min(0).max(1).default(0.5)
});

export const BundleSchemaV1 = z.object({
  bundleVersion: z.literal("1.0.0"),
  locale: z.enum(['tr', 'en']),
  patterns: z.array(PatternSchema)
});

export type ConfigBundle = z.infer<typeof BundleSchemaV1>;
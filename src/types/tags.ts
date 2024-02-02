import type { InferSelectModel } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { tagsTable } from '@/server/db/tables/tags';

export type Tags = InferSelectModel<typeof tagsTable>;
export const TagsCreateSchema = createInsertSchema(tagsTable);

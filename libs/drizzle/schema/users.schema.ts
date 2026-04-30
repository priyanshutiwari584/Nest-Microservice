import { pgTable, varchar, uuid, integer, uniqueIndex } from 'drizzle-orm/pg-core';

export const users = pgTable(
  'users',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    uuid: uuid().notNull().unique().defaultRandom(),
    name: varchar({ length: 50 }).notNull(),
    username: varchar({ length: 50 }).notNull().unique(),
    email: varchar({ length: 255 }).notNull(),
    kcId: uuid().notNull(),
    refreshToken: varchar(),
  },
  (t) => [uniqueIndex('email_idx').on(t.email), uniqueIndex('kcId_idx').on(t.kcId)],
);

export type User = typeof users.$inferSelect;

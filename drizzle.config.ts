import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const dbUrl = `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@localhost:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`;

export default defineConfig({
  out: './drizzle',
  schema: './libs/drizzle/schema/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: dbUrl,
  },
});

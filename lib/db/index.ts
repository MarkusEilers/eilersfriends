import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// For Supabase pooler (transaction mode), disable prepared statements
const sql = postgres(connectionString, {
  ssl: "require",
  prepare: false,
});

export const db = drizzle(sql, { schema });

export type Database = typeof db;

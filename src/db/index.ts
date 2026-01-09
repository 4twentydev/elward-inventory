import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.POSTGRES_URL;

// For development without database, export null
export const sql = connectionString ? postgres(connectionString) : null;
export const db = sql ? drizzle(sql, { schema }) : null;

export function getDb() {
	if (!db) {
		throw new Error(
			"Database not configured. Set POSTGRES_URL environment variable.",
		);
	}
	return db;
}

export function isDbConfigured(): boolean {
	return !!connectionString;
}

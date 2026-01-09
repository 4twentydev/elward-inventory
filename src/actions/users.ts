"use server";

import { and, eq } from "drizzle-orm";
import { db, isDbConfigured } from "@/db";
import type { NewUser, User } from "@/db/schema";
import { users } from "@/db/schema";

export async function getUsers(): Promise<User[]> {
	if (!isDbConfigured() || !db) return [];
	return db.select().from(users).orderBy(users.name);
}

export async function getUser(id: string): Promise<User | null> {
	if (!isDbConfigured() || !db) return null;
	const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
	return result[0] || null;
}

export async function validateUserPin(pin: string): Promise<User | null> {
	if (!isDbConfigured() || !db) return null;
	const result = await db
		.select()
		.from(users)
		.where(and(eq(users.pin, pin), eq(users.active, true)))
		.limit(1);
	return result[0] || null;
}

export async function createUser(user: NewUser): Promise<User> {
	if (!isDbConfigured() || !db) throw new Error("Database not configured");
	const result = await db.insert(users).values(user).returning();
	return result[0];
}

export async function updateUser(
	id: string,
	updates: Partial<NewUser>,
): Promise<User | null> {
	if (!isDbConfigured() || !db) throw new Error("Database not configured");
	const result = await db
		.update(users)
		.set(updates)
		.where(eq(users.id, id))
		.returning();
	return result[0] || null;
}

export async function deactivateUser(id: string): Promise<boolean> {
	if (!isDbConfigured() || !db) throw new Error("Database not configured");
	const result = await db
		.update(users)
		.set({ active: false })
		.where(eq(users.id, id))
		.returning();
	return result.length > 0;
}

export async function seedDefaultUser(): Promise<User | null> {
	if (!isDbConfigured() || !db) return null;

	// Check if admin already exists
	const existingUsers = await db.select().from(users).limit(1);
	if (existingUsers.length > 0) return existingUsers[0];

	// Create default admin
	const result = await db
		.insert(users)
		.values({
			id: "admin",
			name: "Admin",
			pin: "1234",
			role: "admin",
			active: true,
		})
		.returning();

	return result[0];
}

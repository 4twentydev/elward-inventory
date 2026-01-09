"use server";

import { and, desc, eq, isNull } from "drizzle-orm";
import { db, isDbConfigured } from "@/db";
import type { CountSession, NewCountSession } from "@/db/schema";
import { countSessions, counts, items } from "@/db/schema";

export async function createCountSession(
	session: NewCountSession,
): Promise<CountSession> {
	if (!isDbConfigured() || !db) throw new Error("Database not configured");

	// Get total items count
	const allItems = await db.select().from(items);
	const totalItems = allItems.length;

	const result = await db
		.insert(countSessions)
		.values({ ...session, totalItems })
		.returning();
	return result[0];
}

export async function getCountSession(
	id: string,
): Promise<CountSession | null> {
	if (!isDbConfigured() || !db) return null;
	const result = await db
		.select()
		.from(countSessions)
		.where(eq(countSessions.id, id))
		.limit(1);
	return result[0] || null;
}

export async function getActiveCountSessions(): Promise<CountSession[]> {
	if (!isDbConfigured() || !db) return [];
	return db
		.select()
		.from(countSessions)
		.where(eq(countSessions.status, "in_progress"))
		.orderBy(desc(countSessions.startedAt));
}

export async function getCompletedCountSessions(
	limit = 10,
): Promise<CountSession[]> {
	if (!isDbConfigured() || !db) return [];
	return db
		.select()
		.from(countSessions)
		.where(eq(countSessions.status, "completed"))
		.orderBy(desc(countSessions.completedAt))
		.limit(limit);
}

export async function updateCountSession(
	id: string,
	updates: Partial<CountSession>,
): Promise<CountSession | null> {
	if (!isDbConfigured() || !db) throw new Error("Database not configured");
	const result = await db
		.update(countSessions)
		.set(updates)
		.where(eq(countSessions.id, id))
		.returning();
	return result[0] || null;
}

export async function completeCountSession(
	id: string,
): Promise<CountSession | null> {
	if (!isDbConfigured() || !db) throw new Error("Database not configured");

	// Get count stats for this session
	const sessionCounts = await db
		.select()
		.from(counts)
		.where(eq(counts.countSessionId, id));

	const countedItems = sessionCounts.length;
	const discrepancyCount = sessionCounts.filter(
		(c) => c.discrepancy !== 0,
	).length;

	const result = await db
		.update(countSessions)
		.set({
			status: "completed",
			completedAt: new Date(),
			countedItems,
			discrepancyCount,
		})
		.where(eq(countSessions.id, id))
		.returning();

	return result[0] || null;
}

export async function getUncountedItemsInSession(sessionId: string) {
	if (!isDbConfigured() || !db) return [];

	// Get all items that haven't been counted in this session
	const countedItemIds = await db
		.select({ itemId: counts.itemId })
		.from(counts)
		.where(eq(counts.countSessionId, sessionId));

	const countedIds = new Set(countedItemIds.map((c) => c.itemId));

	const allItems = await db.select().from(items);
	return allItems.filter((item) => !countedIds.has(item.id));
}

export async function getSessionSummary(sessionId: string) {
	if (!isDbConfigured() || !db)
		return {
			session: null,
			counts: [],
			uncountedItems: [],
			stats: {
				total: 0,
				counted: 0,
				discrepancies: 0,
				surplus: 0,
				shortage: 0,
			},
		};

	const session = await getCountSession(sessionId);
	if (!session) return null;

	const sessionCounts = await db
		.select()
		.from(counts)
		.where(eq(counts.countSessionId, sessionId))
		.orderBy(desc(counts.createdAt));

	const uncountedItems = await getUncountedItemsInSession(sessionId);

	const stats = {
		total: session.totalItems,
		counted: sessionCounts.length,
		discrepancies: sessionCounts.filter((c) => c.discrepancy !== 0).length,
		surplus: sessionCounts
			.filter((c) => c.discrepancy > 0)
			.reduce((sum, c) => sum + c.discrepancy, 0),
		shortage: sessionCounts
			.filter((c) => c.discrepancy < 0)
			.reduce((sum, c) => sum + Math.abs(c.discrepancy), 0),
	};

	return { session, counts: sessionCounts, uncountedItems, stats };
}

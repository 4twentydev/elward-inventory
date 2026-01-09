"use server";

import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db, isDbConfigured } from "@/db";
import type { Item, NewCount, NewItem, NewTransaction } from "@/db/schema";
import { counts, items, transactions } from "@/db/schema";

export async function getItems(): Promise<Item[]> {
	if (!isDbConfigured() || !db) return [];
	return db.select().from(items).orderBy(items.name);
}

export async function getItem(id: string): Promise<Item | null> {
	if (!isDbConfigured() || !db) return null;
	const result = await db.select().from(items).where(eq(items.id, id)).limit(1);
	return result[0] || null;
}

export async function createItem(item: NewItem): Promise<Item> {
	if (!isDbConfigured() || !db) throw new Error("Database not configured");
	const result = await db.insert(items).values(item).returning();
	return result[0];
}

export async function updateItem(
	id: string,
	updates: Partial<NewItem>,
): Promise<Item | null> {
	if (!isDbConfigured() || !db) throw new Error("Database not configured");
	const result = await db
		.update(items)
		.set({ ...updates, updatedAt: new Date() })
		.where(eq(items.id, id))
		.returning();
	return result[0] || null;
}

export async function deleteItem(id: string): Promise<boolean> {
	if (!isDbConfigured() || !db) throw new Error("Database not configured");
	const result = await db.delete(items).where(eq(items.id, id)).returning();
	return result.length > 0;
}

export async function bulkCreateItems(newItems: NewItem[]): Promise<number> {
	if (!isDbConfigured() || !db) throw new Error("Database not configured");
	if (newItems.length === 0) return 0;
	const result = await db.insert(items).values(newItems).returning();
	return result.length;
}

export async function getLowStockItems(): Promise<Item[]> {
	if (!isDbConfigured() || !db) return [];
	return db
		.select()
		.from(items)
		.where(
			and(
				sql`${items.quantity} <= ${items.reorderLevel}`,
				sql`${items.reorderLevel} > 0`,
			),
		)
		.orderBy(items.name);
}

// Transactions
export async function createTransaction(tx: NewTransaction): Promise<void> {
	if (!isDbConfigured() || !db) throw new Error("Database not configured");
	await db.insert(transactions).values(tx);
}

export async function getItemTransactions(itemId: string) {
	if (!isDbConfigured() || !db) return [];
	return db
		.select()
		.from(transactions)
		.where(eq(transactions.itemId, itemId))
		.orderBy(desc(transactions.createdAt));
}

export async function getTransactionsByDateRange(
	startDate: Date,
	endDate: Date,
) {
	if (!isDbConfigured() || !db) return [];
	return db
		.select()
		.from(transactions)
		.where(
			and(
				gte(transactions.createdAt, startDate),
				lte(transactions.createdAt, endDate),
			),
		)
		.orderBy(desc(transactions.createdAt));
}

// Counts
export async function createCount(count: NewCount): Promise<void> {
	if (!isDbConfigured() || !db) throw new Error("Database not configured");
	await db.insert(counts).values(count);
}

export async function getCountsBySession(sessionId: string) {
	if (!isDbConfigured() || !db) return [];
	return db
		.select()
		.from(counts)
		.where(eq(counts.countSessionId, sessionId))
		.orderBy(desc(counts.createdAt));
}

export async function getCountsByDateRange(startDate: Date, endDate: Date) {
	if (!isDbConfigured() || !db) return [];
	return db
		.select()
		.from(counts)
		.where(
			and(gte(counts.createdAt, startDate), lte(counts.createdAt, endDate)),
		)
		.orderBy(desc(counts.createdAt));
}

// Analytics
export async function getInventoryStats() {
	if (!isDbConfigured() || !db)
		return {
			totalItems: 0,
			totalValue: 0,
			lowStockCount: 0,
			categoryCounts: {},
		};

	const allItems = await db.select().from(items);

	const totalItems = allItems.length;
	const totalValue = allItems.reduce((sum, item) => {
		const cost = item.unitCost ? Number.parseFloat(item.unitCost) : 0;
		return sum + item.quantity * cost;
	}, 0);

	const lowStockCount = allItems.filter(
		(item) => item.quantity <= item.reorderLevel && item.reorderLevel > 0,
	).length;

	const categoryCounts: Record<string, number> = {};
	for (const item of allItems) {
		categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
	}

	return { totalItems, totalValue, lowStockCount, categoryCounts };
}

export async function getRecentActivity(limit = 20) {
	if (!isDbConfigured() || !db) return [];
	return db
		.select()
		.from(transactions)
		.orderBy(desc(transactions.createdAt))
		.limit(limit);
}

"use server";

import { desc, eq } from "drizzle-orm";
import { db, isDbConfigured } from "@/db";
import type { ChatMessage, NewChatMessage } from "@/db/schema";
import { chatMessages } from "@/db/schema";

export async function getChatMessages(userId?: string): Promise<ChatMessage[]> {
	if (!isDbConfigured() || !db) return [];

	if (userId) {
		return db
			.select()
			.from(chatMessages)
			.where(eq(chatMessages.userId, userId))
			.orderBy(chatMessages.createdAt);
	}

	return db.select().from(chatMessages).orderBy(chatMessages.createdAt);
}

export async function createChatMessage(
	message: NewChatMessage,
): Promise<ChatMessage> {
	if (!isDbConfigured() || !db) throw new Error("Database not configured");
	const result = await db.insert(chatMessages).values(message).returning();
	return result[0];
}

export async function clearUserChatMessages(userId: string): Promise<boolean> {
	if (!isDbConfigured() || !db) throw new Error("Database not configured");
	const result = await db
		.delete(chatMessages)
		.where(eq(chatMessages.userId, userId));
	return true;
}

"use server";

import { eq } from "drizzle-orm";
import { db, isDbConfigured } from "@/db";
import {
	aiCountLogs,
	chatMessages,
	countSessions,
	counts,
	items,
	transactions,
	users,
} from "@/db/schema";

export async function resetAllData() {
	if (!isDbConfigured() || !db) {
		return {
			success: false,
			message: "Database not configured. Use localStorage mode.",
		};
	}

	try {
		// Delete all data from all tables (in correct order due to foreign keys)
		await db.delete(chatMessages);
		await db.delete(aiCountLogs);
		await db.delete(counts);
		await db.delete(countSessions);
		await db.delete(transactions);
		await db.delete(items);
		// Keep users table but reset to default admin only
		await db.delete(users);

		// Recreate default admin user
		await db.insert(users).values({
			id: "admin",
			name: "Admin",
			pin: "1234",
			role: "admin",
			active: true,
		});

		return {
			success: true,
			message: "All data has been reset successfully.",
		};
	} catch (error) {
		console.error("Error resetting database:", error);
		return {
			success: false,
			message: "Failed to reset database data.",
		};
	}
}

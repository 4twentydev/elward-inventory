import {
	boolean,
	decimal,
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

export const categoryEnum = pgEnum("category", [
	"ACM",
	"SwissPearl",
	"Trespa",
	"Extrusions",
	"Tools",
	"Hardware",
	"Other",
]);

export const roleEnum = pgEnum("role", ["admin", "counter", "user"]);

export const transactionTypeEnum = pgEnum("transaction_type", [
	"pull",
	"return",
	"adjustment",
	"count",
	"transfer",
]);

export const countTypeEnum = pgEnum("count_type", [
	"quarterly",
	"daily",
	"spot",
]);

export const users = pgTable("users", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	pin: text("pin").notNull(),
	role: roleEnum("role").notNull().default("user"),
	active: boolean("active").notNull().default(true),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const items = pgTable("items", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	category: categoryEnum("category").notNull().default("Other"),
	quantity: integer("quantity").notNull().default(0),
	location: text("location").notNull().default(""),
	supplier: text("supplier").notNull().default(""),
	reorderLevel: integer("reorder_level").notNull().default(0),
	notes: text("notes").notNull().default(""),
	sku: text("sku"),
	unitCost: decimal("unit_cost", { precision: 10, scale: 2 }),
	lastCountDate: timestamp("last_count_date"),
	lastCountBy: text("last_count_by"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const transactions = pgTable("transactions", {
	id: text("id").primaryKey(),
	itemId: text("item_id")
		.notNull()
		.references(() => items.id, { onDelete: "cascade" }),
	type: transactionTypeEnum("type").notNull(),
	quantity: integer("quantity").notNull(),
	previousQuantity: integer("previous_quantity").notNull(),
	newQuantity: integer("new_quantity").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => users.id),
	userName: text("user_name").notNull(),
	jobReference: text("job_reference"),
	notes: text("notes"),
	fromLocation: text("from_location"),
	toLocation: text("to_location"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const counts = pgTable("counts", {
	id: text("id").primaryKey(),
	itemId: text("item_id")
		.notNull()
		.references(() => items.id, { onDelete: "cascade" }),
	countedQuantity: integer("counted_quantity").notNull(),
	systemQuantity: integer("system_quantity").notNull(),
	discrepancy: integer("discrepancy").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => users.id),
	userName: text("user_name").notNull(),
	countType: countTypeEnum("count_type").notNull(),
	countSessionId: text("count_session_id"),
	notes: text("notes"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const countSessions = pgTable("count_sessions", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	type: countTypeEnum("type").notNull(),
	status: text("status").notNull().default("in_progress"),
	startedBy: text("started_by")
		.notNull()
		.references(() => users.id),
	startedByName: text("started_by_name").notNull(),
	totalItems: integer("total_items").notNull().default(0),
	countedItems: integer("counted_items").notNull().default(0),
	discrepancyCount: integer("discrepancy_count").notNull().default(0),
	notes: text("notes"),
	startedAt: timestamp("started_at").notNull().defaultNow(),
	completedAt: timestamp("completed_at"),
});

export const aiCountLogs = pgTable("ai_count_logs", {
	id: text("id").primaryKey(),
	itemId: text("item_id").references(() => items.id, { onDelete: "set null" }),
	imageUrl: text("image_url").notNull(),
	aiCount: integer("ai_count").notNull(),
	confirmedCount: integer("confirmed_count").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => users.id),
	userName: text("user_name").notNull(),
	profileName: text("profile_name"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	userName: text("user_name").notNull(),
	role: text("role").notNull(),
	content: text("content").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type Count = typeof counts.$inferSelect;
export type NewCount = typeof counts.$inferInsert;
export type CountSession = typeof countSessions.$inferSelect;
export type NewCountSession = typeof countSessions.$inferInsert;
export type AICountLog = typeof aiCountLogs.$inferSelect;
export type NewAICountLog = typeof aiCountLogs.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;

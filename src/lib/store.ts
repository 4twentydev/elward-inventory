import type {
	AICountLog,
	ChatMessage,
	InventoryCount,
	InventoryItem,
	Transaction,
	User,
} from "@/types";

const STORAGE_KEYS = {
	ITEMS: "elward_inventory_items",
	TRANSACTIONS: "elward_inventory_transactions",
	COUNTS: "elward_inventory_counts",
	USERS: "elward_inventory_users",
	AI_LOGS: "elward_inventory_ai_logs",
	CURRENT_USER: "elward_inventory_current_user",
	CHAT_MESSAGES: "elward_inventory_chat_messages",
};

function getStorage<T>(key: string, defaultValue: T): T {
	if (typeof window === "undefined") return defaultValue;
	const stored = localStorage.getItem(key);
	return stored ? JSON.parse(stored) : defaultValue;
}

function setStorage<T>(key: string, value: T): void {
	if (typeof window === "undefined") return;
	localStorage.setItem(key, JSON.stringify(value));
}

// Items
export function getItems(): InventoryItem[] {
	return getStorage<InventoryItem[]>(STORAGE_KEYS.ITEMS, []);
}

export function setItems(items: InventoryItem[]): void {
	setStorage(STORAGE_KEYS.ITEMS, items);
}

export function addItem(item: InventoryItem): void {
	const items = getItems();
	items.push(item);
	setItems(items);
}

export function updateItem(id: string, updates: Partial<InventoryItem>): void {
	const items = getItems();
	const index = items.findIndex((i) => i.id === id);
	if (index !== -1) {
		items[index] = {
			...items[index],
			...updates,
			updatedAt: new Date().toISOString(),
		};
		setItems(items);
	}
}

export function deleteItem(id: string): void {
	const items = getItems().filter((i) => i.id !== id);
	setItems(items);
}

export function getItem(id: string): InventoryItem | undefined {
	return getItems().find((i) => i.id === id);
}

// Transactions
export function getTransactions(): Transaction[] {
	return getStorage<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
}

export function addTransaction(transaction: Transaction): void {
	const transactions = getTransactions();
	transactions.unshift(transaction);
	setStorage(STORAGE_KEYS.TRANSACTIONS, transactions);
}

export function getItemTransactions(itemId: string): Transaction[] {
	return getTransactions().filter((t) => t.itemId === itemId);
}

// Counts
export function getCounts(): InventoryCount[] {
	return getStorage<InventoryCount[]>(STORAGE_KEYS.COUNTS, []);
}

export function addCount(count: InventoryCount): void {
	const counts = getCounts();
	counts.unshift(count);
	setStorage(STORAGE_KEYS.COUNTS, counts);
}

// Users
export function getUsers(): User[] {
	const users = getStorage<User[]>(STORAGE_KEYS.USERS, []);
	if (users.length === 0) {
		const defaultUsers: User[] = [
			{
				id: "admin",
				name: "Admin",
				pin: "1234",
				role: "admin",
				active: true,
				createdAt: new Date().toISOString(),
			},
		];
		setStorage(STORAGE_KEYS.USERS, defaultUsers);
		return defaultUsers;
	}
	return users;
}

export function addUser(user: User): void {
	const users = getUsers();
	users.push(user);
	setStorage(STORAGE_KEYS.USERS, users);
}

export function validateUser(pin: string): User | null {
	const users = getUsers();
	return users.find((u) => u.pin === pin && u.active) || null;
}

export function getCurrentUser(): User | null {
	return getStorage<User | null>(STORAGE_KEYS.CURRENT_USER, null);
}

export function setCurrentUser(user: User | null): void {
	setStorage(STORAGE_KEYS.CURRENT_USER, user);
}

// AI Logs
export function getAILogs(): AICountLog[] {
	return getStorage<AICountLog[]>(STORAGE_KEYS.AI_LOGS, []);
}

export function addAILog(log: AICountLog): void {
	const logs = getAILogs();
	logs.unshift(log);
	setStorage(STORAGE_KEYS.AI_LOGS, logs);
}

// Chat Messages
export function getChatMessages(userId?: string): ChatMessage[] {
	const allMessages = getStorage<ChatMessage[]>(STORAGE_KEYS.CHAT_MESSAGES, []);
	if (userId) {
		return allMessages.filter((msg) => msg.userId === userId);
	}
	return allMessages;
}

export function addChatMessage(message: ChatMessage): void {
	const messages = getStorage<ChatMessage[]>(STORAGE_KEYS.CHAT_MESSAGES, []);
	messages.push(message);
	setStorage(STORAGE_KEYS.CHAT_MESSAGES, messages);
}

export function clearChatMessages(userId: string): void {
	const allMessages = getStorage<ChatMessage[]>(STORAGE_KEYS.CHAT_MESSAGES, []);
	const filtered = allMessages.filter((msg) => msg.userId !== userId);
	setStorage(STORAGE_KEYS.CHAT_MESSAGES, filtered);
}

// Bulk import
export function importItems(items: InventoryItem[]): void {
	const existing = getItems();
	const merged = [...existing, ...items];
	setItems(merged);
}

// Export
export function exportItems(): InventoryItem[] {
	return getItems();
}

// Clear all data (for testing)
export function clearAllData(): void {
	for (const key of Object.values(STORAGE_KEYS)) {
		if (typeof window !== "undefined") {
			localStorage.removeItem(key);
		}
	}
}

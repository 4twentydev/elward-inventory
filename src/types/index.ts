export type ItemCategory =
	| "ACM"
	| "SwissPearl"
	| "Trespa"
	| "Extrusions"
	| "Tools"
	| "Hardware"
	| "Other";

export interface InventoryItem {
	id: string;
	name: string;
	category: ItemCategory;
	quantity: number;
	location: string;
	supplier: string;
	reorderLevel: number;
	notes: string;
	sku?: string;
	unitCost?: number;
	lastCountDate?: string;
	lastCountBy?: string;
	createdAt: string;
	updatedAt: string;
}

export interface Transaction {
	id: string;
	itemId: string;
	type: "pull" | "return" | "adjustment" | "count";
	quantity: number;
	previousQuantity: number;
	newQuantity: number;
	userId: string;
	userName: string;
	jobReference?: string;
	notes?: string;
	createdAt: string;
}

export interface InventoryCount {
	id: string;
	itemId: string;
	countedQuantity: number;
	systemQuantity: number;
	discrepancy: number;
	userId: string;
	userName: string;
	countType: "quarterly" | "daily" | "spot";
	notes?: string;
	createdAt: string;
}

export interface User {
	id: string;
	name: string;
	pin: string;
	role: "admin" | "counter" | "user";
	active: boolean;
	createdAt: string;
}

export interface AICountLog {
	id: string;
	itemId?: string;
	imageUrl: string;
	aiCount: number;
	confirmedCount: number;
	userId: string;
	userName: string;
	profileName?: string;
	createdAt: string;
}

export interface ImportResult {
	success: boolean;
	imported: number;
	errors: string[];
	items?: InventoryItem[];
}

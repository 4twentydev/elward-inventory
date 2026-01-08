import * as XLSX from "xlsx";
import type { InventoryItem, ItemCategory, ImportResult } from "@/types";
import { generateId } from "./utils";

const CATEGORY_MAP: Record<string, ItemCategory> = {
	acm: "ACM",
	"swiss pearl": "SwissPearl",
	swisspearl: "SwissPearl",
	swiss: "SwissPearl",
	trespa: "Trespa",
	extrusion: "Extrusions",
	extrusions: "Extrusions",
	profile: "Extrusions",
	profiles: "Extrusions",
	tool: "Tools",
	tools: "Tools",
	hardware: "Hardware",
	fastener: "Hardware",
	fasteners: "Hardware",
};

function normalizeCategory(value: string): ItemCategory {
	const lower = value.toLowerCase().trim();
	return CATEGORY_MAP[lower] || "Other";
}

function parseNumber(value: any): number {
	if (typeof value === "number") return value;
	if (typeof value === "string") {
		const parsed = Number.parseFloat(value.replace(/[^0-9.-]/g, ""));
		return Number.isNaN(parsed) ? 0 : parsed;
	}
	return 0;
}

function findColumnIndex(headers: string[], possibleNames: string[]): number {
	const lowerHeaders = headers.map((h) => h?.toString().toLowerCase().trim() || "");
	for (const name of possibleNames) {
		const idx = lowerHeaders.indexOf(name.toLowerCase());
		if (idx !== -1) return idx;
	}
	return -1;
}

export function parseExcelFile(buffer: ArrayBuffer): ImportResult {
	try {
		const workbook = XLSX.read(buffer, { type: "array" });
		const sheetName = workbook.SheetNames[0];
		const sheet = workbook.Sheets[sheetName];
		const data = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { header: 1 });

		if (data.length < 2) {
			return { success: false, imported: 0, errors: ["File is empty or has no data rows"] };
		}

		const headers = (data[0] as string[]).map((h) => h?.toString() || "");

		// Find column indices
		const nameIdx = findColumnIndex(headers, ["name", "item", "item name", "description", "product"]);
		const categoryIdx = findColumnIndex(headers, ["category", "type", "cat"]);
		const quantityIdx = findColumnIndex(headers, ["quantity", "qty", "count", "stock", "on hand"]);
		const locationIdx = findColumnIndex(headers, ["location", "loc", "bin", "warehouse"]);
		const supplierIdx = findColumnIndex(headers, ["supplier", "vendor", "manufacturer"]);
		const reorderIdx = findColumnIndex(headers, ["reorder", "reorder level", "min", "minimum"]);
		const notesIdx = findColumnIndex(headers, ["notes", "note", "comments", "description"]);
		const skuIdx = findColumnIndex(headers, ["sku", "part number", "part", "code", "item number"]);
		const costIdx = findColumnIndex(headers, ["cost", "price", "unit cost", "unit price"]);

		if (nameIdx === -1) {
			return { success: false, imported: 0, errors: ["Could not find 'Name' or 'Item' column"] };
		}

		const items: InventoryItem[] = [];
		const errors: string[] = [];
		const now = new Date().toISOString();

		for (let i = 1; i < data.length; i++) {
			const row = data[i] as any[];
			if (!row || !row[nameIdx]) continue;

			const name = row[nameIdx]?.toString().trim();
			if (!name) continue;

			try {
				const item: InventoryItem = {
					id: generateId(),
					name,
					category: categoryIdx >= 0 ? normalizeCategory(row[categoryIdx]?.toString() || "") : "Other",
					quantity: quantityIdx >= 0 ? parseNumber(row[quantityIdx]) : 0,
					location: locationIdx >= 0 ? row[locationIdx]?.toString().trim() || "" : "",
					supplier: supplierIdx >= 0 ? row[supplierIdx]?.toString().trim() || "" : "",
					reorderLevel: reorderIdx >= 0 ? parseNumber(row[reorderIdx]) : 0,
					notes: notesIdx >= 0 ? row[notesIdx]?.toString().trim() || "" : "",
					sku: skuIdx >= 0 ? row[skuIdx]?.toString().trim() : undefined,
					unitCost: costIdx >= 0 ? parseNumber(row[costIdx]) : undefined,
					createdAt: now,
					updatedAt: now,
				};
				items.push(item);
			} catch (e) {
				errors.push(`Row ${i + 1}: ${e instanceof Error ? e.message : "Unknown error"}`);
			}
		}

		return {
			success: true,
			imported: items.length,
			errors,
			items,
		};
	} catch (e) {
		return {
			success: false,
			imported: 0,
			errors: [e instanceof Error ? e.message : "Failed to parse file"],
		};
	}
}

export function parseCSVFile(content: string): ImportResult {
	try {
		const lines = content.split(/\r?\n/).filter((line) => line.trim());
		if (lines.length < 2) {
			return { success: false, imported: 0, errors: ["File is empty or has no data rows"] };
		}

		// Simple CSV parsing (handles quoted values)
		const parseCSVLine = (line: string): string[] => {
			const result: string[] = [];
			let current = "";
			let inQuotes = false;

			for (let i = 0; i < line.length; i++) {
				const char = line[i];
				if (char === '"') {
					inQuotes = !inQuotes;
				} else if (char === "," && !inQuotes) {
					result.push(current.trim());
					current = "";
				} else {
					current += char;
				}
			}
			result.push(current.trim());
			return result;
		};

		const headers = parseCSVLine(lines[0]);
		const nameIdx = findColumnIndex(headers, ["name", "profile", "item", "description"]);
		const categoryIdx = findColumnIndex(headers, ["category", "type"]);
		const quantityIdx = findColumnIndex(headers, ["quantity", "qty", "count"]);
		const locationIdx = findColumnIndex(headers, ["location", "loc"]);
		const supplierIdx = findColumnIndex(headers, ["supplier", "vendor"]);
		const notesIdx = findColumnIndex(headers, ["notes", "note"]);
		const skuIdx = findColumnIndex(headers, ["sku", "part", "code"]);

		if (nameIdx === -1) {
			return { success: false, imported: 0, errors: ["Could not find 'Name' or 'Profile' column"] };
		}

		const items: InventoryItem[] = [];
		const errors: string[] = [];
		const now = new Date().toISOString();

		for (let i = 1; i < lines.length; i++) {
			const row = parseCSVLine(lines[i]);
			const name = row[nameIdx]?.trim();
			if (!name) continue;

			try {
				const item: InventoryItem = {
					id: generateId(),
					name,
					category: categoryIdx >= 0 ? normalizeCategory(row[categoryIdx] || "") : "Extrusions",
					quantity: quantityIdx >= 0 ? parseNumber(row[quantityIdx]) : 0,
					location: locationIdx >= 0 ? row[locationIdx]?.trim() || "" : "",
					supplier: supplierIdx >= 0 ? row[supplierIdx]?.trim() || "" : "",
					reorderLevel: 0,
					notes: notesIdx >= 0 ? row[notesIdx]?.trim() || "" : "",
					sku: skuIdx >= 0 ? row[skuIdx]?.trim() : undefined,
					createdAt: now,
					updatedAt: now,
				};
				items.push(item);
			} catch (e) {
				errors.push(`Row ${i + 1}: ${e instanceof Error ? e.message : "Unknown error"}`);
			}
		}

		return {
			success: true,
			imported: items.length,
			errors,
			items,
		};
	} catch (e) {
		return {
			success: false,
			imported: 0,
			errors: [e instanceof Error ? e.message : "Failed to parse CSV"],
		};
	}
}

export function exportToCSV(items: InventoryItem[]): string {
	const headers = ["Name", "Category", "Quantity", "Location", "Supplier", "Reorder Level", "Notes", "SKU", "Unit Cost"];
	const rows = items.map((item) => [
		`"${item.name.replace(/"/g, '""')}"`,
		item.category,
		item.quantity,
		`"${item.location.replace(/"/g, '""')}"`,
		`"${item.supplier.replace(/"/g, '""')}"`,
		item.reorderLevel,
		`"${item.notes.replace(/"/g, '""')}"`,
		item.sku || "",
		item.unitCost || "",
	]);

	return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export function exportToExcel(items: InventoryItem[]): ArrayBuffer {
	const data = items.map((item) => ({
		Name: item.name,
		Category: item.category,
		Quantity: item.quantity,
		Location: item.location,
		Supplier: item.supplier,
		"Reorder Level": item.reorderLevel,
		Notes: item.notes,
		SKU: item.sku || "",
		"Unit Cost": item.unitCost || "",
		"Last Count Date": item.lastCountDate || "",
		"Last Count By": item.lastCountBy || "",
	}));

	const ws = XLSX.utils.json_to_sheet(data);
	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, "Inventory");

	return XLSX.write(wb, { type: "array", bookType: "xlsx" });
}

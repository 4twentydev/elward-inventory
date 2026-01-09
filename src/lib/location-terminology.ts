import type { InventoryItem } from "@/types";

/**
 * Get the location terminology based on item category
 * - Extrusions → "rack"
 * - ACM → "row"
 * - SwissPearl, Trespa → "tent"
 * - Hardware (rivets) → "rivet room"
 * - Other categories → "location"
 */
export function getLocationTerm(
	category: InventoryItem["category"],
): string {
	switch (category) {
		case "Extrusions":
			return "rack";
		case "ACM":
			return "row";
		case "SwissPearl":
		case "Trespa":
			return "tent";
		case "Hardware":
			return "rivet room";
		default:
			return "location";
	}
}

/**
 * Get capitalized location terminology
 */
export function getLocationTermCapitalized(
	category: InventoryItem["category"],
): string {
	const term = getLocationTerm(category);
	return term.charAt(0).toUpperCase() + term.slice(1);
}

/**
 * Get location placeholder text based on category
 */
export function getLocationPlaceholder(
	category: InventoryItem["category"],
): string {
	const term = getLocationTerm(category);
	switch (category) {
		case "Extrusions":
			return "e.g., Rack 3, Rack A";
		case "ACM":
			return "e.g., Row 1, Row B";
		case "SwissPearl":
		case "Trespa":
			return "e.g., Tent 1, Tent A";
		case "Hardware":
			return "e.g., Rivet Room Shelf 1";
		default:
			return "e.g., Warehouse A, Shelf 3";
	}
}

/**
 * Format location display with category-specific terminology
 */
export function formatLocationDisplay(
	location: string,
	category: InventoryItem["category"],
): string {
	if (!location) return "";
	return location;
}

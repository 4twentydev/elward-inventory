import QRCode from "qrcode";
import type { InventoryItem } from "@/types";

export interface LabelData {
	id: string;
	name: string;
	sku?: string;
	location: string;
	category: string;
	qrDataUrl?: string;
}

export async function generateQRCode(data: string): Promise<string> {
	try {
		return await QRCode.toDataURL(data, {
			width: 200,
			margin: 1,
			color: {
				dark: "#000000",
				light: "#ffffff",
			},
		});
	} catch (err) {
		console.error("QR generation failed:", err);
		return "";
	}
}

export async function generateItemLabel(
	item: InventoryItem,
): Promise<LabelData> {
	const qrData = JSON.stringify({
		id: item.id,
		name: item.name,
		sku: item.sku,
	});

	const qrDataUrl = await generateQRCode(qrData);

	return {
		id: item.id,
		name: item.name,
		sku: item.sku,
		location: item.location,
		category: item.category,
		qrDataUrl,
	};
}

export async function generateBulkLabels(
	items: InventoryItem[],
): Promise<LabelData[]> {
	const labels = await Promise.all(items.map(generateItemLabel));
	return labels;
}

export function generateLabelHTML(label: LabelData): string {
	return `
		<div style="
			width: 2in;
			height: 1in;
			padding: 4px;
			border: 1px solid #ccc;
			font-family: sans-serif;
			display: flex;
			gap: 8px;
			box-sizing: border-box;
			page-break-inside: avoid;
		">
			<div style="flex: 1; min-width: 0;">
				<div style="font-weight: bold; font-size: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
					${label.name}
				</div>
				${label.sku ? `<div style="font-size: 8px; color: #666; font-family: monospace;">${label.sku}</div>` : ""}
				<div style="font-size: 8px; color: #666; margin-top: 2px;">${label.location}</div>
				<div style="font-size: 7px; color: #999; margin-top: auto;">${label.category}</div>
			</div>
			${label.qrDataUrl ? `<img src="${label.qrDataUrl}" style="width: 48px; height: 48px;" />` : ""}
		</div>
	`;
}

export function generatePrintPageHTML(labels: LabelData[]): string {
	const labelsHTML = labels.map(generateLabelHTML).join("");

	return `
		<!DOCTYPE html>
		<html>
		<head>
			<title>Inventory Labels</title>
			<style>
				@media print {
					body { margin: 0; }
					.no-print { display: none; }
				}
				body {
					font-family: system-ui, sans-serif;
					padding: 0.5in;
				}
				.labels-container {
					display: flex;
					flex-wrap: wrap;
					gap: 4px;
				}
				.print-btn {
					position: fixed;
					top: 10px;
					right: 10px;
					padding: 10px 20px;
					background: #f59e0b;
					color: #000;
					border: none;
					border-radius: 8px;
					cursor: pointer;
					font-weight: 500;
				}
			</style>
		</head>
		<body>
			<button class="print-btn no-print" onclick="window.print()">Print Labels</button>
			<div class="labels-container">
				${labelsHTML}
			</div>
		</body>
		</html>
	`;
}

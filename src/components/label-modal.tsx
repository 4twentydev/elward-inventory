"use client";

import { useState, useEffect } from "react";
import { Modal } from "./ui/modal";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useInventory } from "./inventory-context";
import {
	generateItemLabel,
	generateBulkLabels,
	generatePrintPageHTML,
	type LabelData,
} from "@/lib/labels";
import { Printer, QrCode, Check, Loader2 } from "lucide-react";
import type { InventoryItem } from "@/types";

interface LabelModalProps {
	isOpen: boolean;
	onClose: () => void;
	item?: InventoryItem | null;
}

export function LabelModal({ isOpen, onClose, item }: LabelModalProps) {
	const { items } = useInventory();
	const [label, setLabel] = useState<LabelData | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [mode, setMode] = useState<"single" | "bulk">(item ? "single" : "bulk");

	useEffect(() => {
		if (isOpen && item) {
			setMode("single");
			setIsLoading(true);
			generateItemLabel(item).then((l) => {
				setLabel(l);
				setIsLoading(false);
			});
		} else if (isOpen && !item) {
			setMode("bulk");
			setLabel(null);
		}
	}, [isOpen, item]);

	const handleToggleItem = (id: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	};

	const handleSelectAll = () => {
		if (selectedIds.size === items.length) {
			setSelectedIds(new Set());
		} else {
			setSelectedIds(new Set(items.map((i) => i.id)));
		}
	};

	const handlePrintSingle = () => {
		if (!label) return;
		const html = generatePrintPageHTML([label]);
		const printWindow = window.open("", "_blank");
		if (printWindow) {
			printWindow.document.write(html);
			printWindow.document.close();
		}
	};

	const handlePrintBulk = async () => {
		if (selectedIds.size === 0) return;

		setIsLoading(true);
		const selectedItems = items.filter((i) => selectedIds.has(i.id));
		const labels = await generateBulkLabels(selectedItems);
		setIsLoading(false);

		const html = generatePrintPageHTML(labels);
		const printWindow = window.open("", "_blank");
		if (printWindow) {
			printWindow.document.write(html);
			printWindow.document.close();
		}
	};

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={mode === "single" ? "Print Label" : "Print Labels"}
			size={mode === "single" ? "md" : "lg"}
		>
			{mode === "single" ? (
				<div className="space-y-4">
					{isLoading ? (
						<div className="flex items-center justify-center py-8">
							<Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
						</div>
					) : label ? (
						<>
							{/* Label Preview */}
							<div className="border border-slate-700 rounded-lg p-4 bg-white">
								<div className="flex gap-4">
									<div className="flex-1 min-w-0">
										<p className="font-bold text-slate-900 truncate">{label.name}</p>
										{label.sku && (
											<p className="text-xs text-slate-600 font-mono">{label.sku}</p>
										)}
										<p className="text-xs text-slate-500 mt-1">{label.location}</p>
										<p className="text-xs text-slate-400 mt-1">{label.category}</p>
									</div>
									{label.qrDataUrl && (
										<img
											src={label.qrDataUrl}
											alt="QR Code"
											className="w-20 h-20"
										/>
									)}
								</div>
							</div>

							<p className="text-sm text-slate-400">
								Label size: 2" × 1" (standard label sheet)
							</p>

							<div className="flex gap-3">
								<Button variant="secondary" onClick={onClose} className="flex-1">
									Cancel
								</Button>
								<Button onClick={handlePrintSingle} className="flex-1">
									<Printer className="w-4 h-4" />
									Print Label
								</Button>
							</div>
						</>
					) : null}
				</div>
			) : (
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<p className="text-slate-300">
							{selectedIds.size} of {items.length} items selected
						</p>
						<Button variant="ghost" size="sm" onClick={handleSelectAll}>
							{selectedIds.size === items.length ? "Deselect All" : "Select All"}
						</Button>
					</div>

					<div className="border border-slate-800 rounded-lg overflow-hidden max-h-80 overflow-y-auto">
						{items.map((item) => (
							<button
								key={item.id}
								onClick={() => handleToggleItem(item.id)}
								className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${
									selectedIds.has(item.id)
										? "bg-amber-500/10"
										: "hover:bg-slate-800/50"
								}`}
							>
								<div
									className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
										selectedIds.has(item.id)
											? "bg-amber-500 border-amber-500"
											: "border-slate-600"
									}`}
								>
									{selectedIds.has(item.id) && (
										<Check className="w-3 h-3 text-slate-900" />
									)}
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-slate-200 truncate">{item.name}</p>
									<p className="text-xs text-slate-500">
										{item.sku || "No SKU"} • {item.location || "No location"}
									</p>
								</div>
								<Badge variant="slate">{item.category}</Badge>
							</button>
						))}
					</div>

					<div className="flex gap-3">
						<Button variant="secondary" onClick={onClose} className="flex-1">
							Cancel
						</Button>
						<Button
							onClick={handlePrintBulk}
							className="flex-1"
							disabled={selectedIds.size === 0 || isLoading}
						>
							{isLoading ? (
								<Loader2 className="w-4 h-4 animate-spin" />
							) : (
								<Printer className="w-4 h-4" />
							)}
							Print {selectedIds.size} Labels
						</Button>
					</div>
				</div>
			)}
		</Modal>
	);
}

interface ItemQRCodeProps {
	item: InventoryItem;
}

export function ItemQRCode({ item }: ItemQRCodeProps) {
	const [qrUrl, setQrUrl] = useState<string>("");

	useEffect(() => {
		generateItemLabel(item).then((label) => {
			if (label.qrDataUrl) {
				setQrUrl(label.qrDataUrl);
			}
		});
	}, [item]);

	if (!qrUrl) return null;

	return (
		<div className="inline-flex items-center justify-center p-2 bg-white rounded-lg">
			<img src={qrUrl} alt={`QR Code for ${item.name}`} className="w-24 h-24" />
		</div>
	);
}

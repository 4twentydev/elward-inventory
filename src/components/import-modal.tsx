"use client";

import {
	AlertCircle,
	CheckCircle,
	FileSpreadsheet,
	Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { parseCSVFile, parseExcelFile } from "@/lib/import-export";
import type { ImportResult, InventoryItem } from "@/types";
import { useInventory } from "./inventory-context";
import { Button } from "./ui/button";
import { Modal } from "./ui/modal";

interface ImportModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function ImportModal({ isOpen, onClose }: ImportModalProps) {
	const { importItems } = useInventory();
	const [result, setResult] = useState<ImportResult | null>(null);
	const [previewItems, setPreviewItems] = useState<InventoryItem[]>([]);
	const [isDragging, setIsDragging] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFile = async (file: File) => {
		setIsProcessing(true);
		setResult(null);
		setPreviewItems([]);

		try {
			let importResult: ImportResult;

			if (file.name.endsWith(".csv")) {
				const text = await file.text();
				importResult = parseCSVFile(text);
			} else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
				const buffer = await file.arrayBuffer();
				importResult = parseExcelFile(buffer);
			} else {
				setResult({
					success: false,
					imported: 0,
					errors: [
						"Unsupported file type. Please upload .xlsx, .xls, or .csv files.",
					],
				});
				setIsProcessing(false);
				return;
			}

			setResult(importResult);
			if (importResult.items) {
				setPreviewItems(importResult.items.slice(0, 10));
			}
		} catch (e) {
			setResult({
				success: false,
				imported: 0,
				errors: [e instanceof Error ? e.message : "Failed to process file"],
			});
		}
		setIsProcessing(false);
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
		const file = e.dataTransfer.files[0];
		if (file) handleFile(file);
	};

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) handleFile(file);
	};

	const handleConfirmImport = () => {
		if (result?.items) {
			importItems(result.items);
			onClose();
			setResult(null);
			setPreviewItems([]);
		}
	};

	const handleClose = () => {
		onClose();
		setResult(null);
		setPreviewItems([]);
	};

	return (
		<Modal
			isOpen={isOpen}
			onClose={handleClose}
			title="Import Inventory"
			size="lg"
		>
			<div className="space-y-6">
				{!result ? (
					<div
						className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
							isDragging
								? "border-amber-500 bg-amber-500/10"
								: "border-slate-700 hover:border-slate-600"
						}`}
						onDragOver={(e) => {
							e.preventDefault();
							setIsDragging(true);
						}}
						onDragLeave={() => setIsDragging(false)}
						onDrop={handleDrop}
					>
						<input
							ref={fileInputRef}
							type="file"
							accept=".xlsx,.xls,.csv"
							onChange={handleFileSelect}
							className="hidden"
						/>

						<div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-slate-800 mb-4">
							{isProcessing ? (
								<div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
							) : (
								<FileSpreadsheet className="w-7 h-7 text-slate-400" />
							)}
						</div>

						<p className="text-slate-300 mb-2">
							Drop your Excel or CSV file here
						</p>
						<p className="text-sm text-slate-500 mb-4">
							Supports .xlsx, .xls, and .csv files
						</p>

						<Button
							variant="secondary"
							onClick={() => fileInputRef.current?.click()}
							disabled={isProcessing}
						>
							<Upload className="w-4 h-4" />
							Browse Files
						</Button>
					</div>
				) : (
					<div className="space-y-4">
						{result.success ? (
							<div className="flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
								<CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
								<div>
									<p className="font-medium text-emerald-400">
										Ready to import {result.imported} items
									</p>
									{result.errors.length > 0 && (
										<p className="text-sm text-slate-400 mt-1">
											{result.errors.length} rows had issues and were skipped
										</p>
									)}
								</div>
							</div>
						) : (
							<div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg">
								<AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
								<div>
									<p className="font-medium text-rose-400">Import failed</p>
									<ul className="text-sm text-slate-400 mt-1 list-disc list-inside">
										{result.errors.slice(0, 5).map((err, i) => (
											<li key={i}>{err}</li>
										))}
									</ul>
								</div>
							</div>
						)}

						{previewItems.length > 0 && (
							<div>
								<h4 className="text-sm font-medium text-slate-300 mb-2">
									Preview (first {previewItems.length} items)
								</h4>
								<div className="border border-slate-800 rounded-lg overflow-hidden">
									<div className="overflow-x-auto">
										<table className="w-full text-sm">
											<thead>
												<tr className="bg-slate-800/50 text-slate-400">
													<th className="text-left px-4 py-2 font-medium">
														Name
													</th>
													<th className="text-left px-4 py-2 font-medium">
														Category
													</th>
													<th className="text-right px-4 py-2 font-medium">
														Qty
													</th>
													<th className="text-left px-4 py-2 font-medium">
														Location
													</th>
												</tr>
											</thead>
											<tbody className="divide-y divide-slate-800">
												{previewItems.map((item) => (
													<tr key={item.id} className="text-slate-300">
														<td className="px-4 py-2">{item.name}</td>
														<td className="px-4 py-2">{item.category}</td>
														<td className="px-4 py-2 text-right">
															{item.quantity}
														</td>
														<td className="px-4 py-2">{item.location}</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								</div>
								{result.imported > 10 && (
									<p className="text-sm text-slate-500 mt-2">
										...and {result.imported - 10} more items
									</p>
								)}
							</div>
						)}

						<div className="flex gap-3 pt-2">
							<Button
								variant="secondary"
								onClick={handleClose}
								className="flex-1"
							>
								Cancel
							</Button>
							{result.success && (
								<Button onClick={handleConfirmImport} className="flex-1">
									Import {result.imported} Items
								</Button>
							)}
							{!result.success && (
								<Button
									onClick={() => {
										setResult(null);
										setPreviewItems([]);
									}}
									className="flex-1"
								>
									Try Another File
								</Button>
							)}
						</div>
					</div>
				)}

				<div className="border-t border-slate-800 pt-4">
					<h4 className="text-sm font-medium text-slate-300 mb-2">
						Expected column headers
					</h4>
					<p className="text-sm text-slate-500">
						Name (required), Category, Quantity, Location (or Rack/Row/Tent/Rivet Room),
						Supplier, Reorder Level, Notes, SKU, Unit Cost
					</p>
				</div>
			</div>
		</Modal>
	);
}

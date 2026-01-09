"use client";

import { AlertTriangle, CheckCircle, ClipboardCheck } from "lucide-react";
import { useState } from "react";
import type { InventoryItem } from "@/types";
import { useInventory } from "./inventory-context";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Modal } from "./ui/modal";
import { Select } from "./ui/select";

interface CountModalProps {
	isOpen: boolean;
	onClose: () => void;
	item: InventoryItem | null;
}

export function CountModal({ isOpen, onClose, item }: CountModalProps) {
	const { recordCount } = useInventory();
	const [countedQty, setCountedQty] = useState<number | "">("");
	const [countType, setCountType] = useState<"quarterly" | "daily" | "spot">(
		"spot",
	);
	const [notes, setNotes] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!item || countedQty === "") return;

		recordCount(item.id, countedQty, countType, notes);
		onClose();
		setCountedQty("");
		setNotes("");
	};

	if (!item) return null;

	const discrepancy = countedQty !== "" ? countedQty - item.quantity : 0;
	const hasDiscrepancy = countedQty !== "" && discrepancy !== 0;

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Record Count" size="md">
			<form onSubmit={handleSubmit} className="space-y-5">
				<div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg">
					<div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center">
						<ClipboardCheck className="w-6 h-6 text-slate-400" />
					</div>
					<div className="flex-1 min-w-0">
						<h3 className="font-medium text-slate-100 truncate">{item.name}</h3>
						<p className="text-sm text-slate-400">
							System quantity:{" "}
							<span className="font-mono text-slate-200">{item.quantity}</span>
						</p>
					</div>
				</div>

				<div>
					<label className="block text-sm font-medium text-slate-300 mb-1.5">
						Count Type
					</label>
					<Select
						value={countType}
						onChange={(e) =>
							setCountType(e.target.value as "quarterly" | "daily" | "spot")
						}
						selectSize="lg"
					>
						<option value="spot">Spot Check</option>
						<option value="daily">Daily Count</option>
						<option value="quarterly">Quarterly Count</option>
					</Select>
				</div>

				<div>
					<label className="block text-sm font-medium text-slate-300 mb-1.5">
						Physical Count
					</label>
					<Input
						type="number"
						value={countedQty}
						onChange={(e) => {
							const val = e.target.value;
							setCountedQty(val === "" ? "" : Number(val));
						}}
						min={0}
						placeholder="Enter counted quantity"
						className="text-xl font-mono"
						inputSize="lg"
						autoFocus
					/>
				</div>

				{countedQty !== "" && (
					<div
						className={`flex items-start gap-3 p-4 rounded-lg border ${
							hasDiscrepancy
								? "bg-amber-500/10 border-amber-500/20"
								: "bg-emerald-500/10 border-emerald-500/20"
						}`}
					>
						{hasDiscrepancy ? (
							<AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
						) : (
							<CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
						)}
						<div>
							{hasDiscrepancy ? (
								<>
									<p
										className={`font-medium ${
											discrepancy > 0 ? "text-emerald-400" : "text-rose-400"
										}`}
									>
										Discrepancy: {discrepancy > 0 ? "+" : ""}
										{discrepancy}
									</p>
									<p className="text-sm text-slate-400 mt-1">
										System shows {item.quantity}, you counted {countedQty}.
										{discrepancy > 0
											? " More stock than expected."
											: " Less stock than expected."}
									</p>
								</>
							) : (
								<p className="font-medium text-emerald-400">
									Count matches system quantity
								</p>
							)}
						</div>
					</div>
				)}

				<div>
					<label className="block text-sm font-medium text-slate-300 mb-1.5">
						Notes (optional)
					</label>
					<Input
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						placeholder="Add any notes about this count..."
						inputSize="lg"
					/>
				</div>

				<div className="flex gap-3 pt-2">
					<Button
						type="button"
						variant="secondary"
						onClick={onClose}
						className="flex-1"
					>
						Cancel
					</Button>
					<Button type="submit" className="flex-1" disabled={countedQty === ""}>
						<ClipboardCheck className="w-4 h-4" />
						Save Count
					</Button>
				</div>
			</form>
		</Modal>
	);
}

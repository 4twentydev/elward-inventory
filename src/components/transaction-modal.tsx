"use client";

import { useState } from "react";
import { Modal } from "./ui/modal";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useInventory } from "./inventory-context";
import { Minus, Plus, Package } from "lucide-react";
import type { InventoryItem } from "@/types";

interface TransactionModalProps {
	isOpen: boolean;
	onClose: () => void;
	item: InventoryItem | null;
	type: "pull" | "return";
}

export function TransactionModal({ isOpen, onClose, item, type }: TransactionModalProps) {
	const { pullItem, returnItem } = useInventory();
	const [quantity, setQuantity] = useState(1);
	const [jobRef, setJobRef] = useState("");
	const [notes, setNotes] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!item) return;

		if (type === "pull") {
			pullItem(item.id, quantity, jobRef, notes);
		} else {
			returnItem(item.id, quantity, jobRef, notes);
		}

		onClose();
		setQuantity(1);
		setJobRef("");
		setNotes("");
	};

	const handleQuickAdjust = (delta: number) => {
		setQuantity((q) => Math.max(1, q + delta));
	};

	if (!item) return null;

	const isPull = type === "pull";
	const maxQty = isPull ? item.quantity : 9999;

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={isPull ? "Pull from Inventory" : "Return to Inventory"}
			size="md"
		>
			<form onSubmit={handleSubmit} className="space-y-5">
				<div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg">
					<div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center">
						<Package className="w-6 h-6 text-slate-400" />
					</div>
					<div className="flex-1 min-w-0">
						<h3 className="font-medium text-slate-100 truncate">{item.name}</h3>
						<p className="text-sm text-slate-400">
							Current stock: <span className="font-mono">{item.quantity}</span>
							{item.location && ` • ${item.location}`}
						</p>
					</div>
				</div>

				<div>
					<label className="block text-sm font-medium text-slate-300 mb-3">
						Quantity to {isPull ? "Pull" : "Return"}
					</label>
					<div className="flex items-center gap-3">
						<button
							type="button"
							onClick={() => handleQuickAdjust(-10)}
							className="btn btn-secondary px-3"
							disabled={quantity <= 10}
						>
							-10
						</button>
						<button
							type="button"
							onClick={() => handleQuickAdjust(-1)}
							className="btn btn-secondary px-3"
							disabled={quantity <= 1}
						>
							<Minus className="w-4 h-4" />
						</button>
						<Input
							type="number"
							value={quantity}
							onChange={(e) => {
								const val = Math.max(1, Math.min(maxQty, Number(e.target.value)));
								setQuantity(val);
							}}
							min={1}
							max={maxQty}
							className="text-center text-xl font-mono flex-1"
							inputSize="lg"
						/>
						<button
							type="button"
							onClick={() => handleQuickAdjust(1)}
							className="btn btn-secondary px-3"
							disabled={isPull && quantity >= maxQty}
						>
							<Plus className="w-4 h-4" />
						</button>
						<button
							type="button"
							onClick={() => handleQuickAdjust(10)}
							className="btn btn-secondary px-3"
							disabled={isPull && quantity + 10 > maxQty}
						>
							+10
						</button>
					</div>
					{isPull && quantity > item.quantity && (
						<p className="text-rose-400 text-sm mt-2">
							Cannot pull more than available stock
						</p>
					)}
				</div>

				<div>
					<label className="block text-sm font-medium text-slate-300 mb-1.5">
						Job / Project Reference
					</label>
					<Input
						value={jobRef}
						onChange={(e) => setJobRef(e.target.value)}
						placeholder="e.g., JOB-2024-001"
						inputSize="lg"
					/>
				</div>

				<div>
					<label className="block text-sm font-medium text-slate-300 mb-1.5">
						Notes (optional)
					</label>
					<Input
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						placeholder="Add any additional notes..."
						inputSize="lg"
					/>
				</div>

				<div className="bg-slate-800/50 rounded-lg p-4">
					<div className="flex justify-between text-sm">
						<span className="text-slate-400">Current Stock</span>
						<span className="font-mono text-slate-200">{item.quantity}</span>
					</div>
					<div className="flex justify-between text-sm mt-2">
						<span className="text-slate-400">{isPull ? "After Pull" : "After Return"}</span>
						<span
							className={`font-mono ${
								isPull ? "text-rose-400" : "text-emerald-400"
							}`}
						>
							{isPull ? item.quantity - quantity : item.quantity + quantity}
						</span>
					</div>
				</div>

				<div className="flex gap-3 pt-2">
					<Button type="button" variant="secondary" onClick={onClose} className="flex-1">
						Cancel
					</Button>
					<Button
						type="submit"
						className="flex-1"
						disabled={isPull && quantity > item.quantity}
					>
						{isPull ? (
							<>
								<Minus className="w-4 h-4" />
								Pull {quantity}
							</>
						) : (
							<>
								<Plus className="w-4 h-4" />
								Return {quantity}
							</>
						)}
					</Button>
				</div>
			</form>
		</Modal>
	);
}

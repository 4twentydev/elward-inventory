"use client";

import { ArrowRightLeft, Package } from "lucide-react";
import { useState } from "react";
import type { InventoryItem } from "@/types";
import { useInventory } from "./inventory-context";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Modal } from "./ui/modal";

interface TransferModalProps {
	isOpen: boolean;
	onClose: () => void;
	item: InventoryItem | null;
}

export function TransferModal({ isOpen, onClose, item }: TransferModalProps) {
	const { transferItem } = useInventory();
	const [quantity, setQuantity] = useState(1);
	const [toLocation, setToLocation] = useState("");
	const [notes, setNotes] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!item || !toLocation.trim()) return;

		transferItem(item.id, quantity, item.location, toLocation, notes);

		onClose();
		setQuantity(1);
		setToLocation("");
		setNotes("");
	};

	if (!item) return null;

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title="Transfer Material"
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
					<label className="block text-sm font-medium text-slate-300 mb-1.5">
						Quantity to Transfer
					</label>
					<Input
						type="number"
						value={quantity}
						onChange={(e) => {
							const val = Math.max(
								1,
								Math.min(item.quantity, Number(e.target.value)),
							);
							setQuantity(val);
						}}
						min={1}
						max={item.quantity}
						className="text-center text-xl font-mono"
						inputSize="lg"
					/>
					<p className="text-slate-400 text-sm mt-1.5">
						Transferring materials from one location to another
					</p>
				</div>

				<div className="bg-slate-800/50 rounded-lg p-4">
					<div className="space-y-3">
						<div>
							<span className="text-sm text-slate-400">From Location</span>
							<div className="text-slate-200 font-medium mt-1">
								{item.location || "No location set"}
							</div>
						</div>
						<div className="flex items-center justify-center">
							<ArrowRightLeft className="w-5 h-5 text-amber-500" />
						</div>
						<div>
							<label className="block text-sm text-slate-400 mb-2">
								To Location
							</label>
							<Input
								value={toLocation}
								onChange={(e) => setToLocation(e.target.value)}
								placeholder="e.g., Bin A-12, Warehouse 2"
								required
								inputSize="lg"
							/>
						</div>
					</div>
				</div>

				<div>
					<label className="block text-sm font-medium text-slate-300 mb-1.5">
						Notes (optional)
					</label>
					<Input
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						placeholder="Reason for transfer..."
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
					<Button
						type="submit"
						className="flex-1"
						disabled={!toLocation.trim()}
					>
						<ArrowRightLeft className="w-4 h-4" />
						Transfer
					</Button>
				</div>
			</form>
		</Modal>
	);
}

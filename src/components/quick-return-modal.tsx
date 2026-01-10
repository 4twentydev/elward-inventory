"use client";

import {
	ArrowLeft,
	Cog,
	Minus,
	Package,
	Plus,
	Truck,
	Undo2,
} from "lucide-react";
import { useState } from "react";
import type { InventoryItem } from "@/types";
import { useInventory } from "./inventory-context";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Modal } from "./ui/modal";

interface QuickReturnModalProps {
	isOpen: boolean;
	onClose: () => void;
	item: InventoryItem | null;
}

type SourceLocation = "CNC" | "ELU" | "Shipping";

const sourceLocations: Array<{
	id: SourceLocation;
	label: string;
	icon: React.ComponentType<{ className?: string }>;
	color: string;
	bgColor: string;
}> = [
	{
		id: "CNC",
		label: "CNC Machine",
		icon: Cog,
		color: "text-blue-400",
		bgColor: "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30",
	},
	{
		id: "ELU",
		label: "ELU",
		icon: Package,
		color: "text-purple-400",
		bgColor: "bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30",
	},
	{
		id: "Shipping",
		label: "Shipping",
		icon: Truck,
		color: "text-amber-400",
		bgColor: "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30",
	},
];

export function QuickReturnModal({
	isOpen,
	onClose,
	item,
}: QuickReturnModalProps) {
	const { returnItem, transferItem } = useInventory();
	const [quantity, setQuantity] = useState(1);
	const [jobRef, setJobRef] = useState("");
	const [notes, setNotes] = useState("");
	const [showDetails, setShowDetails] = useState(false);

	const handleQuickAdjust = (delta: number) => {
		setQuantity((q) => Math.max(1, q + delta));
	};

	const handleSourceClick = (source: SourceLocation) => {
		if (!item) return;

		const fromLocation = source;
		const toLocation = item.location || "Stock";

		// Return to stock (increase quantity)
		returnItem(item.id, quantity, jobRef || `Return from ${source}`, notes);

		// Also create transfer record
		transferItem(item.id, quantity, fromLocation, toLocation, notes);

		// Reset and close
		onClose();
		resetForm();
	};

	const resetForm = () => {
		setQuantity(1);
		setJobRef("");
		setNotes("");
		setShowDetails(false);
	};

	if (!item) return null;

	return (
		<Modal
			isOpen={isOpen}
			onClose={() => {
				onClose();
				resetForm();
			}}
			title="Quick Return to Stock"
			size="lg"
		>
			<div className="space-y-5">
				{/* Item Info */}
				<div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg">
					<div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center">
						<Package className="w-6 h-6 text-slate-400" />
					</div>
					<div className="flex-1 min-w-0">
						<h3 className="font-medium text-slate-100 truncate">{item.name}</h3>
						<p className="text-sm text-slate-400">
							Current stock:{" "}
							<span className="font-mono font-semibold">{item.quantity}</span>
							{item.location && ` • ${item.location}`}
						</p>
					</div>
				</div>

				{/* Info Banner */}
				<div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
					<p className="text-sm text-emerald-300">
						<Undo2 className="w-4 h-4 inline mr-2" />
						Returning unused materials back to stock
					</p>
				</div>

				{/* Quantity Selector */}
				<div>
					<label className="block text-sm font-medium text-slate-300 mb-3">
						Quantity to Return
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
								const val = Math.max(1, Number(e.target.value));
								setQuantity(val);
							}}
							min={1}
							className="text-center text-xl font-mono flex-1"
							inputSize="lg"
						/>
						<button
							type="button"
							onClick={() => handleQuickAdjust(1)}
							className="btn btn-secondary px-3"
						>
							<Plus className="w-4 h-4" />
						</button>
						<button
							type="button"
							onClick={() => handleQuickAdjust(10)}
							className="btn btn-secondary px-3"
						>
							+10
						</button>
					</div>
				</div>

				{/* Source Location Buttons */}
				<div>
					<label className="block text-sm font-medium text-slate-300 mb-3">
						Return From
					</label>
					<div className="grid grid-cols-3 gap-3">
						{sourceLocations.map((source) => {
							const Icon = source.icon;
							return (
								<button
									key={source.id}
									type="button"
									onClick={() => handleSourceClick(source.id)}
									className={`
										relative flex flex-col items-center justify-center gap-3 p-6
										rounded-lg border-2 transition-all
										${source.bgColor}
										active:scale-95
									`}
								>
									<Icon className={`w-8 h-8 ${source.color}`} />
									<div className="text-center">
										<div className={`font-semibold ${source.color}`}>
											{source.label}
										</div>
										<div className="text-xs text-slate-400 mt-1">
											Return {quantity}
										</div>
									</div>
									<ArrowLeft className="w-4 h-4 text-slate-500 absolute bottom-2 right-2" />
								</button>
							);
						})}
					</div>
				</div>

				{/* Optional Details Toggle */}
				<button
					type="button"
					onClick={() => setShowDetails(!showDetails)}
					className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
				>
					{showDetails ? "Hide" : "Add"} job reference or notes
				</button>

				{/* Optional Details */}
				{showDetails && (
					<div className="space-y-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700">
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
								Notes
							</label>
							<Input
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								placeholder="Why are these materials being returned?"
								inputSize="lg"
							/>
						</div>
					</div>
				)}

				{/* Stock Preview */}
				<div className="bg-slate-800/50 rounded-lg p-4">
					<div className="flex justify-between text-sm">
						<span className="text-slate-400">Current Stock</span>
						<span className="font-mono text-slate-200">{item.quantity}</span>
					</div>
					<div className="flex justify-between text-sm mt-2">
						<span className="text-slate-400">After Return</span>
						<span className="font-mono text-emerald-400">
							{item.quantity + quantity}
						</span>
					</div>
				</div>

				{/* Cancel Button */}
				<Button
					type="button"
					variant="secondary"
					onClick={() => {
						onClose();
						resetForm();
					}}
					className="w-full"
				>
					Cancel
				</Button>
			</div>
		</Modal>
	);
}

"use client";

import {
	ArrowRight,
	Cog,
	Minus,
	Package,
	Plus,
	Ship,
	Truck,
} from "lucide-react";
import { useState } from "react";
import type { InventoryItem } from "@/types";
import { useInventory } from "./inventory-context";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Modal } from "./ui/modal";

interface QuickTransferModalProps {
	isOpen: boolean;
	onClose: () => void;
	item: InventoryItem | null;
}

type Destination = "CNC" | "ELU" | "Shipping";

const destinations: Array<{
	id: Destination;
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

export function QuickTransferModal({
	isOpen,
	onClose,
	item,
}: QuickTransferModalProps) {
	const { pullItem, returnItem, transferItem } = useInventory();
	const [quantity, setQuantity] = useState(1);
	const [selectedDestination, setSelectedDestination] =
		useState<Destination | null>(null);
	const [jobRef, setJobRef] = useState("");
	const [notes, setNotes] = useState("");
	const [showDetails, setShowDetails] = useState(false);

	const handleQuickAdjust = (delta: number) => {
		if (!item) return;
		setQuantity((q) => Math.max(1, Math.min(item.quantity, q + delta)));
	};

	const handleDestinationClick = (dest: Destination) => {
		if (!item) return;

		// Quick transfer without additional details
		const fromLocation = item.location || "Stock";
		const toLocation = dest;

		// Pull from stock and record transfer
		pullItem(item.id, quantity, jobRef || `Transfer to ${dest}`, notes);

		// Also create transfer record
		transferItem(item.id, quantity, fromLocation, toLocation, notes);

		// Reset and close
		onClose();
		resetForm();
	};

	const resetForm = () => {
		setQuantity(1);
		setSelectedDestination(null);
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
			title="Quick Transfer"
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
							Available:{" "}
							<span className="font-mono font-semibold">{item.quantity}</span>
							{item.location && ` • ${item.location}`}
						</p>
					</div>
				</div>

				{/* Quantity Selector */}
				<div>
					<label className="block text-sm font-medium text-slate-300 mb-3">
						Quantity to Transfer
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
								const val = Math.max(
									1,
									Math.min(item.quantity, Number(e.target.value)),
								);
								setQuantity(val);
							}}
							min={1}
							max={item.quantity}
							className="text-center text-xl font-mono flex-1"
							inputSize="lg"
						/>
						<button
							type="button"
							onClick={() => handleQuickAdjust(1)}
							className="btn btn-secondary px-3"
							disabled={quantity >= item.quantity}
						>
							<Plus className="w-4 h-4" />
						</button>
						<button
							type="button"
							onClick={() => handleQuickAdjust(10)}
							className="btn btn-secondary px-3"
							disabled={quantity + 10 > item.quantity}
						>
							+10
						</button>
					</div>
				</div>

				{/* Destination Buttons */}
				<div>
					<label className="block text-sm font-medium text-slate-300 mb-3">
						Select Destination
					</label>
					<div className="grid grid-cols-3 gap-3">
						{destinations.map((dest) => {
							const Icon = dest.icon;
							return (
								<button
									key={dest.id}
									type="button"
									onClick={() => handleDestinationClick(dest.id)}
									disabled={quantity > item.quantity}
									className={`
										relative flex flex-col items-center justify-center gap-3 p-6
										rounded-lg border-2 transition-all
										${dest.bgColor}
										disabled:opacity-50 disabled:cursor-not-allowed
										active:scale-95
									`}
								>
									<Icon className={`w-8 h-8 ${dest.color}`} />
									<div className="text-center">
										<div className={`font-semibold ${dest.color}`}>
											{dest.label}
										</div>
										<div className="text-xs text-slate-400 mt-1">
											Transfer {quantity}
										</div>
									</div>
									<ArrowRight className="w-4 h-4 text-slate-500 absolute bottom-2 right-2" />
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
								placeholder="Add any additional notes..."
								inputSize="lg"
							/>
						</div>
					</div>
				)}

				{/* Info Message */}
				<div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
					<p className="text-sm text-blue-300">
						<Ship className="w-4 h-4 inline mr-2" />
						Click a destination to instantly transfer {quantity}{" "}
						{quantity === 1 ? "unit" : "units"}
					</p>
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

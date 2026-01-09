"use client";

import { useEffect, useState } from "react";
import type { InventoryItem, ItemCategory } from "@/types";
import { useInventory } from "./inventory-context";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Modal } from "./ui/modal";
import { Select } from "./ui/select";
import { useInventory } from "./inventory-context";
import type { InventoryItem, ItemCategory } from "@/types";
import {
	getLocationTermCapitalized,
	getLocationPlaceholder,
} from "@/lib/location-terminology";

interface ItemFormModalProps {
	isOpen: boolean;
	onClose: () => void;
	item?: InventoryItem | null;
}

const CATEGORIES: ItemCategory[] = [
	"ACM",
	"SwissPearl",
	"Trespa",
	"Extrusions",
	"Tools",
	"Hardware",
	"Other",
];

export function ItemFormModal({ isOpen, onClose, item }: ItemFormModalProps) {
	const { addItem, updateItem } = useInventory();
	const [formData, setFormData] = useState({
		name: "",
		category: "Other" as ItemCategory,
		quantity: 0,
		location: "",
		supplier: "",
		reorderLevel: 0,
		notes: "",
		sku: "",
		unitCost: 0,
	});

	useEffect(() => {
		if (item) {
			setFormData({
				name: item.name,
				category: item.category,
				quantity: item.quantity,
				location: item.location,
				supplier: item.supplier,
				reorderLevel: item.reorderLevel,
				notes: item.notes,
				sku: item.sku || "",
				unitCost: item.unitCost || 0,
			});
		} else {
			setFormData({
				name: "",
				category: "Other",
				quantity: 0,
				location: "",
				supplier: "",
				reorderLevel: 0,
				notes: "",
				sku: "",
				unitCost: 0,
			});
		}
	}, [item, isOpen]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (item) {
			updateItem(item.id, {
				...formData,
				unitCost: formData.unitCost || undefined,
				sku: formData.sku || undefined,
			});
		} else {
			const newItem: InventoryItem = {
				id: crypto.randomUUID(),
				...formData,
				unitCost: formData.unitCost || undefined,
				sku: formData.sku || undefined,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};
			addItem(newItem);
		}

		onClose();
	};

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={item ? "Edit Item" : "Add New Item"}
			size="lg"
		>
			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="md:col-span-2">
						<label className="block text-sm font-medium text-slate-300 mb-1.5">
							Item Name *
						</label>
						<Input
							value={formData.name}
							onChange={(e) =>
								setFormData({ ...formData, name: e.target.value })
							}
							placeholder="Enter item name"
							required
							inputSize="lg"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-slate-300 mb-1.5">
							Category
						</label>
						<Select
							value={formData.category}
							onChange={(e) =>
								setFormData({
									...formData,
									category: e.target.value as ItemCategory,
								})
							}
							selectSize="lg"
						>
							{CATEGORIES.map((cat) => (
								<option key={cat} value={cat}>
									{cat}
								</option>
							))}
						</Select>
					</div>

					<div>
						<label className="block text-sm font-medium text-slate-300 mb-1.5">
							Quantity
						</label>
						<Input
							type="number"
							value={formData.quantity}
							onChange={(e) =>
								setFormData({ ...formData, quantity: Number(e.target.value) })
							}
							min={0}
							inputSize="lg"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-slate-300 mb-1.5">
							{getLocationTermCapitalized(formData.category)}
						</label>
						<Input
							value={formData.location}
							onChange={(e) => setFormData({ ...formData, location: e.target.value })}
							placeholder={getLocationPlaceholder(formData.category)}
							inputSize="lg"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-slate-300 mb-1.5">
							Supplier
						</label>
						<Input
							value={formData.supplier}
							onChange={(e) =>
								setFormData({ ...formData, supplier: e.target.value })
							}
							placeholder="Supplier name"
							inputSize="lg"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-slate-300 mb-1.5">
							Reorder Level
						</label>
						<Input
							type="number"
							value={formData.reorderLevel}
							onChange={(e) =>
								setFormData({
									...formData,
									reorderLevel: Number(e.target.value),
								})
							}
							min={0}
							inputSize="lg"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-slate-300 mb-1.5">
							SKU / Part Number
						</label>
						<Input
							value={formData.sku}
							onChange={(e) =>
								setFormData({ ...formData, sku: e.target.value })
							}
							placeholder="Optional"
							inputSize="lg"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-slate-300 mb-1.5">
							Unit Cost ($)
						</label>
						<Input
							type="number"
							step="0.01"
							value={formData.unitCost || ""}
							onChange={(e) =>
								setFormData({ ...formData, unitCost: Number(e.target.value) })
							}
							placeholder="0.00"
							inputSize="lg"
						/>
					</div>

					<div className="md:col-span-2">
						<label className="block text-sm font-medium text-slate-300 mb-1.5">
							Notes
						</label>
						<textarea
							value={formData.notes}
							onChange={(e) =>
								setFormData({ ...formData, notes: e.target.value })
							}
							placeholder="Additional notes..."
							rows={3}
							className="input resize-none"
						/>
					</div>
				</div>

				<div className="flex gap-3 pt-4">
					<Button
						type="button"
						variant="secondary"
						onClick={onClose}
						className="flex-1"
					>
						Cancel
					</Button>
					<Button type="submit" className="flex-1">
						{item ? "Save Changes" : "Add Item"}
					</Button>
				</div>
			</form>
		</Modal>
	);
}

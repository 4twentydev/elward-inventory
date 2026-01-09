"use client";

import {
	AlertTriangle,
	ArrowLeft,
	BarChart3,
	Check,
	CheckCircle2,
	ChevronRight,
	ClipboardCheck,
	Clock,
	Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { InventoryItem, ItemCategory } from "@/types";
import { useInventory } from "./inventory-context";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Modal } from "./ui/modal";
import { Select } from "./ui/select";

interface CountModeProps {
	isOpen: boolean;
	onClose: () => void;
}

interface CountedItem {
	itemId: string;
	countedQty: number;
	systemQty: number;
	discrepancy: number;
	countedAt: string;
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

export function QuarterlyCountMode({ isOpen, onClose }: CountModeProps) {
	const { items, recordCount, currentUser } = useInventory();

	const [sessionName, setSessionName] = useState(
		`Q${Math.ceil((new Date().getMonth() + 1) / 3)} ${new Date().getFullYear()} Count`,
	);
	const [countType, setCountType] = useState<"quarterly" | "daily" | "spot">(
		"quarterly",
	);
	const [isStarted, setIsStarted] = useState(false);
	const [countedItems, setCountedItems] = useState<Map<string, CountedItem>>(
		new Map(),
	);

	const [currentItemIndex, setCurrentItemIndex] = useState(0);
	const [categoryFilter, setCategoryFilter] = useState<ItemCategory | "all">(
		"all",
	);
	const [searchQuery, setSearchQuery] = useState("");
	const [countInput, setCountInput] = useState<number | "">("");
	const [showSummary, setShowSummary] = useState(false);

	const filteredItems = useMemo(() => {
		let result = items;
		if (categoryFilter !== "all") {
			result = result.filter((item) => item.category === categoryFilter);
		}
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				(item) =>
					item.name.toLowerCase().includes(query) ||
					item.location.toLowerCase().includes(query),
			);
		}
		return result;
	}, [items, categoryFilter, searchQuery]);

	const currentItem = filteredItems[currentItemIndex] || null;

	const stats = useMemo(() => {
		const counted = countedItems.size;
		const total = filteredItems.length;
		const discrepancies = Array.from(countedItems.values()).filter(
			(c) => c.discrepancy !== 0,
		).length;
		const surplus = Array.from(countedItems.values())
			.filter((c) => c.discrepancy > 0)
			.reduce((sum, c) => sum + c.discrepancy, 0);
		const shortage = Array.from(countedItems.values())
			.filter((c) => c.discrepancy < 0)
			.reduce((sum, c) => sum + Math.abs(c.discrepancy), 0);

		return { counted, total, discrepancies, surplus, shortage };
	}, [countedItems, filteredItems]);

	const handleStartCount = () => {
		setIsStarted(true);
		setCountedItems(new Map());
		setCurrentItemIndex(0);
		setCountInput("");
	};

	const handleCountSubmit = () => {
		if (!currentItem || countInput === "") return;

		const counted: CountedItem = {
			itemId: currentItem.id,
			countedQty: countInput,
			systemQty: currentItem.quantity,
			discrepancy: countInput - currentItem.quantity,
			countedAt: new Date().toISOString(),
		};

		setCountedItems((prev) => new Map(prev).set(currentItem.id, counted));

		// Move to next uncounted item
		const nextIndex = findNextUncountedIndex(currentItemIndex + 1);
		if (nextIndex !== -1) {
			setCurrentItemIndex(nextIndex);
			setCountInput("");
		} else {
			setShowSummary(true);
		}
	};

	const findNextUncountedIndex = (startFrom: number): number => {
		for (let i = startFrom; i < filteredItems.length; i++) {
			if (!countedItems.has(filteredItems[i].id)) {
				return i;
			}
		}
		// Wrap around
		for (let i = 0; i < startFrom; i++) {
			if (!countedItems.has(filteredItems[i].id)) {
				return i;
			}
		}
		return -1;
	};

	const handleSkip = () => {
		const nextIndex = findNextUncountedIndex(currentItemIndex + 1);
		if (nextIndex !== -1 && nextIndex !== currentItemIndex) {
			setCurrentItemIndex(nextIndex);
			setCountInput("");
		}
	};

	const handleSaveAll = () => {
		for (const [itemId, counted] of countedItems) {
			recordCount(
				itemId,
				counted.countedQty,
				countType,
				`${sessionName} - Batch count`,
			);
		}
		handleClose();
	};

	const handleClose = () => {
		setIsStarted(false);
		setCountedItems(new Map());
		setCurrentItemIndex(0);
		setCountInput("");
		setShowSummary(false);
		setSearchQuery("");
		setCategoryFilter("all");
		onClose();
	};

	const isItemCounted = (itemId: string) => countedItems.has(itemId);
	const getItemCount = (itemId: string) => countedItems.get(itemId);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 bg-slate-950 overflow-hidden flex flex-col">
			{/* Header */}
			<header className="bg-slate-900 border-b border-slate-800 px-4 py-3 shrink-0">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<button
							onClick={handleClose}
							className="p-2 rounded-lg hover:bg-slate-800 text-slate-400"
						>
							<ArrowLeft className="w-5 h-5" />
						</button>
						<div>
							<h1 className="font-semibold text-slate-100">
								{isStarted ? sessionName : "Start Count Session"}
							</h1>
							{isStarted && (
								<p className="text-xs text-slate-500">
									{stats.counted} of {stats.total} items counted
								</p>
							)}
						</div>
					</div>
					{isStarted && (
						<Button
							variant="secondary"
							size="sm"
							onClick={() => setShowSummary(true)}
						>
							<BarChart3 className="w-4 h-4" />
							Summary
						</Button>
					)}
				</div>

				{/* Progress bar */}
				{isStarted && (
					<div className="mt-3 h-2 bg-slate-800 rounded-full overflow-hidden">
						<div
							className="h-full bg-amber-500 transition-all duration-300"
							style={{
								width: `${stats.total > 0 ? (stats.counted / stats.total) * 100 : 0}%`,
							}}
						/>
					</div>
				)}
			</header>

			{!isStarted ? (
				/* Setup Screen */
				<div className="flex-1 overflow-auto p-4">
					<Card className="max-w-md mx-auto p-6">
						<div className="text-center mb-6">
							<div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/20 mb-4">
								<ClipboardCheck className="w-8 h-8 text-amber-500" />
							</div>
							<h2 className="text-xl font-semibold text-slate-100">
								Inventory Count Session
							</h2>
							<p className="text-slate-400 mt-1">
								Count items one by one with guided workflow
							</p>
						</div>

						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-slate-300 mb-1.5">
									Session Name
								</label>
								<Input
									value={sessionName}
									onChange={(e) => setSessionName(e.target.value)}
									placeholder="e.g., Q1 2025 Count"
									inputSize="lg"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-slate-300 mb-1.5">
									Count Type
								</label>
								<Select
									value={countType}
									onChange={(e) =>
										setCountType(
											e.target.value as "quarterly" | "daily" | "spot",
										)
									}
									selectSize="lg"
								>
									<option value="quarterly">Quarterly Count</option>
									<option value="daily">Daily Count</option>
									<option value="spot">Spot Check</option>
								</Select>
							</div>

							<div>
								<label className="block text-sm font-medium text-slate-300 mb-1.5">
									Filter by Category (optional)
								</label>
								<Select
									value={categoryFilter}
									onChange={(e) =>
										setCategoryFilter(e.target.value as ItemCategory | "all")
									}
									selectSize="lg"
								>
									<option value="all">
										All Categories ({items.length} items)
									</option>
									{CATEGORIES.map((cat) => {
										const count = items.filter(
											(i) => i.category === cat,
										).length;
										return (
											<option key={cat} value={cat}>
												{cat} ({count} items)
											</option>
										);
									})}
								</Select>
							</div>

							<Button onClick={handleStartCount} className="w-full" size="lg">
								Start Counting
							</Button>
						</div>
					</Card>
				</div>
			) : showSummary ? (
				/* Summary Screen */
				<div className="flex-1 overflow-auto p-4">
					<div className="max-w-2xl mx-auto space-y-4">
						<Card className="p-6">
							<h2 className="text-lg font-semibold text-slate-100 mb-4">
								Count Summary
							</h2>

							<div className="grid grid-cols-2 gap-4 mb-6">
								<div className="p-4 bg-slate-800/50 rounded-lg">
									<p className="text-sm text-slate-400">Items Counted</p>
									<p className="text-2xl font-mono font-bold text-slate-100">
										{stats.counted}
										<span className="text-slate-500 text-base">
											/{stats.total}
										</span>
									</p>
								</div>
								<div className="p-4 bg-slate-800/50 rounded-lg">
									<p className="text-sm text-slate-400">Discrepancies</p>
									<p
										className={`text-2xl font-mono font-bold ${
											stats.discrepancies > 0
												? "text-amber-400"
												: "text-emerald-400"
										}`}
									>
										{stats.discrepancies}
									</p>
								</div>
								<div className="p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
									<p className="text-sm text-emerald-400">Surplus</p>
									<p className="text-2xl font-mono font-bold text-emerald-400">
										+{stats.surplus}
									</p>
								</div>
								<div className="p-4 bg-rose-500/10 rounded-lg border border-rose-500/20">
									<p className="text-sm text-rose-400">Shortage</p>
									<p className="text-2xl font-mono font-bold text-rose-400">
										-{stats.shortage}
									</p>
								</div>
							</div>

							{stats.discrepancies > 0 && (
								<div className="mb-6">
									<h3 className="text-sm font-medium text-slate-300 mb-2">
										Items with Discrepancies
									</h3>
									<div className="space-y-2 max-h-48 overflow-y-auto">
										{Array.from(countedItems.values())
											.filter((c) => c.discrepancy !== 0)
											.map((counted) => {
												const item = items.find((i) => i.id === counted.itemId);
												return (
													<div
														key={counted.itemId}
														className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
													>
														<span className="text-slate-200 truncate">
															{item?.name}
														</span>
														<span
															className={`font-mono ${
																counted.discrepancy > 0
																	? "text-emerald-400"
																	: "text-rose-400"
															}`}
														>
															{counted.discrepancy > 0 ? "+" : ""}
															{counted.discrepancy}
														</span>
													</div>
												);
											})}
									</div>
								</div>
							)}

							<div className="flex gap-3">
								<Button
									variant="secondary"
									onClick={() => setShowSummary(false)}
									className="flex-1"
								>
									Continue Counting
								</Button>
								<Button onClick={handleSaveAll} className="flex-1">
									<Check className="w-4 h-4" />
									Save All Counts
								</Button>
							</div>
						</Card>

						{/* Item List */}
						<Card className="p-4">
							<h3 className="text-sm font-medium text-slate-300 mb-3">
								All Items
							</h3>
							<div className="space-y-1 max-h-64 overflow-y-auto">
								{filteredItems.map((item) => {
									const counted = getItemCount(item.id);
									return (
										<button
											key={item.id}
											onClick={() => {
												const idx = filteredItems.indexOf(item);
												setCurrentItemIndex(idx);
												setCountInput(counted?.countedQty ?? "");
												setShowSummary(false);
											}}
											className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 text-left transition-colors"
										>
											{counted ? (
												<CheckCircle2
													className={`w-5 h-5 shrink-0 ${
														counted.discrepancy === 0
															? "text-emerald-400"
															: "text-amber-400"
													}`}
												/>
											) : (
												<div className="w-5 h-5 rounded-full border-2 border-slate-600 shrink-0" />
											)}
											<div className="flex-1 min-w-0">
												<p className="text-slate-200 truncate">{item.name}</p>
												<p className="text-xs text-slate-500">
													{item.location}
												</p>
											</div>
											{counted && (
												<span
													className={`font-mono text-sm ${
														counted.discrepancy === 0
															? "text-slate-400"
															: counted.discrepancy > 0
																? "text-emerald-400"
																: "text-rose-400"
													}`}
												>
													{counted.countedQty}
													{counted.discrepancy !== 0 && (
														<span className="ml-1">
															({counted.discrepancy > 0 ? "+" : ""}
															{counted.discrepancy})
														</span>
													)}
												</span>
											)}
										</button>
									);
								})}
							</div>
						</Card>
					</div>
				</div>
			) : (
				/* Counting Screen */
				<div className="flex-1 overflow-auto">
					{/* Search bar */}
					<div className="px-4 py-3 border-b border-slate-800">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
							<Input
								value={searchQuery}
								onChange={(e) => {
									setSearchQuery(e.target.value);
									setCurrentItemIndex(0);
								}}
								placeholder="Search items..."
								className="pl-10"
							/>
						</div>
					</div>

					{currentItem ? (
						<div className="p-4">
							{/* Current Item Card */}
							<Card className="p-6 mb-4">
								<div className="flex items-start justify-between mb-4">
									<div>
										<Badge variant="slate" className="mb-2">
											{currentItem.category}
										</Badge>
										<h2 className="text-xl font-semibold text-slate-100">
											{currentItem.name}
										</h2>
										{currentItem.location && (
											<p className="text-slate-400 mt-1">
												📍 {currentItem.location}
											</p>
										)}
									</div>
									{isItemCounted(currentItem.id) && (
										<Badge variant="emerald">
											<Check className="w-3 h-3" />
											Counted
										</Badge>
									)}
								</div>

								<div className="grid grid-cols-2 gap-4 mb-6">
									<div className="p-3 bg-slate-800/50 rounded-lg">
										<p className="text-sm text-slate-400">System Quantity</p>
										<p className="text-2xl font-mono font-bold text-slate-100">
											{currentItem.quantity}
										</p>
									</div>
									<div className="p-3 bg-slate-800/50 rounded-lg">
										<p className="text-sm text-slate-400">Your Count</p>
										<p
											className={`text-2xl font-mono font-bold ${
												countInput === ""
													? "text-slate-500"
													: countInput === currentItem.quantity
														? "text-emerald-400"
														: "text-amber-400"
											}`}
										>
											{countInput === "" ? "—" : countInput}
										</p>
									</div>
								</div>

								{/* Count Input */}
								<div className="space-y-4">
									<Input
										type="number"
										value={countInput}
										onChange={(e) =>
											setCountInput(
												e.target.value === "" ? "" : Number(e.target.value),
											)
										}
										min={0}
										placeholder="Enter count"
										className="text-2xl font-mono text-center"
										inputSize="lg"
										autoFocus
									/>

									{countInput !== "" && countInput !== currentItem.quantity && (
										<div
											className={`flex items-center gap-2 p-3 rounded-lg ${
												countInput > currentItem.quantity
													? "bg-emerald-500/10 border border-emerald-500/20"
													: "bg-rose-500/10 border border-rose-500/20"
											}`}
										>
											<AlertTriangle
												className={`w-4 h-4 ${
													countInput > currentItem.quantity
														? "text-emerald-400"
														: "text-rose-400"
												}`}
											/>
											<span
												className={
													countInput > currentItem.quantity
														? "text-emerald-400"
														: "text-rose-400"
												}
											>
												Discrepancy:{" "}
												{countInput > currentItem.quantity ? "+" : ""}
												{countInput - currentItem.quantity}
											</span>
										</div>
									)}

									<div className="flex gap-3">
										<Button
											variant="secondary"
											onClick={handleSkip}
											className="flex-1"
										>
											Skip
										</Button>
										<Button
											onClick={handleCountSubmit}
											className="flex-1"
											disabled={countInput === ""}
										>
											<Check className="w-4 h-4" />
											Confirm
										</Button>
									</div>
								</div>
							</Card>

							{/* Quick Navigation */}
							<div className="flex items-center justify-between text-sm text-slate-500">
								<button
									onClick={() => {
										const prev =
											currentItemIndex > 0
												? currentItemIndex - 1
												: filteredItems.length - 1;
										setCurrentItemIndex(prev);
										setCountInput(
											getItemCount(filteredItems[prev]?.id)?.countedQty ?? "",
										);
									}}
									className="p-2 hover:text-slate-300"
								>
									← Previous
								</button>
								<span>
									{currentItemIndex + 1} of {filteredItems.length}
								</span>
								<button
									onClick={() => {
										const next = (currentItemIndex + 1) % filteredItems.length;
										setCurrentItemIndex(next);
										setCountInput(
											getItemCount(filteredItems[next]?.id)?.countedQty ?? "",
										);
									}}
									className="p-2 hover:text-slate-300"
								>
									Next →
								</button>
							</div>
						</div>
					) : (
						<div className="p-8 text-center">
							<p className="text-slate-400">No items to count</p>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

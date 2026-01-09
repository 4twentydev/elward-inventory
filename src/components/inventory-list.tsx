"use client";

import {
	AlertTriangle,
	ArrowDownToLine,
	ArrowRightLeft,
	BarChart3,
	ClipboardCheck,
	Download,
	Filter,
	History,
	ListChecks,
	LogOut,
	MessageSquare,
	Minus,
	MoreVertical,
	Package,
	Plus,
	Printer,
	QrCode,
	Search,
	Sparkles,
	Upload,
	Users,
	X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { exportToCSV, exportToExcel } from "@/lib/import-export";
import type { InventoryItem, ItemCategory } from "@/types";
import { AICountModal } from "./ai-count-modal";
import { AnalyticsDashboard } from "./analytics-dashboard";
import { AssistantModal } from "./assistant-modal";
import { ChatModal } from "./chat-modal";
import { CountModal } from "./count-modal";
import { ImportModal } from "./import-modal";
import { useInventory } from "./inventory-context";
import { ItemFormModal } from "./item-form-modal";
import { ItemHistoryModal } from "./item-history-modal";
import { LabelModal } from "./label-modal";
import { QuarterlyCountMode } from "./quarterly-count-mode";
import { TransactionModal } from "./transaction-modal";
import { TransferModal } from "./transfer-modal";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Select } from "./ui/select";
import { UserManagement } from "./user-management";

const CATEGORIES: ItemCategory[] = [
	"ACM",
	"SwissPearl",
	"Trespa",
	"Extrusions",
	"Tools",
	"Hardware",
	"Other",
];

function getCategoryBadgeVariant(category: ItemCategory) {
	switch (category) {
		case "ACM":
			return "amber";
		case "SwissPearl":
			return "emerald";
		case "Trespa":
			return "blue";
		case "Extrusions":
			return "slate";
		case "Tools":
			return "rose";
		default:
			return "slate";
	}
}

interface InventoryListProps {
	initialCategory?: ItemCategory;
	onClearCategory?: () => void;
}

export function InventoryList({
	initialCategory,
	onClearCategory,
}: InventoryListProps) {
	const { items, currentUser, logout, getLowStockItems } = useInventory();

	const [searchQuery, setSearchQuery] = useState("");
	const [categoryFilter, setCategoryFilter] = useState<ItemCategory | "all">(
		initialCategory || "all",
	);
	const [showLowStockOnly, setShowLowStockOnly] = useState(false);

	const [showImportModal, setShowImportModal] = useState(false);
	const [showAddModal, setShowAddModal] = useState(false);
	const [showAICountModal, setShowAICountModal] = useState(false);
	const [showAssistant, setShowAssistant] = useState(false);
	const [showChatModal, setShowChatModal] = useState(false);
	const [showCountMode, setShowCountMode] = useState(false);
	const [showLabelModal, setShowLabelModal] = useState(false);
	const [showAnalytics, setShowAnalytics] = useState(false);
	const [showUserManagement, setShowUserManagement] = useState(false);
	const [showTransferModal, setShowTransferModal] = useState(false);
	const [labelItem, setLabelItem] = useState<InventoryItem | null>(null);
	const [transferItem, setTransferItem] = useState<InventoryItem | null>(null);

	const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
	const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
	const [transactionType, setTransactionType] = useState<"pull" | "return">(
		"pull",
	);
	const [showTransactionModal, setShowTransactionModal] = useState(false);
	const [showCountModal, setShowCountModal] = useState(false);
	const [showHistoryModal, setShowHistoryModal] = useState(false);

	const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

	const lowStockItems = getLowStockItems();

	// Update category filter when initialCategory changes (from Dashboard)
	useEffect(() => {
		if (initialCategory) {
			setCategoryFilter(initialCategory);
		}
	}, [initialCategory]);

	const filteredItems = useMemo(() => {
		let result = items;

		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				(item) =>
					item.name.toLowerCase().includes(query) ||
					item.sku?.toLowerCase().includes(query) ||
					item.location.toLowerCase().includes(query) ||
					item.supplier.toLowerCase().includes(query),
			);
		}

		if (categoryFilter !== "all") {
			result = result.filter((item) => item.category === categoryFilter);
		}

		if (showLowStockOnly) {
			result = result.filter(
				(item) => item.quantity <= item.reorderLevel && item.reorderLevel > 0,
			);
		}

		return result;
	}, [items, searchQuery, categoryFilter, showLowStockOnly]);

	const handleExportCSV = () => {
		const csv = exportToCSV(items);
		const blob = new Blob([csv], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `elward-inventory-${new Date().toISOString().split("T")[0]}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	};

	const handleExportExcel = () => {
		const buffer = exportToExcel(items);
		const blob = new Blob([buffer], {
			type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `elward-inventory-${new Date().toISOString().split("T")[0]}.xlsx`;
		a.click();
		URL.revokeObjectURL(url);
	};

	const openPull = (item: InventoryItem) => {
		setSelectedItem(item);
		setTransactionType("pull");
		setShowTransactionModal(true);
		setExpandedItemId(null);
	};

	const openReturn = (item: InventoryItem) => {
		setSelectedItem(item);
		setTransactionType("return");
		setShowTransactionModal(true);
		setExpandedItemId(null);
	};

	const openCount = (item: InventoryItem) => {
		setSelectedItem(item);
		setShowCountModal(true);
		setExpandedItemId(null);
	};

	const openHistory = (item: InventoryItem) => {
		setSelectedItem(item);
		setShowHistoryModal(true);
		setExpandedItemId(null);
	};

	const openEdit = (item: InventoryItem) => {
		setEditingItem(item);
		setShowAddModal(true);
		setExpandedItemId(null);
	};

	const openLabel = (item: InventoryItem) => {
		setLabelItem(item);
		setShowLabelModal(true);
		setExpandedItemId(null);
	};

	const openTransfer = (item: InventoryItem) => {
		setTransferItem(item);
		setShowTransferModal(true);
		setExpandedItemId(null);
	};

	return (
		<div className="flex-1 flex flex-col overflow-hidden">
			{/* Header */}
			<header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur border-b border-slate-800">
				<div className="max-w-7xl mx-auto px-6 py-4">
					<div className="flex items-center justify-between gap-4">
						<div>
							<h1 className="text-2xl font-bold text-white">Inventory</h1>
							<p className="text-sm text-slate-400">
								{items.length} item{items.length !== 1 ? "s" : ""} total
								{categoryFilter !== "all" &&
									` • Filtering: ${categoryFilter}`}
							</p>
						</div>
						{initialCategory && onClearCategory && (
							<Button
								variant="secondary"
								size="sm"
								onClick={() => {
									setCategoryFilter("all");
									onClearCategory();
								}}
							>
								<X className="w-4 h-4" />
								Clear Filter
							</Button>
						)}
					</div>
				</div>
			</header>

			<div className="flex-1 overflow-y-auto">
				{/* Low Stock Alert */}
			{lowStockItems.length > 0 && !showLowStockOnly && (
				<div className="max-w-7xl mx-auto px-4 pt-4">
					<button
						onClick={() => setShowLowStockOnly(true)}
						className="w-full flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-left hover:bg-amber-500/15 transition-colors"
					>
						<AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
						<div className="flex-1">
							<p className="font-medium text-amber-400">
								{lowStockItems.length} item
								{lowStockItems.length !== 1 ? "s" : ""} below reorder level
							</p>
							<p className="text-sm text-slate-400">
								{lowStockItems
									.slice(0, 3)
									.map((i) => i.name)
									.join(", ")}
								{lowStockItems.length > 3 &&
									` and ${lowStockItems.length - 3} more`}
							</p>
						</div>
					</button>
				</div>
			)}

			{/* Action Bar */}
			<div className="max-w-7xl mx-auto px-4 py-4">
				<div className="flex flex-wrap gap-3">
					<Button onClick={() => setShowAddModal(true)}>
						<Plus className="w-4 h-4" />
						Add Item
					</Button>
					<Button variant="secondary" onClick={() => setShowImportModal(true)}>
						<Upload className="w-4 h-4" />
						Import
					</Button>
					<Button variant="secondary" onClick={() => setShowCountMode(true)}>
						<ListChecks className="w-4 h-4" />
						Count Mode
					</Button>
					<Button variant="secondary" onClick={() => setShowAICountModal(true)}>
						<Sparkles className="w-4 h-4" />
						AI Count
					</Button>
					<Button variant="secondary" onClick={() => setShowAssistant(true)}>
						<MessageSquare className="w-4 h-4" />
						Assistant
					</Button>
					<Button variant="secondary" onClick={() => setShowChatModal(true)}>
						<MessageSquare className="w-4 h-4" />
						Chat
					</Button>
					<div className="flex-1" />
					<Button variant="ghost" onClick={() => setShowAnalytics(true)}>
						<BarChart3 className="w-4 h-4" />
						Analytics
					</Button>
					<Button
						variant="ghost"
						onClick={() => {
							setLabelItem(null);
							setShowLabelModal(true);
						}}
					>
						<Printer className="w-4 h-4" />
						Labels
					</Button>
					<Button variant="ghost" onClick={handleExportCSV}>
						<Download className="w-4 h-4" />
						CSV
					</Button>
					<Button variant="ghost" onClick={handleExportExcel}>
						<Download className="w-4 h-4" />
						Excel
					</Button>
				</div>
			</div>

			{/* Search & Filters */}
			<div className="max-w-7xl mx-auto px-4 pb-4">
				<div className="flex flex-col sm:flex-row gap-3">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
						<Input
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search items, SKUs, locations..."
							className="pl-10"
							inputSize="lg"
						/>
					</div>
					<Select
						value={categoryFilter}
						onChange={(e) =>
							setCategoryFilter(e.target.value as ItemCategory | "all")
						}
						className="sm:w-48"
						selectSize="lg"
					>
						<option value="all">All Categories</option>
						{CATEGORIES.map((cat) => (
							<option key={cat} value={cat}>
								{cat}
							</option>
						))}
					</Select>
					{showLowStockOnly && (
						<Button
							variant="danger"
							onClick={() => setShowLowStockOnly(false)}
							className="sm:w-auto"
						>
							<Filter className="w-4 h-4" />
							Low Stock
							<X className="w-4 h-4" />
						</Button>
					)}
				</div>
			</div>

			{/* Inventory List */}
			<div className="max-w-7xl mx-auto px-4 pb-8">
				{filteredItems.length === 0 ? (
					<Card className="p-12 text-center">
						<Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
						<h3 className="text-lg font-medium text-slate-300 mb-2">
							No items found
						</h3>
						<p className="text-slate-500 mb-4">
							{items.length === 0
								? "Get started by adding items or importing from a spreadsheet."
								: "Try adjusting your search or filters."}
						</p>
						{items.length === 0 && (
							<div className="flex justify-center gap-3">
								<Button onClick={() => setShowAddModal(true)}>
									<Plus className="w-4 h-4" />
									Add Item
								</Button>
								<Button
									variant="secondary"
									onClick={() => setShowImportModal(true)}
								>
									<Upload className="w-4 h-4" />
									Import
								</Button>
							</div>
						)}
					</Card>
				) : (
					<div className="space-y-2">
						{filteredItems.map((item) => {
							const isLowStock =
								item.quantity <= item.reorderLevel && item.reorderLevel > 0;
							const isExpanded = expandedItemId === item.id;

							return (
								<div
									key={item.id}
									className={`card p-4 transition-all ${
										isLowStock ? "border-amber-500/30" : ""
									}`}
								>
									<div className="flex items-center gap-4">
										{/* Main content */}
										<div
											className="flex-1 min-w-0 cursor-pointer"
											onClick={() => openEdit(item)}
										>
											<div className="flex items-center gap-2 flex-wrap">
												<h3 className="font-medium text-slate-100 truncate">
													{item.name}
												</h3>
												<Badge variant={getCategoryBadgeVariant(item.category)}>
													{item.category}
												</Badge>
												{isLowStock && (
													<Badge variant="amber">
														<AlertTriangle className="w-3 h-3" />
														Low
													</Badge>
												)}
											</div>
											<div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
												{item.location && <span>{item.location}</span>}
												{item.sku && (
													<span className="font-mono text-slate-600">
														{item.sku}
													</span>
												)}
											</div>
										</div>

										{/* Quantity */}
										<div className="text-right shrink-0">
											<p
												className={`text-2xl font-mono font-bold ${
													isLowStock ? "text-amber-400" : "text-slate-100"
												}`}
											>
												{item.quantity}
											</p>
											{item.reorderLevel > 0 && (
												<p className="text-xs text-slate-500">
													Min: {item.reorderLevel}
												</p>
											)}
										</div>

										{/* Quick actions */}
										<div className="flex items-center gap-1 shrink-0">
											<button
												onClick={() => openPull(item)}
												className="p-3 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
												title="Pull"
											>
												<Minus className="w-5 h-5" />
											</button>
											<button
												onClick={() => openReturn(item)}
												className="p-3 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
												title="Return"
											>
												<ArrowDownToLine className="w-5 h-5" />
											</button>
											<button
												onClick={() =>
													setExpandedItemId(isExpanded ? null : item.id)
												}
												className="p-3 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
											>
												<MoreVertical className="w-5 h-5" />
											</button>
										</div>
									</div>

									{/* Expanded actions */}
									{isExpanded && (
										<div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-800">
											<Button
												variant="secondary"
												size="sm"
												onClick={() => openCount(item)}
											>
												<ClipboardCheck className="w-4 h-4" />
												Count
											</Button>
											<Button
												variant="secondary"
												size="sm"
												onClick={() => openTransfer(item)}
											>
												<ArrowRightLeft className="w-4 h-4" />
												Transfer
											</Button>
											<Button
												variant="secondary"
												size="sm"
												onClick={() => openHistory(item)}
											>
												<History className="w-4 h-4" />
												History
											</Button>
											<Button
												variant="secondary"
												size="sm"
												onClick={() => openLabel(item)}
											>
												<QrCode className="w-4 h-4" />
												Label
											</Button>
											<Button
												variant="secondary"
												size="sm"
												onClick={() => openEdit(item)}
											>
												Edit Details
											</Button>
										</div>
									)}
								</div>
							);
						})}
					</div>
				)}
			</div>
			</div>

			{/* Modals */}
			<ImportModal
				isOpen={showImportModal}
				onClose={() => setShowImportModal(false)}
			/>
			<ItemFormModal
				isOpen={showAddModal}
				onClose={() => {
					setShowAddModal(false);
					setEditingItem(null);
				}}
				item={editingItem}
			/>
			<TransactionModal
				isOpen={showTransactionModal}
				onClose={() => setShowTransactionModal(false)}
				item={selectedItem}
				type={transactionType}
			/>
			<CountModal
				isOpen={showCountModal}
				onClose={() => setShowCountModal(false)}
				item={selectedItem}
			/>
			<ItemHistoryModal
				isOpen={showHistoryModal}
				onClose={() => setShowHistoryModal(false)}
				item={selectedItem}
			/>
			<AICountModal
				isOpen={showAICountModal}
				onClose={() => setShowAICountModal(false)}
			/>
			<AssistantModal
				isOpen={showAssistant}
				onClose={() => setShowAssistant(false)}
			/>
			<ChatModal
				isOpen={showChatModal}
				onClose={() => setShowChatModal(false)}
			/>
			<TransferModal
				isOpen={showTransferModal}
				onClose={() => setShowTransferModal(false)}
				item={transferItem}
			/>
			<QuarterlyCountMode
				isOpen={showCountMode}
				onClose={() => setShowCountMode(false)}
			/>
			<LabelModal
				isOpen={showLabelModal}
				onClose={() => {
					setShowLabelModal(false);
					setLabelItem(null);
				}}
				item={labelItem}
			/>
			<AnalyticsDashboard
				isOpen={showAnalytics}
				onClose={() => setShowAnalytics(false)}
			/>
			<UserManagement
				isOpen={showUserManagement}
				onClose={() => setShowUserManagement(false)}
			/>
		</div>
	);
}

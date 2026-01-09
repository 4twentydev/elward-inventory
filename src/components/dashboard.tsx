"use client";

import { useInventory } from "./inventory-context";
import type { ItemCategory, InventoryItem, Transaction } from "@/types";
import { useState } from "react";
import { getTransactions } from "@/lib/store";

interface CategoryMetrics {
	category: ItemCategory;
	totalItems: number;
	totalQuantity: number;
	estimatedValue: number;
	lowStockCount: number;
	recentActivity: number;
	icon: string;
	color: string;
}

interface CategorySectionProps {
	metrics: CategoryMetrics;
	items: InventoryItem[];
	onViewAll: () => void;
}

function CategorySection({ metrics, items, onViewAll }: CategorySectionProps) {
	const topItems = items.slice(0, 3);

	return (
		<div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors">
			{/* Category Header */}
			<div className="flex items-start justify-between mb-6">
				<div className="flex items-center gap-3">
					<div
						className={`w-12 h-12 rounded-lg bg-gradient-to-br ${metrics.color} flex items-center justify-center shadow-lg`}
					>
						<span className="text-2xl">{metrics.icon}</span>
					</div>
					<div>
						<h3 className="text-xl font-bold text-white">{metrics.category}</h3>
						<p className="text-sm text-slate-400">
							{metrics.totalItems} item{metrics.totalItems !== 1 ? "s" : ""}
						</p>
					</div>
				</div>
				{metrics.lowStockCount > 0 && (
					<span className="px-3 py-1 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-full text-xs font-semibold">
						{metrics.lowStockCount} Low Stock
					</span>
				)}
			</div>

			{/* Metrics Grid */}
			<div className="grid grid-cols-3 gap-4 mb-6">
				<div className="bg-slate-800/50 rounded-lg p-4">
					<p className="text-xs text-slate-400 mb-1">Total Quantity</p>
					<p className="text-2xl font-bold text-white">
						{metrics.totalQuantity.toLocaleString()}
					</p>
				</div>
				<div className="bg-slate-800/50 rounded-lg p-4">
					<p className="text-xs text-slate-400 mb-1">Est. Value</p>
					<p className="text-2xl font-bold text-emerald-500">
						${metrics.estimatedValue.toLocaleString()}
					</p>
				</div>
				<div className="bg-slate-800/50 rounded-lg p-4">
					<p className="text-xs text-slate-400 mb-1">Recent Activity</p>
					<p className="text-2xl font-bold text-blue-500">
						{metrics.recentActivity}
					</p>
				</div>
			</div>

			{/* Top Items Preview */}
			{topItems.length > 0 && (
				<div className="space-y-2 mb-4">
					<p className="text-xs text-slate-500 uppercase font-semibold">
						Top Items
					</p>
					{topItems.map((item) => (
						<div
							key={item.id}
							className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg"
						>
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium text-white truncate">
									{item.name}
								</p>
								<p className="text-xs text-slate-400">{item.location}</p>
							</div>
							<div className="text-right ml-4">
								<p
									className={`text-sm font-semibold ${
										item.quantity <= item.reorderLevel && item.reorderLevel > 0
											? "text-rose-500"
											: "text-slate-300"
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
						</div>
					))}
				</div>
			)}

			{/* View All Button */}
			<button
				type="button"
				onClick={onViewAll}
				className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
			>
				View All {metrics.category} Items →
			</button>
		</div>
	);
}

interface DashboardProps {
	onNavigate: (view: string, category?: ItemCategory) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
	const { items, getLowStockItems } = useInventory();
	const lowStockItems = getLowStockItems();

	// Calculate overall metrics
	const totalItems = items.length;
	const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
	const estimatedValue = items.reduce(
		(sum, item) => sum + (item.unitCost || 0) * item.quantity,
		0,
	);

	// Get recent transactions (last 7 days)
	const sevenDaysAgo = new Date();
	sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
	const allTransactions = getTransactions();
	const recentTransactions = allTransactions.filter(
		(t) => new Date(t.createdAt) >= sevenDaysAgo,
	);

	// Calculate category metrics
	const categories: ItemCategory[] = [
		"ACM",
		"SwissPearl",
		"Trespa",
		"Extrusions",
		"Tools",
		"Hardware",
		"Other",
	];

	const categoryConfig: Record<
		ItemCategory,
		{ icon: string; color: string }
	> = {
		ACM: { icon: "🏗️", color: "from-amber-500 to-amber-600" },
		SwissPearl: { icon: "💎", color: "from-emerald-500 to-emerald-600" },
		Trespa: { icon: "📐", color: "from-blue-500 to-blue-600" },
		Extrusions: { icon: "📏", color: "from-slate-500 to-slate-600" },
		Tools: { icon: "🔧", color: "from-rose-500 to-rose-600" },
		Hardware: { icon: "⚙️", color: "from-purple-500 to-purple-600" },
		Other: { icon: "📦", color: "from-slate-600 to-slate-700" },
	};

	const categoryMetrics: CategoryMetrics[] = categories
		.map((category) => {
			const categoryItems = items.filter((item) => item.category === category);
			const categoryTransactions = recentTransactions.filter((t) =>
				categoryItems.some((item) => item.id === t.itemId),
			);

			return {
				category,
				totalItems: categoryItems.length,
				totalQuantity: categoryItems.reduce(
					(sum, item) => sum + item.quantity,
					0,
				),
				estimatedValue: categoryItems.reduce(
					(sum, item) => sum + (item.unitCost || 0) * item.quantity,
					0,
				),
				lowStockCount: categoryItems.filter(
					(item) => item.quantity <= item.reorderLevel && item.reorderLevel > 0,
				).length,
				recentActivity: categoryTransactions.length,
				...categoryConfig[category],
			};
		})
		.filter((m) => m.totalItems > 0); // Only show categories with items

	return (
		<div className="flex-1 overflow-y-auto">
			<div className="max-w-7xl mx-auto p-6 space-y-6">
				{/* Page Header */}
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
						<p className="text-slate-400">
							Overview of your inventory and recent activity
						</p>
					</div>
				</div>

				{/* Low Stock Alert */}
				{lowStockItems.length > 0 && (
					<div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-start gap-4">
						<div className="w-10 h-10 rounded-lg bg-rose-500/20 flex items-center justify-center flex-shrink-0">
							<span className="text-xl">⚠️</span>
						</div>
						<div className="flex-1">
							<h3 className="text-rose-500 font-semibold mb-1">
								Low Stock Alert
							</h3>
							<p className="text-rose-300 text-sm">
								{lowStockItems.length} item
								{lowStockItems.length !== 1 ? "s are" : " is"} below reorder
								level
							</p>
						</div>
						<button
							type="button"
							onClick={() => onNavigate("inventory")}
							className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-medium transition-colors"
						>
							View Items
						</button>
					</div>
				)}

				{/* Overall Metrics */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					<div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
						<div className="flex items-center gap-3 mb-3">
							<div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
								<span className="text-xl">📦</span>
							</div>
							<p className="text-sm text-slate-400">Total Items</p>
						</div>
						<p className="text-3xl font-bold text-white">
							{totalItems.toLocaleString()}
						</p>
					</div>

					<div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
						<div className="flex items-center gap-3 mb-3">
							<div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
								<span className="text-xl">📊</span>
							</div>
							<p className="text-sm text-slate-400">Total Quantity</p>
						</div>
						<p className="text-3xl font-bold text-white">
							{totalQuantity.toLocaleString()}
						</p>
					</div>

					<div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
						<div className="flex items-center gap-3 mb-3">
							<div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
								<span className="text-xl">💰</span>
							</div>
							<p className="text-sm text-slate-400">Est. Total Value</p>
						</div>
						<p className="text-3xl font-bold text-emerald-500">
							${estimatedValue.toLocaleString()}
						</p>
					</div>

					<div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
						<div className="flex items-center gap-3 mb-3">
							<div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
								<span className="text-xl">⚠️</span>
							</div>
							<p className="text-sm text-slate-400">Low Stock Items</p>
						</div>
						<p className="text-3xl font-bold text-rose-500">
							{lowStockItems.length}
						</p>
					</div>
				</div>

				{/* Recent Activity Summary */}
				<div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
					<div className="flex items-center gap-3 mb-4">
						<div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
							<span className="text-xl">📈</span>
						</div>
						<div>
							<h3 className="text-lg font-bold text-white">Recent Activity</h3>
							<p className="text-sm text-slate-400">Last 7 days</p>
						</div>
					</div>
					<div className="grid grid-cols-3 gap-4">
						<div className="text-center p-4 bg-slate-800/30 rounded-lg">
							<p className="text-2xl font-bold text-rose-500">
								{
									recentTransactions.filter((t) => t.type === "pull" || t.type === "adjustment")
										.length
								}
							</p>
							<p className="text-xs text-slate-400 mt-1">Pulls</p>
						</div>
						<div className="text-center p-4 bg-slate-800/30 rounded-lg">
							<p className="text-2xl font-bold text-emerald-500">
								{recentTransactions.filter((t) => t.type === "return").length}
							</p>
							<p className="text-xs text-slate-400 mt-1">Returns</p>
						</div>
						<div className="text-center p-4 bg-slate-800/30 rounded-lg">
							<p className="text-2xl font-bold text-blue-500">
								{recentTransactions.filter((t) => t.type === "count").length}
							</p>
							<p className="text-xs text-slate-400 mt-1">Counts</p>
						</div>
					</div>
				</div>

				{/* Category Sections Header */}
				<div className="pt-6">
					<h2 className="text-2xl font-bold text-white mb-4">
						Inventory by Category
					</h2>
				</div>

				{/* Category Sections Grid */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
					{categoryMetrics.map((metrics) => (
						<CategorySection
							key={metrics.category}
							metrics={metrics}
							items={items.filter((item) => item.category === metrics.category)}
							onViewAll={() => onNavigate("inventory", metrics.category)}
						/>
					))}
				</div>

				{/* Empty State */}
				{categoryMetrics.length === 0 && (
					<div className="text-center py-12">
						<div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
							<span className="text-3xl">📦</span>
						</div>
						<h3 className="text-xl font-semibold text-white mb-2">
							No Inventory Yet
						</h3>
						<p className="text-slate-400 mb-6">
							Get started by adding your first inventory item
						</p>
						<button
							type="button"
							onClick={() => onNavigate("inventory")}
							className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg font-semibold transition-colors"
						>
							Go to Inventory
						</button>
					</div>
				)}
			</div>
		</div>
	);
}

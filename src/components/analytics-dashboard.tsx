"use client";

import {
	Activity,
	AlertTriangle,
	ArrowLeft,
	BarChart3,
	Calendar,
	DollarSign,
	Download,
	Package,
	PieChart,
	TrendingDown,
	TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import * as store from "@/lib/store";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { ItemCategory, Transaction } from "@/types";
import { useInventory } from "./inventory-context";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle } from "./ui/card";
import { Modal } from "./ui/modal";
import { Select } from "./ui/select";

interface AnalyticsDashboardProps {
	isOpen: boolean;
	onClose: () => void;
}

const CATEGORY_COLORS: Record<ItemCategory, string> = {
	ACM: "bg-amber-500",
	SwissPearl: "bg-emerald-500",
	Trespa: "bg-blue-500",
	Extrusions: "bg-slate-500",
	Tools: "bg-rose-500",
	Hardware: "bg-purple-500",
	Other: "bg-slate-600",
};

export function AnalyticsDashboard({
	isOpen,
	onClose,
}: AnalyticsDashboardProps) {
	const { items, getLowStockItems, currentUser } = useInventory();
	const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "all">(
		"30d",
	);
	const [viewMode, setViewMode] = useState<"all" | "my">("my");

	const allTransactions = store.getTransactions();
	const allCounts = store.getCounts();
	const lowStockItems = getLowStockItems();

	// Filter by user if in "my" mode
	const transactions =
		viewMode === "my" && currentUser
			? allTransactions.filter((t) => t.userId === currentUser.id)
			: allTransactions;
	const counts =
		viewMode === "my" && currentUser
			? allCounts.filter((c) => c.userId === currentUser.id)
			: allCounts;

	// Calculate date filter
	const dateFilter = useMemo(() => {
		const now = new Date();
		switch (dateRange) {
			case "7d":
				return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
			case "30d":
				return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
			case "90d":
				return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
			default:
				return new Date(0);
		}
	}, [dateRange]);

	// Filter transactions by date
	const filteredTransactions = useMemo(() => {
		return transactions.filter((t) => new Date(t.createdAt) >= dateFilter);
	}, [transactions, dateFilter]);

	// Calculate stats
	const stats = useMemo(() => {
		const totalItems = items.length;
		const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
		const totalValue = items.reduce((sum, item) => {
			const cost = item.unitCost || 0;
			return sum + item.quantity * cost;
		}, 0);

		// Category breakdown
		const categoryBreakdown: Record<
			string,
			{ count: number; quantity: number }
		> = {};
		for (const item of items) {
			if (!categoryBreakdown[item.category]) {
				categoryBreakdown[item.category] = { count: 0, quantity: 0 };
			}
			categoryBreakdown[item.category].count++;
			categoryBreakdown[item.category].quantity += item.quantity;
		}

		// Transaction stats
		const pulls = filteredTransactions.filter((t) => t.type === "pull");
		const returns = filteredTransactions.filter((t) => t.type === "return");
		const totalPulled = pulls.reduce((sum, t) => sum + t.quantity, 0);
		const totalReturned = returns.reduce((sum, t) => sum + t.quantity, 0);

		// Most active items
		const itemActivity: Record<string, number> = {};
		for (const tx of filteredTransactions) {
			itemActivity[tx.itemId] = (itemActivity[tx.itemId] || 0) + 1;
		}
		const mostActiveItemIds = Object.entries(itemActivity)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5)
			.map(([id]) => id);
		const mostActiveItems = mostActiveItemIds
			.map((id) => items.find((i) => i.id === id))
			.filter(Boolean);

		// Job references
		const jobRefs: Record<string, number> = {};
		for (const tx of filteredTransactions) {
			if (tx.jobReference) {
				jobRefs[tx.jobReference] = (jobRefs[tx.jobReference] || 0) + 1;
			}
		}
		const topJobs = Object.entries(jobRefs)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5);

		return {
			totalItems,
			totalQuantity,
			totalValue,
			lowStockCount: lowStockItems.length,
			categoryBreakdown,
			totalPulled,
			totalReturned,
			pullCount: pulls.length,
			returnCount: returns.length,
			mostActiveItems,
			topJobs,
		};
	}, [items, filteredTransactions, lowStockItems]);

	// Recent count sessions
	const recentCounts = useMemo(() => {
		const filtered = counts.filter((c) => new Date(c.createdAt) >= dateFilter);
		const grouped: Record<string, typeof counts> = {};
		for (const count of filtered) {
			const date = count.createdAt.split("T")[0];
			if (!grouped[date]) grouped[date] = [];
			grouped[date].push(count);
		}
		return Object.entries(grouped)
			.sort((a, b) => b[0].localeCompare(a[0]))
			.slice(0, 5);
	}, [counts, dateFilter]);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 bg-slate-950 overflow-hidden flex flex-col">
			{/* Header */}
			<header className="bg-slate-900 border-b border-slate-800 px-4 py-3 shrink-0">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<button
							onClick={onClose}
							className="p-2 rounded-lg hover:bg-slate-800 text-slate-400"
						>
							<ArrowLeft className="w-5 h-5" />
						</button>
						<div>
							<h1 className="font-semibold text-slate-100">
								Analytics Dashboard
							</h1>
							<p className="text-xs text-slate-500">
								{viewMode === "my"
									? `My Activity - ${currentUser?.name}`
									: "All Activity"}
							</p>
						</div>
					</div>
					<div className="flex items-center gap-3">
						<Select
							value={viewMode}
							onChange={(e) => setViewMode(e.target.value as typeof viewMode)}
							className="w-36"
						>
							<option value="my">My Activity</option>
							<option value="all">All Activity</option>
						</Select>
						<Select
							value={dateRange}
							onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
							className="w-32"
						>
							<option value="7d">Last 7 days</option>
							<option value="30d">Last 30 days</option>
							<option value="90d">Last 90 days</option>
							<option value="all">All time</option>
						</Select>
					</div>
				</div>
			</header>

			{/* Content */}
			<div className="flex-1 overflow-auto p-4">
				<div className="max-w-6xl mx-auto space-y-6">
					{/* Key Metrics */}
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						<Card className="p-4">
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
									<Package className="w-5 h-5 text-blue-400" />
								</div>
								<div>
									<p className="text-sm text-slate-400">Total Items</p>
									<p className="text-2xl font-bold text-slate-100">
										{stats.totalItems}
									</p>
								</div>
							</div>
						</Card>

						<Card className="p-4">
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
									<BarChart3 className="w-5 h-5 text-emerald-400" />
								</div>
								<div>
									<p className="text-sm text-slate-400">Total Quantity</p>
									<p className="text-2xl font-bold text-slate-100">
										{stats.totalQuantity.toLocaleString()}
									</p>
								</div>
							</div>
						</Card>

						<Card className="p-4">
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
									<DollarSign className="w-5 h-5 text-amber-400" />
								</div>
								<div>
									<p className="text-sm text-slate-400">Est. Value</p>
									<p className="text-2xl font-bold text-slate-100">
										$
										{stats.totalValue.toLocaleString(undefined, {
											maximumFractionDigits: 0,
										})}
									</p>
								</div>
							</div>
						</Card>

						<Card className="p-4">
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 rounded-lg bg-rose-500/20 flex items-center justify-center">
									<AlertTriangle className="w-5 h-5 text-rose-400" />
								</div>
								<div>
									<p className="text-sm text-slate-400">Low Stock</p>
									<p className="text-2xl font-bold text-rose-400">
										{stats.lowStockCount}
									</p>
								</div>
							</div>
						</Card>
					</div>

					<div className="grid md:grid-cols-2 gap-6">
						{/* Category Breakdown */}
						<Card className="p-4">
							<CardHeader className="px-0 pt-0">
								<CardTitle className="flex items-center gap-2">
									<PieChart className="w-5 h-5 text-slate-400" />
									Category Breakdown
								</CardTitle>
							</CardHeader>
							<div className="space-y-3">
								{Object.entries(stats.categoryBreakdown)
									.sort((a, b) => b[1].count - a[1].count)
									.map(([category, data]) => {
										const percentage =
											stats.totalItems > 0
												? (data.count / stats.totalItems) * 100
												: 0;
										return (
											<div key={category}>
												<div className="flex items-center justify-between text-sm mb-1">
													<span className="text-slate-300">{category}</span>
													<span className="text-slate-400">
														{data.count} items ({data.quantity} units)
													</span>
												</div>
												<div className="h-2 bg-slate-800 rounded-full overflow-hidden">
													<div
														className={`h-full ${CATEGORY_COLORS[category as ItemCategory] || "bg-slate-500"}`}
														style={{ width: `${percentage}%` }}
													/>
												</div>
											</div>
										);
									})}
							</div>
						</Card>

						{/* Activity Summary */}
						<Card className="p-4">
							<CardHeader className="px-0 pt-0">
								<CardTitle className="flex items-center gap-2">
									<Activity className="w-5 h-5 text-slate-400" />
									Activity Summary
								</CardTitle>
							</CardHeader>
							<div className="grid grid-cols-2 gap-4">
								<div className="p-3 bg-rose-500/10 rounded-lg border border-rose-500/20">
									<div className="flex items-center gap-2 mb-1">
										<TrendingDown className="w-4 h-4 text-rose-400" />
										<span className="text-sm text-rose-400">Pulls</span>
									</div>
									<p className="text-2xl font-mono font-bold text-rose-400">
										{stats.totalPulled}
									</p>
									<p className="text-xs text-slate-500">
										{stats.pullCount} transactions
									</p>
								</div>
								<div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
									<div className="flex items-center gap-2 mb-1">
										<TrendingUp className="w-4 h-4 text-emerald-400" />
										<span className="text-sm text-emerald-400">Returns</span>
									</div>
									<p className="text-2xl font-mono font-bold text-emerald-400">
										{stats.totalReturned}
									</p>
									<p className="text-xs text-slate-500">
										{stats.returnCount} transactions
									</p>
								</div>
							</div>

							{stats.topJobs.length > 0 && (
								<div className="mt-4">
									<p className="text-sm text-slate-400 mb-2">Top Jobs</p>
									<div className="space-y-1">
										{stats.topJobs.map(([job, count]) => (
											<div
												key={job}
												className="flex items-center justify-between text-sm"
											>
												<span className="text-slate-300 truncate">{job}</span>
												<Badge variant="slate">{count}</Badge>
											</div>
										))}
									</div>
								</div>
							)}
						</Card>
					</div>

					<div className="grid md:grid-cols-2 gap-6">
						{/* Most Active Items */}
						<Card className="p-4">
							<CardHeader className="px-0 pt-0">
								<CardTitle>Most Active Items</CardTitle>
							</CardHeader>
							{stats.mostActiveItems.length > 0 ? (
								<div className="space-y-2">
									{stats.mostActiveItems.map((item, i) => (
										<div
											key={item!.id}
											className="flex items-center gap-3 p-2 bg-slate-800/30 rounded-lg"
										>
											<span className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-400">
												{i + 1}
											</span>
											<div className="flex-1 min-w-0">
												<p className="text-slate-200 truncate">{item!.name}</p>
												<p className="text-xs text-slate-500">
													{item!.category}
												</p>
											</div>
											<span className="text-slate-400 font-mono">
												{item!.quantity}
											</span>
										</div>
									))}
								</div>
							) : (
								<p className="text-slate-500 text-center py-4">
									No activity in selected period
								</p>
							)}
						</Card>

						{/* Low Stock Items */}
						<Card className="p-4">
							<CardHeader className="px-0 pt-0">
								<CardTitle className="flex items-center gap-2">
									<AlertTriangle className="w-5 h-5 text-amber-400" />
									Low Stock Alerts
								</CardTitle>
							</CardHeader>
							{lowStockItems.length > 0 ? (
								<div className="space-y-2 max-h-64 overflow-y-auto">
									{lowStockItems.map((item) => (
										<div
											key={item.id}
											className="flex items-center gap-3 p-2 bg-amber-500/10 rounded-lg border border-amber-500/20"
										>
											<div className="flex-1 min-w-0">
												<p className="text-slate-200 truncate">{item.name}</p>
												<p className="text-xs text-slate-500">
													Min: {item.reorderLevel}
												</p>
											</div>
											<span className="text-amber-400 font-mono font-bold">
												{item.quantity}
											</span>
										</div>
									))}
								</div>
							) : (
								<div className="text-center py-8">
									<div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-2">
										<Package className="w-6 h-6 text-emerald-400" />
									</div>
									<p className="text-emerald-400">
										All items above reorder level
									</p>
								</div>
							)}
						</Card>
					</div>

					{/* Recent Counts */}
					{recentCounts.length > 0 && (
						<Card className="p-4">
							<CardHeader className="px-0 pt-0">
								<CardTitle className="flex items-center gap-2">
									<Calendar className="w-5 h-5 text-slate-400" />
									Recent Count Sessions
								</CardTitle>
							</CardHeader>
							<div className="space-y-3">
								{recentCounts.map(([date, dayCounts]) => {
									const discrepancies = dayCounts.filter(
										(c) => c.discrepancy !== 0,
									).length;
									return (
										<div
											key={date}
											className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg"
										>
											<div>
												<p className="text-slate-200">{formatDate(date)}</p>
												<p className="text-sm text-slate-500">
													{dayCounts.length} items counted
												</p>
											</div>
											<div className="text-right">
												{discrepancies > 0 ? (
													<Badge variant="amber">
														{discrepancies} discrepancies
													</Badge>
												) : (
													<Badge variant="emerald">All matched</Badge>
												)}
											</div>
										</div>
									);
								})}
							</div>
						</Card>
					)}

					{/* Recent Transactions */}
					<Card className="p-4">
						<CardHeader className="px-0 pt-0">
							<CardTitle>Recent Transactions</CardTitle>
						</CardHeader>
						{filteredTransactions.length > 0 ? (
							<div className="space-y-2 max-h-64 overflow-y-auto">
								{filteredTransactions.slice(0, 20).map((tx) => {
									const item = items.find((i) => i.id === tx.itemId);
									return (
										<div
											key={tx.id}
											className="flex items-center gap-3 p-2 bg-slate-800/30 rounded-lg"
										>
											<div
												className={`w-8 h-8 rounded-lg flex items-center justify-center ${
													tx.type === "pull"
														? "bg-rose-500/20"
														: tx.type === "return"
															? "bg-emerald-500/20"
															: "bg-blue-500/20"
												}`}
											>
												{tx.type === "pull" ? (
													<TrendingDown className="w-4 h-4 text-rose-400" />
												) : tx.type === "return" ? (
													<TrendingUp className="w-4 h-4 text-emerald-400" />
												) : (
													<Activity className="w-4 h-4 text-blue-400" />
												)}
											</div>
											<div className="flex-1 min-w-0">
												<p className="text-slate-200 truncate">
													{item?.name || "Unknown item"}
												</p>
												<p className="text-xs text-slate-500">
													{tx.userName} • {formatDateTime(tx.createdAt)}
												</p>
											</div>
											<span
												className={`font-mono ${
													tx.type === "pull"
														? "text-rose-400"
														: tx.type === "return"
															? "text-emerald-400"
															: "text-slate-400"
												}`}
											>
												{tx.type === "pull"
													? "-"
													: tx.type === "return"
														? "+"
														: ""}
												{tx.quantity}
											</span>
										</div>
									);
								})}
							</div>
						) : (
							<p className="text-slate-500 text-center py-4">
								No transactions in selected period
							</p>
						)}
					</Card>
				</div>
			</div>
		</div>
	);
}

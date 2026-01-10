"use client";

import type { ReactNode } from "react";
import { useInventory } from "./inventory-context";

interface SidebarProps {
	currentView: string;
	onNavigate: (view: string) => void;
}

interface NavItemProps {
	icon: ReactNode;
	label: string;
	view: string;
	currentView: string;
	onClick: (view: string) => void;
	badge?: number;
}

function NavItem({
	icon,
	label,
	view,
	currentView,
	onClick,
	badge,
}: NavItemProps) {
	const isActive = currentView === view;

	return (
		<button
			type="button"
			onClick={() => onClick(view)}
			className={`
				w-full flex items-center gap-3 px-4 py-3 rounded-lg
				transition-all duration-200
				${
					isActive
						? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
						: "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
				}
			`}
		>
			<div className="text-xl">{icon}</div>
			<span className="font-medium">{label}</span>
			{badge !== undefined && badge > 0 && (
				<span
					className={`
						ml-auto px-2 py-0.5 rounded-full text-xs font-semibold
						${isActive ? "bg-amber-500 text-slate-950" : "bg-rose-500 text-white"}
					`}
				>
					{badge}
				</span>
			)}
		</button>
	);
}

export function Sidebar({ currentView, onNavigate }: SidebarProps) {
	const { currentUser, logout, getLowStockItems } = useInventory();
	const lowStockCount = getLowStockItems().length;

	return (
		<aside className="w-64 bg-slate-900/50 border-r border-slate-800 flex flex-col">
			{/* Logo/Header */}
			<div className="p-6 border-b border-slate-800">
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
						<span className="text-xl">📦</span>
					</div>
					<div>
						<h1 className="text-lg font-bold text-white">Elward</h1>
						<p className="text-xs text-slate-400">Inventory System</p>
					</div>
				</div>
			</div>

			{/* Navigation */}
			<nav className="flex-1 p-4 space-y-1 overflow-y-auto">
				<NavItem
					icon="🏠"
					label="Dashboard"
					view="dashboard"
					currentView={currentView}
					onClick={onNavigate}
				/>
				<NavItem
					icon="📋"
					label="Inventory"
					view="inventory"
					currentView={currentView}
					onClick={onNavigate}
					badge={lowStockCount}
				/>
				<NavItem
					icon="📊"
					label="Analytics"
					view="analytics"
					currentView={currentView}
					onClick={onNavigate}
				/>
				<NavItem
					icon="🔢"
					label="Count Mode"
					view="count"
					currentView={currentView}
					onClick={onNavigate}
				/>

				{/* Divider */}
				<div className="py-2">
					<div className="border-t border-slate-800" />
				</div>

				{currentUser?.role === "admin" && (
					<NavItem
						icon="👥"
						label="Users"
						view="users"
						currentView={currentView}
						onClick={onNavigate}
					/>
				)}
			</nav>

			{/* User Info & Logout */}
			<div className="p-4 border-t border-slate-800">
				<div className="flex items-center gap-3 mb-3">
					<div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
						<span className="text-white font-semibold text-sm">
							{currentUser?.name.charAt(0).toUpperCase()}
						</span>
					</div>
					<div className="flex-1 min-w-0">
						<p className="text-sm font-medium text-white truncate">
							{currentUser?.name}
						</p>
						<p className="text-xs text-slate-400 capitalize">
							{currentUser?.role}
						</p>
					</div>
				</div>
				<button
					type="button"
					onClick={logout}
					className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
				>
					Logout
				</button>
			</div>
		</aside>
	);
}

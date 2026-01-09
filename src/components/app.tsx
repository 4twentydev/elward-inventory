"use client";

import { useState } from "react";
import { useInventory } from "./inventory-context";
import { InventoryList } from "./inventory-list";
import { LoginScreen } from "./login-screen";
import { Sidebar } from "./sidebar";
import { Dashboard } from "./dashboard";
import { AnalyticsDashboard } from "./analytics-dashboard";
import { QuarterlyCountMode } from "./quarterly-count-mode";
import { UserManagement } from "./user-management";
import type { ItemCategory } from "@/types";

type ViewType = "dashboard" | "inventory" | "analytics" | "count" | "users";

export function App() {
	const { currentUser, isLoading } = useInventory();
	const [currentView, setCurrentView] = useState<ViewType>("dashboard");
	const [selectedCategory, setSelectedCategory] = useState<
		ItemCategory | undefined
	>();

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-slate-950">
				<div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
			</div>
		);
	}

	if (!currentUser) {
		return <LoginScreen />;
	}

	const handleNavigate = (view: string, category?: ItemCategory) => {
		setCurrentView(view as ViewType);
		setSelectedCategory(category);
	};

	return (
		<div className="min-h-screen flex bg-slate-950">
			<Sidebar currentView={currentView} onNavigate={handleNavigate} />
			<div className="flex-1 flex flex-col min-h-screen">
				{currentView === "dashboard" && (
					<Dashboard onNavigate={handleNavigate} />
				)}
				{currentView === "inventory" && (
					<InventoryList
						initialCategory={selectedCategory}
						onClearCategory={() => setSelectedCategory(undefined)}
					/>
				)}
				{currentView === "analytics" && (
					<AnalyticsDashboard isOpen={true} onClose={() => setCurrentView("dashboard")} />
				)}
				{currentView === "count" && (
					<QuarterlyCountMode isOpen={true} onClose={() => setCurrentView("dashboard")} />
				)}
				{currentView === "users" && currentUser.role === "admin" && (
					<UserManagement isOpen={true} onClose={() => setCurrentView("dashboard")} />
				)}
			</div>
		</div>
	);
}

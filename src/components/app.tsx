"use client";

import { useInventory } from "./inventory-context";
import { LoginScreen } from "./login-screen";
import { InventoryList } from "./inventory-list";

export function App() {
	const { currentUser, isLoading } = useInventory();

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

	return <InventoryList />;
}

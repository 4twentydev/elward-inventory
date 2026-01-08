"use client";

import {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
	type ReactNode,
} from "react";
import type { InventoryItem, User, Transaction, InventoryCount } from "@/types";
import * as store from "@/lib/store";

interface InventoryContextType {
	items: InventoryItem[];
	currentUser: User | null;
	isLoading: boolean;
	login: (pin: string) => User | null;
	logout: () => void;
	refreshItems: () => void;
	addItem: (item: InventoryItem) => void;
	updateItem: (id: string, updates: Partial<InventoryItem>) => void;
	deleteItem: (id: string) => void;
	importItems: (items: InventoryItem[]) => void;
	pullItem: (itemId: string, quantity: number, jobRef?: string, notes?: string) => void;
	returnItem: (itemId: string, quantity: number, jobRef?: string, notes?: string) => void;
	recordCount: (
		itemId: string,
		countedQty: number,
		countType: "quarterly" | "daily" | "spot",
		notes?: string
	) => void;
	getItemTransactions: (itemId: string) => Transaction[];
	getLowStockItems: () => InventoryItem[];
}

const InventoryContext = createContext<InventoryContextType | null>(null);

export function InventoryProvider({ children }: { children: ReactNode }) {
	const [items, setItems] = useState<InventoryItem[]>([]);
	const [currentUser, setCurrentUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const refreshItems = useCallback(() => {
		setItems(store.getItems());
	}, []);

	useEffect(() => {
		refreshItems();
		setCurrentUser(store.getCurrentUser());
		setIsLoading(false);
	}, [refreshItems]);

	const login = useCallback((pin: string): User | null => {
		const user = store.validateUser(pin);
		if (user) {
			store.setCurrentUser(user);
			setCurrentUser(user);
		}
		return user;
	}, []);

	const logout = useCallback(() => {
		store.setCurrentUser(null);
		setCurrentUser(null);
	}, []);

	const addItem = useCallback((item: InventoryItem) => {
		store.addItem(item);
		setItems(store.getItems());
	}, []);

	const updateItem = useCallback((id: string, updates: Partial<InventoryItem>) => {
		store.updateItem(id, updates);
		setItems(store.getItems());
	}, []);

	const deleteItem = useCallback((id: string) => {
		store.deleteItem(id);
		setItems(store.getItems());
	}, []);

	const importItemsFn = useCallback((newItems: InventoryItem[]) => {
		store.importItems(newItems);
		setItems(store.getItems());
	}, []);

	const pullItem = useCallback(
		(itemId: string, quantity: number, jobRef?: string, notes?: string) => {
			if (!currentUser) return;

			const item = store.getItem(itemId);
			if (!item) return;

			const newQty = Math.max(0, item.quantity - quantity);
			const transaction: Transaction = {
				id: crypto.randomUUID(),
				itemId,
				type: "pull",
				quantity,
				previousQuantity: item.quantity,
				newQuantity: newQty,
				userId: currentUser.id,
				userName: currentUser.name,
				jobReference: jobRef,
				notes,
				createdAt: new Date().toISOString(),
			};

			store.addTransaction(transaction);
			store.updateItem(itemId, { quantity: newQty });
			setItems(store.getItems());
		},
		[currentUser]
	);

	const returnItem = useCallback(
		(itemId: string, quantity: number, jobRef?: string, notes?: string) => {
			if (!currentUser) return;

			const item = store.getItem(itemId);
			if (!item) return;

			const newQty = item.quantity + quantity;
			const transaction: Transaction = {
				id: crypto.randomUUID(),
				itemId,
				type: "return",
				quantity,
				previousQuantity: item.quantity,
				newQuantity: newQty,
				userId: currentUser.id,
				userName: currentUser.name,
				jobReference: jobRef,
				notes,
				createdAt: new Date().toISOString(),
			};

			store.addTransaction(transaction);
			store.updateItem(itemId, { quantity: newQty });
			setItems(store.getItems());
		},
		[currentUser]
	);

	const recordCount = useCallback(
		(
			itemId: string,
			countedQty: number,
			countType: "quarterly" | "daily" | "spot",
			notes?: string
		) => {
			if (!currentUser) return;

			const item = store.getItem(itemId);
			if (!item) return;

			const count: InventoryCount = {
				id: crypto.randomUUID(),
				itemId,
				countedQuantity: countedQty,
				systemQuantity: item.quantity,
				discrepancy: countedQty - item.quantity,
				userId: currentUser.id,
				userName: currentUser.name,
				countType,
				notes,
				createdAt: new Date().toISOString(),
			};

			store.addCount(count);

			// Create adjustment transaction if discrepancy
			if (count.discrepancy !== 0) {
				const transaction: Transaction = {
					id: crypto.randomUUID(),
					itemId,
					type: "count",
					quantity: Math.abs(count.discrepancy),
					previousQuantity: item.quantity,
					newQuantity: countedQty,
					userId: currentUser.id,
					userName: currentUser.name,
					notes: `${countType} count adjustment: ${count.discrepancy > 0 ? "+" : ""}${count.discrepancy}`,
					createdAt: new Date().toISOString(),
				};
				store.addTransaction(transaction);
			}

			store.updateItem(itemId, {
				quantity: countedQty,
				lastCountDate: new Date().toISOString(),
				lastCountBy: currentUser.name,
			});
			setItems(store.getItems());
		},
		[currentUser]
	);

	const getItemTransactions = useCallback((itemId: string): Transaction[] => {
		return store.getItemTransactions(itemId);
	}, []);

	const getLowStockItems = useCallback((): InventoryItem[] => {
		return items.filter((item) => item.quantity <= item.reorderLevel && item.reorderLevel > 0);
	}, [items]);

	return (
		<InventoryContext.Provider
			value={{
				items,
				currentUser,
				isLoading,
				login,
				logout,
				refreshItems,
				addItem,
				updateItem,
				deleteItem,
				importItems: importItemsFn,
				pullItem,
				returnItem,
				recordCount,
				getItemTransactions,
				getLowStockItems,
			}}
		>
			{children}
		</InventoryContext.Provider>
	);
}

export function useInventory() {
	const context = useContext(InventoryContext);
	if (!context) {
		throw new Error("useInventory must be used within InventoryProvider");
	}
	return context;
}

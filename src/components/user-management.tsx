"use client";

import { AlertTriangle, Eye, Plus, Shield, Trash2, User } from "lucide-react";
import { useEffect, useState } from "react";
import { resetAllData } from "@/actions/admin";
import * as store from "@/lib/store";
import type { User as UserType } from "@/types";
import { useInventory } from "./inventory-context";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Modal } from "./ui/modal";
import { Select } from "./ui/select";

interface UserManagementProps {
	isOpen: boolean;
	onClose: () => void;
}

export function UserManagement({ isOpen, onClose }: UserManagementProps) {
	const { currentUser } = useInventory();
	const [users, setUsers] = useState<UserType[]>([]);
	const [showAddForm, setShowAddForm] = useState(false);
	const [showResetConfirm, setShowResetConfirm] = useState(false);
	const [isResetting, setIsResetting] = useState(false);
	const [newUser, setNewUser] = useState({
		name: "",
		pin: "",
		role: "user" as "admin" | "counter" | "user",
	});

	useEffect(() => {
		if (isOpen) {
			setUsers(store.getUsers());
		}
	}, [isOpen]);

	const handleAddUser = () => {
		if (!newUser.name || !newUser.pin) return;

		const user: UserType = {
			id: crypto.randomUUID(),
			name: newUser.name,
			pin: newUser.pin,
			role: newUser.role,
			active: true,
			createdAt: new Date().toISOString(),
		};

		store.addUser(user);
		setUsers(store.getUsers());
		setNewUser({ name: "", pin: "", role: "user" });
		setShowAddForm(false);
	};

	const handleToggleActive = (userId: string) => {
		const allUsers = store.getUsers();
		const updatedUsers = allUsers.map((u) =>
			u.id === userId ? { ...u, active: !u.active } : u,
		);
		localStorage.setItem(
			"elward_inventory_users",
			JSON.stringify(updatedUsers),
		);
		setUsers(updatedUsers);
	};

	const handleResetAllData = async () => {
		setIsResetting(true);
		try {
			// Reset database if configured
			await resetAllData();

			// Reset localStorage
			store.clearAllData();

			// Reload the page to reset the app state
			window.location.reload();
		} catch (error) {
			console.error("Error resetting data:", error);
			setIsResetting(false);
			setShowResetConfirm(false);
		}
	};

	const getRoleBadge = (role: string) => {
		switch (role) {
			case "admin":
				return <Badge variant="amber">Admin</Badge>;
			case "counter":
				return <Badge variant="blue">Counter</Badge>;
			default:
				return <Badge variant="slate">User</Badge>;
		}
	};

	if (currentUser?.role !== "admin") {
		return (
			<Modal
				isOpen={isOpen}
				onClose={onClose}
				title="User Management"
				size="md"
			>
				<div className="text-center py-8">
					<Shield className="w-12 h-12 text-slate-600 mx-auto mb-4" />
					<p className="text-slate-400">Admin access required</p>
				</div>
			</Modal>
		);
	}

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="User Management" size="lg">
			<div className="space-y-4">
				{/* Add User Form */}
				{showAddForm ? (
					<div className="p-4 border border-slate-700 rounded-lg space-y-4">
						<h3 className="font-medium text-slate-200">Add New User</h3>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
							<div>
								<label className="block text-sm text-slate-400 mb-1">
									Name
								</label>
								<Input
									value={newUser.name}
									onChange={(e) =>
										setNewUser({ ...newUser, name: e.target.value })
									}
									placeholder="User name"
								/>
							</div>
							<div>
								<label className="block text-sm text-slate-400 mb-1">PIN</label>
								<Input
									value={newUser.pin}
									onChange={(e) =>
										setNewUser({ ...newUser, pin: e.target.value })
									}
									placeholder="4-6 digits"
									maxLength={6}
								/>
							</div>
							<div>
								<label className="block text-sm text-slate-400 mb-1">
									Role
								</label>
								<Select
									value={newUser.role}
									onChange={(e) =>
										setNewUser({
											...newUser,
											role: e.target.value as "admin" | "counter" | "user",
										})
									}
								>
									<option value="user">User</option>
									<option value="counter">Counter</option>
									<option value="admin">Admin</option>
								</Select>
							</div>
						</div>
						<div className="flex gap-2">
							<Button variant="secondary" onClick={() => setShowAddForm(false)}>
								Cancel
							</Button>
							<Button onClick={handleAddUser}>Add User</Button>
						</div>
					</div>
				) : (
					<Button onClick={() => setShowAddForm(true)}>
						<Plus className="w-4 h-4" />
						Add User
					</Button>
				)}

				{/* User List */}
				<div className="border border-slate-800 rounded-lg overflow-hidden">
					<table className="w-full">
						<thead>
							<tr className="bg-slate-800/50 text-slate-400 text-sm">
								<th className="text-left px-4 py-3 font-medium">Name</th>
								<th className="text-left px-4 py-3 font-medium">PIN</th>
								<th className="text-left px-4 py-3 font-medium">Role</th>
								<th className="text-left px-4 py-3 font-medium">Status</th>
								<th className="text-right px-4 py-3 font-medium">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-800">
							{users.map((user) => (
								<tr key={user.id} className="text-slate-300">
									<td className="px-4 py-3">
										<div className="flex items-center gap-2">
											<User className="w-4 h-4 text-slate-500" />
											{user.name}
											{user.id === currentUser?.id && (
												<span className="text-xs text-slate-500">(you)</span>
											)}
										</div>
									</td>
									<td className="px-4 py-3 font-mono text-slate-500">••••</td>
									<td className="px-4 py-3">{getRoleBadge(user.role)}</td>
									<td className="px-4 py-3">
										{user.active ? (
											<Badge variant="emerald">Active</Badge>
										) : (
											<Badge variant="rose">Inactive</Badge>
										)}
									</td>
									<td className="px-4 py-3 text-right">
										{user.id !== currentUser?.id && (
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleToggleActive(user.id)}
											>
												{user.active ? "Deactivate" : "Activate"}
											</Button>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				<p className="text-sm text-slate-500">
					Users log in with their PIN. Deactivated users cannot log in.
				</p>

				{/* Reset All Data Section */}
				<div className="pt-6 mt-6 border-t border-slate-800">
					<div className="bg-rose-950/20 border border-rose-900/50 rounded-lg p-4">
						<div className="flex items-start gap-3">
							<AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
							<div className="flex-1">
								<h3 className="font-medium text-rose-400 mb-1">Danger Zone</h3>
								<p className="text-sm text-slate-400 mb-3">
									Reset all data including inventory items, transactions,
									counts, and users. This action cannot be undone. The default
									admin user (PIN: 1234) will be recreated.
								</p>
								<Button
									variant="danger"
									onClick={() => setShowResetConfirm(true)}
								>
									<Trash2 className="w-4 h-4" />
									Reset All Data
								</Button>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Reset Confirmation Modal */}
			{showResetConfirm && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
					<div className="bg-slate-900 border border-slate-800 rounded-lg p-6 max-w-md mx-4">
						<div className="flex items-center gap-3 mb-4">
							<div className="w-12 h-12 bg-rose-950/50 rounded-full flex items-center justify-center">
								<AlertTriangle className="w-6 h-6 text-rose-400" />
							</div>
							<div>
								<h3 className="font-semibold text-slate-200">Confirm Reset</h3>
								<p className="text-sm text-slate-500">
									This action cannot be undone
								</p>
							</div>
						</div>
						<p className="text-slate-300 mb-6">
							Are you sure you want to reset ALL data? This will permanently
							delete:
						</p>
						<ul className="list-disc list-inside text-sm text-slate-400 mb-6 space-y-1">
							<li>All inventory items</li>
							<li>All transactions and history</li>
							<li>All count records and sessions</li>
							<li>All AI count logs</li>
							<li>All users (except default admin)</li>
							<li>All chat messages</li>
						</ul>
						<div className="flex gap-3">
							<Button
								variant="secondary"
								onClick={() => setShowResetConfirm(false)}
								disabled={isResetting}
								className="flex-1"
							>
								Cancel
							</Button>
							<Button
								variant="danger"
								onClick={handleResetAllData}
								disabled={isResetting}
								className="flex-1"
							>
								{isResetting ? (
									<>
										<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
										Resetting...
									</>
								) : (
									<>
										<Trash2 className="w-4 h-4" />
										Yes, Reset Everything
									</>
								)}
							</Button>
						</div>
					</div>
				</div>
			)}
		</Modal>
	);
}

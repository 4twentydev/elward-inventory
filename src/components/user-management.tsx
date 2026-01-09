"use client";

import { Eye, Plus, Shield, Trash2, User } from "lucide-react";
import { useEffect, useState } from "react";
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
			</div>
		</Modal>
	);
}

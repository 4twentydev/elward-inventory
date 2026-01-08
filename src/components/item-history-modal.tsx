"use client";

import { Modal } from "./ui/modal";
import { Badge } from "./ui/badge";
import { useInventory } from "./inventory-context";
import { formatDateTime } from "@/lib/utils";
import {
	ArrowDownToLine,
	ArrowUpFromLine,
	ClipboardCheck,
	Settings,
} from "lucide-react";
import type { InventoryItem, Transaction } from "@/types";

interface ItemHistoryModalProps {
	isOpen: boolean;
	onClose: () => void;
	item: InventoryItem | null;
}

function TransactionIcon({ type }: { type: Transaction["type"] }) {
	switch (type) {
		case "pull":
			return <ArrowUpFromLine className="w-4 h-4 text-rose-400" />;
		case "return":
			return <ArrowDownToLine className="w-4 h-4 text-emerald-400" />;
		case "count":
			return <ClipboardCheck className="w-4 h-4 text-blue-400" />;
		default:
			return <Settings className="w-4 h-4 text-slate-400" />;
	}
}

function TransactionBadge({ type }: { type: Transaction["type"] }) {
	switch (type) {
		case "pull":
			return <Badge variant="rose">Pull</Badge>;
		case "return":
			return <Badge variant="emerald">Return</Badge>;
		case "count":
			return <Badge variant="blue">Count</Badge>;
		default:
			return <Badge variant="slate">Adjustment</Badge>;
	}
}

export function ItemHistoryModal({ isOpen, onClose, item }: ItemHistoryModalProps) {
	const { getItemTransactions } = useInventory();

	if (!item) return null;

	const transactions = getItemTransactions(item.id);

	return (
		<Modal isOpen={isOpen} onClose={onClose} title={`History: ${item.name}`} size="lg">
			<div className="space-y-4">
				<div className="grid grid-cols-2 gap-4 text-sm">
					<div className="p-3 bg-slate-800/50 rounded-lg">
						<p className="text-slate-400">Current Quantity</p>
						<p className="text-2xl font-mono font-medium text-slate-100">
							{item.quantity}
						</p>
					</div>
					<div className="p-3 bg-slate-800/50 rounded-lg">
						<p className="text-slate-400">Last Count</p>
						<p className="text-slate-100">
							{item.lastCountDate ? formatDateTime(item.lastCountDate) : "Never"}
						</p>
						{item.lastCountBy && (
							<p className="text-slate-500 text-xs">by {item.lastCountBy}</p>
						)}
					</div>
				</div>

				<div>
					<h3 className="text-sm font-medium text-slate-300 mb-3">
						Transaction History
					</h3>

					{transactions.length === 0 ? (
						<div className="text-center py-8 text-slate-500">
							No transactions recorded yet
						</div>
					) : (
						<div className="space-y-2 max-h-[400px] overflow-y-auto">
							{transactions.map((tx) => (
								<div
									key={tx.id}
									className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg"
								>
									<div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
										<TransactionIcon type={tx.type} />
									</div>
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2 flex-wrap">
											<TransactionBadge type={tx.type} />
											<span className="font-mono text-sm">
												{tx.type === "pull" ? "-" : tx.type === "return" ? "+" : ""}
												{tx.quantity}
											</span>
											<span className="text-slate-500 text-sm">
												({tx.previousQuantity} → {tx.newQuantity})
											</span>
										</div>
										<p className="text-sm text-slate-400 mt-1">
											{tx.userName} • {formatDateTime(tx.createdAt)}
										</p>
										{tx.jobReference && (
											<p className="text-sm text-slate-500">Job: {tx.jobReference}</p>
										)}
										{tx.notes && (
											<p className="text-sm text-slate-500 mt-1">{tx.notes}</p>
										)}
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</Modal>
	);
}

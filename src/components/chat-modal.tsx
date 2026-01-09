"use client";

import { Bot, Send, Trash2, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import * as store from "@/lib/store";
import { formatDateTime } from "@/lib/utils";
import type { ChatMessage } from "@/types";
import { useInventory } from "./inventory-context";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Modal } from "./ui/modal";

interface ChatModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function ChatModal({ isOpen, onClose }: ChatModalProps) {
	const { currentUser } = useInventory();
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (currentUser) {
			const userMessages = store.getChatMessages(currentUser.id);
			setMessages(userMessages);
		}
	}, [currentUser, isOpen]);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	const handleSend = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!input.trim() || !currentUser || isLoading) return;

		const userMessage: ChatMessage = {
			id: crypto.randomUUID(),
			userId: currentUser.id,
			userName: currentUser.name,
			role: "user",
			content: input.trim(),
			createdAt: new Date().toISOString(),
		};

		store.addChatMessage(userMessage);
		setMessages((prev) => [...prev, userMessage]);
		setInput("");
		setIsLoading(true);

		// Simulate AI response (replace with actual API call if needed)
		setTimeout(() => {
			const aiMessage: ChatMessage = {
				id: crypto.randomUUID(),
				userId: currentUser.id,
				userName: currentUser.name,
				role: "assistant",
				content: `I received your message: "${input.trim()}". This is a placeholder response. You can integrate with an AI API here.`,
				createdAt: new Date().toISOString(),
			};

			store.addChatMessage(aiMessage);
			setMessages((prev) => [...prev, aiMessage]);
			setIsLoading(false);
		}, 1000);
	};

	const handleClearChat = () => {
		if (!currentUser) return;
		if (confirm("Are you sure you want to clear all chat history?")) {
			store.clearChatMessages(currentUser.id);
			setMessages([]);
		}
	};

	if (!currentUser) return null;

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Chat Assistant" size="lg">
			<div className="flex flex-col h-[600px]">
				<div className="flex-1 overflow-y-auto space-y-4 p-4 bg-slate-900/50 rounded-lg">
					{messages.length === 0 ? (
						<div className="flex flex-col items-center justify-center h-full text-center">
							<Bot className="w-16 h-16 text-slate-600 mb-4" />
							<p className="text-slate-400 text-lg">No messages yet</p>
							<p className="text-slate-500 text-sm mt-2">
								Start a conversation to get assistance
							</p>
						</div>
					) : (
						messages.map((message) => (
							<div
								key={message.id}
								className={`flex gap-3 ${
									message.role === "user" ? "justify-end" : "justify-start"
								}`}
							>
								{message.role === "assistant" && (
									<div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
										<Bot className="w-5 h-5 text-amber-500" />
									</div>
								)}
								<div
									className={`max-w-[75%] rounded-lg p-3 ${
										message.role === "user"
											? "bg-amber-500 text-slate-950"
											: "bg-slate-800 text-slate-100"
									}`}
								>
									<p className="text-sm whitespace-pre-wrap break-words">
										{message.content}
									</p>
									<p
										className={`text-xs mt-2 ${
											message.role === "user"
												? "text-slate-950/60"
												: "text-slate-500"
										}`}
									>
										{formatDateTime(message.createdAt)}
									</p>
								</div>
								{message.role === "user" && (
									<div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
										<User className="w-5 h-5 text-slate-400" />
									</div>
								)}
							</div>
						))
					)}
					<div ref={messagesEndRef} />
				</div>

				<div className="mt-4">
					<form onSubmit={handleSend} className="flex gap-2">
						<Input
							value={input}
							onChange={(e) => setInput(e.target.value)}
							placeholder="Type your message..."
							disabled={isLoading}
							inputSize="lg"
							className="flex-1"
						/>
						<Button type="submit" disabled={!input.trim() || isLoading}>
							<Send className="w-4 h-4" />
						</Button>
					</form>
				</div>

				{messages.length > 0 && (
					<div className="mt-3 flex justify-end">
						<Button
							type="button"
							variant="secondary"
							size="sm"
							onClick={handleClearChat}
						>
							<Trash2 className="w-4 h-4" />
							Clear History
						</Button>
					</div>
				)}
			</div>
		</Modal>
	);
}

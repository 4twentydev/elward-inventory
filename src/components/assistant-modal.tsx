"use client";

import { Loader2, MessageSquare, Send, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useInventory } from "./inventory-context";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Modal } from "./ui/modal";

interface Message {
	role: "user" | "assistant";
	content: string;
}

interface AssistantModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function AssistantModal({ isOpen, onClose }: AssistantModalProps) {
	const { items } = useInventory();
	const [question, setQuestion] = useState("");
	const [messages, setMessages] = useState<Message[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!question.trim() || isLoading) return;

		const userMessage: Message = { role: "user", content: question };
		setMessages((prev) => [...prev, userMessage]);
		setQuestion("");
		setIsLoading(true);
		setError(null);

		try {
			// Build conversation history for API
			const conversationHistory = messages.map((msg) => ({
				role: msg.role,
				content: msg.content,
			}));

			const response = await fetch("/api/assistant", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					question: question,
					inventory: items,
					conversationHistory: conversationHistory,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to get response");
			}

			const assistantMessage: Message = {
				role: "assistant",
				content: data.answer,
			};

			setMessages((prev) => [...prev, assistantMessage]);
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Failed to get response";
			setError(errorMessage);
			setMessages((prev) => [
				...prev,
				{
					role: "assistant",
					content: `Sorry, I encountered an error: ${errorMessage}`,
				},
			]);
		} finally {
			setIsLoading(false);
		}
	};

	const clearChat = () => {
		setMessages([]);
		setError(null);
	};

	const handleClose = () => {
		onClose();
		// Don't clear messages on close, preserve chat history
	};

	const exampleQuestions = [
		"What items are low in stock?",
		"How many ACM items do we have?",
		"What's the total value of inventory?",
		"Show me all items in warehouse A",
		"Which supplier do we order most from?",
	];

	return (
		<Modal isOpen={isOpen} onClose={handleClose} title="Inventory Assistant">
			<div className="flex flex-col h-[600px]">
				{/* Chat messages area */}
				<div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
					{messages.length === 0 ? (
						<div className="text-center py-8">
							<Sparkles className="w-12 h-12 text-blue-400 mx-auto mb-4" />
							<h3 className="text-lg font-medium text-slate-300 mb-2">
								Ask me anything about your inventory
							</h3>
							<p className="text-sm text-slate-500 mb-6">
								I can help you analyze {items.length} items, find trends, check
								stock levels, and more.
							</p>
							<div className="space-y-2">
								<p className="text-xs text-slate-600 mb-2">Try asking:</p>
								{exampleQuestions.map((q, i) => (
									<button
										key={i}
										onClick={() => setQuestion(q)}
										className="block w-full text-left px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
									>
										{q}
									</button>
								))}
							</div>
						</div>
					) : (
						<>
							{messages.map((msg, idx) => (
								<div
									key={idx}
									className={`flex ${
										msg.role === "user" ? "justify-end" : "justify-start"
									}`}
								>
									<div
										className={`max-w-[80%] rounded-lg px-4 py-2 ${
											msg.role === "user"
												? "bg-blue-600 text-white"
												: "bg-slate-800 text-slate-100"
										}`}
									>
										<div className="flex items-start gap-2">
											{msg.role === "assistant" && (
												<Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-1" />
											)}
											<p className="text-sm whitespace-pre-wrap">
												{msg.content}
											</p>
										</div>
									</div>
								</div>
							))}
							{isLoading && (
								<div className="flex justify-start">
									<div className="bg-slate-800 rounded-lg px-4 py-2">
										<Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
									</div>
								</div>
							)}
							<div ref={messagesEndRef} />
						</>
					)}
				</div>

				{/* Error message */}
				{error && (
					<div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
						<p className="text-sm text-rose-400">{error}</p>
					</div>
				)}

				{/* Input area */}
				<form onSubmit={handleSubmit} className="flex gap-2">
					<Input
						value={question}
						onChange={(e) => setQuestion(e.target.value)}
						placeholder="Ask a question about your inventory..."
						className="flex-1"
						disabled={isLoading}
					/>
					{messages.length > 0 && (
						<Button
							type="button"
							variant="ghost"
							onClick={clearChat}
							disabled={isLoading}
						>
							<Trash2 className="w-4 h-4" />
						</Button>
					)}
					<Button type="submit" disabled={!question.trim() || isLoading}>
						{isLoading ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<Send className="w-4 h-4" />
						)}
					</Button>
				</form>

				<p className="text-xs text-slate-600 mt-2 text-center">
					Powered by Claude AI • {items.length} items in context
				</p>
			</div>
		</Modal>
	);
}

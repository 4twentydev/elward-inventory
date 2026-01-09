"use client";

import { X } from "lucide-react";
import { type ReactNode, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	title?: string;
	children: ReactNode;
	size?: "sm" | "md" | "lg" | "xl";
}

export function Modal({
	isOpen,
	onClose,
	title,
	children,
	size = "md",
}: ModalProps) {
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [isOpen]);

	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		if (isOpen) {
			window.addEventListener("keydown", handleEscape);
		}
		return () => window.removeEventListener("keydown", handleEscape);
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div
				className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
				onClick={onClose}
			/>
			<div
				className={cn(
					"card relative z-10 w-full max-h-[90vh] overflow-auto border-slate-700 bg-slate-900",
					{
						"max-w-sm": size === "sm",
						"max-w-lg": size === "md",
						"max-w-2xl": size === "lg",
						"max-w-4xl": size === "xl",
					},
				)}
			>
				{title && (
					<div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
						<h2 className="text-lg font-semibold text-slate-100">{title}</h2>
						<button
							onClick={onClose}
							className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
						>
							<X className="h-5 w-5" />
						</button>
					</div>
				)}
				<div className="p-6">{children}</div>
			</div>
		</div>
	);
}

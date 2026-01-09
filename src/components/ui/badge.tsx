"use client";

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
	variant?: "amber" | "emerald" | "rose" | "blue" | "slate";
}

function Badge({
	className,
	variant = "slate",
	children,
	...props
}: BadgeProps) {
	return (
		<span
			className={cn(
				"badge",
				{
					"badge-amber": variant === "amber",
					"badge-emerald": variant === "emerald",
					"badge-rose": variant === "rose",
					"badge-blue": variant === "blue",
					"badge-slate": variant === "slate",
				},
				className,
			)}
			{...props}
		>
			{children}
		</span>
	);
}

export { Badge };

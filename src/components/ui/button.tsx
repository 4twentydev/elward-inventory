"use client";

import type { ButtonHTMLAttributes } from "react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: "primary" | "secondary" | "danger" | "ghost";
	size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{ className, variant = "primary", size = "md", children, ...props },
		ref,
	) => {
		return (
			<button
				ref={ref}
				className={cn(
					"btn",
					{
						"btn-primary": variant === "primary",
						"btn-secondary": variant === "secondary",
						"btn-danger": variant === "danger",
						"btn-ghost": variant === "ghost",
					},
					{
						"px-3 py-1.5 text-xs": size === "sm",
						"btn-lg": size === "lg",
					},
					className,
				)}
				{...props}
			>
				{children}
			</button>
		);
	},
);

Button.displayName = "Button";

export { Button };

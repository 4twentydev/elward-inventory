"use client";

import { cn } from "@/lib/utils";
import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	inputSize?: "sm" | "md" | "lg";
}

const Input = forwardRef<HTMLInputElement, InputProps>(
	({ className, inputSize = "md", ...props }, ref) => {
		return (
			<input
				ref={ref}
				className={cn(
					"input",
					{
						"input-lg": inputSize === "lg",
						"px-3 py-1.5 text-xs": inputSize === "sm",
					},
					className
				)}
				{...props}
			/>
		);
	}
);

Input.displayName = "Input";

export { Input };

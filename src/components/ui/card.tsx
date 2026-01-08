"use client";

import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
	return (
		<div className={cn("card p-4", className)} {...props}>
			{children}
		</div>
	);
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactNode;
}

export function CardHeader({ className, children, ...props }: CardHeaderProps) {
	return (
		<div className={cn("mb-4", className)} {...props}>
			{children}
		</div>
	);
}

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
	children: ReactNode;
}

export function CardTitle({ className, children, ...props }: CardTitleProps) {
	return (
		<h3 className={cn("text-lg font-semibold text-slate-100", className)} {...props}>
			{children}
		</h3>
	);
}

"use client";

import { AlertCircle, Package } from "lucide-react";
import { useState } from "react";
import { useInventory } from "./inventory-context";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function LoginScreen() {
	const { login } = useInventory();
	const [pin, setPin] = useState("");
	const [error, setError] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		const user = login(pin);
		if (!user) {
			setError("Invalid PIN. Default PIN is 1234.");
			setPin("");
		}
	};

	const handlePinInput = (digit: string) => {
		if (pin.length < 6) {
			setPin((p) => p + digit);
		}
	};

	const handleClear = () => {
		setPin("");
		setError("");
	};

	return (
		<div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
			<div className="w-full max-w-sm">
				<div className="text-center mb-8">
					<div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/20 mb-4">
						<Package className="w-8 h-8 text-amber-500" />
					</div>
					<h1 className="text-2xl font-bold text-slate-100">
						Elward Inventory
					</h1>
					<p className="text-slate-400 mt-1">Enter your PIN to continue</p>
				</div>

				<div className="card p-6 border-slate-800 bg-slate-900/80 backdrop-blur">
					<form onSubmit={handleSubmit}>
						<div className="mb-6">
							<Input
								type="password"
								value={pin}
								onChange={(e) => setPin(e.target.value)}
								placeholder="••••"
								className="text-center text-2xl tracking-[0.5em] font-mono"
								inputSize="lg"
								maxLength={6}
								autoFocus
							/>
						</div>

						{error && (
							<div className="flex items-center gap-2 text-rose-400 text-sm mb-4 p-3 bg-rose-500/10 rounded-lg border border-rose-500/20">
								<AlertCircle className="w-4 h-4 shrink-0" />
								<span>{error}</span>
							</div>
						)}

						<div className="grid grid-cols-3 gap-3 mb-6">
							{["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", ""].map(
								(digit, i) =>
									digit ? (
										<button
											key={digit}
											type="button"
											onClick={() => handlePinInput(digit)}
											className="h-14 text-xl font-medium rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 transition-colors active:scale-95"
										>
											{digit}
										</button>
									) : (
										<div key={`empty-${i}`} />
									),
							)}
						</div>

						<div className="flex gap-3">
							<Button
								type="button"
								variant="secondary"
								onClick={handleClear}
								className="flex-1"
							>
								Clear
							</Button>
							<Button
								type="submit"
								className="flex-1"
								disabled={pin.length < 4}
							>
								Login
							</Button>
						</div>
					</form>
				</div>

				<p className="text-center text-slate-500 text-sm mt-6">
					Default PIN: 1234
				</p>
			</div>
		</div>
	);
}

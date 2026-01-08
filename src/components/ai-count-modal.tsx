"use client";

import { useState, useRef } from "react";
import { Modal } from "./ui/modal";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select } from "./ui/select";
import { useInventory } from "./inventory-context";
import { Camera, Upload, Sparkles, AlertCircle, Check, Loader2 } from "lucide-react";
import * as store from "@/lib/store";

interface AICountModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function AICountModal({ isOpen, onClose }: AICountModalProps) {
	const { items, recordCount, currentUser } = useInventory();
	const [imageData, setImageData] = useState<string | null>(null);
	const [selectedItemId, setSelectedItemId] = useState<string>("");
	const [aiCount, setAiCount] = useState<number | null>(null);
	const [confirmedCount, setConfirmedCount] = useState<number | "">("");
	const [isAnalyzing, setIsAnalyzing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const extrusionItems = items.filter((item) => item.category === "Extrusions");

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (event) => {
				setImageData(event.target?.result as string);
				setAiCount(null);
				setConfirmedCount("");
				setError(null);
			};
			reader.readAsDataURL(file);
		}
	};

	const analyzeImage = async () => {
		if (!imageData) return;

		setIsAnalyzing(true);
		setError(null);

		try {
			const response = await fetch("/api/ai-count", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ image: imageData }),
			});

			if (!response.ok) {
				throw new Error("Failed to analyze image");
			}

			const data = await response.json();
			setAiCount(data.count);
			setConfirmedCount(data.count);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Analysis failed");
		} finally {
			setIsAnalyzing(false);
		}
	};

	const handleConfirm = () => {
		if (!currentUser || confirmedCount === "" || !selectedItemId) return;

		const item = items.find((i) => i.id === selectedItemId);
		if (!item) return;

		// Log the AI count
		store.addAILog({
			id: crypto.randomUUID(),
			itemId: selectedItemId,
			imageUrl: imageData || "",
			aiCount: aiCount || 0,
			confirmedCount: confirmedCount,
			userId: currentUser.id,
			userName: currentUser.name,
			profileName: item.name,
			createdAt: new Date().toISOString(),
		});

		// Record the count
		recordCount(
			selectedItemId,
			confirmedCount,
			"spot",
			`AI-assisted count. AI suggested: ${aiCount}`
		);

		handleClose();
	};

	const handleClose = () => {
		onClose();
		setImageData(null);
		setSelectedItemId("");
		setAiCount(null);
		setConfirmedCount("");
		setError(null);
	};

	return (
		<Modal isOpen={isOpen} onClose={handleClose} title="AI Bundle Counter" size="lg">
			<div className="space-y-5">
				<p className="text-slate-400 text-sm">
					Upload a photo of extrusion bundle ends and let AI count them for you.
				</p>

				{!imageData ? (
					<div className="space-y-4">
						<input
							ref={fileInputRef}
							type="file"
							accept="image/*"
							capture="environment"
							onChange={handleFileSelect}
							className="hidden"
						/>

						<div
							className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:border-slate-600 transition-colors cursor-pointer"
							onClick={() => fileInputRef.current?.click()}
						>
							<div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-slate-800 mb-4">
								<Camera className="w-7 h-7 text-slate-400" />
							</div>
							<p className="text-slate-300 mb-2">Take a photo or upload an image</p>
							<p className="text-sm text-slate-500">
								Best results with clear, well-lit photos of bundle ends
							</p>
						</div>

						<div className="flex gap-3">
							<Button
								variant="secondary"
								onClick={() => fileInputRef.current?.click()}
								className="flex-1"
							>
								<Upload className="w-4 h-4" />
								Upload Image
							</Button>
							<Button
								onClick={() => {
									if (fileInputRef.current) {
										fileInputRef.current.setAttribute("capture", "environment");
										fileInputRef.current.click();
									}
								}}
								className="flex-1"
							>
								<Camera className="w-4 h-4" />
								Take Photo
							</Button>
						</div>
					</div>
				) : (
					<div className="space-y-4">
						<div className="relative rounded-lg overflow-hidden bg-slate-800">
							<img
								src={imageData}
								alt="Bundle to count"
								className="w-full h-auto max-h-64 object-contain"
							/>
							<button
								onClick={() => {
									setImageData(null);
									setAiCount(null);
									setConfirmedCount("");
								}}
								className="absolute top-2 right-2 px-3 py-1 bg-slate-900/80 rounded-lg text-sm text-slate-300 hover:bg-slate-900"
							>
								Change Image
							</button>
						</div>

						{!aiCount && !isAnalyzing && (
							<Button onClick={analyzeImage} className="w-full" size="lg">
								<Sparkles className="w-4 h-4" />
								Analyze with AI
							</Button>
						)}

						{isAnalyzing && (
							<div className="flex items-center justify-center gap-3 py-4">
								<Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
								<span className="text-slate-300">Analyzing image...</span>
							</div>
						)}

						{error && (
							<div className="flex items-center gap-2 text-rose-400 text-sm p-3 bg-rose-500/10 rounded-lg border border-rose-500/20">
								<AlertCircle className="w-4 h-4 shrink-0" />
								<span>{error}</span>
							</div>
						)}

						{aiCount !== null && (
							<>
								<div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
									<div className="flex items-center gap-2 mb-2">
										<Sparkles className="w-4 h-4 text-amber-400" />
										<span className="text-sm font-medium text-amber-400">
											AI Count Result
										</span>
									</div>
									<p className="text-3xl font-mono font-bold text-slate-100">
										{aiCount}
									</p>
									<p className="text-sm text-slate-400 mt-1">
										extrusion ends detected
									</p>
								</div>

								<div>
									<label className="block text-sm font-medium text-slate-300 mb-1.5">
										Confirm or Adjust Count
									</label>
									<Input
										type="number"
										value={confirmedCount}
										onChange={(e) =>
											setConfirmedCount(
												e.target.value === "" ? "" : Number(e.target.value)
											)
										}
										min={0}
										className="text-xl font-mono"
										inputSize="lg"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-slate-300 mb-1.5">
										Associate with Extrusion Profile
									</label>
									<Select
										value={selectedItemId}
										onChange={(e) => setSelectedItemId(e.target.value)}
										selectSize="lg"
									>
										<option value="">Select a profile...</option>
										{extrusionItems.map((item) => (
											<option key={item.id} value={item.id}>
												{item.name} (Current: {item.quantity})
											</option>
										))}
									</Select>
								</div>

								<div className="flex gap-3 pt-2">
									<Button variant="secondary" onClick={handleClose} className="flex-1">
										Cancel
									</Button>
									<Button
										onClick={handleConfirm}
										className="flex-1"
										disabled={confirmedCount === "" || !selectedItemId}
									>
										<Check className="w-4 h-4" />
										Save Count
									</Button>
								</div>
							</>
						)}
					</div>
				)}

				<div className="border-t border-slate-800 pt-4">
					<h4 className="text-sm font-medium text-slate-300 mb-2">Tips for best results</h4>
					<ul className="text-sm text-slate-500 space-y-1">
						<li>• Position camera directly above the bundle ends</li>
						<li>• Ensure good, even lighting without harsh shadows</li>
						<li>• Keep the camera steady and in focus</li>
						<li>• Make sure all extrusion ends are visible</li>
					</ul>
				</div>
			</div>
		</Modal>
	);
}

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const { image } = await request.json();

		if (!image) {
			return NextResponse.json({ error: "No image provided" }, { status: 400 });
		}

		// Check for API key
		const apiKey = process.env.ANTHROPIC_API_KEY;

		if (!apiKey) {
			// Return a simulated count for demo purposes
			console.log("No ANTHROPIC_API_KEY found, using demo mode");
			const simulatedCount = Math.floor(Math.random() * 20) + 5;
			return NextResponse.json({
				count: simulatedCount,
				confidence: "demo",
				message: "Demo mode - add ANTHROPIC_API_KEY for real AI counting",
			});
		}

		// Extract base64 data from data URL
		const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
		const mediaType = image.match(/^data:(image\/\w+);base64,/)?.[1] || "image/jpeg";

		// Call Claude API with vision
		const response = await fetch("https://api.anthropic.com/v1/messages", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": apiKey,
				"anthropic-version": "2023-06-01",
			},
			body: JSON.stringify({
				model: "claude-sonnet-4-20250514",
				max_tokens: 1024,
				messages: [
					{
						role: "user",
						content: [
							{
								type: "image",
								source: {
									type: "base64",
									media_type: mediaType,
									data: base64Data,
								},
							},
							{
								type: "text",
								text: `You are analyzing an image of extrusion bundle ends for inventory counting.

Count the number of distinct extrusion/profile ends visible in this image. These are typically circular, square, or rectangular cross-sections of aluminum extrusions bundled together.

Instructions:
1. Look for the distinct end profiles of each extrusion
2. Count each separate extrusion end you can see
3. If ends are partially obscured, make your best estimate
4. Focus only on the extrusion ends, ignore any background elements

Respond with ONLY a JSON object in this exact format:
{"count": <number>, "confidence": "high" | "medium" | "low", "notes": "<brief observation>"}

Do not include any other text before or after the JSON.`,
							},
						],
					},
				],
			}),
		});

		if (!response.ok) {
			const error = await response.text();
			console.error("Claude API error:", error);
			throw new Error("Failed to analyze image");
		}

		const data = await response.json();
		const textContent = data.content.find((c: any) => c.type === "text");

		if (!textContent) {
			throw new Error("No response from AI");
		}

		// Parse the JSON response
		try {
			const result = JSON.parse(textContent.text);
			return NextResponse.json(result);
		} catch {
			// If JSON parsing fails, try to extract the count
			const countMatch = textContent.text.match(/(\d+)/);
			if (countMatch) {
				return NextResponse.json({
					count: parseInt(countMatch[1], 10),
					confidence: "low",
					notes: "Extracted from non-JSON response",
				});
			}
			throw new Error("Could not parse AI response");
		}
	} catch (error) {
		console.error("AI count error:", error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Analysis failed" },
			{ status: 500 }
		);
	}
}

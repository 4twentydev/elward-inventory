import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const { question, inventory, conversationHistory } = await request.json();

		if (!question) {
			return NextResponse.json(
				{ error: "No question provided" },
				{ status: 400 },
			);
		}

		if (!inventory || !Array.isArray(inventory)) {
			return NextResponse.json(
				{ error: "No inventory data provided" },
				{ status: 400 },
			);
		}

		// Check for API key
		const apiKey = process.env.ANTHROPIC_API_KEY;

		if (!apiKey) {
			return NextResponse.json(
				{
					answer:
						"Sorry, the AI assistant is not configured. Please add ANTHROPIC_API_KEY to your environment variables.",
					error: "API key not configured",
				},
				{ status: 503 },
			);
		}

		// Prepare inventory data summary
		const inventorySummary = inventory.map((item: any) => ({
			name: item.name,
			category: item.category,
			quantity: item.quantity,
			location: item.location || "N/A",
			supplier: item.supplier || "N/A",
			sku: item.sku || "N/A",
			reorderLevel: item.reorderLevel || 0,
			unitCost: item.unitCost || "N/A",
			notes: item.notes || "",
		}));

		// Build conversation messages
		const messages: any[] = [];

		// Add conversation history if exists
		if (conversationHistory && Array.isArray(conversationHistory)) {
			messages.push(...conversationHistory);
		}

		// Add current question with inventory context
		messages.push({
			role: "user",
			content: `You are an inventory management assistant for Elward Systems Corporation. You have access to the current inventory data and can answer questions about it.

Current inventory data (${inventory.length} items):
${JSON.stringify(inventorySummary, null, 2)}

User question: ${question}

Please provide a helpful, concise answer based on the inventory data. If you're analyzing quantities, totals, or trends, be specific with numbers. If the question requires calculations, show your work.`,
		});

		// Call Claude API
		const response = await fetch("https://api.anthropic.com/v1/messages", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": apiKey,
				"anthropic-version": "2023-06-01",
			},
			body: JSON.stringify({
				model: "claude-sonnet-4-20250514",
				max_tokens: 2048,
				messages: messages,
			}),
		});

		if (!response.ok) {
			const error = await response.text();
			console.error("Claude API error:", error);
			throw new Error("Failed to get response from AI");
		}

		const data = await response.json();
		const textContent = data.content.find((c: any) => c.type === "text");

		if (!textContent) {
			throw new Error("No response from AI");
		}

		return NextResponse.json({
			answer: textContent.text,
		});
	} catch (error) {
		console.error("AI assistant error:", error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Assistant failed" },
			{ status: 500 },
		);
	}
}

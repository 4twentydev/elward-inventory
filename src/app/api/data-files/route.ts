import * as fs from "node:fs";
import * as path from "node:path";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { parseExcelFile } from "@/lib/import-export";

const DATA_DIR = path.join(process.cwd(), "data");

export async function GET() {
	try {
		if (!fs.existsSync(DATA_DIR)) {
			return NextResponse.json({ files: [] });
		}

		const files = fs.readdirSync(DATA_DIR).filter((file) => {
			const ext = path.extname(file).toLowerCase();
			return [".xlsx", ".xls", ".csv"].includes(ext);
		});

		return NextResponse.json({ files });
	} catch (error) {
		console.error("Error listing data files:", error);
		return NextResponse.json(
			{ error: "Failed to list files" },
			{ status: 500 },
		);
	}
}

export async function POST(request: Request) {
	try {
		const { filename } = await request.json();

		if (!filename || typeof filename !== "string") {
			return NextResponse.json(
				{ error: "Filename is required" },
				{ status: 400 },
			);
		}

		// Sanitize filename to prevent path traversal
		const sanitizedFilename = path.basename(filename);
		const filePath = path.join(DATA_DIR, sanitizedFilename);

		if (!fs.existsSync(filePath)) {
			return NextResponse.json({ error: "File not found" }, { status: 404 });
		}

		const buffer = fs.readFileSync(filePath);
		const arrayBuffer = buffer.buffer.slice(
			buffer.byteOffset,
			buffer.byteOffset + buffer.byteLength,
		);

		const result = parseExcelFile(arrayBuffer as ArrayBuffer);

		return NextResponse.json(result);
	} catch (error) {
		console.error("Error parsing data file:", error);
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Failed to parse file",
			},
			{ status: 500 },
		);
	}
}

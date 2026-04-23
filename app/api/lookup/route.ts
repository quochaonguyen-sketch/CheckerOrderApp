import { NextResponse } from "next/server";
import { z } from "zod";

import { findOrderByCode } from "@/lib/googleSheets";
import { normalizeCode } from "@/lib/normalize";
import type { LookupErrorResponse, LookupResponse } from "@/types/lookup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const lookupRequestSchema = z.object({
  code: z.string().trim().min(1, "Mã quét không được để trống."),
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json<LookupErrorResponse>(
      { error: "Body JSON không hợp lệ." },
      { status: 400 }
    );
  }

  const parsed = lookupRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json<LookupErrorResponse>(
      { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ." },
      { status: 400 }
    );
  }

  try {
    const normalizedCode = normalizeCode(parsed.data.code);
    const order = await findOrderByCode(normalizedCode);

    if (!order) {
      return NextResponse.json<LookupResponse>({
        found: false,
        message: "Không tìm thấy đơn",
      });
    }

    return NextResponse.json<LookupResponse>({
      found: true,
      data: order,
    });
  } catch (error) {
    console.error("Lookup failed", error);

    return NextResponse.json<LookupErrorResponse>(
      { error: "Không thể tra cứu Google Sheets. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}

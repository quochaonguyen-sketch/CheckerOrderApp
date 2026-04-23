import { google } from "googleapis";
import { z } from "zod";

import { normalizeCode, normalizeOptionalCell } from "@/lib/normalize";
import type { OrderLocation } from "@/types/lookup";

const envSchema = z.object({
  GOOGLE_CLIENT_EMAIL: z.string().email(),
  GOOGLE_PRIVATE_KEY: z.string().min(1),
  GOOGLE_SHEETS_SPREADSHEET_ID: z.string().min(1),
  GOOGLE_SHEETS_SHEET_NAME: z.string().min(1),
  GOOGLE_SHEETS_CACHE_TTL_MS: z.coerce.number().int().positive().optional(),
});

type CachedRows = {
  expiresAt: number;
  rows: string[][];
};

type SheetLayout = {
  headerRowIndex: number | null;
  codeIndex: number;
  zoneIndex: number | null;
  districtIndex: number | null;
  wardIndex: number | null;
  cityIndex: number | null;
  areaIndex: number | null;
  noteIndex: number | null;
};

let cachedRows: CachedRows | null = null;

function getGoogleSheetsConfig() {
  const parsed = envSchema.safeParse({
    GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL,
    GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY,
    GOOGLE_SHEETS_SPREADSHEET_ID: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
    GOOGLE_SHEETS_SHEET_NAME: process.env.GOOGLE_SHEETS_SHEET_NAME,
    GOOGLE_SHEETS_CACHE_TTL_MS: process.env.GOOGLE_SHEETS_CACHE_TTL_MS,
  });

  if (!parsed.success) {
    throw new Error(
      "Thiếu hoặc sai biến môi trường Google Sheets. Kiểm tra .env.local."
    );
  }

  return {
    ...parsed.data,
    GOOGLE_PRIVATE_KEY: parsed.data.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    GOOGLE_SHEETS_CACHE_TTL_MS: parsed.data.GOOGLE_SHEETS_CACHE_TTL_MS ?? 10000,
  };
}

function quoteSheetName(sheetName: string): string {
  return `'${sheetName.replace(/'/g, "''")}'`;
}

function createSheetsClient() {
  const config = getGoogleSheetsConfig();
  const auth = new google.auth.JWT({
    email: config.GOOGLE_CLIENT_EMAIL,
    key: config.GOOGLE_PRIVATE_KEY,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  return {
    config,
    sheets: google.sheets({ version: "v4", auth }),
  };
}

async function getRows(): Promise<string[][]> {
  const { config, sheets } = createSheetsClient();
  const now = Date.now();

  if (cachedRows && cachedRows.expiresAt > now) {
    return cachedRows.rows;
  }

  const range = `${quoteSheetName(config.GOOGLE_SHEETS_SHEET_NAME)}!A:M`;
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: config.GOOGLE_SHEETS_SPREADSHEET_ID,
    range,
    majorDimension: "ROWS",
  });

  const rows = (response.data.values ?? []) as string[][];
  cachedRows = {
    rows,
    expiresAt: now + config.GOOGLE_SHEETS_CACHE_TTL_MS,
  };

  return rows;
}

function normalizeHeader(value: unknown): string {
  return normalizeOptionalCell(value).toLowerCase();
}

function findHeaderIndex(headers: string[], names: string[]): number | null {
  const index = headers.findIndex((header) => names.includes(header));
  return index >= 0 ? index : null;
}

function getCell(row: string[], index: number | null): string {
  if (index === null) {
    return "";
  }

  return normalizeOptionalCell(row[index]);
}

function resolveSheetLayout(rows: string[][]): SheetLayout {
  const headerRowIndex = rows.findIndex((row) => {
    const headers = row.map(normalizeHeader);
    return headers.includes("shipment_id") || headers.includes("code");
  });

  if (headerRowIndex >= 0) {
    const headers = rows[headerRowIndex].map(normalizeHeader);

    return {
      headerRowIndex,
      codeIndex: findHeaderIndex(headers, ["shipment_id", "code"]) ?? 0,
      zoneIndex: findHeaderIndex(headers, ["zone"]),
      districtIndex: findHeaderIndex(headers, ["district"]),
      wardIndex:
        findHeaderIndex(headers, ["phuong_moi", "ward", "seller_phuong_moi"]) ??
        null,
      cityIndex: findHeaderIndex(headers, ["city", "province"]),
      areaIndex: findHeaderIndex(headers, ["area"]),
      noteIndex: findHeaderIndex(headers, ["note", "status"]),
    };
  }

  // Fallback layout theo MVP ban đầu: A code, B district, C ward, D city, E note.
  return {
    headerRowIndex: null,
    codeIndex: 0,
    zoneIndex: null,
    districtIndex: 1,
    wardIndex: 2,
    cityIndex: 3,
    areaIndex: null,
    noteIndex: 4,
  };
}

function rowToOrderLocation(
  row: string[],
  fallbackCode: string,
  layout: SheetLayout
): OrderLocation {
  const area = getCell(row, layout.areaIndex);

  return {
    code: normalizeCode(getCell(row, layout.codeIndex) || fallbackCode),
    zone: getCell(row, layout.zoneIndex),
    district: getCell(row, layout.districtIndex),
    ward: getCell(row, layout.wardIndex),
    city: getCell(row, layout.cityIndex),
    area,
    note: getCell(row, layout.noteIndex) || area,
  };
}

export async function findOrderByCode(code: string): Promise<OrderLocation | null> {
  const normalizedCode = normalizeCode(code);

  if (!normalizedCode) {
    return null;
  }

  const rows = await getRows();
  const layout = resolveSheetLayout(rows);
  const dataRows =
    layout.headerRowIndex === null ? rows : rows.slice(layout.headerRowIndex + 1);

  for (const row of dataRows) {
    const rowCode = normalizeCode(getCell(row, layout.codeIndex));

    if (rowCode === normalizedCode) {
      return rowToOrderLocation(row, normalizedCode, layout);
    }
  }

  return null;
}

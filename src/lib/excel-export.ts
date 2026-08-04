/**
 * Excel export utility — generates professional .xlsx files with multiple sheets,
 * styled headers, number formats (currency / percent), banded rows, and frozen panes.
 *
 * Uses ExcelJS (server-safe, also runs in browser via Blob).
 */

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// ─── Brand palette ────────────────────────────────────────────────────────
const COLOR = {
  headerBg: 'FF0F0F1A',         // dark navy (brand)
  headerFg: 'FFFFFFFF',          // white
  accent: 'FFD4AF37',            // gold accent
  bandEven: 'FFF8F9FB',          // very light gray
  bandOdd: 'FFFFFFFF',           // white
  titleFg: 'FF0F0F1A',           // dark navy
  sectionBg: 'FFE63946',         // red brand
  sectionFg: 'FFFFFFFF',         // white
  positiveDelta: 'FF06D6A0',     // green
  negativeDelta: 'FFE63946',     // red
  borderLight: 'FFE5E7EB',
};

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
  fmt?: string;       // Excel number format: '#,##0.00 "S/"', '0.0%', etc.
  bold?: boolean;
}

export interface ExcelSheet {
  name: string;            // <= 31 chars, no special chars [\\/?*[]:]
  title?: string;          // Optional big title row above headers
  subtitle?: string;       // Optional smaller subtitle row
  columns: ExcelColumn[];
  rows: Array<Record<string, any>>;
  /** Optional: column index (1-based) to use for delta color coding */
  deltaColumn?: string;
}

export interface ExcelWorkbookOptions {
  filename: string;        // without extension
  sheets: ExcelSheet[];
  /** Optional: organization name shown in subtitle */
  organization?: string;
  /** Optional: period label (e.g., "Últimos 30 días") */
  period?: string;
}

/**
 * Generates and downloads a professional .xlsx workbook with multiple sheets.
 */
export async function exportWorkbook(opts: ExcelWorkbookOptions): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'MenuPro';
  wb.created = new Date();
  wb.modified = new Date();
  wb.properties.date1904 = false;

  for (const sheetSpec of opts.sheets) {
    const sheet = wb.addWorksheet(safeSheetName(sheetSpec.name), {
      views: [{ state: 'frozen', ySplit: 1, xSplit: 0 }],
      pageSetup: { fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    });

    // Define columns
    sheet.columns = sheetSpec.columns.map((c) => ({
      header: c.header,
      key: c.key,
      width: c.width ?? 22,
    }));

    // Style header row
    const headerRow = sheet.getRow(1);
    headerRow.height = 32;
    headerRow.eachCell((cell, colNumber) => {
      const col = sheetSpec.columns[colNumber - 1];
      cell.value = col.header;
      cell.font = {
        name: 'Calibri',
        size: 11,
        bold: true,
        color: { argb: COLOR.headerFg },
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLOR.headerBg },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      cell.border = {
        bottom: { style: 'medium', color: { argb: COLOR.accent } },
      };
    });

    // Data rows with banded styling + number formats
    sheetSpec.rows.forEach((rowData, idx) => {
      const row = sheet.addRow(rowData);
      const isEven = idx % 2 === 0;
      row.height = 22;

      row.eachCell((cell, colNumber) => {
        const col = sheetSpec.columns[colNumber - 1];
        // Banded background
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isEven ? COLOR.bandEven : COLOR.bandOdd },
        };
        cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
        cell.font = {
          name: 'Calibri',
          size: 11,
          color: { argb: COLOR.titleFg },
        };
        cell.border = {
          bottom: { style: 'thin', color: { argb: COLOR.borderLight } },
        };
        // Number format
        if (col.fmt) {
          cell.numFmt = col.fmt;
        }
        // Bold?
        if (col.bold) {
          cell.font = { ...cell.font, bold: true };
        }
        // Delta color coding
        if (col.key === sheetSpec.deltaColumn && typeof cell.value === 'number') {
          if (cell.value > 0) {
            cell.font = { ...cell.font, color: { argb: COLOR.positiveDelta }, bold: true };
          } else if (cell.value < 0) {
            cell.font = { ...cell.font, color: { argb: COLOR.negativeDelta }, bold: true };
          }
        }
      });
    });

    // Auto-filter on header row
    if (sheetSpec.rows.length > 0) {
      sheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: sheetSpec.columns.length },
      };
    }

    // Add title rows BEFORE header (insert at top)
    if (sheetSpec.title || sheetSpec.subtitle) {
      // Insert two empty rows at the top, then fill them in
      sheet.spliceRows(1, 0, [], []);
      const titleCell = sheet.getCell('A1');
      titleCell.value = sheetSpec.title || '';
      titleCell.font = {
        name: 'Calibri',
        size: 18,
        bold: true,
        color: { argb: COLOR.titleFg },
      };
      titleCell.alignment = { vertical: 'middle', horizontal: 'left' };

      const subCell = sheet.getCell('A2');
      subCell.value = sheetSpec.subtitle || '';
      subCell.font = {
        name: 'Calibri',
        size: 11,
        italic: true,
        color: { argb: 'FF6B7280' },
      };

      // Merge title row across all columns
      const colCount = sheetSpec.columns.length;
      sheet.mergeCells(1, 1, 1, colCount);
      sheet.mergeCells(2, 1, 2, colCount);

      // Adjust frozen pane (skip title + subtitle rows)
      sheet.views = [{ state: 'frozen', ySplit: 3, xSplit: 0 }];

      // Set row heights for title/subtitle
      sheet.getRow(1).height = 28;
      sheet.getRow(2).height = 18;
    }
  }

  // Generate buffer and trigger download
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const stamp = new Date().toISOString().slice(0, 10);
  saveAs(blob, `${opts.filename}-${stamp}.xlsx`);
}

/**
 * Sanitize sheet name to comply with Excel constraints:
 *  - Max 31 chars
 *  - No chars: \ / ? * [ ] :
 */
function safeSheetName(name: string): string {
  const cleaned = name.replace(/[\\/?*[\]:]/g, '').trim();
  return cleaned.length > 31 ? cleaned.slice(0, 31) : cleaned || 'Hoja 1';
}

// ─── Number format presets ─────────────────────────────────────────────────
export const FMT = {
  PEN: '#,##0.00 "S/"',           // 1,234.50 S/
  USD: '#,##0.00 "$"',
  INT: '#,##0',                    // 1,234
  PCT: '0.0%',                     // 12.3%
  PCT_INT: '0%',                   // 12%
  DATE: 'dd/mm/yyyy',
  DATETIME: 'dd/mm/yyyy hh:mm',
};

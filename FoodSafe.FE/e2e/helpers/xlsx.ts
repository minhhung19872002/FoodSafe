import { zipSync, strToU8 } from "fflate";

/**
 * Tạo workbook .xlsx tối thiểu (inline string, một sheet) để kiểm thử luồng
 * import thật. Dùng thay cho việc commit file nhị phân vào repo — nội dung
 * sinh động theo từng lần chạy nên không đụng dữ liệu của lần chạy trước.
 */
export function buildXlsx(sheetName: string, rows: string[][]): Buffer {
  const files: Record<string, Uint8Array> = {
    "[Content_Types].xml": strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
        "</Types>",
    ),
    "_rels/.rels": strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
        "</Relationships>",
    ),
    "xl/workbook.xml": strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"' +
        ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
        `<sheets><sheet name="${escapeXml(sheetName)}" sheetId="1" r:id="rId1"/></sheets>` +
        "</workbook>",
    ),
    "xl/_rels/workbook.xml.rels": strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
        "</Relationships>",
    ),
    "xl/worksheets/sheet1.xml": strToU8(buildSheetXml(rows)),
  };

  return Buffer.from(zipSync(files));
}

function buildSheetXml(rows: string[][]): string {
  const body = rows
    .map((cells, rowIndex) => {
      const rowNumber = rowIndex + 1;
      const cellXml = cells
        .map((value, columnIndex) =>
          value === ""
            ? ""
            : `<c r="${columnRef(columnIndex)}${rowNumber}" t="inlineStr">` +
              `<is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`,
        )
        .join("");
      return `<row r="${rowNumber}">${cellXml}</row>`;
    })
    .join("");

  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    `<sheetData>${body}</sheetData></worksheet>`
  );
}

function columnRef(zeroBasedIndex: number): string {
  let index = zeroBasedIndex;
  let reference = "";
  do {
    reference = String.fromCharCode(65 + (index % 26)) + reference;
    index = Math.floor(index / 26) - 1;
  } while (index >= 0);
  return reference;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

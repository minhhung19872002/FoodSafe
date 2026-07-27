/** Opens a print window with the given HTML body (Times New Roman, A4-ish). */
export function printHtml(title: string, bodyHtml: string): void {
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) return;
  printWindow.document.write(`<!doctype html><html><head><title>${title}</title>
    <style>body{font-family:'Times New Roman',serif;padding:32px;line-height:1.6}
    h2,h3{text-align:center}p{margin:6px 0}</style>
    </head><body>${bodyHtml}</body></html>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

export function escapeHtml(value: string | null | undefined): string {
  return (value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Exports the first SVG chart found inside a container element as a PNG file.
 * Works for Recharts output without extra dependencies.
 */
export function downloadChartAsPng(
  container: HTMLElement,
  fileName: string,
): Promise<void> {
  const svg = container.querySelector("svg");
  if (!svg) {
    return Promise.reject(new Error("No chart found in container"));
  }

  const rect = svg.getBoundingClientRect();
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("width", String(rect.width));
  clone.setAttribute("height", String(rect.height));
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

  const markup = new XMLSerializer().serializeToString(clone);
  // Use a data: URI rather than a blob: URL: the app's Content Security Policy
  // allows `img-src ... data:` but not `blob:`, so a blob URL is rejected before
  // the image can load and the export silently fails. encodeURIComponent keeps
  // the Vietnamese chart labels intact through the UTF-8 payload.
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = 2;
      canvas.width = rect.width * scale;
      canvas.height = rect.height * scale;
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Canvas unsupported"));
        return;
      }
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.scale(scale, scale);
      context.drawImage(image, 0, 0, rect.width, rect.height);
      canvas.toBlob((pngBlob) => {
        if (!pngBlob) {
          reject(new Error("PNG conversion failed"));
          return;
        }
        const pngUrl = URL.createObjectURL(pngBlob);
        const anchor = document.createElement("a");
        anchor.href = pngUrl;
        anchor.download = fileName;
        anchor.click();
        URL.revokeObjectURL(pngUrl);
        resolve();
      }, "image/png");
    };
    image.onerror = () => {
      reject(new Error("SVG rasterization failed"));
    };
    image.src = url;
  });
}

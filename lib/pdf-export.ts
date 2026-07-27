export function applyStyles(
  element: HTMLElement,
  styles: Partial<CSSStyleDeclaration>
) {
  Object.assign(element.style, styles);
}

export function createTextElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  text: string,
  styles: Partial<CSSStyleDeclaration> = {}
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);
  element.textContent = text;
  applyStyles(element, styles);
  return element;
}

export function slugifyFilename(value: string): string {
  const base = value.trim().toLowerCase();
  if (!base) return "resume";
  return base
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// html2canvas + jsPDF are ~500KB combined — only fetched when a PDF is
// actually requested, not bundled into the page's initial JS.
export async function renderNodeToPdf(
  node: HTMLElement,
  filename: string
): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  applyStyles(node, { position: "fixed", left: "-10000px", top: "0", zIndex: "-1" });
  document.body.appendChild(node);

  try {
    const canvas = await html2canvas(node, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#13141A",
      logging: false,
      onclone: (clonedDocument) => {
        clonedDocument
          .querySelectorAll("style, link[rel='stylesheet']")
          .forEach((el) => el.remove());
      },
    });

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 8;
    const contentWidth = pageWidth - margin * 2;
    const contentHeight = pageHeight - margin * 2;
    const pxPerMm = canvas.width / contentWidth;
    const pageHeightPx = Math.floor(contentHeight * pxPerMm);

    let offsetY = 0;
    let page = 0;

    while (offsetY < canvas.height) {
      const sliceHeightPx = Math.min(pageHeightPx, canvas.height - offsetY);
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeightPx;
      const context = pageCanvas.getContext("2d");
      if (!context) throw new Error("Не удалось подготовить PDF");
      context.drawImage(
        canvas,
        0,
        offsetY,
        canvas.width,
        sliceHeightPx,
        0,
        0,
        canvas.width,
        sliceHeightPx
      );

      if (page > 0) pdf.addPage();
      pdf.addImage(
        pageCanvas.toDataURL("image/png", 1),
        "PNG",
        margin,
        margin,
        contentWidth,
        sliceHeightPx / pxPerMm,
        undefined,
        "FAST"
      );

      offsetY += sliceHeightPx;
      page += 1;
    }

    pdf.save(`${filename}.pdf`);
  } finally {
    node.remove();
  }
}

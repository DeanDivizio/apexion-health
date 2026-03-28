import { PDFDocument } from "pdf-lib";

const DEFAULT_PAGES_PER_CHUNK = 3;

/**
 * Splits a PDF (provided as a base64 data URL) into smaller PDF chunks,
 * each returned as a base64 data URL ready for LLM consumption.
 */
export async function splitPdfDataUrl(
  dataUrl: string,
  pagesPerChunk = DEFAULT_PAGES_PER_CHUNK,
): Promise<string[]> {
  const base64Match = dataUrl.match(/^data:application\/pdf;base64,(.+)$/i);
  if (!base64Match) {
    return [dataUrl];
  }

  const pdfBytes = Buffer.from(base64Match[1], "base64");
  const srcDoc = await PDFDocument.load(pdfBytes);
  const totalPages = srcDoc.getPageCount();

  if (totalPages <= pagesPerChunk) {
    return [dataUrl];
  }

  const chunks: string[] = [];

  for (let start = 0; start < totalPages; start += pagesPerChunk) {
    const end = Math.min(start + pagesPerChunk, totalPages);
    const indices = Array.from({ length: end - start }, (_, i) => start + i);

    const chunkDoc = await PDFDocument.create();
    const copiedPages = await chunkDoc.copyPages(srcDoc, indices);
    for (const page of copiedPages) {
      chunkDoc.addPage(page);
    }

    const chunkBytes = await chunkDoc.save();
    const chunkBase64 = Buffer.from(chunkBytes).toString("base64");
    chunks.push(`data:application/pdf;base64,${chunkBase64}`);
  }

  return chunks;
}

export function getPdfPageCount(dataUrl: string): Promise<number> {
  const base64Match = dataUrl.match(/^data:application\/pdf;base64,(.+)$/i);
  if (!base64Match) return Promise.resolve(0);
  const pdfBytes = Buffer.from(base64Match[1], "base64");
  return PDFDocument.load(pdfBytes).then((doc) => doc.getPageCount());
}

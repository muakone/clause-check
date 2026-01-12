export async function extractPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();

  // Use pdfjs-dist for proper text extraction. If this fails or no text is
  // extractable, propagate an error so the UI can show a clear message
  // instead of rendering unreadable binary content.
  try {
    const [pdfjsLib, pdfWorker] = await Promise.all([
      import("pdfjs-dist/build/pdf"),
      import("pdfjs-dist/build/pdf.worker.min.mjs"),
    ]);

    const data = new Uint8Array(arrayBuffer);

    const anyPdfjs: any = pdfjsLib;
    if (
      anyPdfjs.GlobalWorkerOptions &&
      !anyPdfjs.GlobalWorkerOptions.workerSrc
    ) {
      anyPdfjs.GlobalWorkerOptions.workerSrc = (pdfWorker as any).default;
    }

    const loadingTask = anyPdfjs.getDocument({ data });
    const pdf = await loadingTask.promise;

    let fullText = "";

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();

      const pageText = content.items
        .map((item: any) => (typeof item.str === "string" ? item.str : ""))
        .join(" ");

      fullText += pageText + "\n\n";
    }

    const trimmed = fullText.trim();
    if (!trimmed) {
      throw new Error("No extractable text found in PDF");
    }

    return trimmed;
  } catch (error) {
    console.error("PDF text extraction failed", error);
    throw error;
  }
}

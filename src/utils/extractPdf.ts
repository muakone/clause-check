export async function extractPdf(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/extract-pdf", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? "PDF extraction failed"
    );
  }

  const { text } = (await response.json()) as { text: string };
  if (!text?.trim()) {
    throw new Error("No extractable text found in PDF");
  }

  return text;
}

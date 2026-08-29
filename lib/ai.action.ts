import puter from "@heyputer/puter.js";
import { ROOMIFY_RENDER_PROMPT } from "./constants";

/**
 * Fetches an image from a URL and converts it to a base64 data URL.
 * @param url - The URL of the image to fetch.
 * @returns A promise that resolves to a base64-encoded data URL string.
 * @throws Error if the fetch operation fails.
 */
export const fetchAsDataUrl = async (url: string): Promise<string> => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fectch image: ${response.statusText}`);
  }

  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Generates a 3D architectural visualization from a 2D floor plan using AI.
 * Uses Puter's AI service with Gemini model to transform the source image.
 * @param params - The generation parameters.
 * @param params.sourceImage - The source floor plan image (data URL or URL).
 * @returns A promise that resolves to an object containing the rendered image and path.
 * @throws Error if the source image is invalid or generation fails.
 */
export const generate3DView = async ({ sourceImage }: Generate3DViewParams) => {
  const dataUrl = sourceImage.startsWith("data")
    ? sourceImage
    : await fetchAsDataUrl(sourceImage);

  const base64Data = dataUrl.split(",")[1];
  const mimeType = dataUrl.split(";")[0].split(":")[1];

  if (!mimeType || !base64Data) {
    throw new Error("Invalid source image payload");
  }

  const response = await puter.ai.txt2img(ROOMIFY_RENDER_PROMPT, {
    provider: "gemini",
    model: "gemini-3.1-flash-image-preview",
    input_image: base64Data,
    input_image_mime_type: mimeType,
    ratio: { w: 1024, h: 1024 },
  });

  const rawImageUrl = (response as HTMLImageElement).src ?? null;

  if (!rawImageUrl) return { renderedImage: null, renderedPath: undefined };

  const renderedImage = rawImageUrl.startsWith("data:")
    ? rawImageUrl
    : await fetchAsDataUrl(rawImageUrl);

  return { renderedImage, renderedPath: undefined };
};

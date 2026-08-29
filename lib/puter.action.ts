import puter from "@heyputer/puter.js";
import {
  getOrCreateHostingConfig,
  uploadImageToHosting,
} from "./puter.hosting";
import { isHostedUrl } from "./utils";
import { PUTER_WORKER_URL } from "./constants";

/**
 * Initiates the Puter authentication sign-in flow.
 * @returns A promise that resolves when sign-in is complete.
 */
export const signIn = async () => await puter.auth.signIn();

/**
 * Signs out the current user from Puter authentication.
 */
export const signOut = () => puter.auth.signOut();

/**
 * Retrieves the currently authenticated user from Puter.
 * @returns A promise that resolves to the user object, or null if not authenticated or on error.
 */
export const getCurrentUser = async () => {
  try {
    return await puter.auth.getUser();
  } catch {
    return null;
  }
};

/**
 * Creates a new design project with source and rendered images.
 * Uploads images to Puter hosting and saves project metadata to the worker API.
 * @param params - The project creation parameters.
 * @param params.item - The design item containing project data.
 * @param params.visibility - The visibility setting for the project (default: "private").
 * @returns A promise that resolves to the saved project item, or null if creation fails.
 */
export const createProject = async ({
  item,
  visibility = "private",
}: CreateProjectParams): Promise<DesignItem | null | undefined> => {
  if (!PUTER_WORKER_URL) {
    console.warn("Missing VITE_PUTER_WORKER_URL; skip history fetch;");
    return null;
  }
  const projectId = item.id;

  const hosting = await getOrCreateHostingConfig();

  const hostedSource = projectId
    ? await uploadImageToHosting({
        hosting,
        url: item.sourceImage,
        projectId,
        label: "source",
      })
    : null;

  const hostedRender =
    projectId && item.renderedImage
      ? await uploadImageToHosting({
          hosting,
          url: item.renderedImage,
          projectId,
          label: "rendered",
        })
      : null;

  const resolvedSource =
    hostedSource?.url ||
    (isHostedUrl(item.sourceImage) ? item.sourceImage : "");

  if (!resolvedSource) {
    console.warn("Failed to host source image, skipping save.");
    return null;
  }

  const resolvedRender = hostedRender?.url
    ? hostedRender?.url
    : item.renderedImage && isHostedUrl(item.renderedImage)
      ? item.renderedImage
      : undefined;

  const {
    sourcePath: _sourcePath,
    renderedPath: _renderedPath,
    publicPath: _publicPath,
    ...rest
  } = item;

  const payload = {
    ...rest,
    sourceImage: resolvedSource,
    renderedImage: resolvedRender,
  };

  try {
    const response = await puter.workers.exec(
      `${PUTER_WORKER_URL}/api/projects/save`,
      {
        method: "POST",
        body: JSON.stringify({
          project: payload,
          visibility,
        }),
      },
    );

    if (!response.ok) {
      console.error("failed to save the project", await response.text());
      return null;
    }

    const data = (await response.json()) as { project?: DesignItem | null };

    return data?.project ?? null;
  } catch (e) {
    console.log("Failed to save project", e);
    return null;
  }
};

/**
 * Fetches all projects for the current user from the worker API.
 * @returns A promise that resolves to an array of design items, or an empty array on error.
 */
export const getProjects = async () => {
  if (!PUTER_WORKER_URL) {
    console.warn("Missing VITE_PUTER_WORKER_URL; skip history fetch;");
    return [];
  }

  try {
    const response = await puter.workers.exec(
      `${PUTER_WORKER_URL}/api/projects/list`,
      { method: "GET" },
    );

    if (!response.ok) {
      console.error("Failed to fetch history", await response.text());
      return [];
    }

    const data = (await response.json()) as { projects?: DesignItem[] | null };

    return Array.isArray(data?.projects) ? data?.projects : [];
  } catch (e) {
    console.error("Failed to get projects", e);
    return [];
  }
};

/**
 * Fetches a specific project by its ID from the worker API.
 * @param params - The parameters object.
 * @param params.id - The unique identifier of the project to fetch.
 * @returns A promise that resolves to the project item, or null if not found or on error.
 */
export const getProjectById = async ({ id }: { id: string }) => {
  if (!PUTER_WORKER_URL) {
    console.warn("Missing VITE_PUTER_WORKER_URL; skipping project fetch.");
    return null;
  }

  console.log("Fetching project with ID:", id);

  try {
    const response = await puter.workers.exec(
      `${PUTER_WORKER_URL}/api/projects/get?id=${encodeURIComponent(id)}`,
      { method: "GET" },
    );

    console.log("Fetch project response:", response);

    if (!response.ok) {
      console.error("Failed to fetch project:", await response.text());
      return null;
    }

    const data = (await response.json()) as {
      project?: DesignItem | null;
    };

    console.log("Fetched project data:", data);

    return data?.project ?? null;
  } catch (error) {
    console.error("Failed to fetch project:", error);
    return null;
  }
};

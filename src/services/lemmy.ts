import { LemmyHttp } from "lemmy-js-client";

import { isNative, supportsWebp } from "#/helpers/device";
import { reduceFileSize } from "#/helpers/imageCompress";

import nativeFetch from "./nativeFetch";

export function buildBaseLemmyUrl(url: string): string {
  if (import.meta.env.VITE_FORCE_LEMMY_INSECURE) {
    return `http://${url}`;
  }

  return `https://${url}`;
}

export function getClient(url: string, jwt?: string): LemmyHttp {
  return new LemmyHttp(buildBaseLemmyUrl(url), {
    fetchFunction: isNative() ? nativeFetch : fetch.bind(globalThis),
    headers: jwt
      ? {
          Authorization: `Bearer ${jwt}`,
          ["Cache-Control"]: "no-cache", // otherwise may get back cached site response (despite JWT)
        }
      : undefined,
  });
}

export const LIMIT = 50;

/**
 * upload image, compressing before upload if needed
 *
 * @returns relative pictrs URL
 */
export async function _uploadImage(client: LemmyHttp, image: File) {
  let compressedImageIfNeeded;

  try {
    compressedImageIfNeeded = await reduceFileSize(
      image,
      990_000, // 990 kB - Lemmy's default limit is 1MB
      1500,
      1500,
      0.85,
    );
  } catch (error) {
    compressedImageIfNeeded = image;
    console.error("Image compress failed", error);
  }

  const response = await client.uploadImage({
    image: compressedImageIfNeeded as File,
  });

  // lemm.ee uses response.message for error messages (e.g. account too new)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!response.url) throw new Error(response.msg ?? (response as any).message);

  return response;
}

interface ImageOptions {
  /**
   * maximum image dimension
   */
  size?: number;

  devicePixelRatio?: number;

  format?: "jpg" | "png" | "webp";
}

const defaultFormat = supportsWebp() ? "webp" : "jpg";

export function getImageSrc(url: string, options?: ImageOptions) {
  if (!options || !options.size) return url;

  let mutableUrl;

  try {
    mutableUrl = new URL(url);
  } catch (_) {
    return url;
  }

  const params = mutableUrl.searchParams;

  if (options.size) {
    params.set(
      "thumbnail",
      `${Math.round(
        options.size * (options?.devicePixelRatio ?? window.devicePixelRatio),
      )}`,
    );
  }

  params.set("format", options.format ?? defaultFormat);

  return mutableUrl.toString();
}

export const customBackOff = async (attempt = 0, maxRetries = 5) => {
  await new Promise((resolve) => {
    setTimeout(resolve, Math.min(attempt, maxRetries) * 4_000);
  });
};

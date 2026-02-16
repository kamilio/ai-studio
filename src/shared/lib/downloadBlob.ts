/**
 * downloadBlob – shared fetch-blob-anchor-click download helper.
 *
 * Fetches `url` as a Blob and triggers the browser's native "Save As" dialog
 * using a temporary anchor element.  This ensures a save prompt regardless of
 * whether the resource is cross-origin (some browsers ignore the `download`
 * attribute on cross-origin <a> links).
 *
 * The temporary object URL is revoked after a short delay so the download can
 * start before the reference is cleaned up.
 *
 * @param url      - Resource URL to download.
 * @param filename - Desired filename for the saved file, including extension.
 *                   For image downloads where the extension depends on the
 *                   server MIME type, callers may omit the extension and
 *                   pass a base name; however callers are responsible for
 *                   appending the correct extension beforehand.
 * @param fallbackDirect - When `true`, if the fetch fails a direct navigation
 *                         fallback is attempted (useful for audio files served
 *                         from cross-origin CDNs that reject fetch requests).
 *                         Defaults to `false`.
 */
export async function downloadBlob(
  url: string,
  filename: string,
  fallbackDirect = false,
): Promise<void> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    try {
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } finally {
      // Revoke after a short delay to allow the download to start.
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    }
  } catch (err) {
    if (!fallbackDirect) throw err;
    // Fallback: direct link download (may not prompt Save As on all browsers).
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.target = "_blank";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }
}

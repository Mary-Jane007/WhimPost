/**
 * Browser helper: POST FormData with upload progress (0–100).
 * Prefer this over fetch() for any user-facing file upload.
 */
export function uploadFormData(
  url: string,
  form: FormData,
  opts?: {
    onProgress?: (percent: number) => void;
    method?: string;
  }
): Promise<{
  ok: boolean;
  status: number;
  data: Record<string, unknown>;
}> {
  const method = opts?.method || "POST";
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.responseType = "json";
    xhr.upload.onprogress = (ev) => {
      if (!ev.lengthComputable || !opts?.onProgress) return;
      opts.onProgress(Math.min(99, Math.round((ev.loaded / ev.total) * 100)));
    };
    xhr.onload = () => {
      const data =
        (xhr.response as Record<string, unknown> | null) ||
        (() => {
          try {
            return JSON.parse(xhr.responseText) as Record<string, unknown>;
          } catch {
            return {};
          }
        })();
      resolve({
        ok: xhr.status >= 200 && xhr.status < 300,
        status: xhr.status,
        data,
      });
    };
    xhr.onerror = () => {
      reject(new Error("Upload failed — check your connection and try again"));
    };
    xhr.send(form);
  });
}

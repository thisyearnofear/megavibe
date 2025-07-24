"use client";

import { useState } from "react";

interface UploadOptions {
  onSuccess?: (result: unknown) => void;
  onError?: (error: Error) => void;
}

export const useUploader = (options?: UploadOptions) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const uploadFile = async (file: File, creator: string) => {
    setIsUploading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const content = reader.result as string;
        const filcdnResponse = await fetch("/api/filcdn", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            operation: "store",
            data: {
              name: file.name,
              type: file.type,
              content,
            },
          }),
        });

        if (!filcdnResponse.ok) {
          throw new Error(`Failed to upload file: ${filcdnResponse.statusText}`);
        }

        const filcdnResult = await filcdnResponse.json();
        const cid = filcdnResult.result.cid;

        const performanceResponse = await fetch("/api/performances", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cid,
            filename: file.name,
            filetype: file.type,
            creator,
            timestamp: Date.now(),
          }),
        });

        if (!performanceResponse.ok) {
          throw new Error(`Failed to record performance: ${performanceResponse.statusText}`);
        }

        const performanceResult = await performanceResponse.json();

        if (options?.onSuccess) {
          options.onSuccess(performanceResult);
        }
      };
    } catch (err: unknown) {
      let errorObj: Error;
      if (err instanceof Error) {
        errorObj = err;
      } else {
        errorObj = new Error("Unknown upload error");
      }
      setError(errorObj);
      if (options?.onError) {
        options.onError(errorObj);
      }
    } finally {
      setIsUploading(false);
    }
  };

  return { isUploading, error, uploadFile };
};

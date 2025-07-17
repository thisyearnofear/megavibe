"use client";

import React, { useState } from "react";
import { useUploader } from "@/hooks/useUploader";
import { useWallet } from "@/contexts/WalletContext";
import styles from "./MomentCapture.module.css";

export default function MomentCapture() {
  const [file, setFile] = useState<File | null>(null);
  const { walletAddress } = useWallet();
  const { isUploading, error, uploadFile } = useUploader({
    onSuccess: (result) => {
      console.log("Upload successful:", result);
      alert("Moment captured successfully!");
    },
    onError: (error) => {
      console.error("Upload failed:", error);
      alert("Failed to capture moment.");
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (file && walletAddress) {
      uploadFile(file, walletAddress);
    }
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Capture a Moment</h3>
      <div className={styles.uploadBox}>
        <input type="file" accept="image/*,video/*" onChange={handleFileChange} className={styles.fileInput} />
        <button onClick={handleUpload} disabled={!file || isUploading || !walletAddress} className={styles.uploadButton}>
          {isUploading ? "Uploading..." : "Upload Moment"}
        </button>
      </div>
      {error && <p className={styles.error}>{error.message}</p>}
    </div>
  );
}

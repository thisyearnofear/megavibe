"use client";

import React, { useState, useEffect } from "react";
import { useFilCDNStorage } from "@/hooks/useFilCDNStorage";
import { useFilCDN } from "@/contexts/FilCDNContext";
import styles from "./FilCDNDemo.module.css";

interface StoredFile {
  cid: string;
  name: string;
  type: string;
  size: number;
  timestamp: number;
}

export default function FilCDNDemo() {
  const [file, setFile] = useState<File | null>(null);
  const [storedFiles, setStoredFiles] = useState<StoredFile[]>([]);
  const [retrievedContent, setRetrievedContent] = useState<string | null>(null);
  const [retrievedContentType, setRetrievedContentType] = useState<string>("");
  const [activeCid, setActiveCid] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");

  const {
    storeData,
    retrieveData,
    getCdnUrl,
    loading,
    error,
    lastCid,
    isReady,
  } = useFilCDNStorage({
    enableAutoRetry: true,
    maxRetries: 3,
  });

  const { isInitialized, isInitializing, stats, reInitialize } = useFilCDN();

  // Load stored files from local storage on component mount
  useEffect(() => {
    const savedFiles = localStorage.getItem("stored-files");
    if (savedFiles) {
      try {
        setStoredFiles(JSON.parse(savedFiles));
      } catch (err) {
        console.error("Failed to parse stored files from localStorage", err);
      }
    }
  }, []);

  // Save stored files to local storage when they change
  useEffect(() => {
    if (storedFiles.length > 0) {
      localStorage.setItem("stored-files", JSON.stringify(storedFiles));
    }
  }, [storedFiles]);

  // Update message when status changes
  useEffect(() => {
    if (error) {
      setMessage(`Error: ${error}`);
    } else if (loading) {
      setMessage("Processing...");
    } else if (lastCid) {
      setMessage(`Success! File uploaded successfully.`);
    } else if (!isReady) {
      setMessage(
        isInitializing
          ? "Initializing storage system..."
          : "Storage system not ready"
      );
    } else {
      setMessage("");
    }
  }, [error, loading, lastCid, isReady, isInitializing]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  // Store file
  const handleStoreFile = async () => {
    if (!file || !isReady) return;

    try {
      setMessage("Reading file...");

      // Read file as appropriate format
      const fileContent = await readFileAsAppropriateFormat(file);

      setMessage("Uploading file...");

      // Store file metadata and content
      const result = await storeData({
        name: file.name,
        type: file.type,
        content: fileContent,
        timestamp: Date.now(),
      });

      if (result) {
        const newStoredFile: StoredFile = {
          cid: result.cid,
          name: file.name,
          type: file.type,
          size: result.size,
          timestamp: Date.now(),
        };

        setStoredFiles((prev) => [newStoredFile, ...prev]);
        setFile(null);

        // Reset file input
        const fileInput = document.getElementById(
          "file-input"
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      }
    } catch (err: any) {
      setMessage(`Failed to upload file: ${err.message}`);
      console.error("Failed to upload file:", err);
    }
  };

  // Read file as appropriate format based on type
  const readFileAsAppropriateFormat = (
    file: File
  ): Promise<string | ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (reader.result) {
          resolve(reader.result);
        } else {
          reject(new Error("Failed to read file"));
        }
      };

      reader.onerror = () => {
        reject(reader.error);
      };

      if (
        file.type.startsWith("text/") ||
        file.type === "application/json" ||
        file.type === "application/xml"
      ) {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    });
  };

  // Retrieve file
  const handleRetrieveFile = async (cid: string, fileType: string) => {
    if (!isReady) return;

    try {
      setMessage(`Retrieving file...`);
      setActiveCid(cid);
      setRetrievedContent(null);

      const data = await retrieveData<any>(cid);

      if (data) {
        setRetrievedContentType(fileType);
        setRetrievedContent(data.content);
        setMessage(`File retrieved successfully!`);
      } else {
        setMessage(`Failed to retrieve file`);
      }
    } catch (err: any) {
      setMessage(`Error retrieving file: ${err.message}`);
      console.error("Error retrieving file:", err);
    }
  };

  // Get file size display
  const formatFileSize = (size: number): string => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format timestamp
  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  // Render file content based on type
  const renderFileContent = () => {
    if (!retrievedContent) return null;

    if (retrievedContentType.startsWith("image/")) {
      return (
        <div className={styles.previewContainer}>
          <img
            src={retrievedContent as string}
            alt="Retrieved content"
            className={styles.imagePreview}
          />
        </div>
      );
    } else if (
      retrievedContentType.startsWith("text/") ||
      retrievedContentType === "application/json" ||
      retrievedContentType === "application/xml"
    ) {
      return (
        <div className={styles.previewContainer}>
          <pre className={styles.textPreview}>{retrievedContent as string}</pre>
        </div>
      );
    } else {
      return (
        <div className={styles.previewContainer}>
          <p>
            Content retrieved successfully. Use the link below to access this
            content.
          </p>
          <a
            href={retrievedContent as string}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.cdnLink}
          >
            Open Content
          </a>
        </div>
      );
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>File Manager</h2>
        <div className={styles.status}>
          Status:{" "}
          {isInitialized ? (
            <span className={styles.statusActive}>Ready</span>
          ) : (
            <span className={styles.statusInactive}>Initializing</span>
          )}
          {!isInitialized && (
            <button
              onClick={reInitialize}
              className={styles.reinitButton}
              disabled={isInitializing}
            >
              {isInitializing ? "Connecting..." : "Reconnect"}
            </button>
          )}
        </div>
      </div>

      <div className={styles.uploadSection}>
        <h3>Upload New File</h3>
        <input
          id="file-input"
          type="file"
          onChange={handleFileChange}
          disabled={loading || !isReady}
          className={styles.fileInput}
        />
        <button
          onClick={handleStoreFile}
          disabled={!file || loading || !isReady}
          className={styles.uploadButton}
        >
          {loading ? "Uploading..." : "Upload File"}
        </button>
        {message && <div className={styles.message}>{message}</div>}
      </div>

      <div className={styles.contentSection}>
        <div className={styles.storedFiles}>
          <h3>Your Files</h3>
          {storedFiles.length === 0 ? (
            <p className={styles.noContent}>No files uploaded yet</p>
          ) : (
            <ul className={styles.fileList}>
              {storedFiles.map((storedFile) => (
                <li
                  key={storedFile.cid}
                  className={`${styles.fileItem} ${
                    activeCid === storedFile.cid ? styles.activeFile : ""
                  }`}
                  onClick={() =>
                    handleRetrieveFile(storedFile.cid, storedFile.type)
                  }
                >
                  <div className={styles.fileName}>{storedFile.name}</div>
                  <div className={styles.fileDetails}>
                    <span className={styles.fileType}>
                      {storedFile.type || "Unknown type"}
                    </span>
                    <span className={styles.fileSize}>
                      {formatFileSize(storedFile.size)}
                    </span>
                    <span className={styles.fileDate}>
                      {formatTimestamp(storedFile.timestamp)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={styles.preview}>
          <h3>File Preview</h3>
          {renderFileContent()}
        </div>
      </div>
    </div>
  );
}

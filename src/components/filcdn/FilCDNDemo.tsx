"use client";

import React, { useState, useEffect } from "react";
import { useFilCDNStorage } from "@/hooks/useFilCDNStorage";
import { useIntegrationState } from "@/hooks/useIntegrationState";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { IntegrationStatus } from "@/components/integration/IntegrationStatus";
import { Button } from "@/components/design-system/Button";
import { Card, CardHeader, CardContent } from "@/components/design-system/Card";
import { LoadingState } from "@/components/shared/LoadingStates";
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

  // ENHANCEMENT FIRST: Use unified integration state instead of fragmented hooks
  const integrationState = useIntegrationState();
  const { handleFilCDNError, handleError } = useErrorHandler();

  const { storeData, retrieveData, loading, error, lastCid, isReady } =
    useFilCDNStorage({
      enableAutoRetry: true,
      maxRetries: 3,
    });

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

  // ENHANCEMENT FIRST: Unified error handling instead of scattered patterns
  useEffect(() => {
    if (error) {
      handleFilCDNError(error, "filcdn_operation");
      setMessage(`Error: ${error}`);
    } else if (loading) {
      setMessage("Processing...");
    } else if (lastCid) {
      setMessage(`Success! File uploaded successfully.`);
    } else if (!integrationState.overall.isReady) {
      const blockers = integrationState.overall.blockers;
      setMessage(
        blockers.length > 0
          ? `System not ready: ${blockers.join(", ")}`
          : "Initializing system..."
      );
    } else {
      setMessage("");
    }
  }, [error, loading, lastCid, integrationState.overall, handleFilCDNError]);

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

  // Retrieve file with unified error handling
  const handleRetrieveFile = async (cid: string, fileType: string) => {
    if (!integrationState.overall.isReady) {
      handleError("System not ready for file retrieval", {
        operation: "retrieve_file",
        userMessage:
          "Please ensure systems are connected before retrieving files.",
      });
      return;
    }

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
    } catch (err) {
      handleFilCDNError(err, "retrieve_file");
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
      {/* ENHANCEMENT FIRST: Use unified integration status component */}
      <IntegrationStatus variant="compact" className="mb-lg" />

      <div className={styles.header}>
        <h2 className={styles.title}>File Manager</h2>
        <div className={styles.status}>
          Status:{" "}
          {integrationState.filcdn.isInitialized ? (
            <span className={styles.statusActive}>Ready</span>
          ) : (
            <span className={styles.statusInactive}>Initializing</span>
          )}
          {!integrationState.filcdn.isInitialized && (
            <Button
              size="sm"
              variant="outline"
              onClick={integrationState.reinitializeFilCDN}
              disabled={integrationState.filcdn.isInitializing}
            >
              {integrationState.filcdn.isInitializing
                ? "Connecting..."
                : "Reconnect"}
            </Button>
          )}
        </div>
      </div>

      <div className={styles.uploadSection}>
        <h3>Upload New File</h3>
        <input
          id="file-input"
          type="file"
          onChange={handleFileChange}
          disabled={loading || !integrationState.overall.isReady}
          className={styles.fileInput}
        />
        <Button
          onClick={handleStoreFile}
          disabled={!file || loading || !integrationState.overall.isReady}
          variant="primary"
          isLoading={loading}
        >
          Upload File
        </Button>
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

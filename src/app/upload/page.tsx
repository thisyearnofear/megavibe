"use client";

import React from "react";
import FilCDNDemo from "@/components/filcdn/FilCDNDemo";
import styles from "./page.module.css";
import Container from "@/components/layout/Container";

export default function UploadPage() {
  return (
    <main className={styles.main}>
      <Container>
        <h1 className={styles.title}>File Upload</h1>
        <p className={styles.description}>
          Upload and manage your content on MegaVibe&apos;s decentralized storage
          system. Files uploaded here are stored securely on the Filecoin
          network.
        </p>

        <FilCDNDemo />

        <div className={styles.infoSection}>
          <h2>About Content Storage</h2>
          <p>
            MegaVibe stores all uploaded content on a decentralized storage
            network, providing security, redundancy, and censorship resistance
            for your files.
          </p>

          <h3>Key Features</h3>
          <ul className={styles.featureList}>
            <li>
              <strong>Secure Storage:</strong> Your content is encrypted and
              stored across a network of providers.
            </li>
            <li>
              <strong>Content Integrity:</strong> Each file gets a unique
              identifier that verifies its authenticity.
            </li>
            <li>
              <strong>Persistent Storage:</strong> Multiple copies ensure your
              content remains available.
            </li>
            <li>
              <strong>Fast Access:</strong> Our CDN capabilities ensure quick
              content delivery.
            </li>
          </ul>

          <h3>How It Works</h3>
          <ol className={styles.stepsList}>
            <li>Upload your content using the interface above.</li>
            <li>
              Your file is assigned a unique identifier based on its content.
            </li>
            <li>
              The file is distributed across the storage network for redundancy.
            </li>
            <li>
              You can access your content at any time using the provided link.
            </li>
          </ol>

          <div className={styles.technicalDetails}>
            <h3>Supported File Types</h3>
            <p>Our platform supports various file types including:</p>
            <ul>
              <li>Images (JPG, PNG, GIF, etc.)</li>
              <li>Documents (PDF, DOC, TXT, etc.)</li>
              <li>Audio files (MP3, WAV, etc.)</li>
              <li>Video files (MP4, WebM, etc.)</li>
              <li>And many other standard formats</li>
            </ul>
            <p>Maximum file size: 254 MB per upload</p>
          </div>
        </div>
      </Container>
    </main>
  );
}

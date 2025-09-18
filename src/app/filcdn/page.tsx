"use client";

// Force dynamic rendering to prevent SSR issues with Wagmi hooks
export const dynamic = 'force-dynamic';

import React from "react";
import FilCDNDemo from "@/components/filcdn/FilCDNDemo";
import styles from "./page.module.css";

export default function FilCDNPage() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>FilCDN Integration</h1>
        <p className={styles.description}>
          MegaVibe uses FilCDN for decentralized storage on the Filecoin
          network. This page demonstrates how content is stored and retrieved
          using FilCDN.
        </p>

        <FilCDNDemo />

        <div className={styles.infoSection}>
          <h2>About FilCDN</h2>
          <p>
            FilCDN is a decentralized content delivery network built on the
            Filecoin network. It provides a secure, efficient, and
            censorship-resistant way to store and distribute content.
          </p>

          <h3>Key Features</h3>
          <ul className={styles.featureList}>
            <li>
              <strong>Decentralized Storage:</strong> Content is stored across a
              network of providers instead of centralized servers.
            </li>
            <li>
              <strong>Content-Addressed:</strong> Each piece of content is
              identified by its unique Content Identifier (CID), ensuring
              integrity.
            </li>
            <li>
              <strong>Persistent:</strong> Data is stored with multiple replicas
              and cryptographic proofs of storage.
            </li>
            <li>
              <strong>Fast Retrieval:</strong> CDN capabilities ensure fast
              content delivery from the closest available node.
            </li>
          </ul>

          <h3>How It Works</h3>
          <ol className={styles.stepsList}>
            <li>
              Content is uploaded and assigned a unique CID based on its
              cryptographic hash.
            </li>
            <li>
              The CID is stored on-chain, while the content is stored by FilCDN
              storage providers.
            </li>
            <li>
              When retrieving content, the system locates it using the CID and
              serves it through the CDN network.
            </li>
            <li>
              Periodic verification ensures that storage providers are
              maintaining the data properly.
            </li>
          </ol>

          <div className={styles.technicalDetails}>
            <h3>Technical Implementation</h3>
            <p>
              MegaVibe uses the Synapse SDK to interact with FilCDN. The
              implementation includes:
            </p>
            <ul>
              <li>
                FilCDN service for direct interactions with the Synapse SDK
              </li>
              <li>Context provider for application-wide state management</li>
              <li>Custom hooks for simplified component integration</li>
              <li>UI components for demonstrating storage and retrieval</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}

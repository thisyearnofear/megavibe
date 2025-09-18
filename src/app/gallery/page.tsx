"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Container from "@/components/layout/Container";
import {
  CardSkeleton,
  LoadingSkeleton,
} from "@/components/shared/LoadingStates";
import Button from "@/components/shared/Button";
import styles from "./page.module.css";

type GalleryItem = {
  imageUrl: string;
  title: string;
  description?: string;
  creator: string;
  stylePreset?: string;
  prompt: string;
  submissionId: number;
};

export default function GalleryPage() {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGalleryItems() {
      try {
        setLoading(true);
        const response = await fetch("/api/gallery/submit");

        if (!response.ok) {
          throw new Error(`Failed to fetch gallery: ${response.statusText}`);
        }

        const data = await response.json();

        // Transform the submissions data to include submissionId
        const items = data.submissions
          .map((item: unknown, index: number) => {
            // Attempt to safely cast/validate object as GalleryItem shape
            if (
              typeof item === "object" &&
              item !== null &&
              "imageUrl" in item &&
              "title" in item &&
              "creator" in item &&
              "prompt" in item
            ) {
              return {
                ...(item as Omit<GalleryItem, "submissionId">),
                submissionId: index,
              };
            }
            // Skip invalid items
            return null;
          })
          .filter(Boolean) as GalleryItem[];

        setGalleryItems(items);
        setError(null);
      } catch (err) {
        setError("Failed to load gallery items. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchGalleryItems();
  }, []);

  return (
    <>
      <Container variant="standard" className={styles.container}>
        <h1 className={styles.title}>Community Gallery</h1>
        <h2 className={styles.subtitle}>
          Discover creative AI-generated images shared by our community
        </h2>

        {error && (
          <div className={styles.errorMessage}>
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className={styles.galleryGrid}>
            <CardSkeleton count={6} className={styles.galleryItem} />
          </div>
        ) : galleryItems.length === 0 ? (
          <div className={styles.noItems}>
            <h3 className={styles.noItemsTitle}>
              No images have been shared yet.
            </h3>
            <p className={styles.noItemsText}>
              Be the first to create and share an AI-generated image in our
              Creator Studio!
            </p>
            <Link href="/create">
              <Button variant="primary">Go to Creator Studio</Button>
            </Link>
          </div>
        ) : (
          <div className={styles.galleryGrid}>
            {galleryItems.map((item) => (
              <div key={item.submissionId} className={styles.galleryItem}>
                <div className={styles.card}>
                  <div className={styles.cardMedia}>
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      style={{ objectFit: "cover" }}
                      priority={item.submissionId < 6} // Prioritize loading first 6 images
                    />
                  </div>
                  <div className={styles.cardContent}>
                    <h3 className={styles.cardTitle}>{item.title}</h3>
                    <p className={styles.cardCreator}>By {item.creator}</p>
                    {item.description && (
                      <p className={styles.cardDescription}>
                        {item.description}
                      </p>
                    )}
                    <div className={styles.cardMeta}>
                      {item.stylePreset && (
                        <span className={styles.stylePreset}>
                          Style: {item.stylePreset}
                        </span>
                      )}
                      <p className={styles.prompt}>"{item.prompt}"</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  Skeleton,
  Button,
} from "@mui/material";
import OptimizedNavigation from "@/components/navigation/OptimizedNavigation";
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
        const items = data.submissions.map((item: any, index: number) => ({
          ...item,
          submissionId: index,
        }));

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
      
      <Container
        maxWidth="lg"
        sx={{ mt: 4, mb: 8 }}
        className={styles.container}
      >
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          align="center"
          className={styles.title}
        >
          Community Gallery
        </Typography>
        <Typography
          variant="h6"
          component="h2"
          gutterBottom
          align="center"
          color="text.secondary"
          sx={{ mb: 4 }}
          className={styles.subtitle}
        >
          Discover creative AI-generated images shared by our community
        </Typography>

        {error && (
          <Box sx={{ my: 4 }}>
            <Typography color="error" align="center">
              {error}
            </Typography>
          </Box>
        )}

        {loading ? (
          <div className={styles.galleryGrid}>
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className={styles.galleryItem}>
                <Card sx={{ height: "100%" }} className={styles.skeleton}>
                  <Skeleton variant="rectangular" height={200} />
                  <CardContent>
                    <Skeleton variant="text" height={30} />
                    <Skeleton variant="text" />
                    <Skeleton variant="text" width="60%" />
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        ) : galleryItems.length === 0 ? (
          <Box sx={{ my: 8, textAlign: "center" }} className={styles.noItems}>
            <Typography
              variant="h5"
              color="text.secondary"
              className={styles.noItemsTitle}
            >
              No images have been shared yet.
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mt: 2 }}
              className={styles.noItemsText}
            >
              Be the first to create and share an AI-generated image in our
              Creator Studio!
            </Typography>
            <Link href="/create" passHref>
              <Button variant="contained" color="primary" sx={{ mt: 3 }}>
                Go to Creator Studio
              </Button>
            </Link>
          </Box>
        ) : (
          <div className={styles.galleryGrid}>
            {galleryItems.map((item) => (
              <div key={item.submissionId} className={styles.galleryItem}>
                <Card
                  className={styles.card}
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Box
                    className={styles.cardMedia}
                    sx={{
                      position: "relative",
                      width: "100%",
                      height: 0,
                      paddingTop: "75%",
                    }}
                  >
                    <CardMedia
                      component="div"
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                      }}
                    >
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        style={{ objectFit: "cover" }}
                        priority={item.submissionId < 6} // Prioritize loading first 6 images
                      />
                    </CardMedia>
                  </Box>
                  <CardContent
                    className={styles.cardContent}
                    sx={{ flexGrow: 1 }}
                  >
                    <Typography
                      gutterBottom
                      variant="h5"
                      component="h2"
                      className={styles.imageTitle}
                    >
                      {item.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      paragraph
                      className={styles.imageDescription}
                    >
                      {item.description ||
                        `Created with prompt: "${item.prompt}"`}
                    </Typography>
                    {item.stylePreset && (
                      <span className={styles.imageStyle}>
                        {item.stylePreset}
                      </span>
                    )}
                    <Typography
                      variant="caption"
                      display="block"
                      color="text.secondary"
                      className={styles.imageCreator}
                    >
                      Created by: {item.creator}
                    </Typography>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}

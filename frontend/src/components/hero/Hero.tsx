"use client";

import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import styles from "./Hero.module.css";

interface GalleryImage {
  imageUrl: string;
  title: string;
  description?: string;
  prompt: string;
  stylePreset?: string;
}

export default function Hero() {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const primaryBtnRef = useRef<HTMLButtonElement>(null);
  const secondaryBtnRef = useRef<HTMLButtonElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch gallery images for the slideshow
  useEffect(() => {
    async function fetchGalleryImages() {
      try {
        // Fetch images from the gallery API
        const response = await fetch("/api/gallery/submit");

        if (!response.ok) {
          throw new Error("Failed to fetch gallery images");
        }

        const data = await response.json();
        if (data.submissions && data.submissions.length > 0) {
          setGalleryImages(data.submissions);
        }
      } catch (error) {
        console.error("Error fetching gallery images:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchGalleryImages();
  }, []);

  // Auto-cycle through gallery images
  useEffect(() => {
    if (galleryImages.length > 1) {
      const interval = setInterval(() => {
        setActiveImageIndex((prev) => (prev + 1) % galleryImages.length);
      }, 5000); // Change image every 5 seconds

      return () => clearInterval(interval);
    }
  }, [galleryImages.length]);

  useEffect(() => {
    // Create a timeline for the animation sequence
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    // Animate title
    tl.fromTo(
      titleRef.current,
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8 }
    );

    // Animate description
    tl.fromTo(
      descriptionRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8 },
      "-=0.4" // Start slightly before the previous animation finishes
    );

    // Animate CTA buttons
    tl.fromTo(
      [primaryBtnRef.current, secondaryBtnRef.current],
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, stagger: 0.1 },
      "-=0.4"
    );

    // Create subtle movement for the glow effect
    gsap.to(glowRef.current, {
      x: 100,
      y: -50,
      duration: 15,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
  }, []);

  // Render gallery images or placeholder
  const renderVisualContent = () => {
    if (loading) {
      // Show loading state
      return (
        <div className={styles.visualPlaceholder}>
          <div className={`${styles.placeholderItem} ${styles.loading}`}></div>
          <div className={`${styles.placeholderItem} ${styles.loading}`}></div>
          <div className={`${styles.placeholderItem} ${styles.loading}`}></div>
        </div>
      );
    }

    if (galleryImages.length === 0) {
      // Show default placeholder if no images
      return (
        <div className={styles.visualPlaceholder}>
          <div className={styles.placeholderItem}></div>
          <div className={styles.placeholderItem}></div>
          <div className={styles.placeholderItem}></div>
        </div>
      );
    }

    // Show gallery images slideshow
    const currentImage = galleryImages[activeImageIndex];
    return (
      <div className={styles.gallerySlideshow}>
        <div className={styles.galleryImage}>
          <img
            src={currentImage.imageUrl}
            alt={currentImage.title || currentImage.prompt}
            onError={(e) => {
              // If image fails to load, try proxy through FilCDN retrieve route
              if (!e.currentTarget.src.includes("/api/filcdn/retrieve")) {
                // Extract CID from URL if possible
                const cidMatch = e.currentTarget.src.match(
                  /\/ipfs\/([a-zA-Z0-9]+)/
                );
                if (cidMatch && cidMatch[1]) {
                  e.currentTarget.src = `/api/filcdn/retrieve?cid=${cidMatch[1]}`;
                } else {
                  // Fallback to a placeholder image
                  e.currentTarget.src = `data:image/svg+xml;base64,${btoa(
                    `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stop-color="#6f42c1" />
                          <stop offset="100%" stop-color="#fd7e14" />
                        </linearGradient>
                      </defs>
                      <rect width="512" height="512" fill="url(#grad)" />
                      <text x="50%" y="50%" font-family="Arial" font-size="24" fill="white" text-anchor="middle">
                        ${currentImage.prompt || "AI Generated Image"}
                      </text>
                    </svg>`
                  )}`;
                }
              }
            }}
          />
        </div>
        <div className={styles.galleryCaption}>
          <h3>{currentImage.title}</h3>
          <p>{currentImage.prompt}</p>
          {currentImage.stylePreset && (
            <span className={styles.styleTag}>{currentImage.stylePreset}</span>
          )}
        </div>
        {galleryImages.length > 1 && (
          <div className={styles.galleryDots}>
            {galleryImages.map((_, index) => (
              <span
                key={index}
                className={`${styles.dot} ${
                  index === activeImageIndex ? styles.activeDot : ""
                }`}
                onClick={() => setActiveImageIndex(index)}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.hero}>
      <div className={styles.container}>
        <div className={styles.content}>
          <h1 ref={titleRef} className={styles.title}>
            Welcome to <span className={styles.highlight}>The Stage</span>
          </h1>

          <p ref={descriptionRef} className={styles.description}>
            MegaVibe brings creators and audiences together in a reimagined live
            performance economy. Discover performers, support their work, and be
            part of the experience.
          </p>

          <div className={styles.cta}>
            <button ref={primaryBtnRef} className={styles.primaryButton}>
              Explore Performers
            </button>
            <button ref={secondaryBtnRef} className={styles.secondaryButton}>
              Learn More
            </button>
          </div>
        </div>

        <div className={styles.visual}>
          <div className={styles.visualInner}>
            <div className={styles.visualContent}>{renderVisualContent()}</div>
            <div ref={glowRef} className={styles.glow}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

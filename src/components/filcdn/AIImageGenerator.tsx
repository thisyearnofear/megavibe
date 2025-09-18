"use client";

import React, { useState, useEffect } from "react";
import { useFilCDN } from "@/contexts/FilCDNContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import styles from "./AIImageGenerator.module.css";

// Types
interface GeneratedImage {
  cid: string;
  prompt: string;
  timestamp: number;
  url: string;
  style?: string;
  creator?: string;
  isPublished?: boolean;
  publicTitle?: string;
}

// Venice AI available style presets
const VENICE_STYLES = [
  "3D Model",
  "Analog Film",
  "Anime",
  "Cinematic",
  "Comic Book",
];

// Custom fallback UI for AIImageGenerator errors
const AIGeneratorErrorFallback = () => (
  <div className={styles.container}>
    <div className={styles.header}>
      <div className={styles.status}>
        Status: <span className={styles.statusInactive}>Error</span>
      </div>
    </div>
    <div className={styles.generatorSection}>
      <h3>Image Generator Error</h3>
      <div className={styles.message}>
        The AI image generator encountered an error. This could be due to:
        <ul style={{ marginTop: "10px", marginBottom: "10px" }}>
          <li>Issues with the Venice AI service</li>
          <li>Problems with FilCDN connectivity</li>
          <li>Application state conflicts</li>
        </ul>
        <button
          className={styles.generateButton}
          onClick={() => window.location.reload()}
        >
          Refresh Page
        </button>
      </div>
    </div>
  </div>
);

function AIImageGeneratorInner() {
  const [prompt, setPrompt] = useState<string>("");
  const [selectedStyle, setSelectedStyle] = useState<string>("3D Model");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isStoring, setIsStoring] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [publicTitle, setPublicTitle] = useState<string>("");
  const [showPublishModal, setShowPublishModal] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [sliderInterval, setSliderInterval] = useState<NodeJS.Timeout | null>(
    null
  );
  const [showStyleSelector, setShowStyleSelector] = useState<boolean>(false);
  const [currentGeneratedImage, setCurrentGeneratedImage] = useState<
    string | null
  >(null);
  // Track the original image data for storage while using blob URLs for display
  const [originalImageData, setOriginalImageData] = useState<string | null>(
    null
  );

  const { isInitialized, error } = useFilCDN();

  // Add error boundary to handle React hydration errors
  const [hasError, setHasError] = useState<boolean>(false);

  // Track created blob URLs for cleanup
  const [blobUrls, setBlobUrls] = useState<string[]>([]);

  // Load stored images from local storage on component mount
  useEffect(() => {
    const savedImages = localStorage.getItem("ai-generated-images");
    if (savedImages) {
      try {
        setImages(JSON.parse(savedImages));
      } catch (err) {
        console.error("Failed to parse stored images from localStorage", err);
      }
    }
  }, []);

  // Save generated images to local storage when they change
  useEffect(() => {
    if (images.length > 0) {
      localStorage.setItem("ai-generated-images", JSON.stringify(images));
    }
  }, [images]);

  // Auto-cycle through images
  useEffect(() => {
    // Clear any existing interval first
    if (sliderInterval) {
      clearInterval(sliderInterval);
      setSliderInterval(null);
    }

    // Only start interval if we have multiple images and not showing newly generated
    if (images.length > 1 && !currentGeneratedImage) {
      const interval = setInterval(() => {
        setActiveImageIndex((prev) => (prev + 1) % images.length);
      }, 3000);

      setSliderInterval(interval);
    }

    // Cleanup function
    return () => {
      if (sliderInterval) {
        clearInterval(sliderInterval);
      }
    };
  }, [images.length, currentGeneratedImage]); // Remove sliderInterval from dependencies

  // Clean up blob URLs when component unmounts
  useEffect(() => {
    return () => {
      // Revoke all blob URLs to prevent memory leaks
      blobUrls.forEach((url) => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [blobUrls]);

  // Generate image with Venice AI
  const handleGenerateImage = async () => {
    if (!prompt) return;

    try {
      setIsGenerating(true);
      setMessage("Generating image with AI...");
      setCurrentGeneratedImage(null);

      // Step 1: Generate image with Venice AI
      const veniceResponse = await fetch("/api/venice/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          width: 512,
          height: 512,
          model: "hidream",
          style_preset: selectedStyle,
          // Additional parameters for content safety
          safe_mode: true,
        }),
      });

      let imageData: string;

      if (!veniceResponse.ok) {
        // For demo purposes, use mock response if API key is not set up
        console.log("Using mock Venice AI response for demo");
        setMessage("Using mock image for demo purposes...");

        // Create a mock colored gradient as base64
        imageData = `data:image/svg+xml;base64,${btoa(
          `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#6f42c1" />
                <stop offset="100%" stop-color="#fd7e14" />
              </linearGradient>
            </defs>
            <rect width="512" height="512" fill="url(#grad)" />
            <text x="50%" y="50%" font-family="Arial" font-size="24" fill="white" text-anchor="middle">
              ${prompt} (${selectedStyle})
            </text>
          </svg>`
        )}`;
      } else {
        try {
          const veniceData = await veniceResponse.json();
          // Check for different response formats from Venice AI
          if (veniceData.image) {
            imageData = veniceData.image;
          } else if (veniceData.images && veniceData.images.length > 0) {
            imageData = veniceData.images[0];
          } else {
            throw new Error("Invalid response format from Venice AI");
          }

          // If the image data doesn't have a data URI prefix, add it
          if (imageData && !imageData.startsWith("data:")) {
            imageData = `data:image/webp;base64,${imageData}`;
          }
        } catch (err) {
          // If we can't parse the response, use mock data
          console.log("Using mock Venice AI response for demo");
          setMessage("Using mock image for demo purposes...");

          // Create a mock colored gradient as base64
          imageData = `data:image/svg+xml;base64,${btoa(
            `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#6f42c1" />
                  <stop offset="100%" stop-color="#fd7e14" />
                </linearGradient>
              </defs>
              <rect width="512" height="512" fill="url(#grad)" />
              <text x="50%" y="50%" font-family="Arial" font-size="24" fill="white" text-anchor="middle">
                ${prompt} (${selectedStyle})
              </text>
            </svg>`
          )}`;
        }
      }

      // Store the original image data for FilCDN storage
      setOriginalImageData(imageData);

      // Debug: Log the first 100 characters of image data to verify format
      console.log("Raw image data format:", imageData.substring(0, 100));

      // Check if we have WebP data
      const isWebP = imageData.includes("image/webp");

      // Convert the image data to a Blob URL for more reliable display
      try {
        // Check if data is in base64 format
        if (imageData.startsWith("data:")) {
          // Create a blob from the data URL with proper typing
          fetch(imageData)
            .then((res) => res.blob())
            .then((blob) => {
              // Verify the blob type and size
              console.log("Blob type:", blob.type, "Blob size:", blob.size);

              // Create a blob URL with explicit type
              const blobUrl = URL.createObjectURL(
                new Blob([blob], { type: blob.type || "image/webp" })
              );

              // Track the blob URL for cleanup
              setBlobUrls((prev) => [...prev, blobUrl]);
              setCurrentGeneratedImage(blobUrl);
              console.log(
                "Converted image data to blob URL for better display:",
                blobUrl.substring(0, 50)
              );
            })
            .catch((err) => {
              console.error("Error converting to blob URL:", err);
              // Fallback to original data
              setCurrentGeneratedImage(imageData);
            });
        } else {
          // If it's not a data URL already, use as is
          setCurrentGeneratedImage(imageData);
        }
      } catch (conversionError) {
        console.error("Error processing image data:", conversionError);
        setCurrentGeneratedImage(imageData);
      }

      console.log(
        "Image data generated successfully, length:",
        imageData.substring(0, 50) + "..."
      );
      setMessage(
        "Image generated successfully! Click 'Save to FilCDN' if you want to keep it."
      );

      // Reset error state if successful
      setHasError(false);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
      console.error("Failed to generate image:", err);
      setHasError(true);
    } finally {
      setIsGenerating(false);
    }
  };

  // Store image on FilCDN and automatically add to gallery
  const handleStoreImage = async () => {
    if ((!currentGeneratedImage && !originalImageData) || !isInitialized)
      return;

    // Always use the original image data for storage, not the blob URL
    // This ensures we're storing the actual image data and not a temporary browser resource
    let imageToStore = originalImageData;

    if (!imageToStore && currentGeneratedImage) {
      // Fallback to currentGeneratedImage if we somehow lost the original data
      console.warn("Using blob URL for storage - this is not ideal");
      imageToStore = currentGeneratedImage;
    }

    if (!imageToStore) {
      console.error("No image data available to store");
      setMessage("Error: No image data available to store");
      return;
    }

    try {
      setIsStoring(true);
      setMessage("Storing image on FilCDN...");

      // Debug image being stored
      console.log(
        "Storing image of type:",
        imageToStore?.startsWith("data:image/webp")
          ? "WebP"
          : imageToStore?.startsWith("data:image/jpeg")
          ? "JPEG"
          : imageToStore?.startsWith("data:")
          ? "Data URL"
          : "Unknown format"
      );

      // Store the image on FilCDN
      const filcdnResponse = await fetch("/api/filcdn", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operation: "store",
          data: {
            name: `venice-${Date.now()}.webp`,
            type: "image/webp",
            content: imageToStore, // Original image data (not blob URL)
            prompt,
            timestamp: Date.now(),
          },
        }),
      });

      if (!filcdnResponse.ok) {
        throw new Error(`FilCDN API error: ${filcdnResponse.statusText}`);
      }

      const filcdnData = await filcdnResponse.json();

      // Add to images list with FilCDN metadata
      const newImage: GeneratedImage = {
        cid: filcdnData.result.cid,
        prompt,
        timestamp: Date.now(),
        url: filcdnData.result.url,
        style: selectedStyle,
        creator: "user", // We'll use a generic identifier for now
        isPublished: true, // Mark as published since we're auto-adding to gallery
      };

      // Log FilCDN integration details for transparency
      console.log("Image stored on FilCDN:", {
        cid: newImage.cid,
        decentralizedStorage: true,
        permanentStorage: true,
        timestamp: new Date(newImage.timestamp).toISOString(),
      });

      // Automatically submit to the gallery
      try {
        setMessage("Storing on FilCDN and adding to gallery...");

        // Prepare submission data
        const submissionData = {
          imageUrl: newImage.url,
          title: `${selectedStyle} artwork`,
          description: `AI-generated artwork: "${prompt}"`,
          creator: newImage.creator || "anonymous",
          stylePreset: selectedStyle,
          prompt: prompt,
        };

        // Submit to public gallery API
        const galleryResponse = await fetch("/api/gallery/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(submissionData),
        });

        if (galleryResponse.ok) {
          console.log("Image automatically added to gallery");
          setMessage("Image stored on FilCDN and added to gallery!");
        } else {
          console.warn("Image stored on FilCDN but failed to add to gallery");
          setMessage("Image stored on FilCDN! (Gallery update failed)");
        }
      } catch (galleryError) {
        console.error("Failed to add to gallery:", galleryError);
        setMessage("Image stored on FilCDN! (Gallery update failed)");
      }

      setImages((prev) => [newImage, ...prev]);
      setCurrentGeneratedImage(null);
      setOriginalImageData(null);
      setPrompt("");
    } catch (err: any) {
      setMessage(`Error storing image: ${err.message}`);
      console.error("Failed to store image:", err);
    } finally {
      setIsStoring(false);
    }
  };

  // Handle publishing image to public gallery
  const handlePublishImage = async () => {
    if (images.length === 0) return;

    try {
      setIsPublishing(true);
      const currentImage = images[activeImageIndex];

      // Skip if already published
      if (currentImage.isPublished) {
        setMessage("This image is already in the public gallery!");
        setIsPublishing(false);
        setShowPublishModal(false);
        return;
      }

      // Prepare submission data
      const submissionData = {
        imageUrl: currentImage.url,
        title: publicTitle || `${currentImage.style} artwork`,
        description: `AI-generated artwork: "${currentImage.prompt}"`,
        creator: currentImage.creator || "anonymous",
        stylePreset: currentImage.style,
        prompt: currentImage.prompt,
      };

      // Submit to public gallery API
      const response = await fetch("/api/gallery/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        throw new Error(`Failed to publish: ${response.statusText}`);
      }

      // Update local state
      const updatedImages = [...images];
      updatedImages[activeImageIndex] = {
        ...currentImage,
        isPublished: true,
        publicTitle,
      };

      setImages(updatedImages);
      localStorage.setItem(
        "ai-generated-images",
        JSON.stringify(updatedImages)
      );

      setMessage("Your artwork has been published to the public gallery!");
      setPublicTitle("");
      setShowPublishModal(false);
    } catch (err: any) {
      setMessage(`Error publishing: ${err.message}`);
      console.error("Failed to publish image:", err);
    } finally {
      setIsPublishing(false);
    }
  };

  // Display current active image or newly generated image
  const renderCurrentImage = () => {
    // If there's a newly generated image waiting to be saved
    if (currentGeneratedImage || originalImageData) {
      console.log("Rendering current generated image preview");

      // For WebP images, prioritize using the original data directly over blob URLs
      // This is to ensure better compatibility across browsers
      const imageToRender = originalImageData?.includes("image/webp")
        ? originalImageData
        : originalImageData || currentGeneratedImage;

      // Detailed debugging for image format
      const imageFormat = imageToRender?.startsWith("blob:")
        ? "blob URL"
        : imageToRender?.startsWith("data:image/webp")
        ? "WebP data URL"
        : imageToRender?.startsWith("data:")
        ? "data URL"
        : "unknown format";

      console.log(`Image format: ${imageFormat}`);
      console.log(
        "Image data sample:",
        imageToRender?.substring(0, 50) + "..."
      );

      return (
        <div className={styles.imageContainer}>
          {/* Render the image */}
          <div className={styles.previewImage}>
            {/* Display debug info for development */}
            <div
              style={{
                fontSize: "10px",
                padding: "4px",
                color: "#666",
                maxWidth: "100%",
                overflowX: "hidden",
              }}
            >
              Format: {imageFormat}
            </div>

            {/* Directly use image data for display */}
            <img
              src={imageToRender || ""}
              alt={prompt}
              className={styles.generatedImage}
              loading="eager"
              decoding="async"
              crossOrigin="anonymous"
              onError={(e) => {
                console.error("Error loading image", e);

                // Try alternative sources or conversion methods
                if (imageToRender !== originalImageData && originalImageData) {
                  // Try using original data directly if we're not already
                  console.log("Trying original data directly");
                  e.currentTarget.src = originalImageData;
                  return;
                }

                // For WebP images that might have compatibility issues
                if (originalImageData?.includes("image/webp")) {
                  console.log(
                    "WebP compatibility issue, trying embedded image"
                  );

                  // Create an embedded image element for better WebP support
                  try {
                    // Create a wrapped version with an explicit image tag
                    const webpWrapper = `
                      <html>
                        <body style="margin:0;padding:0;">
                          <img src="${originalImageData}" style="width:100%;height:100%;object-fit:contain;" />
                        </body>
                      </html>
                    `;
                    const blob = new Blob([webpWrapper], { type: "text/html" });
                    const blobUrl = URL.createObjectURL(blob);
                    setBlobUrls((prev) => [...prev, blobUrl]);

                    // Use iframe or object as fallback
                    e.currentTarget.style.display = "none";
                    const container = e.currentTarget.parentElement;
                    if (container) {
                      const iframe = document.createElement("iframe");
                      iframe.src = blobUrl;
                      iframe.style.width = "100%";
                      iframe.style.height = "100%";
                      iframe.style.border = "none";
                      container.appendChild(iframe);
                      return;
                    }
                  } catch (err) {
                    console.error("Failed WebP handling:", err);
                  }
                }

                // Try converting to PNG if it's a data URL
                if (imageToRender?.startsWith("data:")) {
                  console.log("Trying to convert to PNG");
                  const img = new Image();
                  img.onload = () => {
                    try {
                      const canvas = document.createElement("canvas");
                      canvas.width = img.width || 512;
                      canvas.height = img.height || 512;
                      const ctx = canvas.getContext("2d");
                      ctx?.drawImage(img, 0, 0);
                      const pngUrl = canvas.toDataURL("image/png");
                      e.currentTarget.src = pngUrl;
                    } catch (canvasErr) {
                      console.error("Canvas conversion failed:", canvasErr);
                      e.currentTarget.src = createPlaceholderImage(
                        prompt,
                        selectedStyle
                      );
                    }
                  };
                  img.onerror = () => {
                    console.error("Image load failed in converter");
                    e.currentTarget.src = createPlaceholderImage(
                      prompt,
                      selectedStyle
                    );
                  };
                  img.src = imageToRender;
                  return;
                }

                // Last resort fallback
                e.currentTarget.src = createPlaceholderImage(
                  prompt,
                  selectedStyle
                );
              }}
            />
          </div>
          <div className={styles.imageCaption}>"{prompt}"</div>

          <div className={styles.imageActions}>
            {/* Save to FilCDN button */}
            <button
              className={styles.storeButton}
              onClick={handleStoreImage}
              disabled={isStoring || !isInitialized}
            >
              {isStoring ? "Storing..." : "Save to FilCDN"}
            </button>

            {/* Discard button */}
            <button
              className={styles.discardButton}
              onClick={() => {
                setCurrentGeneratedImage(null);
                setOriginalImageData(null);
                setMessage("Image discarded");
              }}
              disabled={isStoring}
            >
              Discard
            </button>
          </div>
        </div>
      );
    }

    // Show saved images if available
    if (images.length > 0) {
      const currentImage = images[activeImageIndex];

      return (
        <div className={styles.imageContainer}>
          <img
            src={currentImage.url}
            alt={currentImage.prompt}
            className={styles.generatedImage}
            onError={(e) => {
              // If image fails to load, try proxy through FilCDN retrieve route
              if (!e.currentTarget.src.includes("/api/filcdn/retrieve")) {
                // Extract CID from URL if possible
                const cidMatch = e.currentTarget.src.match(
                  /\/ipfs\/([a-zA-Z0-9]+)/
                );
                if (cidMatch && cidMatch[1]) {
                  console.log(
                    "Retrying image load with FilCDN retrieve API",
                    cidMatch[1]
                  );
                  e.currentTarget.src = `/api/filcdn/retrieve?cid=${cidMatch[1]}`;
                } else if (currentImage.cid) {
                  // If we have the CID directly, use it
                  console.log("Using direct CID for image", currentImage.cid);
                  e.currentTarget.src = `/api/filcdn/retrieve?cid=${currentImage.cid}`;
                } else {
                  // Fallback to a placeholder with the prompt text
                  console.log("Falling back to placeholder for image");
                  e.currentTarget.src = createPlaceholderImage(
                    currentImage.prompt,
                    currentImage.style
                  );
                }
              }
            }}
          />
          <div className={styles.imageCaption}>"{currentImage.prompt}"</div>
          <div className={styles.filcdnBadge}>
            <span className={styles.filcdnIcon}>📦</span>
            <span>Stored on FilCDN</span>
            <span className={styles.filcdnCid}>
              {currentImage.cid.substring(0, 8)}...
            </span>
          </div>

          {/* Publish status badge */}
          {currentImage.isPublished && (
            <div className={styles.publishedBadge}>
              <span className={styles.publishedIcon}>🌐</span>
              <span>Published to Gallery</span>
            </div>
          )}

          {/* Share/Publish button */}
          {!currentImage.isPublished && (
            <button
              className={styles.publishButton}
              onClick={() => setShowPublishModal(true)}
            >
              Share to Public Gallery
            </button>
          )}
        </div>
      );
    }

    // Default placeholder
    return (
      <div className={styles.placeholderImage}>
        <p>Your created artwork will appear here</p>
        <span className={styles.filcdnInfo}>
          Generate an image first, then save it to decentralized FilCDN storage
        </span>
      </div>
    );
  };

  // Add error recovery rendering
  if (hasError) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.status}>
            Status: <span className={styles.statusInactive}>Error</span>
          </div>
        </div>

        <div className={styles.generatorSection}>
          <h3>Error Detected</h3>
          <div className={styles.message}>
            There was an error with the image generator.
            <button
              className={styles.generateButton}
              onClick={() => {
                setHasError(false);
                setCurrentGeneratedImage(null);
                setOriginalImageData(null);
                setMessage("Ready to generate a new image.");
              }}
            >
              Reset Generator
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.status}>
          Status:{" "}
          {isInitialized ? (
            <span className={styles.statusActive}>Ready</span>
          ) : (
            <span className={styles.statusInactive}>Initializing</span>
          )}
        </div>
      </div>

      <div className={styles.generatorSection}>
        <h3>Create Your AI Artwork</h3>
        <div className={styles.promptInput}>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the artwork you want to create..."
            disabled={isGenerating || currentGeneratedImage !== null}
            className={styles.textInput}
          />
          <button
            onClick={handleGenerateImage}
            disabled={!prompt || isGenerating || currentGeneratedImage !== null}
            className={styles.generateButton}
          >
            {isGenerating ? "Generating..." : "Generate Image"}
          </button>
        </div>

        <div className={styles.styleSelector}>
          <div
            className={styles.styleHeader}
            onClick={() =>
              !currentGeneratedImage && setShowStyleSelector(!showStyleSelector)
            }
          >
            <span>
              Style: <strong>{selectedStyle}</strong>
            </span>
            <span className={styles.styleToggle}>
              {showStyleSelector ? "▲" : "▼"}
            </span>
          </div>

          {showStyleSelector && !currentGeneratedImage && (
            <div className={styles.styleOptions}>
              {VENICE_STYLES.map((style) => (
                <div
                  key={style}
                  className={`${styles.styleOption} ${
                    style === selectedStyle ? styles.selectedStyle : ""
                  }`}
                  onClick={() => {
                    setSelectedStyle(style);
                    setShowStyleSelector(false);
                  }}
                >
                  {style}
                </div>
              ))}
            </div>
          )}
        </div>
        {message && <div className={styles.message}>{message}</div>}
      </div>

      {/* Publish Modal */}
      {showPublishModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.publishModal}>
            <div className={styles.modalHeader}>
              <h3>Share to Public Gallery</h3>
              <button
                className={styles.closeButton}
                onClick={() => setShowPublishModal(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalContent}>
              <p>
                Your artwork will be visible to all platform users and visitors.
              </p>

              <div className={styles.publishForm}>
                <label htmlFor="publicTitle">
                  Title for your artwork (optional):
                </label>
                <input
                  type="text"
                  id="publicTitle"
                  value={publicTitle}
                  onChange={(e) => setPublicTitle(e.target.value)}
                  placeholder="Enter a title..."
                  className={styles.titleInput}
                />

                <div className={styles.publishActions}>
                  <button
                    className={styles.cancelButton}
                    onClick={() => setShowPublishModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className={styles.confirmButton}
                    onClick={handlePublishImage}
                    disabled={isPublishing}
                  >
                    {isPublishing ? "Publishing..." : "Publish Artwork"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={styles.gallerySection}>
        <h3>Your Artwork Gallery</h3>
        <p className={styles.galleryHelp}>
          Share your creations to the public gallery to collaborate with
          performers and audiences
        </p>
        <div className={styles.imageGallery}>{renderCurrentImage()}</div>
        {images.length > 0 && !currentGeneratedImage && (
          <div className={styles.imageDots}>
            {images.map((_, index) => (
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
    </div>
  );
}

// Helper function to create a placeholder SVG image
function createPlaceholderImage(prompt: string, style?: string) {
  return `data:image/svg+xml;base64,${btoa(
    `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#6f42c1" />
          <stop offset="100%" stop-color="#fd7e14" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" fill="url(#grad)" />
      <text x="50%" y="50%" font-family="Arial" font-size="24" fill="white" text-anchor="middle">
        ${prompt || "AI Generated Image"} ${style ? `(${style})` : ""}
      </text>
    </svg>`
  )}`;
}

// Export the component wrapped in ErrorBoundary
export default function AIImageGenerator() {
  return (
    <ErrorBoundary fallback={AIGeneratorErrorFallback}>
      <AIImageGeneratorInner />
    </ErrorBoundary>
  );
}

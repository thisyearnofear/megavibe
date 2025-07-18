"use client";

import React from "react";
import styles from "./Container.module.css";

interface ContainerProps {
  children: React.ReactNode;
  variant?:
    | "standard"
    | "wide"
    | "narrow"
    | "full"
    | "full-bleed"
    | "touch-optimized";
  className?: string;
}

export function Container({
  children,
  variant = "standard",
  className = "",
}: ContainerProps) {
  // Get the appropriate container class based on the variant
  let containerClass;
  switch (variant) {
    case "wide":
      containerClass = styles["container-wide"];
      break;
    case "narrow":
      containerClass = styles["container-narrow"];
      break;
    case "full":
      containerClass = styles["container-full"];
      break;
    case "full-bleed":
      containerClass = styles["container-full-bleed"];
      break;
    case "touch-optimized":
      containerClass = styles["container-touch-optimized"];
      break;
    default:
      containerClass = styles.container;
  }

  return <div className={`${containerClass} ${className}`}>{children}</div>;
}

export default Container;

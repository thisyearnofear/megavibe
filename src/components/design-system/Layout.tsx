// Design System Layout Components
// Foundational layout components for consistent spacing and structure

"use client";

import React from "react";
import { ContainerProps, GridProps, FlexProps } from "./types";

export const Container: React.FC<ContainerProps> = ({
  children,
  size = "lg",
  padding = "lg",
  centered = true,
  className = "",
  testId,
  ...props
}) => {
  const containerClasses = [
    "container-base",
    `container-${size}`,
    `container-padding-${padding}`,
    centered && "container-centered",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClasses} data-testid={testId} {...props}>
      {children}
    </div>
  );
};

export const Grid: React.FC<GridProps> = ({
  children,
  columns = "auto-fit",
  gap = "lg",
  responsive = true,
  minColumnWidth = "300px",
  className = "",
  testId,
  ...props
}) => {
  const gridClasses = [
    "grid-base",
    responsive && "grid-responsive",
    `gap-${gap}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const gridStyles: React.CSSProperties = {
    gridTemplateColumns:
      typeof columns === "number"
        ? `repeat(${columns}, 1fr)`
        : columns === "auto-fit"
        ? `repeat(auto-fit, minmax(${minColumnWidth}, 1fr))`
        : `repeat(auto-fill, minmax(${minColumnWidth}, 1fr))`,
  };

  return (
    <div
      className={gridClasses}
      style={gridStyles}
      data-testid={testId}
      {...props}
    >
      {children}
    </div>
  );
};

export const Flex: React.FC<FlexProps> = ({
  children,
  direction = "row",
  align = "stretch",
  justify = "start",
  wrap = false,
  gap,
  className = "",
  testId,
  ...props
}) => {
  const flexClasses = [
    "flex",
    direction !== "row" && `flex-${direction}`,
    align !== "stretch" && `items-${align}`,
    justify !== "start" && `justify-${justify}`,
    wrap && "flex-wrap",
    gap && `gap-${gap}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={flexClasses} data-testid={testId} {...props}>
      {children}
    </div>
  );
};

// Spacer component for consistent spacing
export const Spacer: React.FC<{
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  direction?: "horizontal" | "vertical";
}> = ({ size = "md", direction = "vertical" }) => (
  <div
    className={`spacer spacer-${direction} spacer-${size}`}
    aria-hidden="true"
  />
);

export default { Container, Grid, Flex, Spacer };

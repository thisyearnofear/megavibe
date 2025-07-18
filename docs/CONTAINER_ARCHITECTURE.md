# Container Architecture

## Overview

This document outlines our container architecture strategy for creating consistent, responsive, and maintainable layouts across the MegaVibe application.

## Goals

- **DRY Code**: Eliminate duplicate container definitions across components
- **Consistency**: Provide unified layout patterns across the application
- **Mobile Optimization**: Enhance existing mobile-specific design choices
- **Maintainability**: Centralize responsive behavior for easier updates
- **Performance**: Reduce CSS duplication and improve rendering efficiency

## Implementation

### 1. Container Component System

```
src/components/layout/
├── Container.tsx       # Main container component with variants
├── Container.module.css
└── index.ts           # Export all layout components
```

#### Container Variants

- `standard` (1200px) - Default for most content
- `wide` (1400px) - For dashboard and data-rich pages
- `narrow` (800px) - For forms and focused content
- `full` (100%) - For edge-to-edge content
- Mobile-specific variants:
  - `full-bleed` - Removes horizontal padding on mobile
  - `touch-optimized` - Increases spacing for touch targets

### 2. CSS Variables

```css
:root {
  /* Content widths */
  --content-width-narrow: 800px;
  --content-width-standard: 1200px;
  --content-width-wide: 1400px;
  
  /* Container padding */
  --container-padding-desktop: var(--space-lg);
  --container-padding-tablet: var(--space-md);
  --container-padding-mobile: var(--space-sm);
}
```

### 3. Usage Examples

#### Basic Usage

```tsx
import Container from "@/components/layout/Container";

export default function SomePage() {
  return (
    <Container variant="standard">
      <h1>Page Content</h1>
      {/* ... */}
    </Container>
  );
}
```

#### Mobile-Optimized Usage

```tsx
import Container from "@/components/layout/Container";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export default function ResponsivePage() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  return (
    <Container 
      variant={isMobile ? "full-bleed" : "standard"}
      className={styles.customContainer}
    >
      {/* Content adapts based on device */}
    </Container>
  );
}
```

## Mobile Optimization Benefits

- **Consistent Responsive Behavior**: Standardized breakpoints and spacing
- **Content Prioritization**: Support for emphasizing important content on mobile
- **Performance Improvements**: Reduced CSS duplication for faster mobile loading
- **Integration with Existing Mobile Components**: Enhances current mobile optimizations
- **Touch-Friendly Spacing**: Proper spacing for comfortable touch interactions

## Migration Plan

1. **Phase 1**: Create container components and update high-traffic pages
2. **Phase 2**: Update secondary pages and major components
3. **Phase 3**: Refine the system and update remaining components

## Best Practices

- Use the appropriate container variant for the content type
- Consider mobile experience first when designing layouts
- Leverage container props for responsive behavior rather than custom media queries
- Test on multiple device sizes to ensure consistent experience
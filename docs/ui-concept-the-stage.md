# MegaVibe UI Concept: "The Stage"

## Overview

The Stage concept reimagines MegaVibe as a unified, contextual experience centered around performers and content rather than features and pages. This document outlines the core concepts, layouts, and interactions.

## Core Layout

```
┌─────────────────────────────────────────────────────────────┐
│  ┌─────────┐                                     ┌────────┐ │
│  │ LOGO    │                                     │ WALLET │ │
│  └─────────┘                                     └────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                                                         ││
│  │                      THE STAGE                          ││
│  │                                                         ││
│  │    ┌─────────────┐                                      ││
│  │    │             │                                      ││
│  │    │  PERFORMER  │           ┌──────────────────┐      ││
│  │    │    CARD     │──────────▶│  INTERACTION     │      ││
│  │    │             │           │  ZONE            │      ││
│  │    └─────────────┘           └──────────────────┘      ││
│  │                                                         ││
│  │                                                         ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                                                         ││
│  │                    CONTENT STREAM                       ││
│  │                                                         ││
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ ││
│  │  │CONTENT   │  │CONTENT   │  │CONTENT   │  │CONTENT   │ ││
│  │  │CARD      │  │CARD      │  │CARD      │  │CARD      │ ││
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘ ││
│  │                                                         ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. The Stage

The main focal area where performers, speakers, or artists are showcased. Rather than a static component, the Stage adapts based on context:

- **Live Event Mode**: Shows current performer with real-time information
- **Discovery Mode**: Browse featured talent with preview capabilities
- **Content Mode**: Showcases specific content with creator attribution

#### Performer Card Example

```
┌─────────────────────────────────┐
│                                 │
│         [PROFILE IMAGE]         │
│                                 │
│  Artist Name                    │
│  @username                      │
│                                 │
│  Currently performing at:       │
│  Venue Name                     │
│                                 │
│  ┌─────────┐     ┌─────────┐   │
│  │ SUPPORT │     │ BOUNTY  │   │
│  └─────────┘     └─────────┘   │
│                                 │
└─────────────────────────────────┘
```

### 2. Interaction Zone

Instead of modals, a dedicated area that adapts based on the selected performer or content:

- Appears when performer is selected
- Changes context based on what action is being performed
- Provides immediate feedback
- Allows natural flow between related actions

#### Tipping Interaction Example

```
┌───────────────────────────────────────┐
│                                       │
│  SUPPORT ARTIST                       │
│                                       │
│  ┌───────────────────────────────┐    │
│  │   $5    $10    $25    $50     │    │
│  └───────────────────────────────┘    │
│                                       │
│  ┌───────────────────────────────┐    │
│  │         Custom Amount         │    │
│  └───────────────────────────────┘    │
│                                       │
│  Add message:                         │
│  ┌───────────────────────────────┐    │
│  │                               │    │
│  └───────────────────────────────┘    │
│                                       │
│  ┌───────────────────────────────┐    │
│  │           SEND TIP            │    │
│  └───────────────────────────────┘    │
│                                       │
└───────────────────────────────────────┘
```

### 3. Content Stream

A horizontal scrolling feed of content cards that:

- Shows content relevant to the current context
- Allows for easy browsing and discovery
- Provides quick access to related actions (tip, bounty, share)
- Displays content from FilCDN with optimal loading

#### Content Card Example

```
┌───────────────────────┐
│                       │
│   [CONTENT PREVIEW]   │
│                       │
│  Title                │
│  @creator             │
│                       │
│  ┌─────┐ ┌────────┐   │
│  │ TIP │ │ BOUNTY │   │
│  └─────┘ └────────┘   │
│                       │
└───────────────────────┘
```

## Key Interactions

### 1. Discovering a Performer

1. User scrolls through Content Stream
2. Taps on content of interest
3. Content expands, showing creator details
4. User taps on creator
5. Creator card animates to center stage
6. Interaction Zone updates with creator options

### 2. Tipping Flow

1. User selects "Support" on Performer Card
2. Interaction Zone transitions to tipping interface
3. User selects amount with simple tap or slider
4. If wallet not connected, connection happens inline (no modal)
5. User confirms with gesture (swipe right)
6. Animation shows tip "flowing" from user to performer
7. Success confirmation appears briefly
8. Interface returns to previous state with subtle indicator of success

### 3. Bounty Creation

1. User selects "Bounty" on Performer Card
2. Interaction Zone transitions to bounty interface
3. User describes what they want
4. User sets bounty amount
5. User confirms with gesture
6. Bounty card appears in Content Stream
7. Notification is sent to performer

## Transitions and Animations

Key to this interface is the fluid, natural transitions between states:

1. **Smooth Motion**: Elements move with natural physics
2. **State Changes**: Visual cues indicate what's happening
3. **Continuity**: Elements maintain identity as they transform
4. **Micro-interactions**: Small animations provide feedback

## Mobile-First Approach

The Stage concept is inherently mobile-friendly:

1. **Single Column Layout**: Everything flows vertically on mobile
2. **Thumb-Friendly Controls**: Important actions within reach
3. **Gestural Interface**: Swipe, tap, and hold gestures
4. **Reduced Chrome**: Minimal UI elements to maximize content

## Color and Typography

### Color Palette

- **Background**: Deep gradient (#121212 to #1E1E1E)
- **Primary**: Vibrant Purple (#8A2BE2)
- **Secondary**: Electric Blue (#1E90FF)
- **Accent**: Hot Pink (#FF1493)
- **Text**: White (#FFFFFF) and Light Gray (#E0E0E0)

### Typography

- **Headings**: "Montserrat", bold, clean, with generous letter-spacing
- **Body**: "Inter", optimized for readability
- **Accents**: "Roboto Mono" for metrics and data

## Next Steps

1. Create interactive prototypes of key flows
2. Test with users in live event contexts
3. Refine animations and transitions
4. Develop component library based on this concept

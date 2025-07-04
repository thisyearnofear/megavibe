"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import styles from "./Hero.module.css";

export default function Hero() {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const primaryBtnRef = useRef<HTMLButtonElement>(null);
  const secondaryBtnRef = useRef<HTMLButtonElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

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
            <div className={styles.visualContent}>
              {/* Placeholder for dynamic content visualization */}
              <div className={styles.visualPlaceholder}>
                <div className={styles.placeholderItem}></div>
                <div className={styles.placeholderItem}></div>
                <div className={styles.placeholderItem}></div>
              </div>
            </div>
            <div ref={glowRef} className={styles.glow}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

// Force dynamic rendering to prevent SSR issues with Wagmi hooks
export const dynamic = 'force-dynamic';

import React from "react";
import styles from "./page.module.css";
import Container from "@/components/layout/Container";

export default function PerformersPage() {
  const performers = [
    {
      id: 1,
      name: "Alex River",
      specialty: "Vocalist & Guitarist",
      description:
        "Indie rock performer with a passion for heartfelt lyrics and acoustic melodies.",
      image: "/placeholder-performer-1.jpg",
      followers: 12450,
    },
    {
      id: 2,
      name: "Electra Synth",
      specialty: "Electronic Music Producer",
      description:
        "Creating immersive electronic landscapes with cutting-edge production techniques.",
      image: "/placeholder-performer-2.jpg",
      followers: 18920,
    },
    {
      id: 3,
      name: "Marcus Beat",
      specialty: "Drummer & Percussionist",
      description:
        "Rhythm master with experience across jazz, rock, and fusion genres.",
      image: "/placeholder-performer-3.jpg",
      followers: 8730,
    },
    {
      id: 4,
      name: "Lyric Flow",
      specialty: "Spoken Word Artist",
      description:
        "Poet and performer blending words with ambient soundscapes.",
      image: "/placeholder-performer-4.jpg",
      followers: 15640,
    },
    {
      id: 5,
      name: "Harmony Collective",
      specialty: "Vocal Ensemble",
      description:
        "Five-piece a cappella group specializing in complex harmonies and arrangements.",
      image: "/placeholder-performer-5.jpg",
      followers: 21350,
    },
    {
      id: 6,
      name: "DJ Wavelength",
      specialty: "DJ & Remix Artist",
      description:
        "Crafting unique mixes and remixes across multiple electronic genres.",
      image: "/placeholder-performer-6.jpg",
      followers: 29800,
    },
  ];

  return (
    <main className={styles.main}>
      <Container>
        <h1 className={styles.title}>Performers</h1>
        <p className={styles.description}>
          Discover and support talented performers from around the world.
          Connect directly with your favorites and help them create new content.
        </p>

        <div className={styles.searchSection}>
          <input
            type="text"
            placeholder="Search performers..."
            className={styles.searchInput}
          />
          <div className={styles.filters}>
            <select className={styles.filterSelect}>
              <option value="">All Categories</option>
              <option value="musician">Musicians</option>
              <option value="producer">Producers</option>
              <option value="vocalist">Vocalists</option>
              <option value="ensemble">Ensembles</option>
              <option value="other">Other</option>
            </select>
            <select className={styles.filterSelect}>
              <option value="trending">Trending</option>
              <option value="newest">Newest</option>
              <option value="mostFollowed">Most Followed</option>
              <option value="alphabetical">A-Z</option>
            </select>
          </div>
        </div>

        <div className={styles.performersGrid}>
          {performers.map((performer) => (
            <div key={performer.id} className={styles.performerCard}>
              <div className={styles.performerImageContainer}>
                <div className={styles.performerImagePlaceholder}>
                  {performer.name.charAt(0)}
                </div>
              </div>
              <div className={styles.performerInfo}>
                <h2 className={styles.performerName}>{performer.name}</h2>
                <h3 className={styles.performerSpecialty}>
                  {performer.specialty}
                </h3>
                <p className={styles.performerDescription}>
                  {performer.description}
                </p>
                <div className={styles.performerStats}>
                  <span className={styles.followers}>
                    {performer.followers.toLocaleString()} followers
                  </span>
                </div>
                <div className={styles.performerActions}>
                  <button className={styles.followButton}>Follow</button>
                  <button className={styles.supportButton}>Support</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.pagination}>
          <button className={styles.paginationButton}>Previous</button>
          <span className={styles.pageIndicator}>Page 1 of 4</span>
          <button className={styles.paginationButton}>Next</button>
        </div>
      </Container>
    </main>
  );
}

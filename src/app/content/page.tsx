"use client";

// Force dynamic rendering to prevent SSR issues with Wagmi hooks
export const dynamic = 'force-dynamic';

import React from "react";
import styles from "./page.module.css";
import Container from "@/components/layout/Container";

export default function ContentPage() {
  // Mock data for the content items
  const featuredContent = [
    {
      id: 1,
      title: "Neon Dreams",
      creator: "Electra Synth",
      genre: "Electronic",
      description:
        "A journey through synthetic landscapes and digital emotions.",
      image: "/placeholder-track-1.jpg",
      plays: 34250,
      likes: 2156,
    },
    {
      id: 2,
      title: "Acoustic Reflections",
      creator: "Alex River",
      genre: "Indie Folk",
      description:
        "Intimate acoustic arrangements that capture moments of quiet reflection.",
      image: "/placeholder-track-2.jpg",
      plays: 28730,
      likes: 1895,
    },
    {
      id: 3,
      title: "Rhythm Patterns",
      creator: "Marcus Beat",
      genre: "Jazz Fusion",
      description:
        "Complex drumming patterns interwoven with melodic jazz elements.",
      image: "/placeholder-track-3.jpg",
      plays: 19840,
      likes: 1347,
    },
  ];

  const recentContent = [
    {
      id: 4,
      title: "Spoken Word Atmospheres Vol. 1",
      creator: "Lyric Flow",
      genre: "Spoken Word",
      description:
        "Poetic expressions backed by ambient soundscapes and subtle beats.",
      image: "/placeholder-track-4.jpg",
      plays: 12560,
      likes: 845,
    },
    {
      id: 5,
      title: "Harmonic Convergence",
      creator: "Harmony Collective",
      genre: "A Cappella",
      description:
        "Five-part harmonies exploring themes of unity and connection.",
      image: "/placeholder-track-5.jpg",
      plays: 15780,
      likes: 1234,
    },
    {
      id: 6,
      title: "Festival Remix Set",
      creator: "DJ Wavelength",
      genre: "EDM",
      description: "High-energy festival remixes designed to move the crowd.",
      image: "/placeholder-track-6.jpg",
      plays: 42650,
      likes: 3210,
    },
    {
      id: 7,
      title: "Late Night Sessions",
      creator: "Alex River",
      genre: "Lo-fi",
      description:
        "Relaxed beats and melodies perfect for late night focus or relaxation.",
      image: "/placeholder-track-7.jpg",
      plays: 31240,
      likes: 2187,
    },
    {
      id: 8,
      title: "Digital Horizons EP",
      creator: "Electra Synth",
      genre: "Synthwave",
      description:
        "A four-track EP exploring retro-futuristic synth soundscapes.",
      image: "/placeholder-track-8.jpg",
      plays: 26890,
      likes: 1785,
    },
    {
      id: 9,
      title: "Percussion Improvisation",
      creator: "Marcus Beat",
      genre: "Experimental",
      description:
        "Live percussion improvisations using traditional and found instruments.",
      image: "/placeholder-track-9.jpg",
      plays: 9870,
      likes: 678,
    },
  ];

  return (
    <main className={styles.main}>
      <Container>
        <h1 className={styles.title}>Discover Content</h1>
        <p className={styles.description}>
          Explore unique music and audio from independent creators. Support your
          favorites directly and help fund new creative projects.
        </p>

        <div className={styles.searchSection}>
          <input
            type="text"
            placeholder="Search tracks, albums, and creators..."
            className={styles.searchInput}
          />
          <div className={styles.filters}>
            <select className={styles.filterSelect}>
              <option value="">All Types</option>
              <option value="track">Tracks</option>
              <option value="album">Albums</option>
              <option value="ep">EPs</option>
              <option value="podcast">Podcasts</option>
              <option value="other">Other</option>
            </select>
            <select className={styles.filterSelect}>
              <option value="">All Genres</option>
              <option value="electronic">Electronic</option>
              <option value="indie">Indie</option>
              <option value="jazz">Jazz</option>
              <option value="hiphop">Hip Hop</option>
              <option value="rock">Rock</option>
              <option value="folk">Folk</option>
              <option value="spoken">Spoken Word</option>
            </select>
            <select className={styles.filterSelect}>
              <option value="trending">Trending</option>
              <option value="newest">Newest</option>
              <option value="mostPlayed">Most Played</option>
              <option value="mostLiked">Most Liked</option>
            </select>
          </div>
        </div>

        <div className={styles.featuredSection}>
          <h2 className={styles.sectionHeading}>Featured</h2>
          <div className={styles.contentGrid}>
            {featuredContent.map((content) => (
              <div key={content.id} className={styles.contentCard}>
                <div className={styles.contentImageContainer}>
                  <div className={styles.contentImagePlaceholder}>
                    {content.title.charAt(0)}
                  </div>
                  <button className={styles.playButton}>▶</button>
                </div>
                <div className={styles.contentInfo}>
                  <h2 className={styles.contentTitle}>{content.title}</h2>
                  <p className={styles.contentCreator}>{content.creator}</p>
                  <span className={styles.contentGenre}>{content.genre}</span>
                  <p className={styles.contentDescription}>
                    {content.description}
                  </p>
                  <div className={styles.contentStats}>
                    <span>{content.plays.toLocaleString()} plays</span>
                    <span>•</span>
                    <span>{content.likes.toLocaleString()} likes</span>
                  </div>
                  <div className={styles.contentActions}>
                    <button className={styles.likeButton}>♥ Like</button>
                    <button className={styles.supportButton}>Support</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.featuredSection}>
          <h2 className={styles.sectionHeading}>Recent Uploads</h2>
          <div className={styles.contentGrid}>
            {recentContent.map((content) => (
              <div key={content.id} className={styles.contentCard}>
                <div className={styles.contentImageContainer}>
                  <div className={styles.contentImagePlaceholder}>
                    {content.title.charAt(0)}
                  </div>
                  <button className={styles.playButton}>▶</button>
                </div>
                <div className={styles.contentInfo}>
                  <h2 className={styles.contentTitle}>{content.title}</h2>
                  <p className={styles.contentCreator}>{content.creator}</p>
                  <span className={styles.contentGenre}>{content.genre}</span>
                  <p className={styles.contentDescription}>
                    {content.description}
                  </p>
                  <div className={styles.contentStats}>
                    <span>{content.plays.toLocaleString()} plays</span>
                    <span>•</span>
                    <span>{content.likes.toLocaleString()} likes</span>
                  </div>
                  <div className={styles.contentActions}>
                    <button className={styles.likeButton}>♥ Like</button>
                    <button className={styles.supportButton}>Support</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.pagination}>
          <button className={styles.paginationButton}>Previous</button>
          <span className={styles.pageIndicator}>Page 1 of 6</span>
          <button className={styles.paginationButton}>Next</button>
        </div>
      </Container>
    </main>
  );
}

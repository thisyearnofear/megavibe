import React, { useRef, useState, useEffect } from 'react';
import { TwitterShareButton, TwitterIcon } from 'react-share';
import './styles.css';
import SwipeableViews from 'react-swipeable-views-react-18-fix';

// Artist data structure
interface ArtistData {
  name: string;
  image: string;
  bio: string;
  genre: string;
  socialLinks: {
    spotify?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
  songs: string[];
}

const ARTIST_DATA: Record<string, ArtistData> = {
  Papa: {
    name: 'Papa',
    image: '/images/boom.jpg',
    bio: 'Live Experience App creator and indie rock performer',
    genre: 'Indie Rock',
    socialLinks: {
      spotify: 'https://spoti.fi/3FEOjci',
      instagram: 'https://bit.ly/3FLPDKk',
      twitter: 'https://bit.ly/3FHRTT5',
      youtube: 'https://youtube.com/c/papajams'
    },
    songs: ['Chupacabra', 'Digital Dreams', 'City Lights', 'Midnight Drive', 'Electric Soul']
  },
  Anatu: {
    name: 'Anatu',
    image: '/images/boom.jpg',
    bio: 'Nigerian-born electronic artist blending traditional Afrobeat with modern production. Known for creating immersive live experiences that bridge cultures.',
    genre: 'Afrobeat/Electronic',
    socialLinks: {
      spotify: 'https://open.spotify.com/artist/anatu',
      instagram: 'https://instagram.com/anatumusic',
      twitter: 'https://twitter.com/anatumusic',
      youtube: 'https://youtube.com/c/anatumusic'
    },
    songs: ['Lagos Nights', 'Rhythm of the Streets', 'Ancestral Beats', 'Modern Tribe', 'Electronic Sunrise', 'Digital Diaspora']
  },
  Andrew: {
    name: 'Andrew',
    image: '/images/boom.jpg',
    bio: 'Storytelling singer-songwriter with a passion for connecting through music. Specializes in intimate acoustic performances that create deep audience connections.',
    genre: 'Acoustic/Singer-Songwriter',
    socialLinks: {
      spotify: 'https://open.spotify.com/artist/andrewmusic',
      instagram: 'https://instagram.com/andrewsongs',
      twitter: 'https://twitter.com/andrewsongs',
      youtube: 'https://youtube.com/c/andrewsongs'
    },
    songs: ['City Stories', 'Coffee Shop Tales', 'Rainy Day Thoughts', 'Hometown Memories', 'Acoustic Dreams', 'Whispered Truths']
  }
};

type ArtistProfilesProps = {
  artist: string;
  onClose?: () => void;
  onBack?: () => void;
  demoMode?: 'connection' | 'bounty' | 'tokenization' | 'influence' | 'reputation' | 'demo';
};

type EmojiKey = 'emoji1' | 'emoji2' | 'emoji3';

type EmojiCounts = {
  emoji1: number;
  emoji2: number;
  emoji3: number;
};

const ArtistProfiles: React.FC<ArtistProfilesProps> = ({
  artist,
  onClose,
  onBack,
  demoMode = 'demo'
}) => {
  // If called from dashboard (has onBack prop), start in morphed state
  const [isMorphed, setIsMorphed] = React.useState(!!onBack);
  const [isSpinning, setIsSpinning] = React.useState(false);
  const buttonRef = useRef(null);
  const profileRef = useRef(null);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [slideIndex, setSlideIndex] = React.useState(0);
  const [totalAmount, setTotalAmount] = React.useState<number>(0);
  const [selectedSong, setSelectedSong] = useState<string>('');
  const [showExplainer1, setShowExplainer1] = useState<boolean>(true);
  const [showExplainer2, setShowExplainer2] = useState<boolean>(true);
  const [showExplainer3, setShowExplainer3] = useState<boolean>(true);

  const handleOpenGleam = () => {
    // Open the Gleam page in a new tab
    window.open('https://gleam.io/kNvwc/bounty', '_blank');
  };

  const [emojiCounts, setEmojiCounts] = React.useState<EmojiCounts>({
    emoji1: 0,
    emoji2: 0,
    emoji3: 0,
  });

  const handleClearTotal = () => {
    setTotalAmount(0);
  };

  const [totalBountyAmount, setTotalBountyAmount] = useState<number>(0);

  // Get current artist data
  const currentArtist = ARTIST_DATA[artist] || ARTIST_DATA.Papa;

  const handleNextSlide = () => {
    setSlideIndex(prev => Math.min(prev + 1, 3)); // 3 is the maximum index
  };

  const handlePrevSlide = () => {
    setSlideIndex(prev => Math.max(prev - 1, 0)); // 0 is the minimum index
  };

  const handleButtonClick = () => {
    console.log('Button clicked');
    setIsSpinning(true);
    setTimeout(() => {
      setIsMorphed(true);
    }, 500); // Wait for 500ms (the duration of the fade-out animation) before showing the profile
  };

  const handleDoneClick = () => {
    if (onBack) {
      onBack();
    } else if (onClose) {
      onClose();
    } else {
      setIsMorphed(false);
      setTimeout(() => {
        setIsSpinning(false);
      }, 500);
      window.location.reload();
    }
  };

  const handleEmojiClick = (emoji: EmojiKey) => {
    setEmojiCounts(prev => {
      let newCount = prev[emoji] + 1;

      // If count reaches 10, reset to 1 on next click
      if (newCount > 10) {
        newCount = 1;
      }

      // If count reaches 0, reset to 10 on next click
      if (newCount < 1) {
        newCount = 10;
      }

      const updatedEmojiCounts = { ...prev, [emoji]: newCount };

      // Calculate the total bounty amount based on emoji counts
      const totalAmount =
        emojiCounts.emoji1 * 3 +
        emojiCounts.emoji2 * 5 +
        emojiCounts.emoji3 * 10;

      setTotalBountyAmount(totalAmount);

      // Show feedback message only when count is increasing
      if (newCount % 5 === 0 && newCount !== 10) {
        const messages = [
          'Vibes!',
          'Amazing!',
          'Jaysus!',
          'Woop!',
          'Yeehar!',
          'Pow!',
          'Zing!',
          'Chee!',
          'Yes!',
        ];

        const randomMessage =
          messages[Math.floor(Math.random() * messages.length)];
        console.log('New count:', newCount);
        console.log('Selected feedback message:', randomMessage);
        setFeedbackMessage(randomMessage);
        setTimeout(() => setFeedbackMessage(null), 3000);
      }

      // Update the emoji counts but do not affect the total bounty amount on the third mini page
      if (slideIndex !== 2) {
        setTotalBountyAmount(totalAmount);
      }

      return { ...prev, [emoji]: newCount };
    });
  };

  // Function to clear emoji counts and total bounty amount
  const handleClearClick = () => {
    setEmojiCounts({ emoji1: 0, emoji2: 0, emoji3: 0 });
    setTotalBountyAmount(0);
  };

  // Function to handle tip button clicks
  const handleTipClick = (amount: number) => {
    // Add the tip amount to the total amount
    setTotalAmount(prevTotal => prevTotal + amount);
  };

  const handleCheckout = () => {
    window.open('https://buy.stripe.com/test_3cs5oe0J20fo7h6aEE', '_blank');
  };

  const [leaderboardData, setLeaderboardData] = useState<
    Array<{ song: string; emojiCounts: EmojiCounts }>
  >([]);

  const handleSongSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSong(event.target.value);
  };

  const handleSubmit = () => {
    if (selectedSong) {
      // Check if the song has already been submitted
      const alreadySubmitted = leaderboardData.some(
        data => data.song === selectedSong
      );

      if (!alreadySubmitted) {
        setLeaderboardData(prevData => [
          ...prevData,
          {
            song: selectedSong,
            emojiCounts,
          },
        ]);
        // Clear the selected song after submission
        setSelectedSong('');
      } else {
        alert("You've already submitted a rating for this song.");
      }
    }
  };

  const handleRemoveSubmission = (index: number) => {
    setLeaderboardData(prevData => prevData.filter((_, i) => i !== index));
  };

  const leaderboardString = leaderboardData
    .map(
      data =>
        `${data.song}: 🤘🏿 ${data.emojiCounts.emoji1} 🥹 ${data.emojiCounts.emoji2} 🔥 ${data.emojiCounts.emoji3}`
    )
    .join('\n ');

  return (
    <div className="content">
      {onBack && (
        <div className="artist-profile-header">
          <button className="back-to-dashboard-btn" onClick={onBack}>
            ← Back to Performers
          </button>
        </div>
      )}
      {isMorphed ? (
        <>
          <SwipeableViews
            index={slideIndex}
            onChangeIndex={(index: React.SetStateAction<number>) =>
              setSlideIndex(index)
            }
          >
            {/* Mini Profile Page */}
            <div
              className={`artist-profile ${isMorphed ? 'visible' : ''}`}
              ref={profileRef}
            >
              {showExplainer1 && slideIndex === 0 && (
                <div className="explainer">
                  Connect on preferred platforms ‣
                  <button onClick={() => setShowExplainer1(false)}>
                    Got it
                  </button>
                </div>
              )}
              {/* Arrows */}

              <div className="arrow right" onClick={handleNextSlide}>
                →
              </div>
              <img
                src={currentArtist.image}
                alt={currentArtist.name}
                className="artist-image"
              />
              <h2 className="artist-name">{currentArtist.name}</h2>
              <div className="integrations-list">
                {currentArtist.socialLinks.spotify && (
                  <a
                    href={currentArtist.socialLinks.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Spotify
                  </a>
                )}
                {currentArtist.socialLinks.instagram && (
                  <a
                    href={currentArtist.socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Instagram
                  </a>
                )}
                {currentArtist.socialLinks.twitter && (
                  <a
                    href={currentArtist.socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Twitter/X
                  </a>
                )}
                {currentArtist.socialLinks.youtube && (
                  <a
                    href={currentArtist.socialLinks.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Youtube
                  </a>
                )}
              </div>

              <button onClick={handleDoneClick} className="done-button">
                Leave
              </button>
            </div>

            {/* Emoji VibeCheck Page */}
            <div className={`artist-profile ${isMorphed ? 'visible' : ''}`}>
              {showExplainer2 && slideIndex === 1 && (
                <div className="explainer">
                  Rate songs live. Awaken Emojiboard. Share ‣
                  <button onClick={() => setShowExplainer2(false)}>
                    Got it
                  </button>
                </div>
              )}
              <div className="arrow left" onClick={handlePrevSlide}>
                ←
              </div>
              <div className="arrow right" onClick={handleNextSlide}>
                →
              </div>
              <img
                src={currentArtist.image}
                alt={currentArtist.name}
                className="artist-image"
              />
              <h2 className="artist-name">{currentArtist.name}</h2>

              <select
                className="song-dropdown"
                onChange={handleSongSelect}
                value={selectedSong}
              >
                <option value="" disabled style={{ fontStyle: 'italic' }}>
                  Pick A Song
                </option>
                <option value="Chupacabra">Chupacabra</option>
                <option value="OnMyWay">On My Way</option>
                <option value="Hubba">Hubba</option>
                <option value="Shadow">Shadow</option>
              </select>

              <div className="song-emoji-row">
                <div className="emojis">
                  <button onClick={() => handleEmojiClick('emoji1')}>
                    🤘🏿 {emojiCounts.emoji1}
                  </button>
                  <button onClick={() => handleEmojiClick('emoji2')}>
                    🥹 {emojiCounts.emoji2}
                  </button>
                  <button onClick={() => handleEmojiClick('emoji3')}>
                    🔥 {emojiCounts.emoji3}
                  </button>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!selectedSong || selectedSong === 'Pick A Song'}
              >
                Submit A Rating
              </button>

              <div className="emoji-feedback">{feedbackMessage}</div>

              <div className="leaderboard">
                <h3>Emojiboard</h3>
                {leaderboardData.slice(0, 3).map((data, index) => (
                  <div key={index}>
                    <div>{data.song}</div>
                    <div>
                      🤘🏿 {data.emojiCounts.emoji1} 🥹 {data.emojiCounts.emoji2}{' '}
                      🔥 {data.emojiCounts.emoji3}
                    </div>
                    <button onClick={() => handleRemoveSubmission(index)}>
                      Remove
                    </button>
                  </div>
                ))}

                <TwitterShareButton
                  url={window.location.href}
                  title={`${currentArtist.name} - live!\nMy @megavibeapp song ratings\n${leaderboardString}\n@${currentArtist.name.toLowerCase()}\n${currentArtist.socialLinks.spotify || ''}\n`}
                  hashtags={['livemusic', 'megavibelondon']}
                  className="custom-twitter-share-button"
                  disabled={leaderboardData.length === 0}
                >
                  <TwitterIcon size={32} round />
                </TwitterShareButton>
              </div>

              <button onClick={handleDoneClick} className="done-button">
                Leave
              </button>
            </div>

            {/* Bounty Page */}
            <div className={`artist-profile ${isMorphed ? 'visible' : ''}`}>
              {showExplainer3 && slideIndex === 2 && (
                <div className="explainer">
                  Set bounties via actions, or simply tip! ‣
                  <button onClick={() => setShowExplainer3(false)}>
                    Got it
                  </button>
                </div>
              )}
              <div className="arrow left" onClick={handlePrevSlide}>
                ←
              </div>
              <div className="arrow right" onClick={handleNextSlide}>
                →
              </div>
              <img
                src={currentArtist.image}
                alt={currentArtist.name}
                className="artist-image"
              />
              <h2 className="artist-name">{currentArtist.name}</h2>

              <div className="bounty-options">
                {/* Dropdown for songs */}
                <select className="song-dropdown" defaultValue="">
                  <option value="" disabled style={{ fontStyle: 'italic' }}>
                    Bounty Song
                  </option>
                  {currentArtist.songs.map((song, index) => (
                    <option key={index} value={song}>{song}</option>
                  ))}
                </select>

                <button className="set-bounty-button" onClick={handleOpenGleam}>
                  Set Bounty
                </button>
              </div>

              <div className="tipping-options">
                <button
                  className="tip-option"
                  onClick={() => handleTipClick(1)}
                >
                  🍬<span>£1</span>
                </button>
                <button
                  className="tip-option"
                  onClick={() => handleTipClick(2)}
                >
                  ☕<span>£2</span>
                </button>
                <button
                  className="tip-option"
                  onClick={() => handleTipClick(3)}
                >
                  💐<span>£3</span>
                </button>
              </div>

              <div className="tally-box">
                <div className="total-amount-box">
                  {' '}
                  <span>Total: £{totalAmount}</span>
                </div>
                <button className="clear-button" onClick={handleClearTotal}>
                  Clear
                </button>

                <button className="send-tip-button" onClick={handleCheckout}>
                  Send As A Tip
                </button>
              </div>

              <button onClick={handleDoneClick} className="done-button">
                Leave
              </button>
            </div>

            {/* Information Page */}
            <div
              className={`artist-profile ${isMorphed ? 'visible' : ''}`}
              ref={profileRef}
            >
              {showExplainer1 && slideIndex === 3 && (
                <div className="explainer">
                  Share email/feedback. Read blog ‣
                  <button onClick={() => setShowExplainer1(false)}>
                    Got it
                  </button>
                </div>
              )}
              {/* Arrows */}
              <div className="arrow left" onClick={handlePrevSlide}>
                ←
              </div>

              <img
                src={currentArtist.image}
                alt={currentArtist.name}
                className="artist-image"
              />
              <h2 className="artist-name">{currentArtist.name}</h2>
              <div className="information-box">
                <p>
                  {currentArtist.bio}
                </p>
                <p>
                  <strong>Genre:</strong> {currentArtist.genre}
                </p>
                <p>
                  {' '}
                  <a
                    href="  https://github.com/thisyearnofear/megavibe"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Megavibe
                  </a>
                </p>
                <p>Live Experience App</p>
                <p>
                  <a
                    href="https://forms.gle/dvUemCEZ3TEJ8x1b7"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Mail List + Feedback
                  </a>
                </p>
                <p>
                  <a
                    href="https://medium.com/megavibe/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Blog
                  </a>
                </p>
              </div>

              <button onClick={handleDoneClick} className="done-button">
                Leave
              </button>
            </div>

            <div className="nav-indicators">
              <div className={`dot ${activeIndex === 0 ? 'active' : ''}`}></div>
              <div className={`dot ${activeIndex === 1 ? 'active' : ''}`}></div>
              <div className={`dot ${activeIndex === 2 ? 'active' : ''}`}></div>
              <div className={`dot ${activeIndex === 3 ? 'active' : ''}`}></div>
            </div>
          </SwipeableViews>
        </>
      ) : (
        <div ref={buttonRef}>
          {/* Add a specific class for the "MEGA VIBE" button */}
          <button
            className={`button-class custom-mega-vibe-button ${
              isSpinning ? 'spinning' : ''
            }`}
            onClick={handleButtonClick}
          >
            MEGAVIBE
          </button>
        </div>
      )}
    </div>
  );
};

export default ArtistProfiles;

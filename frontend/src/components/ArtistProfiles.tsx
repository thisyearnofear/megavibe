import React, { useRef, useState } from "react";
import "./styles.css";
import SwipeableViews from "react-swipeable-views";
import PaymentDialog from "./PaymentDialog";

type ArtistProfilesProps = {
  artist: string;
};

type EmojiKey = "emoji1" | "emoji2" | "emoji3";

type EmojiCounts = {
  emoji1: number;
  emoji2: number;
  emoji3: number;
};

const ArtistProfiles: React.FC<ArtistProfilesProps> = ({ artist }) => {
  const [isMorphed, setIsMorphed] = React.useState(false);
  const [isSpinning, setIsSpinning] = React.useState(false);
  const buttonRef = useRef(null);
  const profileRef = useRef(null);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [slideIndex, setSlideIndex] = React.useState(0);
  const [totalAmount, setTotalAmount] = React.useState<number>(0);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState<string>("");
  const [selectedAction, setSelectedAction] = useState<string>("");

  const handleOpenPaymentDialog = (
    songName: string | null,
    actionType: string | null
  ) => {
    console.log("Opening payment dialog"); // Add this line for debugging
    console.log("isPaymentDialogOpen:", isPaymentDialogOpen); // Add this line for debugging

    setSelectedSong(songName || "");
    setSelectedAction(actionType || "");
    setIsPaymentDialogOpen(true);
  };

  const handleClosePaymentDialog = () => {
    console.log("Closing payment dialog"); // Add this line for debugging
    console.log("isPaymentDialogOpen:", isPaymentDialogOpen); // Add this line for debugging

    setIsPaymentDialogOpen(false);
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

  const handleNextSlide = () => {
    setSlideIndex((prev) => Math.min(prev + 1, 2)); // 2 is the maximum index
  };

  const handlePrevSlide = () => {
    setSlideIndex((prev) => Math.max(prev - 1, 0)); // 0 is the minimum index
  };

  const handleButtonClick = () => {
    console.log("Button clicked"); // Add this line for debugging
    setIsSpinning(true);
    setTimeout(() => {
      setIsMorphed(true);
    }, 500); // Wait for 500ms (the duration of the fade-out animation) before showing the profile

    // Add this line to open the payment dialog when the button is clicked
    if (slideIndex === 2 && isSpinning) {
      setIsPaymentDialogOpen(true);
    }
  };

  const handleDoneClick = () => {
    setIsMorphed(false);
    setTimeout(() => {
      setIsSpinning(false);
    }, 500); // Wait for 500ms (the duration of the fade-out animation) before showing the button
  };

  const handleEmojiClick = (emoji: EmojiKey) => {
    setEmojiCounts((prev) => {
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
          "Vibes!",
          "Amazing!",
          "Jaysus!",
          "Woop!",
          "Yeehar!",
          "Pow!",
          "Zing!",
          "Chee!",
          "Yes!",
        ];
        const randomMessage =
          messages[Math.floor(Math.random() * messages.length)];
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
    setTotalAmount((prevTotal) => prevTotal + amount);
  };

  return (
    <div className="content">
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
              className={`artist-profile ${isMorphed ? "visible" : ""}`}
              ref={profileRef}
            >
              {/* Arrows */}
              <div className="arrow left" onClick={handlePrevSlide}>
                ←
              </div>
              <div className="arrow right" onClick={handleNextSlide}>
                →
              </div>
              <img
                src="/images/boom.jpg"
                alt="Artist Name"
                className="artist-image"
              />
              <h2 className="artist-name">Papa</h2>
              <div className="integrations-list">
                <a
                  href="https://bit.ly/papaspotify"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Spotify
                </a>
                <a
                  href="https://soundcloud.com/papajams"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Soundcloud
                </a>
                <a
                  href="https://instagram.com/papajams"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Instagram
                </a>
                <a
                  href="https://music.apple.com/gb/artist/papa/1474551580"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Apple
                </a>
                <a
                  href="https://youtube.com/c/papajams"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Youtube
                </a>
              </div>

              <button onClick={handleDoneClick} className="done-button">
                Done
              </button>
            </div>
            {/* VibeCheck Page */}
            <div className={`artist-profile ${isMorphed ? "visible" : ""}`}>
              <div className="arrow left" onClick={handlePrevSlide}>
                ←
              </div>
              <div className="arrow right" onClick={handleNextSlide}>
                →
              </div>
              <img
                src="/images/boom.jpg"
                alt="Artist Name"
                className="artist-image"
              />
              <h2 className="artist-name">Papa</h2>
              <div className="song">
                <a
                  href="http://ffm.to/chpa"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Chupacabra
                </a>
                <div className="emojis">
                  <button onClick={() => handleEmojiClick("emoji1")}>
                    🤘🏿 {emojiCounts.emoji1}
                  </button>
                  <button onClick={() => handleEmojiClick("emoji2")}>
                    🥹 {emojiCounts.emoji2}
                  </button>
                  <button onClick={() => handleEmojiClick("emoji3")}>
                    🔥 {emojiCounts.emoji3}
                  </button>
                </div>
                <div className="emoji-feedback">{feedbackMessage}</div>{" "}
                {/* Moved feedback message here */}
              </div>
              <div className="song">
                <a
                  href="http://ffm.to/blckmn"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Black Man
                </a>
                <div className="emojis">
                  <button onClick={() => handleEmojiClick("emoji1")}>
                    🤘🏿 {emojiCounts.emoji1}
                  </button>
                  <button onClick={() => handleEmojiClick("emoji2")}>
                    🥹 {emojiCounts.emoji2}
                  </button>
                  <button onClick={() => handleEmojiClick("emoji3")}>
                    🔥 {emojiCounts.emoji3}
                  </button>
                </div>
                <div className="emoji-feedback">{feedbackMessage}</div>{" "}
                {/* Moved feedback message here */}
              </div>
              <button onClick={handleDoneClick} className="done-button">
                Done
              </button>
            </div>
            {/* Bounty Page */}
            <div className={`artist-profile ${isMorphed ? "visible" : ""}`}>
              <div className="arrow left" onClick={handlePrevSlide}>
                ←
              </div>
              <div className="arrow right" onClick={handleNextSlide}>
                →
              </div>
              <img
                src="/images/boom.jpg"
                alt="Artist Name"
                className="artist-image"
              />
              <h2 className="artist-name">Papa</h2>

              {/* Dropdown for songs */}
              <select className="song-dropdown" defaultValue="">
                <option value="" disabled style={{ fontStyle: "italic" }}>
                  Pick A Song
                </option>
                <option value="song1">On My Way</option>
                <option value="song2">Happy Birthday</option>
                <option value="song3">Under The Sea</option>
              </select>

              <div className="tipping-options">
                <button
                  className="tip-option"
                  onClick={() => handleTipClick(1)}
                >
                  ☕<span>£1</span>
                </button>
                <button
                  className="tip-option"
                  onClick={() => handleTipClick(2)}
                >
                  🍸<span>£2</span>
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
                  {" "}
                  <span>Total: £{totalAmount}</span>
                </div>
                <button className="clear-button" onClick={handleClearTotal}>
                  Clear
                </button>
              </div>

              {/* Set A Bounty button */}
              <button
                className="set-bounty-button"
                onClick={() =>
                  handleOpenPaymentDialog(selectedSong, "Set A Bounty")
                }
              >
                Set As Bounty To Play It
              </button>

              {/* Send A Tip button */}
              <button
                className="send-tip-button"
                onClick={() =>
                  handleOpenPaymentDialog(selectedSong, "Send As A Thank You")
                }
              >
                Send As A Thank You
              </button>

              <button onClick={handleDoneClick} className="done-button">
                Done
              </button>
            </div>

            <div className="nav-indicators">
              <div className={`dot ${activeIndex === 0 ? "active" : ""}`}></div>
              <div className={`dot ${activeIndex === 1 ? "active" : ""}`}></div>
              <div className={`dot ${activeIndex === 2 ? "active" : ""}`}></div>
            </div>
          </SwipeableViews>
        </>
      ) : (
        <div ref={buttonRef}>
          {/* Add a specific class for the "MEGA VIBE" button */}
          <button
            className={`button-class custom-mega-vibe-button ${
              isSpinning ? "spinning" : ""
            }`}
            onClick={handleButtonClick}
          >
            MEGA VIBE
          </button>
        </div>
      )}

      {isPaymentDialogOpen && (
        <PaymentDialog
          selectedAction={selectedAction}
          totalAmount={totalAmount}
          artistName={artist}
          selectedSong={selectedSong}
          onClose={handleClosePaymentDialog}
        />
      )}
    </div>
  );
};

export default ArtistProfiles;

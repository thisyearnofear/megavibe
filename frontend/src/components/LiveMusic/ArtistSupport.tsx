import React, { useState } from 'react';
import styles from '../../styles/ArtistSupport.module.css';

interface ArtistSupportProps {
  artistName: string;
  venueId: string;
  onTipSent: (amount: number) => void;
}

const ArtistSupport: React.FC<ArtistSupportProps> = ({
  artistName,
  venueId,
  onTipSent,
}) => {
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [isSendingTip, setIsSendingTip] = useState<boolean>(false);
  const [showNFTs, setShowNFTs] = useState<boolean>(false);

  const handleSendTip = () => {
    if (tipAmount <= 0) return;
    setIsSendingTip(true);
    // Simulate API call or blockchain transaction
    setTimeout(() => {
      setIsSendingTip(false);
      onTipSent(tipAmount);
      setTipAmount(0);
    }, 1000);
  };

  const toggleNFTView = () => {
    setShowNFTs(!showNFTs);
  };

  // Dummy NFT/POAP data
  const dummyNFTs = [
    {
      id: 'nft1',
      name: `${artistName} Live Event POAP`,
      description: "Proof of attendance for tonight's performance.",
      image: '/images/nft-poap.png',
      price: 0.01, // in ETH or equivalent
    },
    {
      id: 'nft2',
      name: `${artistName} Exclusive Digital Art`,
      description: 'Limited edition artwork from the artist.',
      image: '/images/nft-art.png',
      price: 0.05,
    },
  ];

  return (
    <div className={styles['artist-support']}>
      <h2>Support {artistName}</h2>
      <p>
        Send a tip or collect exclusive digital items from this performance.
      </p>

      <div className={styles['tip-section']}>
        <h3>Send a Tip</h3>
        <div className={styles['tip-input-group']}>
          <input
            type="number"
            step="0.01"
            min="0"
            value={tipAmount}
            onChange={e => setTipAmount(parseFloat(e.target.value) || 0)}
            placeholder="Enter amount (ETH)"
            className={styles['tip-input']}
            disabled={isSendingTip}
          />
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSendTip}
            disabled={isSendingTip || tipAmount <= 0}
          >
            {isSendingTip ? 'Sending...' : 'Send Tip'}
          </button>
        </div>
        <div className={styles['tip-presets']}>
          <button
            className="btn btn-outline btn-xs"
            onClick={() => setTipAmount(0.01)}
            disabled={isSendingTip}
          >
            0.01 ETH
          </button>
          <button
            className="btn btn-outline btn-xs"
            onClick={() => setTipAmount(0.05)}
            disabled={isSendingTip}
          >
            0.05 ETH
          </button>
          <button
            className="btn btn-outline btn-xs"
            onClick={() => setTipAmount(0.1)}
            disabled={isSendingTip}
          >
            0.1 ETH
          </button>
        </div>
      </div>

      <div className={styles['nft-section']}>
        <button
          className={`btn btn-outline btn-sm ${styles['nft-toggle']}`}
          onClick={toggleNFTView}
        >
          {showNFTs ? 'Hide' : 'View'} Exclusive NFTs & POAPs
        </button>
        {showNFTs && (
          <div className={styles['nft-grid']}>
            {dummyNFTs.map(nft => (
              <div key={nft.id} className={`${styles['nft-card']} card`}>
                <div className={styles['nft-image']}>
                  <img src={nft.image} alt={nft.name} />
                </div>
                <div className={styles['nft-info']}>
                  <h3>{nft.name}</h3>
                  <p className="text-muted">{nft.description}</p>
                  <p className={styles['nft-price']}>{nft.price} ETH</p>
                  <button className="btn btn-primary btn-sm">
                    Collect Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ArtistSupport;

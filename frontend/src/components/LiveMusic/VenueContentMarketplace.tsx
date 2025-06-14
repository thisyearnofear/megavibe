import React from 'react';
import styles from '../../styles/VenueContentMarketplace.module.css';

interface VenueContent {
  id: string;
  title: string;
  thumbnail: string;
  description: string;
  isPremium: boolean;
  venueId: string;
}

interface VenueContentMarketplaceProps {
  venueId: string;
}

// Dummy data for venue content
const dummyContent: VenueContent[] = [
  {
    id: '1',
    title: 'Live Performance Highlight',
    thumbnail: '/images/boom.jpg',
    description: "Highlights from last night's epic performance at Venue A.",
    isPremium: false,
    venueId: 'venueA',
  },
  {
    id: '2',
    title: 'Exclusive Backstage Footage',
    thumbnail: '/images/background-main.jpeg',
    description: "Get a behind-the-scenes look at Venue B's latest event.",
    isPremium: true,
    venueId: 'venueB',
  },
  {
    id: '3',
    title: 'Artist Interview',
    thumbnail: '/images/boom.jpg',
    description: 'Exclusive interview with a featured artist at Venue C.',
    isPremium: false,
    venueId: 'venueC',
  },
];

const VenueContentMarketplace: React.FC<VenueContentMarketplaceProps> = ({
  venueId,
}) => {
  // Filter content based on venueId if needed; for now, show all dummy content
  const contentList = dummyContent;

  return (
    <div className={styles['venue-content-marketplace']}>
      <h2>Venue Content Marketplace</h2>
      <p>
        Browse highlights and exclusive content from live events at this venue.
      </p>
      <div className={styles['content-grid']}>
        {contentList.length > 0 ? (
          contentList.map(content => (
            <div key={content.id} className={`${styles['content-card']} card`}>
              <div className={styles['content-thumbnail']}>
                <img src={content.thumbnail} alt={content.title} />
                {content.isPremium && (
                  <span
                    className={`${styles['premium-badge']} badge badge-primary`}
                  >
                    Premium
                  </span>
                )}
              </div>
              <div className={styles['content-info']}>
                <h3>{content.title}</h3>
                <p className="text-muted">{content.description}</p>
                <button
                  className={`btn ${
                    content.isPremium ? 'btn-outline' : 'btn-primary'
                  } btn-sm`}
                >
                  {content.isPremium ? 'Unlock Now' : 'Watch Free'}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className={styles['empty-state']}>
            <div className={styles['empty-state-icon']}>📹</div>
            <p>No content available for this venue yet.</p>
            <p>Check back after live events!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VenueContentMarketplace;

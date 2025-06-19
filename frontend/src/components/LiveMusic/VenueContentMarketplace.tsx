import React from 'react';
import styles from '../../styles/VenueContentMarketplace.module.css';
import '../../styles/design-system.css';
import { PageLayout } from '../Layout/PageLayout';
import { Card } from '../UI/Card';
import { SkeletonCard } from '../Loading/SkeletonCard';

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
    <PageLayout
      title="Venue Content Marketplace"
      subtitle="Browse highlights and exclusive content from live events at this venue."
      
    >
      <div className="content-grid grid">
        {contentList.length > 0 ? (
          contentList.map(content => (
            <Card key={content.id} hoverable className="content-card">
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
            </Card>
          ))
        ) : (
          <>
            {[...Array(3)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </>
        )}
      </div>
    </PageLayout>
  );
};

export default VenueContentMarketplace;

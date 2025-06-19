import React from 'react';
import { CrossNavigation } from '../Navigation/CrossNavigation';

const SocialFeed = () => {
  return (
    <div>
      {/* Cross-Navigation */}
      <CrossNavigation currentPage="social" />
      {/* Existing content of the Social Feed page */}
    </div>
  );
};

export default SocialFeed;
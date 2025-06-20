import React from 'react';
import { Link } from 'react-router-dom';
import './BountyMarketplaceHeader.css';

const BountyMarketplaceHeader: React.FC = () => {
  return (
    <div className="bounty-marketplace-header">
      <div className="bounty-header-content">
        <h1>Bounty Marketplace</h1>
        <p>Discover and complete tasks from creators to earn rewards</p>
      </div>
      
      <Link to="/bounties/create" className="create-bounty-button">
        <span className="plus-icon">+</span>
        Create Bounty
      </Link>
    </div>
  );
};

export default BountyMarketplaceHeader;
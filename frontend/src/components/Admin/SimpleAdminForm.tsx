import React, { useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../UI/Button';
import { Card } from '../UI/Card';

interface AdminFormData {
  address: string;
  name: string;
  bio: string;
  profileImage: string;
  twitterHandle: string;
  linkedinUrl: string;
  websiteUrl: string;
  featured: boolean;
  verified: boolean;
}

interface SimpleAdminFormProps {
  onSuccess?: () => void;
}

export const SimpleAdminForm: React.FC<SimpleAdminFormProps> = ({ onSuccess }) => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<AdminFormData>({
    address: '',
    name: '',
    bio: '',
    profileImage: '',
    twitterHandle: '',
    linkedinUrl: '',
    websiteUrl: '',
    featured: false,
    verified: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate wallet address format
      if (!formData.address.match(/^0x[a-fA-F0-9]{40}$/)) {
        throw new Error('Invalid wallet address format');
      }

      // Prepare data for API
      const speakerData = {
        address: formData.address.toLowerCase(),
        name: formData.name.trim(),
        bio: formData.bio.trim(),
        profileImage: formData.profileImage.trim() || '/api/placeholder/60/60',
        socialLinks: {
          twitter: formData.twitterHandle ? `https://twitter.com/${formData.twitterHandle.replace('@', '')}` : undefined,
          linkedin: formData.linkedinUrl || undefined,
          website: formData.websiteUrl || undefined
        },
        featured: formData.featured,
        verified: formData.verified,
        source: 'manual' as const
      };

      // Call backend API
      const response = await fetch('/api/admin/speakers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify(speakerData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add speaker');
      }

      // Success
      showSuccess('Speaker Added!', `Successfully added ${formData.name} to the platform`);
      
      // Reset form
      setFormData({
        address: '',
        name: '',
        bio: '',
        profileImage: '',
        twitterHandle: '',
        linkedinUrl: '',
        websiteUrl: '',
        featured: false,
        verified: false
      });

      onSuccess?.();

    } catch (error) {
      console.error('Error adding speaker:', error);
      showError('Error', error instanceof Error ? error.message : 'Failed to add speaker');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof AdminFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="admin-form">
      <div className="admin-form-header">
        <h3>✨ Add New Speaker</h3>
        <p>Manually add speakers who aren't on Farcaster yet</p>
      </div>

      <form onSubmit={handleSubmit} className="admin-form-body">
        {/* Required Fields */}
        <div className="form-section">
          <h4>Required Information</h4>
          
          <div className="form-group">
            <label htmlFor="address">Wallet Address *</label>
            <input
              id="address"
              type="text"
              placeholder="0x..."
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              required
              pattern="0x[a-fA-F0-9]{40}"
              title="Must be a valid Ethereum address"
            />
          </div>

          <div className="form-group">
            <label htmlFor="name">Full Name *</label>
            <input
              id="name"
              type="text"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label htmlFor="bio">Bio *</label>
            <textarea
              id="bio"
              placeholder="Brief description of the speaker..."
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              required
              maxLength={500}
              rows={3}
            />
            <small>{formData.bio.length}/500 characters</small>
          </div>
        </div>

        {/* Optional Fields */}
        <div className="form-section">
          <h4>Optional Information</h4>
          
          <div className="form-group">
            <label htmlFor="profileImage">Profile Image URL</label>
            <input
              id="profileImage"
              type="url"
              placeholder="https://example.com/image.jpg"
              value={formData.profileImage}
              onChange={(e) => handleInputChange('profileImage', e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="twitterHandle">Twitter Handle</label>
              <input
                id="twitterHandle"
                type="text"
                placeholder="username (without @)"
                value={formData.twitterHandle}
                onChange={(e) => handleInputChange('twitterHandle', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="linkedinUrl">LinkedIn URL</label>
              <input
                id="linkedinUrl"
                type="url"
                placeholder="https://linkedin.com/in/username"
                value={formData.linkedinUrl}
                onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="websiteUrl">Website URL</label>
            <input
              id="websiteUrl"
              type="url"
              placeholder="https://example.com"
              value={formData.websiteUrl}
              onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
            />
          </div>
        </div>

        {/* Flags */}
        <div className="form-section">
          <h4>Speaker Settings</h4>
          
          <div className="form-checkboxes">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => handleInputChange('featured', e.target.checked)}
              />
              <span>⭐ Featured Speaker</span>
              <small>Show prominently on talent page</small>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.verified}
                onChange={(e) => handleInputChange('verified', e.target.checked)}
              />
              <span>✅ Manually Verified</span>
              <small>Mark as verified speaker</small>
            </label>
          </div>
        </div>

        <div className="form-actions">
          <Button
            type="submit"
            variant="primary"
            disabled={loading || !formData.address || !formData.name || !formData.bio}
          >
            {loading ? 'Adding Speaker...' : '✨ Add Speaker'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default SimpleAdminForm;

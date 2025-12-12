'use client';

import { useEffect, useState } from 'react';
import { ReviewProfileForm } from '@/components/review-profile-form';
import { ReviewProfilesTable } from '@/components/review-profiles-table';

// Define the type for a review configuration, matching the schema
export interface ReviewConfiguration {
  id: number;
  platformName: string;
  targetCountry: string;
  mainUserCriterion: string;
  secondaryUserCriterion: string;
  rating: number;
  mainLicense: string;
  foundationYear: number;
  mobileApp: string;
  averageWithdrawalTime: string;
  support247: string;
  sportsVariety: string;
  strongMarkets: string;
  casinoGamesCount: number;
  mainProvider: string;
  featuredGame: string;
  welcomeOfferType: string;
  rolloverRequirement: string;
  additionalPromotionsCount: number;
  popularPaymentMethod1: string;
  popularPaymentMethod2: string;
  uniqueCompetitiveAdvantage: string;
  experienceLevel: string;
  desiredTone: string;
  mainFocus: string;
}

export default function ReviewProfilesPage() {
  const [configurations, setConfigurations] = useState<ReviewConfiguration[]>([]);
  const [editingProfile, setEditingProfile] = useState<ReviewConfiguration | null>(null);

  async function fetchConfigurations() {
    const response = await fetch('/api/review-configurations');
    const data = await response.json();
    setConfigurations(data);
  }

  useEffect(() => {
    fetchConfigurations();
  }, []);

  const handleEdit = (profile: ReviewConfiguration) => {
    setEditingProfile(profile);
  };

  const handleCancelEdit = () => {
    setEditingProfile(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Perfiles de Reseñas</h3>
        <p className="text-sm text-muted-foreground">
          Crea y gestiona los perfiles de configuración para la generación de reseñas.
        </p>
      </div>
      <ReviewProfileForm
        editingProfile={editingProfile}
        onFinished={fetchConfigurations}
        onCancel={handleCancelEdit}
      />
      <ReviewProfilesTable
        profiles={configurations}
        onEdit={handleEdit}
        onDelete={fetchConfigurations}
      />
    </div>
  );
}

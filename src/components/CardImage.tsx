import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { getEffectiveCardImage } from '../data/cardsDatabase';

interface CardImageProps {
  card?: {
    name?: string;
    id?: string;
    imageUrl?: string;
    type?: string;
  } | null;
  className?: string;
  alt?: string;
  fallbackIcon?: React.ReactNode;
}

export const CardImage: React.FC<CardImageProps> = ({
  card,
  className = 'w-full h-full object-contain',
  alt,
  fallbackIcon
}) => {
  const { customImageOverrides, artReloadNonce } = useGame();
  const [hasError, setHasError] = useState(false);

  const cardName = card?.name || '';
  const cardId = card?.id || '';

  // Get image source strictly: custom from context/localStorage -> original card.imageUrl -> empty
  const activeSrc =
    customImageOverrides[cardName] ||
    customImageOverrides[cardId] ||
    getEffectiveCardImage(card, customImageOverrides);

  // Reset error state whenever the source or card changes
  useEffect(() => {
    setHasError(false);
  }, [activeSrc, artReloadNonce, cardName, cardId]);

  if (!card) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#111113] text-gray-600">
        {fallbackIcon || '🎴'}
      </div>
    );
  }

  if (!hasError && activeSrc && activeSrc.trim() !== '') {
    return (
      <img
        src={activeSrc}
        alt={alt || card.name || 'Carta'}
        referrerPolicy="no-referrer"
        onError={() => {
          setHasError(true);
        }}
        className={`object-contain max-h-full max-w-full ${className}`}
        style={{ objectFit: 'contain' }}
      />
    );
  }

  // Dark neutral container when no image is provided or on load error
  return (
    <div className="w-full h-full flex items-center justify-center bg-[#111113] text-gray-500">
      {fallbackIcon || <span className="text-3xl opacity-30">⚔️</span>}
    </div>
  );
};

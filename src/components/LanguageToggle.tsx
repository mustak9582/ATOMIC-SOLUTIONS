import React from 'react';

export interface LanguageToggleProps {
  className?: string;
  theme?: 'light' | 'dark';
  variant?: 'compact' | 'standard';
}

/**
 * Entire website operates strictly in English.
 * Language toggle is disabled and hidden across the application.
 */
export const LanguageToggle: React.FC<LanguageToggleProps> = () => {
  return null;
};

export default LanguageToggle;

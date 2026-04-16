import React from 'react';
import boschLogo from '../assets/bosch-logo.svg';

interface BoschLogoProps {
  className?: string;
  imageClassName?: string;
  alt?: string;
}

export default function BoschLogo({ className, imageClassName, alt = 'Bosch logo' }: BoschLogoProps) {
  return (
    <div className={className}>
      <img src={boschLogo} alt={alt} className={imageClassName} />
    </div>
  );
}

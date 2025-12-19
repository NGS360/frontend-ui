import React from 'react';

interface ManifestValidationResponseDisplayProps {
  message?: string;
}

export const ManifestValidationResponseDisplay: React.FC<ManifestValidationResponseDisplayProps> = ({
  message = 'Hello World',
}) => {
  return <div>{message}</div>;
};
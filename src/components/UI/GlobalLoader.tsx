import React from 'react';
import PlantechXLoader from './PlantechXLoader';
import { useLoading } from '../../contexts/LoadingContext';

const GlobalLoader: React.FC = () => {
  const { isLoading, loadingMessage } = useLoading();

  if (!isLoading) return null;

  return <PlantechXLoader message={loadingMessage} />;
};

export default GlobalLoader;
import React from 'react';
import CelebrationModal from '@/components/CelebrationModal';
import { useStorytelling } from '@/context/StorytellingContext';

const AchievementNotifier = () => {
  const {
    showCelebration,
    setShowCelebration,
    celebrationData,
    setCelebrationData,
  } = useStorytelling();

  const handleClose = () => {
    setShowCelebration(false);
    setCelebrationData({ type: 'insight', data: {} });
  };

  return (
    <CelebrationModal
      open={showCelebration}
      onClose={handleClose}
      type={celebrationData.type}
      data={celebrationData.data}
    />
  );
};

export default AchievementNotifier;

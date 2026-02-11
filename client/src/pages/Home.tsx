import { useState } from 'react';
import ObjectDetector from '@/components/ObjectDetector';
import HomeScreen from '@/components/HomeScreen';

/**
 * Home Page - Detect AI
 * 
 * Design Philosophy: Modern Tech-Forward Minimalism
 * - Shows HomeScreen with tutorial on first load
 * - Navigates to ObjectDetector when user clicks "Launch App"
 * - Full-screen camera feed with floating UI panels
 * - Dark slate background with cyan accents
 * - Emphasis on the detection interface as the hero element
 */
export default function Home() {
  const [showApp, setShowApp] = useState(false);

  if (showApp) {
    return <ObjectDetector />;
  }

  return <HomeScreen onStartApp={() => setShowApp(true)} />;
}

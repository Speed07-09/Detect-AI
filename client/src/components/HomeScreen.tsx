import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX, ChevronRight, ChevronLeft, Zap, Upload, BarChart3, Video, Smartphone } from 'lucide-react';
import { useState, useRef } from 'react';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  details: string[];
  audioFile?: string;
}

/**
 * HomeScreen Component
 * 
 * Design Philosophy: Premium Dark Minimalism with Mobile-First Approach
 * - Glass-morphism header with semi-transparent background
 * - Left section: Large headline with feature buttons
 * - Right section: Tutorial card with step indicator
 * - Subtle gradient background with cyan accent lines
 * - Optimized for mobile display
 */
export default function HomeScreen({ onStartApp }: { onStartApp: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  const tutorialSteps: TutorialStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Detect AI',
      description: 'Detect objects in real-time using your webcam or process batch files for offline analysis.',
      icon: <Zap className="w-8 h-8 text-accent" />,
      details: [
        'Powered by TensorFlow.js and COCO-SSD model',
        'Detects 90+ object classes',
        'All processing happens locally in your browser',
        'No data is sent to external servers'
      ],
      audioFile: '/audio/tutorial-step-1.mp3'
    },
    {
      id: 'live-detection',
      title: 'Live Webcam Detection',
      description: 'Use your webcam to detect objects in real-time with visual feedback.',
      icon: <Video className="w-8 h-8 text-accent" />,
      details: [
        'Click "Start Detection" to begin webcam stream',
        'Objects are highlighted with cyan bounding boxes',
        'Confidence scores show detection accuracy',
        'Capture snapshots of detected moments',
        'View detection statistics in real-time'
      ],
      audioFile: '/audio/tutorial-step-2.mp3'
    },
    {
      id: 'batch-processing',
      title: 'Batch File Processing',
      description: 'Upload multiple images or videos for offline detection analysis.',
      icon: <Upload className="w-8 h-8 text-accent" />,
      details: [
        'Switch to "Batch Processing" tab',
        'Drag and drop or select images and videos',
        'Supports PNG, JPG, MP4, and WebM formats',
        'Videos are sampled for efficient processing',
        'View results with detection visualizations'
      ],
      audioFile: '/audio/tutorial-step-3.mp3'
    },
    {
      id: 'export-data',
      title: 'Export & Analyze',
      description: 'Export your detection data in multiple formats for analysis.',
      icon: <BarChart3 className="w-8 h-8 text-accent" />,
      details: [
        'Export snapshots and detections as CSV',
        'Export detailed data as JSON format',
        'CSV format works with spreadsheet applications',
        'JSON format for programmatic analysis',
        'Includes timestamps and confidence scores'
      ],
      audioFile: '/audio/tutorial-step-4.mp3'
    }
  ];

  const currentTutorial = tutorialSteps[currentStep];

  // Handle audio playback
  const handlePlayAudio = () => {
    if (audioRef.current) {
      if (isPlayingAudio) {
        audioRef.current.pause();
        setIsPlayingAudio(false);
      } else {
        audioRef.current.play();
        setIsPlayingAudio(true);
      }
    }
  };

  const handleNextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      setIsPlayingAudio(false);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setIsPlayingAudio(false);
    }
  };

  const handleStepClick = (index: number) => {
    setCurrentStep(index);
    setIsPlayingAudio(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-blue-950/30 text-foreground flex flex-col overflow-hidden relative">
      {/* Animated background gradient lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <svg className="absolute inset-0 w-full h-full opacity-10" preserveAspectRatio="none">
          <path d="M 0 200 Q 300 150 600 200" stroke="#00d9ff" strokeWidth="2" fill="none" />
          <path d="M 0 600 Q 300 550 600 600" stroke="#00d9ff" strokeWidth="2" fill="none" />
        </svg>
      </div>

      {/* Header with Glass-morphism */}
      <header className="relative z-40 border-b border-border/20 bg-card/20 backdrop-blur-xl sticky top-0">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-accent/20 border border-accent/50 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <Video className="w-5 h-5 text-accent" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Detect <span className="text-accent">AI</span></h1>
          </div>
          <Button
            onClick={onStartApp}
            className="bg-accent text-background hover:bg-accent/90 font-semibold rounded-full px-6 py-2 text-sm"
          >
            Launch App
          </Button>
        </div>
      </header>

      {/* Main Content - Mobile-First Layout */}
      <main className="flex-1 container py-8 flex flex-col lg:flex-row gap-8 items-stretch relative z-10">
        {/* Left Section - Hero */}
        <div className="flex-1 flex flex-col justify-center space-y-6 min-h-[500px]">
          {/* Headline */}
          <div>
            <h2 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight tracking-tight">
              Detect<br />
              Objects<br />
              Objects<br />
              with <span className="text-accent">AI</span><br />
              <span className="text-accent">Power</span>
            </h2>
            <p className="text-base lg:text-lg text-muted-foreground leading-relaxed max-w-md">
              Real-time object detection using TensorFlow.js. Identify 90+ object classes from your webcam or batch process images and videos.
            </p>
          </div>

          {/* Feature Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              onClick={onStartApp}
              className="glass border-2 border-accent/60 hover:border-accent hover:bg-accent/10 p-4 rounded-xl transition-all text-left group"
            >
              <div className="flex items-center gap-3 mb-2">
                <Video className="w-5 h-5 text-accent group-hover:scale-110 transition-transform" />
                <span className="font-semibold">Real-Time Detection</span>
              </div>
            </button>
            <button
              onClick={onStartApp}
              className="glass border-2 border-accent/60 hover:border-accent hover:bg-accent/10 p-4 rounded-xl transition-all text-left group"
            >
              <div className="flex items-center gap-3 mb-2">
                <Upload className="w-5 h-5 text-accent group-hover:scale-110 transition-transform" />
                <span className="font-semibold">Batch Processing</span>
              </div>
            </button>
          </div>
        </div>

        {/* Right Section - Tutorial Card */}
        <div className="flex-1 flex flex-col min-h-[500px]">
          <div className="glass border border-accent/30 p-6 rounded-2xl glow-cyan flex flex-col h-full backdrop-blur-xl">
            {/* Tutorial Header */}
            <div className="mb-6 pb-4 border-b border-border/30">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-muted-foreground tracking-widest uppercase">Tutorial</span>
                <span className="text-xs font-medium text-accent">{currentStep + 1}/{tutorialSteps.length}</span>
              </div>
              <h3 className="text-xl font-bold">{currentTutorial.title}</h3>
            </div>

            {/* Tutorial Icon */}
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-card/50 rounded-xl border border-accent/20">
                {currentTutorial.icon}
              </div>
            </div>

            {/* Tutorial Details */}
            <div className="flex-1 mb-6 space-y-3">
              {currentTutorial.details.map((detail, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-1 h-1 rounded-full bg-accent mt-2 flex-shrink-0" />
                  <span className="text-xs lg:text-sm text-foreground/90 leading-relaxed">{detail}</span>
                </div>
              ))}
            </div>

            {/* Progress Dots */}
            <div className="flex justify-center gap-1.5 mb-6">
              {tutorialSteps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => handleStepClick(idx)}
                  className={`transition-all ${
                    idx === currentStep ? 'bg-accent w-6 h-1.5' : 'bg-border w-1.5 h-1.5 hover:bg-border/70'
                  } rounded-full`}
                  aria-label={`Go to step ${idx + 1}`}
                />
              ))}
            </div>

            {/* Audio Controls */}
            {currentTutorial.audioFile && (
              <div className="mb-4">
                <audio
                  ref={audioRef}
                  src={currentTutorial.audioFile}
                  onEnded={() => setIsPlayingAudio(false)}
                />
                <button
                  onClick={handlePlayAudio}
                  className="w-full bg-accent text-background hover:bg-accent/90 font-semibold rounded-lg py-2 text-sm transition-all flex items-center justify-center gap-2"
                >
                  {isPlayingAudio ? (
                    <>
                      <Pause className="w-4 h-4" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" /> Play Audio
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-2">
              <button
                onClick={handlePrevStep}
                disabled={currentStep === 0}
                className="flex-1 glass border border-border/50 hover:bg-card/50 disabled:opacity-40 disabled:cursor-not-allowed font-medium rounded-lg py-2 text-sm transition-all"
              >
                <ChevronLeft className="w-4 h-4 inline mr-1" /> Prev
              </button>
              {currentStep === tutorialSteps.length - 1 ? (
                <button
                  onClick={onStartApp}
                  className="flex-1 bg-accent text-background hover:bg-accent/90 font-semibold rounded-lg py-2 text-sm transition-all flex items-center justify-center gap-1"
                >
                  Start <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleNextStep}
                  className="flex-1 bg-accent text-background hover:bg-accent/90 font-semibold rounded-lg py-2 text-sm transition-all flex items-center justify-center gap-1"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/20 bg-card/10 backdrop-blur-sm py-4">
        <div className="container flex items-center justify-between text-xs text-muted-foreground">
          <p>Made with Manus</p>
          <button className="hover:text-foreground transition-colors">✕</button>
        </div>
      </footer>
    </div>
  );
}

import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { Button } from '@/components/ui/button';
import { Camera, StopCircle, Loader2, Download, Image as ImageIcon, Trash2, Upload, Video, Eye, Percent } from 'lucide-react';
import BatchProcessor from './BatchProcessor';
import { useState, useRef, useEffect } from 'react';

interface Detection {
  class: string;
  score: number;
  bbox: [number, number, number, number];
}

interface Snapshot {
  id: string;
  timestamp: Date;
  imageData: string;
  detections: Detection[];
}

/**
 * ObjectDetector Component
 * 
 * Design Philosophy: Premium Dark Minimalism
 * - Very dark navy background with bright cyan accents
 * - Glass-morphism panels with blur effects
 * - Large camera feed with cyan border
 * - Right sidebar with Detected Objects and Stats panels
 * - Green status indicator
 * - Mobile-first responsive layout
 */
export default function ObjectDetector() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [modelStatus, setModelStatus] = useState('Initializing...');
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [showSnapshots, setShowSnapshots] = useState(false);
  const [activeTab, setActiveTab] = useState<'webcam' | 'batch'>('webcam');
  const modelRef = useRef<cocoSsd.ObjectDetection | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize TensorFlow.js and COCO-SSD model
  useEffect(() => {
    const initializeModel = async () => {
      try {
        setModelStatus('Loading TensorFlow.js...');
        await tf.ready();
        
        setModelStatus('Loading COCO-SSD model...');
        const model = await cocoSsd.load();
        modelRef.current = model;
        
        setModelStatus('Ready');
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading model:', error);
        setModelStatus('Error loading model');
        setIsLoading(false);
      }
    };

    initializeModel();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Start webcam stream
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsDetecting(true);
          detectObjects();
        };
      }
    } catch (error) {
      console.error('Error accessing webcam:', error);
      alert('Unable to access webcam. Please check permissions.');
    }
  };

  // Detect objects in video frames
  const detectObjects = async () => {
    if (!videoRef.current || !canvasRef.current || !modelRef.current || !isDetecting) {
      return;
    }

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const video = videoRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const predictions = await modelRef.current.detect(canvas);

        // Draw bounding boxes
        predictions.forEach((prediction) => {
          const [x, y, width, height] = prediction.bbox;
          ctx.strokeStyle = '#00d9ff';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 2]);
          ctx.strokeRect(x, y, width, height);
          ctx.setLineDash([]);

          const label = `${prediction.class} ${(prediction.score * 100).toFixed(1)}%`;
          ctx.font = 'bold 12px sans-serif';
          const textMetrics = ctx.measureText(label);
          ctx.fillStyle = '#00d9ff';
          ctx.fillRect(x, y - 18, textMetrics.width + 4, 16);
          ctx.fillStyle = '#0f1419';
          ctx.fillText(label, x + 2, y - 4);
        });

        setDetections(predictions.map(p => ({
          class: p.class,
          score: p.score,
          bbox: p.bbox as [number, number, number, number]
        })));
      }

      animationFrameRef.current = requestAnimationFrame(detectObjects);
    } catch (error) {
      console.error('Error detecting objects:', error);
    }
  };

  // Stop detection
  const stopDetection = () => {
    setIsDetecting(false);
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setDetections([]);
  };

  // Capture snapshot
  const captureSnapshot = () => {
    if (canvasRef.current) {
      const imageData = canvasRef.current.toDataURL('image/png');
      const snapshot: Snapshot = {
        id: Date.now().toString(),
        timestamp: new Date(),
        imageData,
        detections: [...detections]
      };
      setSnapshots([snapshot, ...snapshots]);
    }
  };

  // Export snapshots as CSV
  const exportAsCSV = () => {
    const headers = ['Timestamp', 'Object Class', 'Confidence', 'X', 'Y', 'Width', 'Height'];
    const rows: string[] = [];

    snapshots.forEach(snapshot => {
      snapshot.detections.forEach(d => {
        rows.push([
          snapshot.timestamp.toISOString(),
          d.class,
          (d.score * 100).toFixed(2),
          d.bbox[0].toFixed(2),
          d.bbox[1].toFixed(2),
          d.bbox[2].toFixed(2),
          d.bbox[3].toFixed(2)
        ].join(','));
      });
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `detections-${Date.now()}.csv`;
    a.click();
  };

  // Export snapshots as JSON
  const exportAsJSON = () => {
    const data = {
      timestamp: new Date().toISOString(),
      snapshots: snapshots.map(s => ({
        timestamp: s.timestamp.toISOString(),
        detections: s.detections.map(d => ({
          class: d.class,
          confidence: (d.score * 100).toFixed(2),
          bbox: {
            x: d.bbox[0],
            y: d.bbox[1],
            width: d.bbox[2],
            height: d.bbox[3]
          }
        }))
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `detections-${Date.now()}.json`;
    a.click();
  };

  // Calculate average confidence
  const avgConfidence = detections.length > 0
    ? (detections.reduce((sum, d) => sum + d.score, 0) / detections.length * 100).toFixed(1)
    : '0';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-blue-950/30 flex flex-col">
      {/* Header */}
      <header className="border-b border-border/20 bg-card/20 backdrop-blur-xl sticky top-0 z-40">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-accent/20 border border-accent/50 rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-accent" />
            </div>
            <h1 className="text-xl font-bold">Detect <span className="text-accent">AI</span></h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm font-medium text-green-500">{modelStatus}</span>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="border-b border-border/20 bg-card/10 backdrop-blur-sm sticky top-14 z-30">
        <div className="container flex gap-8">
          <button
            onClick={() => setActiveTab('webcam')}
            className={`py-4 text-sm font-medium transition-colors relative ${
              activeTab === 'webcam' ? 'text-accent' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Live Detection
            {activeTab === 'webcam' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('batch')}
            className={`py-4 text-sm font-medium transition-colors relative ${
              activeTab === 'batch' ? 'text-accent' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Batch Processing
            {activeTab === 'batch' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 container py-6 flex flex-col lg:flex-row gap-6">
        {activeTab === 'webcam' ? (
          <>
            {/* Left Section - Camera Feed */}
            <div className="flex-1 flex flex-col gap-4">
              {/* Camera Preview */}
              <div className="glass border-2 border-accent/60 rounded-2xl overflow-hidden aspect-video lg:aspect-auto lg:h-96 glow-cyan">
                <canvas
                  ref={canvasRef}
                  className="w-full h-full object-cover hidden"
                />
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover bg-black"
                  playsInline
                />
                {!isDetecting && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-card/50 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <Camera className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">Ready to detect objects</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Control Button */}
              <div className="glass rounded-2xl p-4 glow-cyan">
                {!isDetecting ? (
                  <button
                    onClick={startWebcam}
                    disabled={isLoading}
                    className="w-full bg-accent text-background hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed font-semibold rounded-lg py-3 transition-all flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Loading Model...
                      </>
                    ) : (
                      <>
                        <Camera className="w-5 h-5" />
                        Start Detection
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={stopDetection}
                    className="w-full bg-destructive text-background hover:bg-destructive/90 font-semibold rounded-lg py-3 transition-all flex items-center justify-center gap-2"
                  >
                    <StopCircle className="w-5 h-5" />
                    Stop Detection
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              {isDetecting && (
                <div className="flex gap-3">
                  <button
                    onClick={captureSnapshot}
                    className="flex-1 glass border border-accent/50 hover:bg-card/50 rounded-lg py-2 text-sm font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <ImageIcon className="w-4 h-4" />
                    Capture
                  </button>
                  {snapshots.length > 0 && (
                    <button
                      onClick={() => setShowSnapshots(!showSnapshots)}
                      className="flex-1 glass border border-accent/50 hover:bg-card/50 rounded-lg py-2 text-sm font-medium transition-all"
                    >
                      Snapshots ({snapshots.length})
                    </button>
                  )}
                </div>
              )}

              {/* Export Buttons */}
              {snapshots.length > 0 && (
                <div className="flex gap-3">
                  <button
                    onClick={exportAsCSV}
                    className="flex-1 bg-accent text-background hover:bg-accent/90 font-semibold rounded-lg py-2 text-sm transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    CSV
                  </button>
                  <button
                    onClick={exportAsJSON}
                    className="flex-1 bg-accent text-background hover:bg-accent/90 font-semibold rounded-lg py-2 text-sm transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    JSON
                  </button>
                </div>
              )}
            </div>

            {/* Right Section - Detected Objects & Stats */}
            <div className="w-full lg:w-80 flex flex-col gap-4">
              {/* Detected Objects Panel */}
              <div className="glass border border-accent/30 rounded-2xl overflow-hidden glow-cyan flex flex-col h-80">
                <div className="border-b border-border/30 px-4 py-3">
                  <h3 className="text-sm font-semibold text-accent">Detected Objects</h3>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-4">
                  {detections.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                      <div className="text-4xl mb-2">😢</div>
                      <p className="text-sm text-muted-foreground">No objects detected yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {detections.map((detection, idx) => (
                        <div key={idx} className="p-2 bg-card/50 rounded border border-border/30">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium">{detection.class}</span>
                            <span className="text-xs font-semibold text-accent">{(detection.score * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Panel */}
              <div className="glass border border-accent/30 rounded-2xl overflow-hidden glow-cyan">
                <div className="border-b border-border/30 px-4 py-3">
                  <h3 className="text-sm font-semibold text-accent">Stats</h3>
                </div>
                <div className="p-6 space-y-6">
                  {/* Objects Count */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-4xl font-bold text-accent">{detections.length}</p>
                      <p className="text-xs text-muted-foreground mt-1">Objects</p>
                    </div>
                    <Eye className="w-6 h-6 text-accent/50" />
                  </div>

                  {/* Confidence */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-4xl font-bold text-accent">{avgConfidence}%</p>
                      <p className="text-xs text-muted-foreground mt-1">Avg Confidence</p>
                    </div>
                    <Percent className="w-6 h-6 text-accent/50" />
                  </div>
                </div>
              </div>

              {/* Made with Manus */}
              <div className="glass border border-border/30 rounded-xl px-3 py-2 text-xs text-muted-foreground text-center">
                Made with Manus 🚀
              </div>
            </div>
          </>
        ) : (
          <div className="w-full">
            <BatchProcessor />
          </div>
        )}
      </main>

      {/* Snapshots Modal */}
      {showSnapshots && snapshots.length > 0 && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border/30 rounded-2xl max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="sticky top-0 border-b border-border/30 px-6 py-4 bg-card/50 backdrop-blur-sm flex items-center justify-between">
              <h3 className="font-semibold">Snapshots ({snapshots.length})</h3>
              <button
                onClick={() => setShowSnapshots(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 p-4">
              {snapshots.map(snapshot => (
                <div key={snapshot.id} className="relative group">
                  <img
                    src={snapshot.imageData}
                    alt="snapshot"
                    className="w-full aspect-video object-cover rounded-lg border border-border/30"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        const a = document.createElement('a');
                        a.href = snapshot.imageData;
                        a.download = `snapshot-${snapshot.id}.png`;
                        a.click();
                      }}
                      className="p-2 bg-accent rounded-lg hover:bg-accent/90"
                    >
                      <Download className="w-4 h-4 text-background" />
                    </button>
                    <button
                      onClick={() => setSnapshots(snapshots.filter(s => s.id !== snapshot.id))}
                      className="p-2 bg-destructive rounded-lg hover:bg-destructive/90"
                    >
                      <Trash2 className="w-4 h-4 text-background" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    {snapshot.detections.length} objects
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

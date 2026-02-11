import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, Download, Trash2, Play, Pause } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface Detection {
  class: string;
  score: number;
  bbox: [number, number, number, number];
}

interface ProcessedFile {
  id: string;
  name: string;
  type: 'image' | 'video';
  detections: Detection[];
  imageData?: string;
  timestamp: Date;
}

/**
 * BatchProcessor Component
 * 
 * Design Philosophy: Premium Dark Minimalism
 * - Handles image and video file uploads
 * - Processes files offline using TensorFlow.js
 * - Displays detection results with visualizations
 * - Exports batch processing results
 * - Glass-morphism design with cyan accents
 */
export default function BatchProcessor() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [currentFile, setCurrentFile] = useState<ProcessedFile | null>(null);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const videoFrameCountRef = useRef(0);
  const modelRef = useRef<cocoSsd.ObjectDetection | null>(null);

  // Initialize model on component mount
  useEffect(() => {
    const initModel = async () => {
      try {
        const model = await cocoSsd.load();
        modelRef.current = model;
      } catch (error) {
        console.error('Error loading model for batch processing:', error);
      }
    };
    initModel();
  }, []);

  // Process image file
  const processImage = async (file: File): Promise<ProcessedFile | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const img = new Image();
        img.onload = async () => {
          if (!modelRef.current) {
            resolve(null);
            return;
          }

          try {
            const predictions = await modelRef.current.detect(img);
            
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              
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

              resolve({
                id: Date.now().toString(),
                name: file.name,
                type: 'image',
                detections: predictions.map(p => ({
                  class: p.class,
                  score: p.score,
                  bbox: p.bbox as [number, number, number, number]
                })),
                imageData: canvas.toDataURL('image/png'),
                timestamp: new Date()
              });
            }
          } catch (error) {
            console.error('Error processing image:', error);
            resolve(null);
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  // Process video file
  const processVideo = async (file: File): Promise<ProcessedFile | null> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const reader = new FileReader();

      reader.onload = (e) => {
        video.src = e.target?.result as string;
        video.onloadedmetadata = async () => {
          if (!modelRef.current) {
            resolve(null);
            return;
          }

          try {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
              resolve(null);
              return;
            }

            let allDetections: Detection[] = [];
            let frameCount = 0;

            const processFrame = async () => {
              if (video.ended) {
                // Draw final frame with all detections
                ctx.drawImage(video, 0, 0);
                
                allDetections.forEach((detection) => {
                  const [x, y, width, height] = detection.bbox;
                  ctx.strokeStyle = '#00d9ff';
                  ctx.lineWidth = 2;
                  ctx.setLineDash([4, 2]);
                  ctx.strokeRect(x, y, width, height);
                  ctx.setLineDash([]);
                  
                  const label = `${detection.class} ${(detection.score * 100).toFixed(1)}%`;
                  ctx.font = 'bold 12px sans-serif';
                  const textMetrics = ctx.measureText(label);
                  ctx.fillStyle = '#00d9ff';
                  ctx.fillRect(x, y - 18, textMetrics.width + 4, 16);
                  ctx.fillStyle = '#0f1419';
                  ctx.fillText(label, x + 2, y - 4);
                });

                resolve({
                  id: Date.now().toString(),
                  name: file.name,
                  type: 'video',
                  detections: allDetections,
                  imageData: canvas.toDataURL('image/png'),
                  timestamp: new Date()
                });
                return;
              }

              // Sample every 5 frames
              if (frameCount % 5 === 0) {
                ctx.drawImage(video, 0, 0);
                const predictions = await modelRef.current!.detect(canvas);
                allDetections = predictions.map(p => ({
                  class: p.class,
                  score: p.score,
                  bbox: p.bbox as [number, number, number, number]
                }));
              }

              frameCount++;
              video.currentTime += 1 / 30; // Move to next frame
              setTimeout(processFrame, 100);
            };

            video.currentTime = 0;
            processFrame();
          } catch (error) {
            console.error('Error processing video:', error);
            resolve(null);
          }
        };
      };

      reader.readAsArrayBuffer(file);
    });
  };

  // Handle file selection
  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    setIsProcessing(true);
    const newFiles: ProcessedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (isImage) {
        const result = await processImage(file);
        if (result) newFiles.push(result);
      } else if (isVideo) {
        const result = await processVideo(file);
        if (result) newFiles.push(result);
      }
    }

    setProcessedFiles([...newFiles, ...processedFiles]);
    setIsProcessing(false);
  };

  // Export batch results as CSV
  const exportAsCSV = () => {
    const headers = ['File Name', 'Object Class', 'Confidence', 'X', 'Y', 'Width', 'Height', 'Timestamp'];
    const rows: string[] = [];

    processedFiles.forEach(file => {
      file.detections.forEach(d => {
        rows.push([
          file.name,
          d.class,
          (d.score * 100).toFixed(2),
          d.bbox[0].toFixed(2),
          d.bbox[1].toFixed(2),
          d.bbox[2].toFixed(2),
          d.bbox[3].toFixed(2),
          file.timestamp.toISOString()
        ].join(','));
      });
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch-detections-${Date.now()}.csv`;
    a.click();
  };

  // Export batch results as JSON
  const exportAsJSON = () => {
    const data = {
      timestamp: new Date().toISOString(),
      files: processedFiles.map(file => ({
        name: file.name,
        type: file.type,
        detections: file.detections.map(d => ({
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
    a.download = `batch-detections-${Date.now()}.json`;
    a.click();
  };

  // Delete processed file
  const deleteFile = (id: string) => {
    setProcessedFiles(processedFiles.filter(f => f.id !== id));
    if (currentFile?.id === id) {
      setCurrentFile(null);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Upload Zone */}
      <div
        className="glass rounded-2xl p-12 border-2 border-dashed border-accent/60 glow-cyan cursor-pointer hover:border-accent/80 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          e.currentTarget.classList.add('border-accent');
        }}
        onDragLeave={(e) => {
          e.currentTarget.classList.remove('border-accent');
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove('border-accent');
          handleFileSelect(e.dataTransfer.files);
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        <div className="text-center">
          <Upload className="w-12 h-12 mx-auto mb-4 text-accent/60" />
          <p className="text-lg font-semibold mb-2">Click to upload or drag and drop</p>
          <p className="text-sm text-muted-foreground">PNG, JPG, MP4, WebM (up to 100MB)</p>
        </div>
      </div>

      {/* Processing Status */}
      {isProcessing && (
        <div className="glass p-6 rounded-2xl flex items-center gap-4 glow-cyan">
          <Loader2 className="w-6 h-6 text-accent animate-spin" />
          <span className="text-sm font-medium">Processing files...</span>
        </div>
      )}

      {/* Results Grid */}
      {processedFiles.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Processed Files ({processedFiles.length})</h3>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {processedFiles.map(file => (
              <div
                key={file.id}
                className="glass rounded-xl overflow-hidden cursor-pointer hover:border-accent/50 transition-all group glow-cyan"
                onClick={() => setCurrentFile(file)}
              >
                {file.imageData && (
                  <div className="relative">
                    <img
                      src={file.imageData}
                      alt={file.name}
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFile(file.id);
                        }}
                        className="p-2 bg-destructive rounded-lg hover:bg-destructive/90"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
                <div className="p-3">
                  <p className="text-xs font-semibold text-accent mb-1">{file.detections.length} objects</p>
                  <p className="text-xs text-muted-foreground truncate">{file.name}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Export Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={exportAsCSV}
              className="flex-1 bg-accent text-background hover:bg-accent/90 font-semibold rounded-lg py-6"
            >
              <Download className="w-4 h-4 mr-2" />
              Export as CSV
            </Button>
            <Button
              onClick={exportAsJSON}
              className="flex-1 bg-accent text-background hover:bg-accent/90 font-semibold rounded-lg py-6"
            >
              <Download className="w-4 h-4 mr-2" />
              Export as JSON
            </Button>
          </div>
        </div>
      )}

      {/* Current File Details */}
      {currentFile && (
        <div className="glass rounded-2xl p-6 glow-cyan">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold">{currentFile.name}</h4>
            <button
              onClick={() => setCurrentFile(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
          {currentFile.imageData && (
            <img
              src={currentFile.imageData}
              alt={currentFile.name}
              className="w-full rounded-lg mb-4 border border-border/30"
            />
          )}
          <div className="space-y-2">
            <p className="text-sm"><span className="text-muted-foreground">Type:</span> <span className="font-medium">{currentFile.type}</span></p>
            <p className="text-sm"><span className="text-muted-foreground">Objects Detected:</span> <span className="font-medium text-accent">{currentFile.detections.length}</span></p>
            <p className="text-sm"><span className="text-muted-foreground">Timestamp:</span> <span className="font-medium">{currentFile.timestamp.toLocaleString()}</span></p>
          </div>
          <div className="mt-4">
            <h5 className="text-sm font-semibold mb-3">Detections</h5>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {currentFile.detections.map((detection, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-card/50 rounded border border-border/30">
                  <span className="text-sm">{detection.class}</span>
                  <span className="text-xs font-semibold text-accent">{(detection.score * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

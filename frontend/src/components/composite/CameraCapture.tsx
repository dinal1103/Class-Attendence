import { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/primitives/Button';

interface CameraCaptureProps {
    onCapture: (file: File) => void;
    onClose: () => void;
}

export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isStreaming, setIsStreaming] = useState(false);

    const startCamera = useCallback(async () => {
        try {
            setError(null);
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }, // Default to rear camera
                audio: false
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                setIsStreaming(true);
            }
        } catch (err) {
            console.error('Camera Access Error:', err);
            setError('Could not access camera. Please check permissions.');
        }
    }, []);

    useEffect(() => {
        startCamera();
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) return;

        // Match canvas size to video aspect ratio
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw current video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert canvas to blob/file
        canvas.toBlob((blob) => {
            if (blob) {
                const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
                onCapture(file);
                onClose();
            }
        }, 'image/jpeg', 0.9);
    };

    return (
        <div className="fixed inset-0 z-[60] flex flex-col bg-black">
            {/* Header */}
            <div className="h-16 px-4 flex items-center justify-between text-white border-b border-white/10 z-10">
                <span className="font-semibold">Take Classroom Photo</span>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Video Viewport */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                {!error ? (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                        onPlay={() => setIsStreaming(true)}
                    />
                ) : (
                    <div className="flex flex-col items-center gap-4 text-white px-6 text-center">
                        <AlertCircle className="w-12 h-12 text-red-500" />
                        <p className="text-sm font-medium">{error}</p>
                        <Button variant="secondary" onClick={startCamera}>Try Again</Button>
                    </div>
                )}
            </div>

            {/* Footer / Controls */}
            <div className="h-32 flex items-center justify-center px-6 bg-black/50 backdrop-blur-md z-10">
                {isStreaming && (
                    <button
                        onClick={capturePhoto}
                        className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center group active:scale-95 transition-transform"
                    >
                        <div className="w-12 h-12 rounded-full bg-white group-hover:bg-white/90" />
                    </button>
                )}
            </div>

            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}

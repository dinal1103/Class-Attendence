import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Loader2, CheckCircle, ChevronRight, RotateCcw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/primitives/Button';
import { Card, CardContent } from '@/components/primitives/Card';
import { PageHeader } from '@/components/layout/PageHeader';
import api from '@/api/axios';

const ANGLES = [
    { key: 'straight', label: 'Look Straight', instruction: 'Look directly at the camera' },
    { key: 'left', label: 'Turn Left', instruction: 'Turn your head slightly to the left' },
    { key: 'right', label: 'Turn Right', instruction: 'Turn your head slightly to the right' },
    { key: 'up', label: 'Look Up', instruction: 'Tilt your head slightly upward' },
    { key: 'down', label: 'Look Down', instruction: 'Tilt your head slightly downward' },
];

export default function StudentFaceEnroll() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [step, setStep] = useState(0); // 0 = start, 1-5 = capturing angles, 6 = uploading, 7 = done
    const [captures, setCaptures] = useState<Blob[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');
    const [success, setSuccess] = useState(false);
    const [cameraError, setCameraError] = useState('');
    const [countdown, setCountdown] = useState<number | null>(null);

    const startCamera = useCallback(async () => {
        try {
            setCameraError('');
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch {
            setCameraError('Could not access camera. Please allow camera permissions and try again.');
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
    }, []);

    useEffect(() => {
        return () => { stopCamera(); };
    }, [stopCamera]);

    const beginCapture = async () => {
        setStep(1);
        setCaptures([]);
        setPreviews([]);
        setMessage('');
        setSuccess(false);
        await startCamera();
    };

    const captureFrame = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        // 3-second countdown
        setCountdown(3);
        let count = 3;
        const interval = setInterval(() => {
            count--;
            if (count > 0) {
                setCountdown(count);
            } else {
                clearInterval(interval);
                setCountdown(null);

                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;
                ctx.drawImage(video, 0, 0);
                canvas.toBlob((blob) => {
                    if (blob) {
                        const newCaptures = [...captures, blob];
                        const newPreviews = [...previews, URL.createObjectURL(blob)];
                        setCaptures(newCaptures);
                        setPreviews(newPreviews);

                        if (newCaptures.length >= 5) {
                            // All angles done
                            stopCamera();
                            setStep(6);
                        } else {
                            setStep(newCaptures.length + 1);
                        }
                    }
                }, 'image/jpeg', 0.9);
            }
        }, 1000);
    };

    const handleUpload = async () => {
        setUploading(true);
        setMessage('');
        const formData = new FormData();
        captures.forEach((blob, i) => {
            formData.append('images', blob, `face_${ANGLES[i].key}.jpg`);
        });

        try {
            const res = await api.post('/enrollment/self', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage(res.data.message || 'Face enrollment successful!');
            setSuccess(true);
            setStep(7);
        } catch (err: any) {
            setMessage(err.response?.data?.error || 'Face enrollment failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const resetAll = () => {
        stopCamera();
        setStep(0);
        setCaptures([]);
        setPreviews([]);
        setMessage('');
        setSuccess(false);
        setCameraError('');
    };

    const currentAngle = step >= 1 && step <= 5 ? ANGLES[step - 1] : null;

    return (
        <div className="space-y-6">
            <PageHeader title="Face Enrollment" description="Enroll your face for automated attendance recognition" />

            {/* Step 0: Start */}
            {step === 0 && (
                <Card>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <div className="w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center mb-5">
                                <Camera className="w-10 h-10 text-primary-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-surface-900 mb-2">Real-Time Face Enrollment</h3>
                            <p className="text-sm text-surface-500 max-w-sm mb-2">
                                We'll guide you through capturing 5 photos from different angles for accurate recognition.
                            </p>
                            <div className="flex flex-wrap justify-center gap-2 mb-6">
                                {ANGLES.map((a, i) => (
                                    <span key={a.key} className="text-xs bg-surface-100 text-surface-600 px-2 py-1 rounded-full">
                                        {i + 1}. {a.label}
                                    </span>
                                ))}
                            </div>
                            <Button size="lg" onClick={beginCapture} leftIcon={<Camera className="w-5 h-5" />}>
                                Start Enrollment
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Steps 1-5: Capturing */}
            {currentAngle && (
                <Card>
                    <CardContent className="p-0">
                        <div className="relative">
                            {/* Video feed */}
                            <video ref={videoRef} autoPlay playsInline muted
                                className="w-full aspect-[4/3] object-cover rounded-t-xl bg-black" />

                            {/* Overlay */}
                            <div className="absolute inset-0 flex flex-col items-center justify-between py-4 pointer-events-none">
                                {/* Top bar */}
                                <div className="bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
                                    Step {step}/5 · {currentAngle.label}
                                </div>

                                {/* Face guide oval */}
                                <div className="w-48 h-60 border-2 border-dashed border-white/50 rounded-[50%]" />

                                {/* Countdown */}
                                {countdown !== null && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-7xl font-bold text-white drop-shadow-lg animate-pulse">{countdown}</span>
                                    </div>
                                )}

                                {/* Instruction */}
                                <div className="bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm">
                                    {currentAngle.instruction}
                                </div>
                            </div>

                            {/* Camera error */}
                            {cameraError && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-t-xl">
                                    <div className="text-center text-white px-6">
                                        <AlertCircle className="w-10 h-10 mx-auto mb-3 text-red-400" />
                                        <p className="text-sm">{cameraError}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Progress & Capture button */}
                        <div className="p-5 space-y-4">
                            {/* Progress dots */}
                            <div className="flex items-center justify-center gap-2">
                                {ANGLES.map((a, i) => (
                                    <div key={a.key} className={`w-3 h-3 rounded-full transition-colors ${i < captures.length ? 'bg-green-500' :
                                            i === captures.length ? 'bg-primary-500 ring-2 ring-primary-200' :
                                                'bg-surface-200'
                                        }`} />
                                ))}
                            </div>

                            {/* Captured thumbnails */}
                            {previews.length > 0 && (
                                <div className="flex justify-center gap-2">
                                    {previews.map((p, i) => (
                                        <img key={i} src={p} alt={`Capture ${i + 1}`}
                                            className="w-12 h-12 rounded-lg object-cover border-2 border-green-300" />
                                    ))}
                                </div>
                            )}

                            <div className="flex justify-center gap-3">
                                <Button variant="secondary" size="sm" onClick={resetAll}
                                    leftIcon={<RotateCcw className="w-4 h-4" />}>Reset</Button>
                                <Button size="lg" onClick={captureFrame} disabled={countdown !== null}
                                    leftIcon={<Camera className="w-5 h-5" />}>
                                    {countdown !== null ? `${countdown}...` : `Capture ${currentAngle.label}`}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 6: Review & Upload */}
            {step === 6 && (
                <Card>
                    <CardContent className="p-6">
                        <div className="text-center mb-4">
                            <h3 className="text-lg font-semibold text-surface-900 mb-1">Review Your Photos</h3>
                            <p className="text-sm text-surface-500">All 5 angles captured. Review and submit for enrollment.</p>
                        </div>
                        <div className="grid grid-cols-5 gap-3 mb-6">
                            {previews.map((p, i) => (
                                <div key={i} className="text-center">
                                    <img src={p} alt={ANGLES[i].label}
                                        className="w-full aspect-square rounded-xl object-cover border-2 border-green-300" />
                                    <p className="text-[10px] text-surface-500 mt-1">{ANGLES[i].label}</p>
                                </div>
                            ))}
                        </div>
                        {message && (
                            <div className={`p-3 rounded-lg text-sm font-medium mb-4 ${success ? 'bg-green-50 text-green-700' : 'bg-error-50 text-error-700'}`}>
                                {message}
                            </div>
                        )}
                        <div className="flex justify-center gap-3">
                            <Button variant="secondary" onClick={resetAll}
                                leftIcon={<RotateCcw className="w-4 h-4" />}>Retake</Button>
                            <Button size="lg" onClick={handleUpload} disabled={uploading}
                                leftIcon={uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}>
                                {uploading ? 'Enrolling...' : 'Confirm & Enroll'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 7: Success */}
            {step === 7 && success && (
                <Card>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-5">
                                <CheckCircle className="w-10 h-10 text-green-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-surface-900 mb-2">Enrollment Successful!</h3>
                            <p className="text-sm text-surface-500 max-w-sm mb-4">
                                Your face has been enrolled for automated attendance. You're all set!
                            </p>
                            <Button variant="secondary" onClick={resetAll}>Enroll Again</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}

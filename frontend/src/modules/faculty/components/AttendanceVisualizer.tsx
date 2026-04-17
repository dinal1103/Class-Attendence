import { useState, useRef, useEffect } from 'react';
import { X, User, ShieldAlert, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/api/axios';

interface BBox {
    bbox: number[];
    studentName?: string;
    studentEmail?: string;
    isIdentified: boolean;
    status?: 'present' | 'absent';
}

interface AttendanceVisualizerProps {
    sessionId: string;
    onClose: () => void;
}

export function AttendanceVisualizer({ sessionId, onClose }: AttendanceVisualizerProps) {
    const [loading, setLoading] = useState(true);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [detections, setDetections] = useState<BBox[]>([]);
    const [totalImages, setTotalImages] = useState(1);
    const [imageIdx, setImageIdx] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const [scale, setScale] = useState({ x: 1, y: 1 });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [sessionRes, recordsRes] = await Promise.all([
                    api.get(`/attendance/sessions/${sessionId}`),
                    api.get(`/attendance/sessions/${sessionId}/records`)
                ]);

                const session = sessionRes.data;
                const records = recordsRes.data;

                setTotalImages(session.imagePaths?.length || 1);

                const allDetections: BBox[] = [];

                // Recognized students
                records.forEach((r: any) => {
                    if (r.status !== 'absent' && r.bbox && r.bbox.length === 4) {
                        allDetections.push({
                            bbox: r.bbox,
                            studentName: r.student_id?.name,
                            studentEmail: r.student_id?.email,
                            isIdentified: true,
                            status: r.status
                        });
                    }
                });

                // Unidentified faces
                if (session.unidentifiedDetections) {
                    session.unidentifiedDetections.forEach((u: any) => {
                        allDetections.push({
                            bbox: u.bbox,
                            isIdentified: false
                        });
                    });
                }

                setDetections(allDetections);
                
                if (allDetections.length === 0 && session.status === 'completed') {
                    setError('Face recognition data is not available for this session. It might have been processed before this feature was enabled.');
                }
            } catch (err) {
                console.error('Failed to load visualizer data:', err);
                setError('Failed to load recognition data.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [sessionId]);

    const handleImageLoad = () => {
        if (imgRef.current) {
            const { naturalWidth, naturalHeight, clientWidth, clientHeight } = imgRef.current;
            setScale({
                x: clientWidth / naturalWidth,
                y: clientHeight / naturalHeight
            });
            setImageLoaded(true);
        }
    };

    // Re-calculate scale on window resize
    useEffect(() => {
        const handleResize = () => handleImageLoad();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [imageUrl, setImageUrl] = useState<string | null>(null);

    useEffect(() => {
        const fetchImage = async () => {
            try {
                setImageLoaded(false);
                const response = await api.get(`/attendance/sessions/${sessionId}/image/${imageIdx}`, {
                    responseType: 'blob'
                });
                const url = URL.createObjectURL(response.data);
                setImageUrl(url);
            } catch (err) {
                console.error('Failed to fetch session image:', err);
                setError('Could not load classroom image.');
            }
        };

        if (sessionId) {
            fetchImage();
        }

        return () => {
            if (imageUrl) URL.revokeObjectURL(imageUrl);
        };
    }, [sessionId, imageIdx]);

    return (
        <div className="fixed inset-0 z-[60] flex flex-col bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
            {/* Header */}
            <div className="h-16 px-6 flex items-center justify-between text-white border-b border-white/10">
                <div>
                    <h3 className="text-lg font-bold">Recognition Analysis</h3>
                    <p className="text-xs text-white/50">Green: Present • Red: Unidentified • Photo {imageIdx + 1} of {totalImages}</p>
                </div>
                <div className="flex items-center gap-4">
                    {totalImages > 1 && (
                        <div className="flex items-center gap-2 bg-white/5 rounded-full p-1 border border-white/10">
                            <button 
                                onClick={() => setImageIdx(prev => Math.max(0, prev - 1))}
                                disabled={imageIdx === 0}
                                className="px-3 py-1 text-xs font-semibold hover:bg-white/10 rounded-full disabled:opacity-30 transition-colors"
                            >
                                Previous
                            </button>
                            <button 
                                onClick={() => setImageIdx(prev => Math.min(totalImages - 1, prev + 1))}
                                disabled={imageIdx === totalImages - 1}
                                className="px-3 py-1 text-xs font-semibold hover:bg-white/10 rounded-full disabled:opacity-30 transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    )}
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Main Viewport */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-4">
                {loading ? (
                    <div className="flex flex-col items-center gap-3 text-white/70">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="text-sm">Loading visual analysis...</span>
                    </div>
                ) : error ? (
                    <div className="text-red-400 text-center">
                        <ShieldAlert className="w-12 h-12 mx-auto mb-4" />
                        <p>{error}</p>
                    </div>
                ) : (
                    <div className="relative inline-block max-w-full">
                        {imageUrl && (
                            <img 
                                ref={imgRef}
                                src={imageUrl} 
                                alt="Classroom" 
                                className="max-h-[80vh] w-auto rounded-lg shadow-2xl transition-opacity duration-300"
                                onLoad={handleImageLoad}
                                style={{ opacity: imageLoaded ? 1 : 0 }}
                            />
                        )}
                        
                    </div>
                )}
            </div>

            {/* Legend/Footer */}
            {!loading && !error && (
                <div className="h-20 bg-black/40 border-t border-white/5 flex items-center justify-center gap-8 text-white/70 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span>Present ({detections.filter(d => d.status === 'present').length})</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span>Unknown ({detections.filter(d => !d.isIdentified).length})</span>
                    </div>
                </div>
            )}
        </div>
    );
}

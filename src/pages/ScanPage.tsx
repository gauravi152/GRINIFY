import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResultCard } from '../components/scan/ResultCard';
import { ScanningOverlay } from '../components/scan/ScanningOverlay';
import { DragDropZone } from '../components/scan/DragDropZone';
import { Camera, X } from 'lucide-react';
import { ChatbotWidget } from '../components/chat/ChatbotWidget';

export const ScanPage: React.FC = () => {
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<any>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [cameraError, setCameraError] = useState<string | null>(null);

    // Camera initialization logic
    useEffect(() => {
        let stream: MediaStream | null = null;

        const startCamera = async () => {
            if (!isCameraOpen) return;

            setCameraError(null);
            console.log("Initializing camera...");

            try {
                // Remove strict facingMode: 'environment' to support laptop cameras
                const constraints = {
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                };

                stream = await navigator.mediaDevices.getUserMedia(constraints);
                console.log("Camera stream obtained. Tracks:", stream.getVideoTracks().map(t => t.label));

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;

                    videoRef.current.onloadedmetadata = () => {
                        console.log("Video metadata loaded. Natural size:", videoRef.current?.videoWidth, "x", videoRef.current?.videoHeight);
                        if (videoRef.current && (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0)) {
                            console.warn("Video dimensions are 0. Possible stream issue.");
                        }
                        videoRef.current?.play().catch(e => console.error("Auto-play failed:", e));
                    };
                } else {
                    console.error("Video element (videoRef.current) is not available during stream attachment.");
                    throw new Error("Video display element not found.");
                }

                streamRef.current = stream;
            } catch (err: any) {
                console.error("Camera access error:", err);
                let errorMessage = "Could not access camera.";
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    errorMessage = "Camera permission denied. Please allow camera access in your browser settings.";
                } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                    errorMessage = "No camera hardware detected.";
                } else {
                    errorMessage = `Camera Error: ${err.message || 'Unknown error'}`;
                }
                setCameraError(errorMessage);
                setIsCameraOpen(false);
            }
        };

        if (isCameraOpen) {
            startCamera();
        }

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => {
                    console.log("Stopping camera track:", track.label);
                    track.stop();
                });
            }
        };
    }, [isCameraOpen]);

    const stopCamera = () => {
        setIsCameraOpen(false);
    };

    const captureImage = () => {
        if (videoRef.current && videoRef.current.videoWidth > 0) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
            const imageUrl = canvas.toDataURL('image/jpeg');
            setSelectedImage(imageUrl);
            stopCamera();
            handleScan(imageUrl);
        } else {
            console.error("Attempted to capture with invalid video state.");
            alert("Camera not ready. Please wait for the preview to appear.");
        }
    };

    const handleFileSelect = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageUrl = e.target?.result as string;
            setSelectedImage(imageUrl);
            handleScan(imageUrl);
        };
        reader.readAsDataURL(file);
    };

    const handleScan = async (imageSrc: string) => {
        setIsScanning(true);
        setScanResult(null);

        try {
            // Convert base64 to blob
            const response = await fetch(imageSrc);
            const blob = await response.blob();

            const formData = new FormData();
            formData.append('file', blob, 'scan.jpg');

            const apiResponse = await fetch('http://localhost:8000/predict', {
                method: 'POST',
                body: formData,
            });

            if (!apiResponse.ok) throw new Error('Backend prediction failed');

            const result = await apiResponse.json();

            if (result.error) throw new Error(result.error);

            setScanResult({
                category: result.category,
                confidence: result.confidence,
                instructions: result.instructions,
                points: result.points,
                recyclable: result.recyclable !== undefined ? result.recyclable : result.confidence > 50
            });

            // Persist for Map contextual search
            localStorage.setItem('lastScannedCategory', result.category);
        } catch (err: any) {
            console.error("Scan failed:", err);
            alert(`Scanning failed: ${err.message || 'Backend unreachable'}`);
        } finally {
            setIsScanning(false);
        }
    };

    const handleReset = () => {
        setSelectedImage(null);
        setScanResult(null);
        setIsScanning(false);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <header className="text-center md:text-left">
                <h1 className="text-3xl font-bold text-text dark:text-dark-text tracking-tight">Scan Waste</h1>
                <p className="text-text-light mt-1">Identify recyclable materials instantly with AI.</p>
            </header>

            <AnimatePresence mode="wait">
                {!selectedImage && !isCameraOpen && (
                    <motion.div
                        key="input-methods"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                        {/* Camera Option */}
                        <div onClick={() => setIsCameraOpen(true)} className="bg-white dark:bg-dark-surface p-10 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5 cursor-pointer transition-all group text-center space-y-4">
                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                                <Camera className="w-10 h-10 text-primary" />
                            </div>
                            <h3 className="text-lg font-bold text-text dark:text-dark-text">Open Camera</h3>
                            <p className="text-sm text-text-light">Point your camera at a waste item</p>
                            {cameraError && (
                                <p className="text-xs text-red-500 mt-2 font-medium">{cameraError}</p>
                            )}
                        </div>

                        {/* File Upload Option */}
                        <DragDropZone onFileSelect={handleFileSelect} />
                    </motion.div>
                )}

                {isCameraOpen && (
                    <motion.div
                        key="camera-view"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="relative rounded-3xl overflow-hidden shadow-2xl bg-black aspect-[3/4] md:aspect-video max-w-2xl mx-auto"
                    >
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover z-0"
                        />

                        <div className="absolute top-4 right-4 z-10">
                            <button onClick={stopCamera} className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="absolute bottom-8 left-0 right-0 flex justify-between items-center px-8 z-10 w-full">
                            <div className="w-12 h-12" /> {/* Spacer */}
                            <button
                                onClick={captureImage}
                                className="w-20 h-20 rounded-full border-4 border-white bg-transparent flex items-center justify-center hover:bg-white/20 transition-all shadow-xl"
                            >
                                <div className="w-16 h-16 bg-white rounded-full"></div>
                            </button>

                            {/* Fallback Upload in Camera View */}
                            <label className="w-12 h-12 bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            stopCamera();
                                            handleFileSelect(file);
                                        }
                                    }}
                                />
                                <Camera size={20} className="rotate-90" /> {/* Reuse icon for fallback */}
                            </label>
                        </div>
                    </motion.div>
                )}

                {isScanning && (
                    <motion.div key="scanning" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <ScanningOverlay />
                    </motion.div>
                )}

                {scanResult && selectedImage && (
                    <div className="max-w-md mx-auto">
                        <ResultCard
                            result={scanResult}
                            image={selectedImage}
                            onReset={handleReset}
                        />
                    </div>
                )}
            </AnimatePresence>

            {/* Chatbot Widget */}
            <ChatbotWidget />
        </div>
    );
};

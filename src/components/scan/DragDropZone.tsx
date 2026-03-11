import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Camera, Image as ImageIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../ui/Button';

interface DragDropZoneProps {
    onFileSelect: (file: File) => void;
}

export const DragDropZone: React.FC<DragDropZoneProps> = ({ onFileSelect }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onFileSelect(e.target.files[0]);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <motion.div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                whileHover={{ scale: 1.01 }}
                animate={{
                    borderColor: isDragging ? '#8EB897' : '#E5E7EB',
                    backgroundColor: isDragging ? '#F0F8FF' : '#FFFFFF'
                }}
                className={clsx(
                    "border-4 border-dashed rounded-3xl p-10 text-center transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md",
                    isDragging ? "border-primary bg-background" : "border-gray-200"
                )}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                />

                <div className="flex justify-center mb-6">
                    <div className="bg-primary/10 p-6 rounded-full">
                        <Upload className="w-12 h-12 text-primary" />
                    </div>
                </div>

                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    Upload or Drag & Drop
                </h3>
                <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                    Take a picture of your waste to instantly identify if it's recyclable.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button
                        className="w-full sm:w-auto"
                        onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                        }}
                    >
                        <ImageIcon className="mr-2 w-5 h-5" />
                        Select Image
                    </Button>
                    <span className="text-gray-400 font-medium">or</span>
                    <Button
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={(e) => {
                            e.stopPropagation();
                            // In a real app, this would trigger camera access
                            console.log("Camera clicked");
                        }}
                    >
                        <Camera className="mr-2 w-5 h-5" />
                        Use Camera
                    </Button>
                </div>

                <p className="mt-6 text-xs text-gray-400 uppercase tracking-wide">
                    Supported: JPG, PNG, HEIC
                </p>
            </motion.div>
        </div>
    );
};

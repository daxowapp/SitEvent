"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";
import Image from "next/image";

interface ImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    onRemove: () => void;
    bucket?: string; // default 'public'
    folder?: string; // default 'events'
}

export function ImageUpload({ value, onChange, onRemove, bucket = "events-media", folder = "events" }: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Size check (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File excessively large. Max 5MB allowed.");
            return;
        }

        setIsUploading(true);
        try {
            const fileExt = file.name.split(".").pop();
            const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
            const filePath = `${folder}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

            onChange(data.publicUrl);
            toast.success("Image uploaded successfully");
        } catch (error) {
            console.error("Upload failed:", error);
            toast.error(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    return (
        <div className="space-y-4 w-full">
            <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploading}
            />
            {value ? (
                <div className="relative aspect-video w-full max-w-md rounded-lg overflow-hidden border bg-gray-100">
                    <div className="absolute top-2 right-2 z-10">
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={onRemove}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    <Image
                        src={value}
                        alt="Uploaded image"
                        fill
                        className="object-cover"
                    />
                </div>
            ) : (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-12 hover:bg-gray-50 transition cursor-pointer text-center w-full max-w-md h-48"
                >
                    <div className="p-4 rounded-full bg-gray-100 mb-4">
                        <ImageIcon className="h-6 w-6 text-gray-500" />
                    </div>
                    <div className="font-semibold text-gray-700">
                        {isUploading ? "Uploading..." : "Click to upload image"}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                        SVG, PNG, JPG or GIF (max. 5MB)
                    </div>
                </div>
            )}
        </div>
    );
}

"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";
import Image from "next/image";

interface MultiImageUploadProps {
    value?: string[];
    onChange: (urls: string[]) => void;
    onRemove: (url: string) => void;
    bucket?: string; // default 'events-media'
    folder?: string; // default 'events/gallery'
}

export function MultiImageUpload({
    value = [],
    onChange,
    onRemove,
    bucket = "events-media",
    folder = "events/gallery",
}: MultiImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        const newUrls: string[] = [];

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                // Size check (max 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    toast.error(`File ${file.name} is too large. Max 5MB.`);
                    continue;
                }

                const fileExt = file.name.split(".").pop();
                const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
                const filePath = `${folder}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from(bucket)
                    .upload(filePath, file);

                if (uploadError) {
                    console.error(`Failed to upload ${file.name}:`, uploadError);
                    toast.error(`Failed to upload ${file.name}`);
                    continue;
                }

                const { data } = supabase.storage
                    .from(bucket)
                    .getPublicUrl(filePath);

                newUrls.push(data.publicUrl);
            }

            if (newUrls.length > 0) {
                onChange([...value, ...newUrls]);
                toast.success(`Successfully uploaded ${newUrls.length} images`);
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("An unexpected error occurred during upload.");
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
                multiple
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploading}
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {value.map((url, index) => (
                    <div key={url + index} className="relative aspect-square rounded-lg overflow-hidden border bg-gray-100 group">
                        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => onRemove(url)}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                        <Image
                            src={url}
                            alt="Gallery image"
                            fill
                            className="object-cover"
                        />
                    </div>
                ))}
            </div>

            <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 hover:bg-gray-50 transition cursor-pointer text-center w-full"
            >
                {isUploading ? (
                    <div className="flex items-center gap-2 text-gray-500">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span>Uploading...</span>
                    </div>
                ) : (
                    <>
                        <div className="p-3 rounded-full bg-gray-100 mb-2">
                            <ImageIcon className="h-6 w-6 text-gray-500" />
                        </div>
                        <div className="font-semibold text-gray-700">
                            Add Gallery Images
                        </div>
                        <div className="text-sm text-gray-400 mt-1">
                            Click to upload multiple images
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

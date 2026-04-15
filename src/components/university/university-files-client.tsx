"use client";

/**
 * University Files Management — Client Component
 * Upload, view, and manage brochures and catalogs
 */

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Upload,
  Trash2,
  Download,
  Image as ImageIcon,
  Video,
  File,
  Plus,
  Loader2,
  X,
  FolderOpen,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import {
  createUniversityFile,
  getUniversityFiles,
  deleteUniversityFile,
} from "@/app/actions/university-files";

interface UniversityFile {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  label: string;
  description: string | null;
  createdAt: Date;
}

import { supabase } from "@/lib/supabase-client";

const fileTypeIcons: Record<string, React.ReactNode> = {
  PDF: <FileText className="w-5 h-5 text-red-500" />,
  IMAGE: <ImageIcon className="w-5 h-5 text-blue-500" />,
  VIDEO: <Video className="w-5 h-5 text-purple-500" />,
  DOCUMENT: <File className="w-5 h-5 text-gray-500" />,
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getFileType(fileName: string): "PDF" | "IMAGE" | "VIDEO" | "DOCUMENT" {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (ext === "pdf") return "PDF";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "IMAGE";
  if (["mp4", "mov", "avi", "webm"].includes(ext)) return "VIDEO";
  return "DOCUMENT";
}

interface Props {
  universityId: string;
}

export function UniversityFilesClient({ universityId }: Props) {
  const [files, setFiles] = useState<UniversityFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFiles();
  }, [universityId]);

  async function loadFiles() {
    setLoading(true);
    const result = await getUniversityFiles(universityId);
    setFiles(result as any);
    setLoading(false);
  }

  async function handleUpload() {
    if (!selectedFile || !label.trim()) return;

    setUploading(true);
    try {
      // Upload to Supabase Storage
      const fileName = `${Date.now()}-${selectedFile.name}`;
      const filePath = `university-files/${universityId}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("files")
        .upload(filePath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        alert("Failed to upload file. Please try again.");
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("files")
        .getPublicUrl(filePath);

      // Create file record
      const result = await createUniversityFile({
        universityId,
        fileName: selectedFile.name,
        fileUrl: urlData.publicUrl,
        fileType: getFileType(selectedFile.name),
        fileSize: selectedFile.size,
        label: label.trim(),
        description: description.trim() || undefined,
      });

      if (result.success) {
        await loadFiles();
        resetUploadForm();
      } else {
        alert("Failed to save file record.");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(fileId: string) {
    if (!confirm("Are you sure you want to delete this file?")) return;

    const result = await deleteUniversityFile(fileId, universityId);
    if (result.success) {
      await loadFiles();
    }
  }

  function resetUploadForm() {
    setShowUpload(false);
    setLabel("");
    setDescription("");
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Brochures & Catalogs</h1>
          <p className="text-muted-foreground mt-1">
            Upload your university materials to share with visiting students
          </p>
        </div>
        <Button
          onClick={() => setShowUpload(!showUpload)}
          className="bg-red-600 hover:bg-red-700"
        >
          <Plus className="w-4 h-4 mr-1" />
          Upload File
        </Button>
      </div>

      {/* Upload Form */}
      {showUpload && (
        <Card className="border-dashed border-2 border-red-200 bg-red-50/30">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Upload New File</h3>
              <Button variant="ghost" size="sm" onClick={resetUploadForm}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* File Input */}
            <div>
              <label className="block text-sm font-medium mb-1.5">File</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.mp4,.mov"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-muted-foreground
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-red-50 file:text-red-700
                  hover:file:bg-red-100
                  cursor-pointer"
              />
              {selectedFile && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </p>
              )}
            </div>

            {/* Label */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Label <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g., 2026 Programs Catalog"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Description (optional)
              </label>
              <Textarea
                placeholder="Brief description of the file contents..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !label.trim() || uploading}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload File
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* File List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : files.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-lg font-medium text-muted-foreground">
              No files uploaded yet
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Upload brochures and catalogs to share with students at events
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {files.map((file) => (
            <Card key={file.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-gray-50 rounded-lg flex-shrink-0">
                    {fileTypeIcons[file.fileType] || fileTypeIcons.DOCUMENT}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{file.label}</h3>
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        {file.fileType}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 truncate">
                      {file.fileName}
                    </p>
                    {file.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {file.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatFileSize(file.fileSize)} •{" "}
                      {new Date(file.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                    >
                      <a
                        href={file.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(file.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

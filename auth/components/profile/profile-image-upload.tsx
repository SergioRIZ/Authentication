"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/lib/uploadthing";

const { useUploadThing } = generateReactHelpers<OurFileRouter>();

interface ProfileImageUploadProps {
  currentImage?: string | null;
  onUploadComplete: (url: string) => void;
}

export default function ProfileImageUpload({ 
  currentImage, 
  onUploadComplete 
}: ProfileImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { startUpload } = useUploadThing("profileImage", {
    onClientUploadComplete: (res) => {
      if (res?.[0]?.url) {
        setPreview(res[0].url);
        onUploadComplete(res[0].url);
      }
      setIsUploading(false);
    },
    onUploadError: (err) => {
      setError(err.message || "Error al subir la imagen");
      setIsUploading(false);
    },
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    // Preview local
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Subir a Uploadthing
    await startUpload([file]);
  }, [startUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    maxFiles: 1,
    maxSize: 4 * 1024 * 1024, // 4MB
  });

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Preview de imagen */}
      <div className="relative">
        {preview ? (
          <img
            src={preview}
            alt="Foto de perfil"
            className="w-24 h-24 rounded-full object-cover border-2 border-border"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
            <svg
              className="w-12 h-12 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
            <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          w-full p-4 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors
          ${isDragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}
          ${isUploading ? "pointer-events-none opacity-50" : ""}
        `}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-sm text-primary">Suelta la imagen aquí...</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Arrastra una imagen o haz clic para seleccionar
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP (máx. 4MB)</p>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
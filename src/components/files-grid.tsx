"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { File } from "@/generated/prisma/client";
import axios from "axios";

export default function FilesGrid() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [presignedUrls, setPresignedUrls] = useState<Record<string, string>>({});

  /* ----------------------------------------
     Fetch images from API (client-side)
  ----------------------------------------- */
  useEffect(() => {
    const fetchImages = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get<File[]>("/api/get-images");
        setFiles(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load images");
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  /* ----------------------------------------
     Fetch presigned URLs for private images
  ----------------------------------------- */
  useEffect(() => {
    const fetchPresignedUrls = async () => {
      const privateFiles = files.filter(
        (file) => file.exposure === "private"
      );

      for (const file of privateFiles) {
        if (!presignedUrls[file.id] && file.bucket && file.fileName) {
          try {
            const { data } = await axios.get("/api/get-presigned", {
              params: {
                bucket: file.bucket,
                object: file.fileName,
              },
            });

            setPresignedUrls((prev) => ({
              ...prev,
              [file.id]: data.url,
            }));
          } catch (error) {
            console.error(
              `Failed to fetch presigned URL for ${file.id}:`,
              error
            );
          }
        }
      }
    };

    if (files.length > 0) {
      fetchPresignedUrls();
    }
  }, [files, presignedUrls]);

  /* ----------------------------------------
     Helpers
  ----------------------------------------- */
  const getFileUrl = (file: File) => {
    if (file.exposure === "private") {
      return presignedUrls[file.id] || null;
    }
    return file.url;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "0 B";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  /* ----------------------------------------
     States
  ----------------------------------------- */
  if (loading) {
    return (
      <div className="text-center py-20 text-gray-500">
        Loading images...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-red-500">
        {error}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border">
        <p className="text-center text-gray-500">
          No images uploaded yet.
        </p>
      </div>
    );
  }
  
  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border">
        <h2 className="text-2xl font-bold mb-6">
          Uploaded Images ({files.length})
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {files.map((file) => (
            <div
              key={file.id}
              className="group relative rounded-xl overflow-hidden border cursor-pointer"
              onClick={() => setSelectedImage(file)}
            >
              <div className="aspect-square relative bg-gray-200">
                {getFileUrl(file) ? (
                  <Image
                    src={getFileUrl(file)!}
                    alt={file.originalName || "Uploaded image"}
                    fill
                    className="object-cover"
                    unoptimized={file.exposure === "private"}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin h-8 w-8 border-b-2" />
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="font-semibold truncate">
                  {file.originalName}
                </h3>
                <p className="text-sm text-gray-500">
                  {formatFileSize(file.size)}
                </p>
                <p className="text-xs text-gray-400">
                  {formatDate(file.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal stays unchanged */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 p-4 rounded-xl max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={getFileUrl(selectedImage)!}
              alt={selectedImage.originalName || ""}
              width={1200}
              height={800}
              className="w-full h-auto object-contain"
              unoptimized={selectedImage.exposure === "private"}
            />
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import "@uppy/core/css/style.min.css";
import "@uppy/dashboard/css/style.min.css";

import AwsS3 from "@uppy/aws-s3";
import Uppy from "@uppy/core";
import Dashboard from "@uppy/react/dashboard";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import axios from "axios";

const FILE_TYPES = ["image/png", "image/jpeg", "image/jpg"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const UppyUploaderComponent = () => {
  const [isPrivate, setIsPrivate] = useState(false);
  // Initialize Uppy instance
  const uppy = useMemo(() => {
    return new Uppy({
      autoProceed: false,
      allowMultipleUploadBatches: false,
      restrictions: {
        maxFileSize: MAX_FILE_SIZE,
        allowedFileTypes: FILE_TYPES,
        maxNumberOfFiles: 1,
        minNumberOfFiles: 1,
      },
    })
      .use(AwsS3, {
        endpoint: "/api/upload-presigned",
        getUploadParameters: async (file) => {
          const { data } = await axios.post("/api/upload-presigned", {
            fileName: file.name,
            originalName: file.name,
            size: file.size,
            isPrivate,
          });

          // Store metadata for later use
          file.meta.serverFileName = data.objectName;
          file.meta.fileId = data.fileId; // Store the database ID

          return {
            method: data.method,
            url: data.url,
            fields: data.fields,
            headers: data.headers,
          };
        },
      })
      .on("upload-success", async (file) => {
        if (file) {
          try {
            await axios.put("/api/upload-presigned", {
              fileId: file.meta.fileId,
              contentType: file.type,
            });
          } catch (error) {
            console.error("Failed to update file status:", error);
          }
        }
      });
  }, [isPrivate]);

  if (!uppy) return null;

  return (
    <div className="space-y-4">
      {/* Privacy Toggle */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <p>
              RustFS Upload
            </p>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Privacy Setting
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {isPrivate
                ? "Your image will be private and require authentication to view"
                : "Your image will be publicly accessible"}
            </p>
          </div>
          <button
            onClick={() => setIsPrivate(!isPrivate)}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              isPrivate
                ? "bg-blue-600"
                : "bg-gray-300 dark:bg-gray-600"
            }`}
            role="switch"
            aria-checked={isPrivate}
            aria-label="Toggle privacy"
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                isPrivate ? "translate-x-7" : "translate-x-1"
              }`}
            />
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2 text-sm">
          <span
            className={`font-medium ${
              !isPrivate
                ? "text-blue-600 dark:text-blue-400"
                : "text-gray-400 dark:text-gray-500"
            }`}
          >
            Public
          </span>
          <span className="text-gray-400">|</span>
          <span
            className={`font-medium ${
              isPrivate
                ? "text-blue-600 dark:text-blue-400"
                : "text-gray-400 dark:text-gray-500"
            }`}
          >
            Private
          </span>
        </div>
      </div>

      {/* Uppy Dashboard */}
      <Dashboard theme="dark" uppy={uppy} />
    </div>
  );
};

const UppyUploader = dynamic(() => Promise.resolve(UppyUploaderComponent), {
  ssr: false,
  loading: () => (
    <p className="h-137 w-187 border border-white rounded flex justify-center items-center bg-black/40 animate-pulse">
      Loading uploader...
    </p>
  ),
});

export default UppyUploader;
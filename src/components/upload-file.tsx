"use client";

import { useState } from "react";
import { z } from "zod";

// File validation schema
const fileSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size > 0, "File is required")
    .refine(
      (file) => file.size <= 10 * 1024 * 1024,
      "File size must be less than 10MB"
    )
    .refine(
      (file) =>
        [
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/gif",
          "application/pdf",
          "text/plain",
        ].includes(file.type),
      "File must be an image (JPEG, PNG, WebP, GIF), PDF, or text file"
    ),
});

type FormErrors = {
  file?: string[];
  [key: string]: string[] | undefined;
};

export default function Upload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingRustFS, setUploadingRustFS] = useState(false); // Only RustFS loading state
  const [errors, setErrors] = useState<FormErrors>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  // RustFS upload function only
  async function uploadToRustFS() {
    if (!selectedFile) {
      setErrors({ file: ["Please select a file first"] });
      return;
    }

    setErrors({});
    setSuccess(null);
    setUploadedUrl(null);

    // Validate file with Zod
    const validation = fileSchema.safeParse({ file: selectedFile });

    if (!validation.success) {
      const formattedErrors: FormErrors = {};
      validation.error.issues.forEach((err) => {
        const path = err.path[0] as string;
        if (!formattedErrors[path]) {
          formattedErrors[path] = [];
        }
        formattedErrors[path]!.push(err.message);
      });
      setErrors(formattedErrors);
      return;
    }

    try {
      setUploadingRustFS(true);
      
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const { data } = await response.json();

      if (!response.ok) {
        setErrors({ file: [data.error || "Upload failed"] });
        return;
      }

      setSuccess(`File "${data.fileName}" uploaded successfully to RustFS!`);
      setUploadedUrl(data.url);
      setSelectedFile(null);
    } catch (error) {
      setErrors({ file: ["An error occurred during upload"] });
      console.error("Upload error:", error);
    } finally {
      setUploadingRustFS(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setErrors({});
    setSuccess(null);
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="space-y-6">
        {/* File Upload Area */}
        <div className="space-y-2">
          <label
            htmlFor="file-upload"
            className="block text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            Choose File
          </label>
          <div className="relative">
            <input
              id="file-upload"
              type="file"
              name="file"
              onChange={handleFileChange}
              disabled={uploadingRustFS}
              className="block w-full text-sm text-gray-900 dark:text-gray-100
                file:mr-4 file:py-3 file:px-6
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-linear-to-r file:from-blue-500 file:to-purple-600
                file:text-white
                hover:file:from-blue-600 hover:file:to-purple-700
                file:cursor-pointer
                file:transition-all file:duration-200
                cursor-pointer
                disabled:opacity-50 disabled:cursor-not-allowed
                border border-gray-300 dark:border-gray-600
                rounded-lg p-3 bg-white dark:bg-gray-800
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* File Info */}
          {selectedFile && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <svg
                className="w-5 h-5 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
          )}

          {/* Validation Rules */}
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>• Accepted formats: Images (JPEG, PNG, WebP, GIF), PDF, Text</p>
            <p>• Maximum file size: 10MB</p>
          </div>

          {/* Error Messages */}
          {errors.file && (
            <div className="space-y-1">
              {errors.file.map((error, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg border border-red-200 dark:border-red-800"
                >
                  <svg
                    className="w-5 h-5 shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm">{error}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload Button - Only RustFS */}
        <div className="grid grid-cols-1 gap-4">
          {/* RustFS Upload Button */}
          <button
            type="button"
            onClick={uploadToRustFS}
            disabled={uploadingRustFS || !selectedFile}
            className="py-3 px-6 text-sm font-semibold rounded-lg
              bg-linear-to-r from-green-500 to-teal-600
              hover:from-green-600 hover:to-teal-700
              text-white shadow-lg hover:shadow-xl
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              disabled:hover:shadow-lg
              flex items-center justify-center gap-2"
          >
            {uploadingRustFS ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Uploading to RustFS...
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                Upload to RustFS
              </>
            )}
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-3">
              <svg
                className="w-6 h-6 shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <p className="font-semibold">{success}</p>
                {uploadedUrl && (
                  <a
                    href={uploadedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-green-700 dark:text-green-300 hover:underline mt-1 inline-block"
                  >
                    View uploaded file →
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
    </div>
  );
}
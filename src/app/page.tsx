import Upload from "@/components/upload-file";
import FilesGrid from "@/components/files-grid";
import prisma from "@/lib/prisma";
import UppyUploader from "@/components/uppy-upload";
import UppyUploaderRustfs from "@/components/uppy-upload-rustfs";

export default async function Home() {
  const files = await prisma.file.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            MinIO & RustFS File Upload
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Securely upload your files with validation and progress tracking
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
          <Upload />
        </div>
        
        <div className="mt-4 mx-auto flex  gap-4">
          <UppyUploader />
          <UppyUploaderRustfs />
        </div>

        <div className="mt-4">
          <FilesGrid files={files} />
        </div>
      </div>
    </div>
  );
}

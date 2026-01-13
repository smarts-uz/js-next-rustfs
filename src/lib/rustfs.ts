// lib/rustfs.ts
import { S3Client } from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";

if (!process.env.RUSTFS_ENDPOINT) {
  throw new Error("RUSTFS_ENDPOINT is not defined");
}

export const rustfsClient = new S3Client({
  endpoint: process.env.RUSTFS_ENDPOINT, // http://localhost:9000
  region: "us-east-1", // RustFS uchun ixtiyoriy
  credentials: {
    accessKeyId: process.env.RUSTFS_ACCESS_KEY!,
    secretAccessKey: process.env.RUSTFS_SECRET_KEY!,
  },
  forcePathStyle: true, // ⚠️ RustFS uchun MUHIM
  requestHandler: new NodeHttpHandler({
    connectionTimeout: 5_000,
    socketTimeout: 30_000,
  }),
});

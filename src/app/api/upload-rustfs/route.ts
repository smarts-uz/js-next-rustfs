// app/api/upload/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { rustfsClient } from "@/lib/rustfs";
import prisma from "@/lib/prisma";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

const fileSchema = z.object({
  file: z
    .instanceof(File)
    .refine((f) => f.size > 0, "File is required")
    .refine((f) => f.size <= MAX_FILE_SIZE, "Max size is 100MB")
    .refine(
      (f) =>
        [
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/gif",
          "application/pdf",
          "text/plain",
        ].includes(f.type),
      "Invalid file type"
    ),
});

export async function POST(req: Request): Promise<Response> {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "File not provided" },
        { status: 400 }
      );
    }

    const validation = fileSchema.safeParse({ file });
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues.map(e => e.message).join(", ") },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${crypto.randomUUID()}-${file.name}`;

    // ⬆️ RustFS upload
    await rustfsClient.send(
      new PutObjectCommand({
        Bucket: process.env.RUSTFS_BUCKET!,
        Key: fileName,
        Body: buffer,
        ContentType: file.type,
        ContentLength: file.size,
      })
    );

    const url = `${process.env.RUSTFS_PUBLIC_URL}/${process.env.RUSTFS_BUCKET}/${fileName}`;

    const row = await prisma.file.create({
      data: {
        fileName,
        originalName: file.name,
        bucket: process.env.RUSTFS_BUCKET!,
        size: file.size,
        url,
      },
    });

    return NextResponse.json({
      success: true,
      data: row,
      url,
    });
  } catch (err) {
    console.error("RustFS upload error:", err);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}

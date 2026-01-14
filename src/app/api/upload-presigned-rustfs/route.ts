import { NextResponse } from "next/server";
import { z } from "zod";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { rustfsClient } from "@/lib/rustfs";
import prisma from "@/lib/prisma";
import { FileStatus, FileExposure } from "@/generated/prisma/enums";

/* ================= POST (presigned URL) ================= */

const uploadSchema = z.object({
  fileName: z.string().min(1),
  originalName: z.string().min(1),
  size: z.number().positive(),
  contentType: z.string(),
  isPrivate: z.boolean().default(false),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fileName, originalName, size, contentType, isPrivate } =
      uploadSchema.parse(body);

    const bucketName = isPrivate
      ? process.env.RUSTFS_PRIVATE_BUCKET!
      : process.env.RUSTFS_BUCKET!;

    const objectName = `${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: objectName,
      ContentType: contentType,
      ContentLength: size,
    });

    const presignedUrl = await getSignedUrl(rustfsClient, command, {
      expiresIn: 60 * 15,
    });

    const publicUrl = `${process.env.RUSTFS_PUBLIC_URL}/${bucketName}/${objectName}`;

    const row = await prisma.file.create({
      data: {
        fileName: objectName,
        originalName,
        bucket: bucketName,
        size,
        url: publicUrl,
        status: FileStatus.pending,
        exposure: isPrivate
          ? FileExposure.private
          : FileExposure.public,
      },
    });

    return NextResponse.json({
      success: true,
      url: presignedUrl,
      method: "PUT",
      fileId: row.id,
      objectName,
    });
  } catch (err) {
    console.error("RustFS presigned error:", err);
    return NextResponse.json(
      { error: "Failed to generate presigned URL" },
      { status: 500 }
    );
  }
}

/* ================= PUT (upload completed) ================= */

const updateSchema = z.object({
  fileId: z.string().uuid(),
});

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { fileId } = updateSchema.parse(body);

    const file = await prisma.file.update({
      where: { id: fileId },
      data: {
        status: FileStatus.uploaded,
      },
    });

    return NextResponse.json({
      success: true,
      data: file,
    });
  } catch (err) {
    console.error("RustFS update error:", err);
    return NextResponse.json(
      { error: "Failed to update file status" },
      { status: 500 }
    );
  }
}

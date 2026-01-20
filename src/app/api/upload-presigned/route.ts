import { NextResponse } from "next/server";
import { FileStatus, FileExposure } from "@/generated/prisma/enums";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { rustfsClient } from "@/lib/rustfs";
import prisma from "@/lib/prisma";
import z from "zod";

const uploadSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  originalName: z.string().min(1, "Original name is required"),
  size: z.number().positive("Size must be a positive number"),
  isPrivate: z.boolean().default(false),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fileName, originalName, size, isPrivate } = uploadSchema.parse(body);
    
    // Select bucket based on privacy setting
    const bucketName = isPrivate 
      ? process.env.RUSTFS_PRIVATE_BUCKET! 
      : process.env.RUSTFS_BUCKET!;
    console.log("Bucket Name:", bucketName);
    
    const objectName = `${Date.now()}-${fileName}`;
    const url = `${process.env.RUSTFS_PUBLIC_URL}/${bucketName}/${objectName}`;

    // Generate presigned PUT URL (15 minutes expiry)
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: objectName,
      ContentLength: size,
    });

    const presignedUrl = await getSignedUrl(rustfsClient, command, {
      expiresIn: 15 * 60 // 15 minutes
    });

    // Create pending record
    const row = await prisma.file.create({
      data: {
        fileName: objectName,
        url,
        size,
        bucket: bucketName,
        originalName,
        status: FileStatus.pending, // Status is pending until upload completes
        exposure: isPrivate ? FileExposure.private : FileExposure.public,
      },
    });

    return NextResponse.json({
      url: presignedUrl,
      method: "PUT",
      objectName,
      fileId: row.id, // Return the database ID
      success: true,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Presigned URL error:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}

const updateSchema = z.object({
  fileId: z.uuid({ error: "Invalid file ID" }),
  contentType: z.string().optional(),
});

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { fileId } = updateSchema.parse(body);

    // Update status to uploaded
    const updatedFile = await prisma.file.update({
      where: { id: fileId },
      data: {
        status: FileStatus.uploaded,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedFile,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Update file error:", error);
    return NextResponse.json(
      { error: "Failed to update file status" },
      { status: 500 }
    );
  }
}
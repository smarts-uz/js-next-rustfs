import { NextResponse, type NextRequest } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { rustfsClient } from "@/lib/rustfs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const bucket = searchParams.get("bucket");
  const objectName = searchParams.get("object");

  if (!bucket || !objectName) {
    return NextResponse.json(
      { error: "bucket and object are required" },
      { status: 400 }
    );
  }

  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: objectName,
    });

    const url = await getSignedUrl(rustfsClient, command, {
      expiresIn: 60 * 10 // 10 minutes
    });

    return NextResponse.json({ url });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to generate presigned URL" },
      { status: 500 }
    );
  }
}
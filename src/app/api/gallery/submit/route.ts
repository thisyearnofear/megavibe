import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Schema validation for gallery submission
const gallerySubmissionSchema = z.object({
  imageUrl: z.string().url(),
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  creator: z.string(),
  stylePreset: z.string().optional(),
  prompt: z.string().min(1)
});

type GallerySubmission = z.infer<typeof gallerySubmissionSchema>;

// In-memory store for gallery submissions
// In a production app, this would be stored in a database
let gallerySubmissions: GallerySubmission[] = [];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate submission data
    const result = gallerySubmissionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid submission data", details: result.error.format() },
        { status: 400 }
      );
    }
    
    const submission = result.data;
    
    // Store the submission
    gallerySubmissions.push(submission);
    
    // Return success response with the submission ID (here just the index)
    return NextResponse.json({
      success: true,
      submissionId: gallerySubmissions.length - 1,
      message: "Image successfully submitted to gallery"
    });
  } catch (error) {
    console.error("Error submitting to gallery:", error);
    return NextResponse.json(
      { error: "Failed to process gallery submission" },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return all gallery submissions
  return NextResponse.json({ 
    submissions: gallerySubmissions
  });
}
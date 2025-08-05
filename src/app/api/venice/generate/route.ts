import { NextRequest, NextResponse } from 'next/server';

// Venice AI API configuration
const VENICE_API_KEY = process.env.VENICE_API_KEY;
const VENICE_API_URL = 'https://api.venice.ai/api/v1/image/generate';

// Valid style presets for Venice AI
const VALID_STYLES = [
  "3D Model",
  "Analog Film",
  "Anime",
  "Cinematic",
  "Comic Book"
];

/**
 * API Route to handle Venice AI image generation
 * This keeps the API key server-side only
 */
export async function POST(request: NextRequest) {
  try {
    // Check if Venice API key is configured
    if (!VENICE_API_KEY) {
      return NextResponse.json(
        { error: 'Venice AI API key not configured' }, 
        { status: 500 }
      );
    }
    
    // Get parameters from request
    const params = await request.json();
    
    // Validate prompt
    if (!params.prompt || typeof params.prompt !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid prompt' }, 
        { status: 400 }
      );
    }
    
    // Set default values for optional parameters
    const requestBody = {
      cfg_scale: 7.5,
      embed_exif_metadata: true, // Store metadata in image for provenance
      format: 'webp',
      height: params.height || 512,
      hide_watermark: false,
      lora_strength: 50,
      model: params.model || 'hidream',
      // Enhanced negative prompt for content moderation
      negative_prompt: params.negative_prompt ||
        'nsfw, nudity, violence, gore, explicit, offensive, harmful, hateful content, inappropriate, sexual, disturbing, dangerous, illegal, unethical, Clouds, Rain, Snow',
      prompt: params.prompt,
      return_binary: false,
      safe_mode: false,
      seed: Math.floor(Math.random() * 1000000000),
      steps: 20,
      style_preset: validateStylePreset(params.style_preset) || '3D Model',
      width: params.width || 512
    };
    
    console.log('Making request to Venice AI API:', {
      ...requestBody,
      prompt: requestBody.prompt.substring(0, 20) + '...' // Log truncated prompt for privacy
    });
    
    // Call Venice AI API
    const response = await fetch(VENICE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VENICE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Venice AI API error:', response.status, errorData);
      
      // Handle different error types with appropriate messages
      let errorMessage = `Venice AI API error: ${response.status}`;
      let statusCode = response.status;
      
      if (errorData.error?.includes('rate limit')) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
        statusCode = 429;
      } else if (errorData.error?.includes('invalid model')) {
        errorMessage = 'Invalid model selected.';
        statusCode = 400;
      } else if (errorData.error?.includes('content policy')) {
        errorMessage = 'Content policy violation detected. Please modify your prompt.';
        statusCode = 403;
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: statusCode }
      );
    }
    
    // Parse response from Venice AI
    const veniceResponse = await response.json();
    
    // Content moderation check (basic implementation)
    const moderationCheck = await performContentModeration(requestBody.prompt);
    if (!moderationCheck.safe) {
      console.warn('Content moderation flagged prompt:', moderationCheck.reason);
      return NextResponse.json(
        { error: `Content policy violation: ${moderationCheck.reason}` },
        { status: 403 }
      );
    }
    
    // Return image data to client with FilCDN integration details
    // Ensure we're handling the Venice AI response format correctly
    const imageData = veniceResponse.images?.[0] || veniceResponse.image;
    
    if (!imageData) {
      console.error('No image data in Venice AI response:', veniceResponse);
      return NextResponse.json(
        { error: 'No image data received from Venice AI' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      image: imageData,
      timestamp: Date.now(),
      storage: {
        provider: 'FilCDN',
        permanentStorage: true,
        decentralized: true
      }
    });
  } catch (error: unknown) {
    let message = "Unknown error";
    if (typeof error === "object" && error && "message" in error) {
      message = (error as { message?: string }).message || message;
    }
    console.error('Venice AI generation error:', error);
    return NextResponse.json(
      { error: `Server error: ${message}` }, 
      { status: 500 }
    );
  }
}

/**
 * Basic content moderation function
 * In a production environment, this would be replaced with a more robust solution
 * such as OpenAI's moderation API or a dedicated service
 */
async function performContentModeration(prompt: string): Promise<{safe: boolean, reason?: string}> {
  // List of keywords that might indicate inappropriate content
  const flaggedTerms = [
    'nsfw', 'nude', 'naked', 'sex', 'porn', 'explicit',
    'violence', 'gore', 'blood', 'kill', 'death', 'murder',
    'terrorist', 'bomb', 'weapon', 'gun', 'racist', 'nazi',
    'illegal', 'drug'
  ];
  
  const promptLower = prompt.toLowerCase();
  
  // Check for flagged terms
  for (const term of flaggedTerms) {
    if (promptLower.includes(term)) {
      return {
        safe: false,
        reason: `Prompt contains potentially inappropriate content`
      };
    }
  }
  
  return { safe: true };
}

/**
 * Validates that the provided style preset is supported by Venice AI
 * @param style The style preset to validate
 * @returns The validated style or undefined if invalid
 */
function validateStylePreset(style?: string): string | undefined {
  if (!style) return undefined;
  
  return VALID_STYLES.includes(style) ? style : undefined;
}
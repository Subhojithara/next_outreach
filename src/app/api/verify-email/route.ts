// app/api/verify-email/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { VerifyEmailAddressCommand, SESClient } from '@aws-sdk/client-ses';
import { initSESClient } from '@/lib/aws-service';
import { handleAWSError } from '@/middleware/aws-error-handler';

// Helper function to validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Helper function to verify email with AWS SES
async function verifyEmailWithSES(email: string, sesClient: SESClient): Promise<boolean> {
  if (!isValidEmail(email)) {
    return false;
  }
  
  try {
    await sesClient.send(new VerifyEmailAddressCommand({ EmailAddress: email }));
    return true;
  } catch (error) {
    console.error('Error verifying email with SES:', error);
    return false;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Authenticate user
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get email from request body
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Initialize SES client with error handling
    const sesClient = initSESClient();
    
    // Log for debugging
    console.log(`Verifying email ${email} for user ${userId}`);

    // Verify email with SES
    const isVerified = await verifyEmailWithSES(email, sesClient);

    // Determine email quality based on domain
    let emailQuality = null;
    const domain = email.split('@')[1];
    if (domain) {
      if (['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com'].includes(domain)) {
        emailQuality = 'personal';
      } else {
        emailQuality = 'business';
      }
    }

    return NextResponse.json({
      email,
      isVerified,
      emailQuality,
      verifiedAt: new Date().toISOString()
    });
  } catch (error) {
    // Use the error handler to get detailed error information
    const handledError = handleAWSError(error as Error, 'SES');
    
    console.error('Error verifying email:', handledError);
    
    // Return a more informative error message
    return NextResponse.json(
      { 
        error: 'An error occurred while verifying the email', 
        details: handledError.message,
        errorType: handledError.type,
        timestamp: handledError.timestamp
      },
      { status: 500 }
    );
  }
}
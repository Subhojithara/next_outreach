// app/api/verify-email/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { VerifyEmailAddressCommand, SESClient } from '@aws-sdk/client-ses';
import { initSESClient } from '@/lib/aws-service';
import { handleAWSError } from '@/middleware/aws-error-handler';
import dns from 'dns';
import { promisify } from 'util';

// Promisify DNS methods
const resolveMx = promisify(dns.resolveMx);

// Function to suggest corrections for common email typos
function suggestEmailCorrection(email: string): string | null {
  const parts = email.split('@');
  if (parts.length !== 2) return null;

  const localPart = parts[0];
  const domainPart = parts[1];

  const commonDomainTypos: { [key: string]: string } = {
    'gamil.com': 'gmail.com',
    'gmial.com': 'gmail.com',
    'gmai.com': 'gmail.com',
    'gmal.com': 'gmail.com',
    'hotmal.com': 'hotmail.com',
    'hotmial.com': 'hotmail.com',
    'hotmil.com': 'hotmail.com',
    'outlok.com': 'outlook.com',
    'outllok.com': 'outlook.com',
    'yahho.com': 'yahoo.com',
    'yaho.com': 'yahoo.com',
  };

  const commonTldTypos: { [key: string]: string } = {
    'con': 'com',
    'cmo': 'com',
    'ocm': 'com',
    'om': 'com', // common if 'c' is missed
    'nte': 'net',
    'ogr': 'org',
  };

  if (commonDomainTypos[domainPart.toLowerCase()]) {
    return `${localPart}@${commonDomainTypos[domainPart.toLowerCase()]}`;
  }

  const domainParts = domainPart.split('.');
  if (domainParts.length >= 2) {
    const tld = domainParts.pop()!;
    const mainDomain = domainParts.join('.');
    if (commonTldTypos[tld.toLowerCase()]) {
      return `${localPart}@${mainDomain}.${commonTldTypos[tld.toLowerCase()]}`;
    }
  }

  return null;
}

// Function to identify role-based email accounts
function isRoleBasedEmail(email: string): boolean {
  const localPart = email.split('@')[0]?.toLowerCase();
  if (!localPart) return false;

  const rolePrefixes = [
    'admin', 'administrator', 'webmaster', 'postmaster', 'hostmaster',
    'support', 'help', 'contact', 'info', 'information', 'sales', 'marketing',
    'abuse', 'security', 'privacy', 'legal', 'billing', 'hr', 'jobs',
    'careers', 'feedback', 'media', 'press', 'noreply', 'no-reply',
    'dev', 'test', 'demo', 'office', 'team', 'hello', 'mail'
  ];

  return rolePrefixes.some(prefix => localPart.startsWith(prefix));
}

// Enhanced email validation regex
function isValidEmail(email: string): boolean {
  // More comprehensive regex for email validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

// Function to check common disposable email domains
function isDisposableEmail(email: string): boolean {
  const disposableDomains = [
    'mailinator.com', 'tempmail.com', 'temp-mail.org', 'guerrillamail.com',
    'throwawaymail.com', '10minutemail.com', 'yopmail.com', 'trashmail.com',
    'dispostable.com', 'sharklasers.com', 'grr.la', 'guerrillamail.info',
    'fakeinbox.com', 'mailnesia.com', 'mailcatch.com', 'tempr.email',
    'tempmail.net', 'discard.email', 'maildrop.cc', 'getairmail.com'
  ];
  
  const domain = email.split('@')[1]?.toLowerCase();
  return disposableDomains.includes(domain);
}

// Check if domain has valid MX records
async function hasMxRecords(domain: string): Promise<boolean> {
  try {
    const records = await resolveMx(domain);
    return records && records.length > 0;
  } catch (error) {
    console.error(`Error checking MX records for ${domain}:`, error);
    return false;
  }
}

// Helper function to verify email with AWS SES
async function verifyEmailWithSES(email: string, sesClient: SESClient): Promise<boolean> {
  if (!isValidEmail(email)) {
    return false;
  }
  
  // Before calling SES, check if it's a role-based email that might be blocked by SES policies
  // This is a proactive check, SES might still verify some role accounts
  if (isRoleBasedEmail(email)) {
    console.warn(`Attempting to verify a role-based email: ${email}. SES might have restrictions.`);
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
  
  let email = '';
  
  try {
    // Get email from request body
    const body = await request.json();
    email = body.email;

    if (!email) {
      return NextResponse.json({ 
        valid: false, 
        message: 'Email is required' 
      }, { status: 400 });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      const suggestion = suggestEmailCorrection(email);
      return NextResponse.json({ 
        valid: false, 
        message: 'Invalid email format',
        suggestion,
        details: {
          format: false,
          domain: false,
          disposable: false,
          mxRecords: false,
          roleBased: isRoleBasedEmail(email) // Add role-based check here too
        }
      }, { status: 200 });
    }

    // Extract domain for further checks
    const domain = email.split('@')[1];
    if (!domain) {
      return NextResponse.json({ 
        valid: false, 
        message: 'Invalid email domain',
        details: {
          format: true,
          domain: false,
          disposable: false,
          mxRecords: false
        }
      }, { status: 200 });
    }
    
    // Check if email is from a disposable domain
    const isDisposable = isDisposableEmail(email);
    const isRole = isRoleBasedEmail(email);
    const suggestion = suggestEmailCorrection(email);
    
    // Check for valid MX records
    const hasMx = await hasMxRecords(domain);
    
    // Determine email quality based on domain
    let emailQuality = null;
    if (['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com'].includes(domain.toLowerCase())) {
      emailQuality = 'personal';
    } else {
      emailQuality = 'business';
    }

    // If domain has no MX records, it's likely invalid
    if (!hasMx) {
      return NextResponse.json({ 
        valid: false, 
        message: 'Email domain does not have valid mail servers',
        isVerified: false,
        emailQuality,
        suggestion,
        details: {
          format: true,
          domain: true,
          disposable: isDisposable,
          mxRecords: false,
          roleBased: isRole
        }
      }, { status: 200 });
    }

    // If it's a disposable email, mark as invalid but don't waste resources on SES check
    if (isDisposable) {
      return NextResponse.json({ 
        valid: false, 
        message: 'Disposable email addresses are not allowed',
        isVerified: false,
        emailQuality,
        suggestion,
        details: {
          format: true,
          domain: true,
          disposable: true,
          mxRecords: hasMx,
          roleBased: isRole
        }
      }, { status: 200 });
    }

    // Initialize SES client with error handling
    const sesClient = initSESClient();
    
    // Log for debugging
    console.log(`Verifying email ${email} for user ${userId}`);

    // Verify email with SES
    const isVerified = await verifyEmailWithSES(email, sesClient);

    // Prepare verification details
    const verificationDetails = {
      format: true,
      domain: true,
      disposable: isDisposable,
      mxRecords: hasMx,
      verified: isVerified,
      quality: emailQuality,
      roleBased: isRole
    };

    // Determine overall validity
    const isValid = isVerified && !isDisposable;

    // Generate appropriate message
    let message = '';
    if (isValid) {
      message = 'Email appears to be valid and deliverable';
    } else if (isDisposable) {
      message = 'Email appears to be from a disposable domain';
    } else if (!isVerified) {
      message = 'Email verification failed. The email address may not exist or may be unreachable.';
    }

    return NextResponse.json({
      valid: isValid,
      message,
      email,
      isVerified,
      emailQuality,
      suggestion,
      details: verificationDetails,
      verifiedAt: new Date().toISOString(),
      confidence: isVerified ? 'high' : (hasMx ? 'medium' : 'low')
    }, { status: 200 });
  } catch (error) {
    // Use the error handler to get detailed error information
    const handledError = handleAWSError(error as Error, 'SES');
    
    console.error('Error verifying email:', handledError);
    
    // Return a more informative error message in the new format
    return NextResponse.json(
      { 
        valid: false,
        message: 'An error occurred while verifying the email',
        details: {
          error: handledError.message,
          errorType: handledError.type,
          timestamp: handledError.timestamp,
          // Include basic email checks in error response too, if email was available
          format: isValidEmail(email),
          roleBased: isRoleBasedEmail(email)
        }
      },
      { status: 500 }
    );
  }
}
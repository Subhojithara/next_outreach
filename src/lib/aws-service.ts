/**
 * AWS Service Utility
 * 
 * This utility provides centralized AWS service initialization and error handling
 * for all API routes. It ensures consistent error handling and logging across
 * the application, especially important for production deployments.
 */

import { S3Client } from '@aws-sdk/client-s3';
import { SESClient } from '@aws-sdk/client-ses';
import { AthenaClient } from '@aws-sdk/client-athena';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { handleAWSError, validateS3BucketConfig } from '@/middleware/aws-error-handler';

// Interface for AWS service initialization options
interface AWSServiceOptions {
  region?: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

/**
 * Initialize S3 client with proper error handling
 */
export function initS3Client(options?: AWSServiceOptions): S3Client {
  try {
    // Use provided options or fall back to environment variables
    const region = options?.region || process.env.AWS_REGION || 'ap-south-1';
    const credentials = options?.credentials || {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    };
    
    // Validate credentials
    if (!credentials.accessKeyId || !credentials.secretAccessKey) {
      console.error('AWS credentials not properly configured');
    }
    
    // Validate S3 bucket configuration
    const bucketValidation = validateS3BucketConfig(process.env.S3_BUCKET_NAME);
    if (!bucketValidation.isValid) {
      console.error(bucketValidation.message);
    }
    
    return new S3Client({
      region,
      credentials,
    });
  } catch (error) {
    const handledError = handleAWSError(error, 'S3');
    console.error('Failed to initialize S3 client:', handledError.message);
    // Return a client anyway, but operations will likely fail
    return new S3Client({
      region: process.env.AWS_REGION || 'ap-south-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }
}

/**
 * Initialize SES client with proper error handling
 */
export function initSESClient(options?: AWSServiceOptions): SESClient {
  try {
    const region = options?.region || process.env.AWS_REGION || 'ap-south-1';
    const credentials = options?.credentials || {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    };
    
    return new SESClient({
      region,
      credentials,
    });
  } catch (error) {
    const handledError = handleAWSError(error, 'SES');
    console.error('Failed to initialize SES client:', handledError.message);
    return new SESClient({
      region: process.env.AWS_REGION || 'ap-south-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }
}

/**
 * Initialize Athena client with proper error handling
 */
export function initAthenaClient(options?: AWSServiceOptions): AthenaClient {
  try {
    const region = options?.region || process.env.AWS_REGION || 'ap-south-1';
    const credentials = options?.credentials || {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    };
    
    return new AthenaClient({
      region,
      credentials,
    });
  } catch (error) {
    const handledError = handleAWSError(error, 'Athena');
    console.error('Failed to initialize Athena client:', handledError.message);
    return new AthenaClient({
      region: process.env.AWS_REGION || 'ap-south-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }
}

/**
 * Initialize DynamoDB client with proper error handling
 */
export function initDynamoDBClient(options?: AWSServiceOptions): DynamoDBClient {
  try {
    const region = options?.region || process.env.AWS_REGION || 'ap-south-1';
    const credentials = options?.credentials || {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    };
    
    return new DynamoDBClient({
      region,
      credentials,
    });
  } catch (error) {
    const handledError = handleAWSError(error, 'DynamoDB');
    console.error('Failed to initialize DynamoDB client:', handledError.message);
    return new DynamoDBClient({
      region: process.env.AWS_REGION || 'ap-south-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }
}

/**
 * Parse S3 bucket name and prefix from environment variable
 * This function handles different formats of S3_BUCKET_NAME
 */
export function parseS3BucketConfig(userId: string, type: 'single' | 'bulk' = 'single') {
  try {
    // Extract just the bucket name from the S3_BUCKET_NAME environment variable
    // Format could be either 's3://bucketname/path/' or just 'bucketname'
    const s3BucketNameFull = process.env.S3_BUCKET_NAME?.replace('s3://', '') || '';
    
    // Split by '/' and take the first part as the bucket name
    const s3BucketName = s3BucketNameFull.split('/')[0];
    
    // Determine the prefix - if the env var had a path, use it as part of the prefix
    let prefix = '';
    if (s3BucketNameFull.includes('/')) {
      // Get everything after the bucket name as the base prefix
      const basePrefix = s3BucketNameFull.substring(s3BucketName.length + 1);
      prefix = `${basePrefix}user-data/${userId}/${type === 'single' ? 'find-email' : 'bulk-find-email'}/`;
    } else {
      prefix = `user-data/${userId}/${type === 'single' ? 'find-email' : 'bulk-find-email'}/`;
    }
    
    return { bucketName: s3BucketName, prefix };
  } catch (error) {
    console.error('Error parsing S3 bucket configuration:', error);
    // Return default values as fallback
    return { 
      bucketName: process.env.S3_BUCKET_NAME || 'default-bucket',
      prefix: `user-data/${userId}/${type === 'single' ? 'find-email' : 'bulk-find-email'}/`
    };
  }
}
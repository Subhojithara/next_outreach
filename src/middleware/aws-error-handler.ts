/**
 * AWS Error Handler Middleware
 * 
 * This middleware provides enhanced error handling and logging for AWS service interactions.
 * It helps diagnose issues in production environments by providing more detailed error information.
 */

import { S3Client } from '@aws-sdk/client-s3';
import { SESClient } from '@aws-sdk/client-ses';
import { AthenaClient } from '@aws-sdk/client-athena';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

// Error types for better classification
export enum AWSErrorType {
  CREDENTIALS = 'CREDENTIALS',
  PERMISSIONS = 'PERMISSIONS',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  CONFIGURATION = 'CONFIGURATION',
  NETWORK = 'NETWORK',
  THROTTLING = 'THROTTLING',
  UNKNOWN = 'UNKNOWN'
}

// Interface for standardized error response
export interface AWSErrorResponse {
  type: AWSErrorType;
  message: string;
  service: string;
  originalError?: Error;
  timestamp: string;
}

/**
 * Creates AWS service clients with enhanced error handling
 * @param region AWS region
 * @param credentials AWS credentials
 */
export function createAWSClients(region: string, credentials: { accessKeyId: string, secretAccessKey: string }) {
  // Validate inputs
  if (!region) {
    console.error('AWS Region not specified in environment variables');
  }
  
  if (!credentials.accessKeyId || !credentials.secretAccessKey) {
    console.error('AWS credentials not properly configured in environment variables');
  }

  // Create clients with custom error handling
  const s3Client = new S3Client({
    region,
    credentials,
  });

  const sesClient = new SESClient({
    region,
    credentials,
  });

  const athenaClient = new AthenaClient({
    region,
    credentials,
  });

  const dynamoClient = new DynamoDBClient({
    region,
    credentials,
  });

  return {
    s3Client,
    sesClient,
    athenaClient,
    dynamoClient
  };
}

/**
 * Processes AWS errors and returns standardized error information
 * @param error The error from AWS service
 * @param service The AWS service name
 */
export function handleAWSError(error: Error, service: string): AWSErrorResponse {
  console.error(`AWS ${service} Error:`, error);
  
  let type = AWSErrorType.UNKNOWN;
  let message = 'An unknown error occurred with AWS services';
  
  // Classify error types based on AWS error codes
  if (error.name === 'CredentialsProviderError' || error.name === 'InvalidAccessKeyId') {
    type = AWSErrorType.CREDENTIALS;
    message = 'Invalid AWS credentials. Please check your access keys.';
  } else if (error.name === 'AccessDenied' || error.name === 'UnauthorizedOperation') {
    type = AWSErrorType.PERMISSIONS;
    message = 'Insufficient permissions to perform this operation.';
  } else if (error.name === 'NoSuchBucket' || error.name === 'NoSuchKey' || error.name === 'ResourceNotFoundException') {
    type = AWSErrorType.RESOURCE_NOT_FOUND;
    message = 'The requested AWS resource was not found.';
  } else if (error.name === 'ValidationException' || error.name === 'InvalidParameter') {
    type = AWSErrorType.CONFIGURATION;
    message = 'Invalid configuration for AWS service.';
  } else if (error.name === 'NetworkingError' || error.name === 'TimeoutError') {
    type = AWSErrorType.NETWORK;
    message = 'Network error when connecting to AWS services.';
  } else if (error.name === 'ThrottlingException' || error.name === 'TooManyRequestsException') {
    type = AWSErrorType.THROTTLING;
    message = 'Request was throttled by AWS. Please try again later.';
  }
  
  // Add service-specific context to the error message
  if (service === 'S3') {
    message += ' This may affect file storage and history features.';
  } else if (service === 'SES') {
    message += ' This may affect email verification features.';
  } else if (service === 'Athena') {
    message += ' This may affect bulk email lookup features.';
  } else if (service === 'DynamoDB') {
    message += ' This may affect caching and performance.';
  }
  
  return {
    type,
    message,
    service,
    originalError: error,
    timestamp: new Date().toISOString()
  };
}

/**
 * Validates S3 bucket configuration
 * @param bucketName The S3 bucket name from environment variables
 */
export function validateS3BucketConfig(bucketName: string | undefined): { isValid: boolean; message: string } {
  if (!bucketName) {
    return { 
      isValid: false, 
      message: 'S3 bucket name is not configured in environment variables' 
    };
  }
  
  // Remove s3:// prefix if present
  const normalizedBucketName = bucketName.replace('s3://', '');
  
  // Basic validation for bucket name format
  const bucketNameRegex = /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/;
  const bucketParts = normalizedBucketName.split('/');
  const actualBucketName = bucketParts[0];
  
  if (!bucketNameRegex.test(actualBucketName)) {
    return { 
      isValid: false, 
      message: `Invalid S3 bucket name format: ${actualBucketName}` 
    };
  }
  
  return { isValid: true, message: 'S3 bucket configuration is valid' };
}
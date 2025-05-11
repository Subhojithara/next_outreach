# Vercel Deployment Instructions

## Fixing Bulk Email, Email Verifier, and History Features

This guide provides step-by-step instructions to fix the issues with bulk email finder, email verification, and history features in your Vercel deployment.

## Problem Summary

You're experiencing the following issues in your Vercel deployment:
- Single email finder works correctly
- Bulk email finder doesn't work
- Email verification doesn't work
- History feature shows "Failed to load your search history. Please try again later"

These issues are likely related to AWS service configuration in your Vercel environment.

## Solution Steps

### 1. Update Environment Variables in Vercel

1. Log in to your Vercel dashboard
2. Select your project
3. Go to "Settings" > "Environment Variables"
4. Verify the following environment variables are correctly set:
   - `AWS_REGION` (e.g., ap-south-1)
   - `AWS_ACCESS_KEY_ID` (your AWS access key)
   - `AWS_SECRET_ACCESS_KEY` (your AWS secret key)
   - `S3_BUCKET_NAME` (your S3 bucket name)
   - `DYNAMODB_CACHE_TABLE` (if you're using DynamoDB caching)

### 2. Check AWS IAM Permissions

Ensure your AWS IAM user has the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListObjects",
        "s3:ListObjectsV2"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "ses:VerifyEmailAddress"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "athena:StartQueryExecution",
        "athena:GetQueryExecution",
        "athena:GetQueryResults"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/email-lookup-cache"
    }
  ]
}
```

Replace `your-bucket-name` and table name with your actual resource names.

### 3. Configure CORS for S3 Bucket

Ensure your S3 bucket has proper CORS configuration:

1. Go to AWS S3 console
2. Select your bucket
3. Go to "Permissions" > "CORS configuration"
4. Add the following configuration:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": ["https://your-vercel-domain.vercel.app"],
    "ExposeHeaders": []
  }
]
```

Replace `your-vercel-domain.vercel.app` with your actual Vercel domain.

### 4. Redeploy Your Application

After making these changes:

1. Go to your Vercel dashboard
2. Select your project
3. Go to "Deployments"
4. Click "Redeploy" on your latest deployment

### 5. Verify the Fix

After redeployment:

1. Test the bulk email finder
2. Test the email verification feature
3. Check if the history is loading correctly

## Troubleshooting

If you're still experiencing issues:

1. Check Vercel logs for detailed error messages
2. Verify that all AWS services are available in your selected region
3. Test AWS credentials using the AWS CLI to ensure they're valid
4. Check that your S3 bucket exists and is accessible

## Code Improvements

We've added improved error handling and debugging to your codebase:

1. Created AWS service utilities for better error handling
2. Added detailed logging for AWS operations
3. Improved error responses with more context

These changes will help identify the specific issues in your Vercel deployment.
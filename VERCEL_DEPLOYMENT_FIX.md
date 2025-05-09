# Vercel Deployment Troubleshooting Guide

## Issue: Bulk Email, Email Verifier, and History Not Working in Production

The single email finder works in production, but bulk email finder, email verification, and history features are failing with the error: "Failed to load your search history. Please try again later."

## Root Cause Analysis

After examining the codebase, the issue appears to be related to AWS S3 bucket access and environment variable configuration in the Vercel deployment. The application relies on several AWS services:

1. **S3** - For storing search results and history
2. **SES** - For email verification
3. **Athena** - For bulk email lookups
4. **DynamoDB** - For caching email lookup results

## Required Environment Variables

Ensure the following environment variables are properly configured in your Vercel project settings:

```
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=your_bucket_name
DYNAMODB_CACHE_TABLE=email-lookup-cache
```

## Fixing the Issues

### 1. Check AWS IAM Permissions

Ensure the AWS IAM user associated with your access keys has the following permissions:

- `s3:PutObject`, `s3:GetObject`, `s3:ListObjects` for your S3 bucket
- `ses:VerifyEmailAddress` for SES
- `athena:StartQueryExecution`, `athena:GetQueryExecution`, `athena:GetQueryResults` for Athena
- `dynamodb:PutItem`, `dynamodb:GetItem` for DynamoDB

### 2. Verify Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to "Settings" > "Environment Variables"
4. Verify all required environment variables are set correctly
5. Make sure there are no typos or extra spaces

### 3. Check S3 Bucket CORS Configuration

Ensure your S3 bucket has proper CORS configuration to allow requests from your Vercel domain:

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

### 4. Debugging in Production

To debug issues in production:

1. Enable more detailed logging in your API routes
2. Check Vercel logs for error messages
3. Test each AWS service independently to isolate the issue

### 5. Common Issues and Solutions

#### S3 Access Issues

- **Issue**: "Access Denied" errors when accessing S3
- **Solution**: Check bucket permissions and IAM policies

#### SES Verification Issues

- **Issue**: Email verification fails
- **Solution**: Ensure SES is properly set up in the same region as specified in environment variables

#### Athena Query Issues

- **Issue**: Bulk email finder fails
- **Solution**: Verify Athena database and table names, check query permissions

## Deployment Checklist

- [ ] All environment variables are set in Vercel
- [ ] AWS IAM user has correct permissions
- [ ] S3 bucket has proper CORS configuration
- [ ] AWS services are available in the specified region
- [ ] DynamoDB table exists with correct name

After making these changes, redeploy your application in Vercel to apply the fixes.
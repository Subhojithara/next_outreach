// app/api/list-single-results/route.ts

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { initS3Client, parseS3BucketConfig } from '@/lib/aws-service';
import { handleAWSError } from '@/middleware/aws-error-handler';

// Helper function to convert stream to string
async function streamToString(stream: Readable): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  });
}

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Initialize S3 client with error handling
    const s3Client = initS3Client();
    
    // Parse S3 bucket configuration
    const { bucketName: s3BucketName, prefix } = parseS3BucketConfig(userId, 'single');
    
    // Log configuration for debugging
    console.log(`Listing single results for user ${userId} from bucket ${s3BucketName} with prefix ${prefix}`);

    const listObjectsParams = {
      Bucket: s3BucketName,
      Prefix: prefix,
    };

    const listedObjects = await s3Client.send(new ListObjectsV2Command(listObjectsParams));

    if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
      return NextResponse.json({ results: [] }); // No results found for this user
    }

    // Process the results to extract metadata and fetch complete data
    // const getObjectCommand = new GetObjectCommand({});
    
    // Fetch complete data for each search result
    const resultsPromises = listedObjects.Contents.map(async (item) => {
      try {
        // Get the full object data
        const getObjectParams = { Bucket: s3BucketName, Key: item.Key };
        const data = await s3Client.send(new GetObjectCommand(getObjectParams));
        
        if (data.Body) {
          // Convert stream to string and parse JSON
          const bodyContents = await streamToString(data.Body as Readable);
          const searchData = JSON.parse(bodyContents);
          
          return {
            key: item.Key,
            lastModified: item.LastModified,
            searchId: searchData.searchId || 'unknown',
            firstName: searchData.firstName || 'unknown',
            lastName: searchData.lastName || 'unknown',
            companyName: searchData.companyName || 'unknown',
            linkedin: searchData.linkedin,
            email: searchData.email,
            personalEmails: searchData.personalEmails || [],
            timestamp: searchData.timestamp
          };
        }
      } catch (error) {
        console.error(`Error fetching data for ${item.Key}:`, error);
        // Return basic metadata if full data fetch fails
        const keyParts = item.Key?.split('/');
        const fileName = keyParts?.[keyParts.length - 1];
        const searchId = fileName?.replace('.json', '');
        
        return {
          key: item.Key,
          lastModified: item.LastModified,
          searchId: searchId || 'unknown',
          firstName: 'unknown',
          lastName: 'unknown',
          companyName: 'unknown'
        };
      }
    });
    
    // Resolve all promises and sort by date
    const resultsMetadata = (await Promise.all(resultsPromises))
      .filter(Boolean)
      .sort((a, b) => ((b?.lastModified?.getTime() || 0) - (a?.lastModified?.getTime() || 0))); // Sort by date descending

    return NextResponse.json({ results: resultsMetadata });
  } catch (error) {
    // Use the error handler to get detailed error information
    const handledError = handleAWSError(error, 'S3');
    
    console.error('Error listing single email results:', handledError);
    
    // Return a more informative error message
    return NextResponse.json(
      { 
        error: 'Failed to retrieve search history.', 
        details: handledError.message,
        errorType: handledError.type,
        timestamp: handledError.timestamp
      },
      { status: 500 }
    );
  }
}
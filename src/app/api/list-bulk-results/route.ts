// app/api/list-bulk-results/route.ts

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { initS3Client, parseS3BucketConfig } from '@/lib/aws-service';
import { handleAWSError } from '@/middleware/aws-error-handler';

// Helper to convert a Readable stream to string
async function streamToString(stream: Readable): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf-8');
}

export async function GET(): Promise<NextResponse> {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Initialize S3 client with error handling
    const s3Client = initS3Client();
    
    // Parse S3 bucket configuration
    const { bucketName: s3BucketName, prefix } = parseS3BucketConfig(userId, 'bulk');
    
    // Log configuration for debugging
    console.log(`Listing bulk results for user ${userId} from bucket ${s3BucketName} with prefix ${prefix}`);

    const listObjectsParams = {
      Bucket: s3BucketName,
      Prefix: prefix,
    };

    const listedObjects = await s3Client.send(new ListObjectsV2Command(listObjectsParams));

    // The AWS SDK v3 types for ListObjectsV2CommandOutput
    // Contents?: _Object[] | undefined;
    // _Object: { Key?: string, LastModified?: Date, ... }

    if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
      return NextResponse.json({ results: [] });
    }

    // Fetch complete data for each bulk search result
    const resultsPromises = listedObjects.Contents.map(async (item) => {
      if (!item.Key) return null;
      try {
        const getObjectParams = { Bucket: s3BucketName, Key: item.Key };
        const response = await s3Client.send(new GetObjectCommand(getObjectParams));
        const Body = response.Body;

        if (Body && Body instanceof Readable) {
          const bodyContents = await streamToString(Body);
          const searchData = JSON.parse(bodyContents);

          return {
            key: item.Key,
            searchId: searchData.searchId || 'unknown',
            fileName: searchData.fileName || 'unknown',
            recordCount: searchData.recordCount || 0,
            successCount: searchData.successCount || 0,
            lastModified: item.LastModified,
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
          searchId: searchId || 'unknown',
          fileName: 'Unknown file',
          recordCount: 0,
          lastModified: item.LastModified
        };
      }
      return null;
    });

    // Resolve all promises and sort by date
    const resultsMetadata = (await Promise.all(resultsPromises))
      .filter((r): r is NonNullable<typeof r> => !!r)
      .sort((a, b) => ((b?.lastModified?.getTime() || 0) - (a?.lastModified?.getTime() || 0)));

    return NextResponse.json({ results: resultsMetadata });

  } catch (error) {
    // Use the error handler to get detailed error information
    const handledError = handleAWSError(error, 'S3');
    
    console.error('Error listing bulk results from S3:', handledError);
    
    // Return a more informative error message
    return NextResponse.json(
      { 
        error: 'Failed to retrieve bulk search history.', 
        details: handledError.message,
        errorType: handledError.type,
        timestamp: handledError.timestamp
      },
      { status: 500 }
    );
  }
}
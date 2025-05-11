'use client';

import { useState } from 'react';
import BulkUploadForm from './bulk/BulkUploadForm';
import BulkResultsDisplay from './bulk/BulkResultsDisplay';

// Types
interface BulkResultRecord {
  firstName: string;
  lastName: string;
  linkedin: string;
  companyName: string;
  foundEmail: string | null;
  personalEmails?: string[];
  personalEmailsString?: string;
  isVerified?: boolean | null;
  emailQuality?: string | null;
  retryCount?: number;
  lastRetry?: Date;
}

export default function BulkFindEmailPage() {
  const [results, setResults] = useState<BulkResultRecord[] | null>(null);

  return (
    <div className='space-y-4'>
      <BulkUploadForm onResults={setResults} />
      <BulkResultsDisplay results={results} setResults={setResults} />
    </div>
  );
}
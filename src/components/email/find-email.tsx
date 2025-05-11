'use client';

import { useState } from 'react';
import EmailSearchForm from './single/EmailSearchForm';
import EmailResults from './single/EmailResults';

export default function HomePage() {
  const [searchResult, setSearchResult] = useState({
    email: '',
    personalEmails: [] as string[],
    error: '',
    success: false,
  });

  return (
    <div className="space-y-4">
      <EmailSearchForm onSearchResult={setSearchResult} />
      <EmailResults
        email={searchResult.email}
        personalEmails={searchResult.personalEmails}
        error={searchResult.error}
        success={searchResult.success}
      />
    </div>
  );
}
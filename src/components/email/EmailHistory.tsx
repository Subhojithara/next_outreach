'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Toaster, toast } from 'sonner';
import { Clock, Mail, FileSpreadsheet, RefreshCw } from 'lucide-react';
import SingleEmailHistory from './history/SingleEmailHistory';
import BulkEmailHistory from './history/BulkEmailHistory';


export default function EmailHistory() {
  const [error, setError] = useState<string | null>(null);
  const [isLoadingSingle, setIsLoadingSingle] = useState(true);
  const [isLoadingBulk, setIsLoadingBulk] = useState(true);

  const handleRefresh = async () => {
    setIsLoadingSingle(true);
    setIsLoadingBulk(true);
    setError(null);

    try {
      const [singleResponse, bulkResponse] = await Promise.all([
        fetch('/api/list-single-results').then((res) => res.json()),
        fetch('/api/list-bulk-results').then((res) => res.json()),
      ]);
      toast.success('History refreshed');
      return { singleData: singleResponse.results || [], bulkData: bulkResponse.results || [] };
    } catch (err) {
      console.error('Error refreshing history:', err);
      setError('Failed to refresh history. Please try again.');
      return { singleData: [], bulkData: [] };
    } finally {
      setIsLoadingSingle(false);
      setIsLoadingBulk(false);
    }
  };

  if (error && !isLoadingSingle && !isLoadingBulk) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Search History</CardTitle>
          <CardDescription>View your previous email searches</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Toaster position="top-center" theme="dark" />
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <span>Email Search History</span>
              </CardTitle>
              <CardDescription>View and manage your previous email search results</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} className="h-9 px-2">
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="single" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="single" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>Single Searches</span>
              </TabsTrigger>
              <TabsTrigger value="bulk" className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                <span>Bulk Searches</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="single" className="mt-0">
              <SingleEmailHistory onError={setError} />
            </TabsContent>
            <TabsContent value="bulk" className="mt-0">
              <BulkEmailHistory onError={setError} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
}
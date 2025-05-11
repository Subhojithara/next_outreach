'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileSpreadsheet, ArrowLeft, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Define interfaces
interface BulkEmailItem {
  key: string;
  searchId: string;
  fileName: string;
  recordCount: number;
  successCount?: number;
  lastModified?: Date;
  timestamp?: string;
  results?: BulkResultRecord[];
}

interface BulkResultRecord {
  firstName: string;
  lastName: string;
  linkedin: string;
  companyName: string;
  foundEmail: string | null;
  personalEmails?: string[];
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      staggerChildren: 0.1,
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0, scale: 0.95 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
      duration: 0.4,
    },
  },
};

interface BulkEmailHistoryProps {
  onError: (error: string | null) => void;
}

export default function BulkEmailHistory({ onError }: BulkEmailHistoryProps) {
  const { user } = useUser();
  const [bulkSearchHistory, setBulkSearchHistory] = useState<BulkEmailItem[]>([]);
  const [isLoadingBulk, setIsLoadingBulk] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedBulkSearch, setSelectedBulkSearch] = useState<string | null>(null);
  const [bulkSearchDetails, setBulkSearchDetails] = useState<BulkResultRecord[] | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const fetchBulkSearchHistory = useCallback(
    async (showRefreshIndicator = false) => {
      if (!user) return;

      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoadingBulk(true);
      }
      onError(null);

      try {
        const response = await fetch('/api/list-bulk-results');
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        setBulkSearchHistory(data.results || []);
        if (showRefreshIndicator) {
          toast.success('Bulk email history refreshed');
        }
      } catch (err) {
        console.error('Failed to fetch bulk search history:', err);
        onError('Failed to load your bulk search history. Please try again later.');
        if (showRefreshIndicator) {
          toast.error('Failed to refresh data. Please try again.');
        }
      } finally {
        setIsLoadingBulk(false);
        setIsRefreshing(false);
      }
    },
    [user, onError]
  );

  const fetchBulkSearchDetails = async (searchId: string) => {
    setIsLoadingDetails(true);
    try {
      const response = await fetch(`/api/bulk-result/${searchId}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setBulkSearchDetails(data.results || []);
      setSelectedBulkSearch(searchId);
    } catch (err) {
      console.error('Failed to fetch bulk search details:', err);
      onError('Failed to load bulk search details. Please try again later.');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchBulkSearchHistory();
  }, [fetchBulkSearchHistory]);

  const formatDate = (dateString?: Date | string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Skeleton loader for the table
  const TableSkeleton = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex space-x-4">
          <Skeleton className="h-8 w-[250px]" />
        </div>
        <Skeleton className="h-8 w-[100px]" />
      </div>
      <div className="overflow-x-auto border rounded-md">
        <div className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <div className="bg-gray-50 dark:bg-gray-900">
            <div className="grid grid-cols-5 gap-2 px-4 py-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-black">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="grid grid-cols-5 gap-2 px-4 py-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderBulkEmailHistory = () => {
    const headerSection = (
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Bulk Email Search History</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchBulkSearchHistory(true)}
          disabled={isRefreshing}
          className={cn('flex items-center gap-1 transition-all', isRefreshing && 'opacity-70 cursor-not-allowed')}
        >
          {isRefreshing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Refreshing...</span>
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </>
          )}
        </Button>
      </div>
    );

    if (isLoadingBulk) {
      return (
        <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-4">
          {headerSection}
          <TableSkeleton />
        </motion.div>
      );
    }

    if (bulkSearchHistory.length === 0) {
      return (
        <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-4">
          {headerSection}
          <motion.div variants={itemVariants} className="p-8 text-center border rounded-md bg-gray-50 dark:bg-gray-900">
            <p className="text-muted-foreground mb-4">You haven‘t performed any bulk email searches yet.</p>
            <Link href="/email">
              <Button>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Bulk Find Emails
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      );
    }

    if (selectedBulkSearch && bulkSearchDetails && !isLoadingDetails) {
      const selectedSearch = bulkSearchHistory.find((item) => item.searchId === selectedBulkSearch);

      return (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedBulkSearch(null);
                setBulkSearchDetails(null);
              }}
              className="flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to List
            </Button>
            <div className="text-sm text-muted-foreground">
              {selectedSearch?.fileName} • Searched on:{' '}
              {formatDate(selectedSearch?.timestamp ? new Date(selectedSearch.timestamp) : selectedSearch?.lastModified)}
            </div>
          </div>

          {selectedSearch && (
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="text-md font-medium mb-2">Bulk Search Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">File Name</p>
                  <p className="font-medium break-all">{selectedSearch.fileName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Records</p>
                  <p className="font-medium">{selectedSearch.recordCount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Emails Found</p>
                  <p className="font-medium">{selectedSearch.successCount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Success Rate</p>
                  <p className="font-medium">
                    {selectedSearch.recordCount > 0
                      ? `${Math.round(((selectedSearch.successCount ?? 0) / selectedSearch.recordCount) * 100)}%`
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Search ID</p>
                  <p className="font-mono text-xs break-all">{selectedSearch.searchId}</p>
                </div>
              </div>
            </div>
          )}

          <h4 className="text-md font-medium mb-2">Detailed Results</h4>
          <div className="overflow-x-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">First Name</TableHead>
                  <TableHead className="w-[150px]">Last Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Business Email</TableHead>
                  <TableHead>Personal Emails</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bulkSearchDetails.length > 0 ? (
                  bulkSearchDetails.map((record, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {record.firstName} {record.lastName}
                      </TableCell>
                      <TableCell>{record.companyName}</TableCell>
                      <TableCell>
                        {record.foundEmail ? (
                          <div>
                            <span className="font-mono text-xs bg-black text-white dark:bg-white dark:text-black px-2 py-1 rounded">
                              {record.foundEmail}
                            </span>
                            {record.personalEmails && record.personalEmails.length > 0 && (
                              <div className="mt-1">
                                <span className="text-xs text-muted-foreground">
                                  +{record.personalEmails.length} personal{' '}
                                  {record.personalEmails.length === 1 ? 'email' : 'emails'}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : record.personalEmails && record.personalEmails.length > 0 ? (
                          <div>
                            <span className="font-mono text-xs bg-black text-white dark:bg-white dark:text-black px-2 py-1 rounded">
                              {record.personalEmails[0]}
                            </span>
                            {record.personalEmails.length > 1 && (
                              <div className="mt-1">
                                <span className="text-xs text-muted-foreground">
                                  +{record.personalEmails.length - 1} more{' '}
                                  {record.personalEmails.length === 2 ? 'email' : 'emails'}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">Not found</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-10 text-sm text-gray-500">
                      No results found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      );
    }

    return (
      <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-4">
        {headerSection}
        <motion.div variants={itemVariants} className="overflow-x-auto border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead>Records</TableHead>
                <TableHead>Success Rate</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bulkSearchHistory.map((item) => (
                <TableRow key={item.searchId}>
                  <TableCell className="font-medium">{item.fileName}</TableCell>
                  <TableCell>{item.recordCount} records</TableCell>
                  <TableCell>
                    {item.successCount !== undefined ? (
                      <span>
                        {Math.round((item.successCount / item.recordCount) * 100)}% ({item.successCount}/
                        {item.recordCount})
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">Unknown</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(item.lastModified)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fetchBulkSearchDetails(item.searchId)}
                      className="h-8 px-2"
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </motion.div>
      </motion.div>
    );
  };

  return renderBulkEmailHistory();
}
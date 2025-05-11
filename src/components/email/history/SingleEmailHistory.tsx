'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Mail, ArrowLeft, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Define interfaces
interface SingleEmailItem {
  key: string;
  searchId: string;
  firstName: string;
  lastName: string;
  companyName: string;
  linkedin?: string;
  email?: string;
  personalEmails?: string[];
  lastModified?: Date;
  timestamp?: Date;
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

const tableRowVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.05,
      type: 'spring',
      stiffness: 100,
      damping: 15,
      duration: 0.3,
    },
  }),
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: {
      duration: 0.2,
      ease: 'easeInOut',
    },
  },
  hover: {
    scale: 1.01,
    transition: { duration: 0.2 },
  },
};

interface SingleEmailHistoryProps {
  onError: (error: string | null) => void;
}

export default function SingleEmailHistory({ onError }: SingleEmailHistoryProps) {
  const { user } = useUser();
  const [singleSearchHistory, setSingleSearchHistory] = useState<SingleEmailItem[]>([]);
  const [isLoadingSingle, setIsLoadingSingle] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedSingleSearch, setSelectedSingleSearch] = useState<string | null>(null);
  const [singleSearchDetails, setSingleSearchDetails] = useState<SingleEmailItem | null>(null);
  const [isLoadingSingleDetails, setIsLoadingSingleDetails] = useState(false);

  const fetchSingleSearchHistory = useCallback(
    async (showRefreshIndicator = false) => {
      if (!user) return;

      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoadingSingle(true);
      }
      onError(null);

      try {
        const response = await fetch('/api/list-single-results');
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        setSingleSearchHistory(data.results || []);
        if (showRefreshIndicator) {
          toast.success('Single email history refreshed');
        }
      } catch (err) {
        console.error('Failed to fetch single search history:', err);
        onError('Failed to load your search history. Please try again later.');
        if (showRefreshIndicator) {
          toast.error('Failed to refresh data. Please try again.');
        }
      } finally {
        setIsLoadingSingle(false);
        setIsRefreshing(false);
      }
    },
    [user, onError]
  );

  const fetchSingleSearchDetails = async (searchId: string) => {
    setIsLoadingSingleDetails(true);
    try {
      const response = await fetch(`/api/single-result/${searchId}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setSingleSearchDetails(data);
      setSelectedSingleSearch(searchId);
    } catch (err) {
      console.error('Failed to fetch single search details:', err);
      onError('Failed to load search details. Please try again later.');
    } finally {
      setIsLoadingSingleDetails(false);
    }
  };

  useEffect(() => {
    fetchSingleSearchHistory();
  }, [fetchSingleSearchHistory]);

  const formatDate = (dateString?: Date) => {
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

  const renderSingleEmailHistory = () => {
    const headerSection = (
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Email Search History</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchSingleSearchHistory(true)}
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

    if (isLoadingSingle) {
      return (
        <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-4">
          {headerSection}
          <TableSkeleton />
        </motion.div>
      );
    }

    if (singleSearchHistory.length === 0) {
      return (
        <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-4">
          {headerSection}
          <motion.div variants={itemVariants} className="p-8 text-center border rounded-md bg-gray-50 dark:bg-gray-900">
            <p className="text-muted-foreground mb-4">You haven‘t performed any email searches yet.</p>
            <Link href="/email">
              <Button>
                <Mail className="mr-2 h-4 w-4" />
                Find an Email
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      );
    }

    if (selectedSingleSearch && singleSearchDetails && !isLoadingSingleDetails) {
      return (
        <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-4">
          <motion.div variants={itemVariants} className="mb-4 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedSingleSearch(null);
                setSingleSearchDetails(null);
              }}
              className="flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to List
            </Button>
            <div className="text-sm text-muted-foreground">
              Searched on: {formatDate(singleSearchDetails.timestamp || singleSearchDetails.lastModified)}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-2 sm:grid-cols-1">
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Search Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">First Name</p>
                    <p className="font-medium">{singleSearchDetails.firstName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Name</p>
                    <p className="font-medium">{singleSearchDetails.lastName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Company</p>
                    <p className="font-medium">{singleSearchDetails.companyName}</p>
                  </div>
                  {singleSearchDetails.linkedin && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">LinkedIn</p>
                      <p className="font-medium break-all">{singleSearchDetails.linkedin}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Search ID</p>
                    <p className="font-mono text-xs break-all">{singleSearchDetails.searchId}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">
                      {singleSearchDetails.firstName} {singleSearchDetails.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Company</p>
                    <p className="font-medium">{singleSearchDetails.companyName}</p>
                  </div>
                </div>
                {singleSearchDetails.linkedin && (
                  <div>
                    <p className="text-sm text-muted-foreground">LinkedIn</p>
                    <p className="font-medium break-all">{singleSearchDetails.linkedin}</p>
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-4 md:col-span-2">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Email Results</h3>
                {singleSearchDetails.email ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md"
                  >
                    <p className="text-sm text-muted-foreground mb-1">Business Email</p>
                    <p className="font-mono text-sm bg-black text-white dark:bg-white dark:text-black px-2 py-1 rounded inline-block">
                      {singleSearchDetails.email}
                    </p>
                  </motion.div>
                ) : (
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
                    <p className="text-sm text-muted-foreground">No business email found</p>
                  </div>
                )}

                {singleSearchDetails.personalEmails && singleSearchDetails.personalEmails.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md"
                  >
                    <p className="text-sm text-muted-foreground mb-1">
                      Personal Emails ({singleSearchDetails.personalEmails.length})
                    </p>
                    <div className="space-y-2">
                      {singleSearchDetails.personalEmails.map((email, index) => (
                        <motion.p
                          key={index}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="font-mono text-sm bg-black text-white dark:bg-white dark:text-black px-2 py-1 rounded inline-block mr-2 mb-2"
                        >
                          {email}
                        </motion.p>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      );
    }

    return (
      <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-4">
        {headerSection}
        <motion.div variants={itemVariants} className="overflow-x-auto border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Name</TableHead>
                <TableHead className="hidden md:table-cell">Company</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {singleSearchHistory.map((item, i) => (
                  <motion.tr
                    key={item.searchId}
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={tableRowVariants}
                    className="border-b transition-colors hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    <TableCell className="font-medium">
                      {item.firstName} {item.lastName}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{item.companyName}</TableCell>
                    <TableCell>
                      {item.email ? (
                        <div>
                          <span className="font-mono text-xs bg-black text-white dark:bg-white dark:text-black px-2 py-1 rounded">
                            {item.email}
                          </span>
                          {item.personalEmails && item.personalEmails.length > 0 && (
                            <div className="mt-1">
                              <span className="text-xs text-muted-foreground">
                                +{item.personalEmails.length} personal{' '}
                                {item.personalEmails.length === 1 ? 'email' : 'emails'}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : item.personalEmails && item.personalEmails.length > 0 ? (
                        <div>
                          <span className="font-mono text-xs bg-black text-white dark:bg-white dark:text-black px-2 py-1 rounded">
                            {item.personalEmails[0]}
                          </span>
                          {item.personalEmails.length > 1 && (
                            <div className="mt-1">
                              <span className="text-xs text-muted-foreground">
                                +{item.personalEmails.length - 1} more{' '}
                                {item.personalEmails.length === 2 ? 'email' : 'emails'}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">Not found</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                      {formatDate(item.lastModified)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fetchSingleSearchDetails(item.searchId)}
                        className="h-8 px-2"
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        </motion.div>
      </motion.div>
    );
  };

  return renderSingleEmailHistory();
}
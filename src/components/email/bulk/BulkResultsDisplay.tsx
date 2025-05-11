/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Loader2, ArrowLeft, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

// Types
interface BulkResultRecord {
  firstName: string;
  lastName: string;
  linkedin: string;
  companyName: string;
  foundEmail: string | null;
  personalEmails?: string[];
  isVerified?: boolean | null;
  emailQuality?: string | null;
  retryCount?: number;
  lastRetry?: Date;
}

interface BulkResultsDisplayProps {
  results: BulkResultRecord[] | null;
  setResults: (results: BulkResultRecord[]) => void;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      duration: 0.6,
    },
  },
};

const itemVariants = {
  hidden: { y: 25, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1, 
    transition: { 
      type: "spring", 
      stiffness: 400, 
      damping: 25 
    } 
  },
};

export default function BulkResultsDisplay({ results, setResults }: BulkResultsDisplayProps) {
  const [verifyingEmail, setVerifyingEmail] = useState<number | null>(null);
  const [verifyingBatch, setVerifyingBatch] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'verified' | 'unverified' | 'not-found'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [retryingEmail, setRetryingEmail] = useState<number | null>(null);

  // Verify email manually
  const verifyEmail = useCallback(
    async (email: string, index: number) => {
      if (!email) return;
      setVerifyingEmail(index);

      try {
        const response = await fetch('/api/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (response.ok && results) {
          const updatedResults = [...results];
          updatedResults[index] = {
            ...updatedResults[index],
            isVerified: data.isVerified,
            emailQuality: data.emailQuality || updatedResults[index].emailQuality,
          };
          setResults(updatedResults);
          toast(data.isVerified ? 'Email verified successfully' : 'Email verification failed', {
            icon: data.isVerified ? '✅' : '❌',
          });
        } else {
          toast.error(data.error || 'Failed to verify email');
        }
      } catch (_error) {
        toast.error('Verification error. Please try again.');
      } finally {
        setVerifyingEmail(null);
      }
    },
    [results, setResults]
  );

  // Verify all emails in batch
  const verifyAllEmails = useCallback(async () => {
    if (!results?.length) return;

    const emailsToVerify = results
      .filter((record) => record.foundEmail && record.isVerified === undefined)
      .map((record) => record.foundEmail!);

    if (!emailsToVerify.length) {
      toast.info('No unverified emails to process');
      return;
    }

    setVerifyingBatch(true);
    toast.info(`Verifying ${emailsToVerify.length} emails...`);

    let verifiedCount = 0;
    let failedCount = 0;
    const updatedResults = [...results];

    for (let i = 0; i < emailsToVerify.length; i++) {
      const email = emailsToVerify[i];
      const recordIndex = results.findIndex((r) => r.foundEmail === email);
      if (recordIndex === -1) continue;

      try {
        const response = await fetch('/api/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (response.ok) {
        updatedResults[recordIndex] = {
          ...updatedResults[recordIndex],
          isVerified: data.isVerified,
          emailQuality: data.emailQuality || updatedResults[recordIndex].emailQuality,
        };
        if (data.isVerified) {
          verifiedCount++;
        } else {
          failedCount++;
        }
        } else {
          failedCount++;
        }
      } catch (_error) {
        failedCount++;
      }

      // Update state occasionally to show progress
      if (i % 5 === 0 || i === emailsToVerify.length - 1) {
        setResults([...updatedResults]);
      }
    }

    setResults(updatedResults);
    setVerifyingBatch(false);
    
    if (verifiedCount > 0) {
      toast.success(`Verified ${verifiedCount} emails${failedCount ? `, ${failedCount} failed` : ''}`);
    } else if (failedCount > 0) {
      toast.error(`Failed to verify ${failedCount} emails`);
    }
  }, [results, setResults]);

  // Retry finding email
  const retryFindEmail = useCallback(
    async (record: BulkResultRecord, index: number) => {
      setRetryingEmail(index);

      try {
        const response = await fetch('/api/find-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: record.firstName,
            lastName: record.lastName,
            linkedin: record.linkedin,
            companyName: record.companyName,
          }),
        });

        const data = await response.json();

        if (response.ok && results) {
          const updatedResults = [...results];
          updatedResults[index] = {
            ...updatedResults[index],
            foundEmail: data.email || null,
            personalEmails: data.personalEmails || [],
            isVerified: undefined,
            emailQuality: undefined,
            retryCount: (record.retryCount || 0) + 1,
            lastRetry: new Date(),
          };
          setResults(updatedResults);

          if (data.email || (data.personalEmails?.length > 0)) {
            toast.success(data.email ? `Found: ${data.email}` : `Found ${data.personalEmails.length} personal email(s)`);
          } else {
            toast.error('No email found on retry');
          }
        } else {
          toast.error('Failed to retry lookup');
        }
      } catch (_error) {
        toast.error('Error during retry');
      } finally {
        setRetryingEmail(null);
      }
    },
    [results, setResults]
  );

  // Download CSV
  const downloadResults = useCallback(() => {
    if (!results?.length) return;

    const headers = [
      'firstName', 'lastName', 'companyName', 'foundEmail', 
      'personalEmails', 'isVerified', 'emailQuality', 'retryCount'
    ];

    const csvContent = results.map(record => {
      const row = {
        ...record,
        personalEmails: record.personalEmails?.join('; ') || '',
      };
      
      return headers.map(key => {
        const value = row[key as keyof typeof row];
        if (value === null || value === undefined) return '';
        return String(value).includes(',') ? `"${value}"` : value;
      }).join(',');
    }).join('\n');

    const blob = new Blob([`${headers.join(',')}\n${csvContent}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email-results-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Downloaded results');
  }, [results]);

  // Filter results
  const filteredResults = useCallback(() => {
    if (!results) return [];

    return results.filter((record) => {
      // Apply status filter
      if (filterStatus === 'verified' && record.isVerified !== true) return false;
      if (filterStatus === 'unverified' && record.isVerified !== false) return false;
      if (filterStatus === 'not-found' && record.foundEmail) return false;

      // Apply search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          record.firstName?.toLowerCase().includes(search) ||
          record.lastName?.toLowerCase().includes(search) ||
          record.companyName?.toLowerCase().includes(search) ||
          record.foundEmail?.toLowerCase().includes(search) ||
          record.personalEmails?.some((email) => email.toLowerCase().includes(search))
        );
      }

      return true;
    });
  }, [results, filterStatus, searchTerm]);

  if (!results) return null;

  const foundCount = results.filter(r => r.foundEmail).length;
  const successRate = Math.round((foundCount / results.length) * 100);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-blue-50/50 dark:from-gray-950 dark:to-blue-950/30 backdrop-blur-md">
        <CardHeader className="pb-2 flex flex-row items-center justify-between bg-gradient-to-r from-gray-50 to-blue-50/30 dark:from-gray-900/80 dark:to-blue-900/20">
          <div>
            <CardTitle className="text-xl font-bold">Email Results</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              {foundCount} of {results.length} found ({successRate}%)
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={verifyAllEmails}
              variant="outline"
              disabled={verifyingBatch}
              className="bg-white/80 hover:bg-white transition-all duration-300 border-blue-200/50 hover:border-blue-300 shadow-sm"
            >
              {verifyingBatch ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>Verify All</>
              )}
            </Button>
            <Button
              onClick={downloadResults}
              variant="default"
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 transition-all duration-300 shadow-sm"
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <motion.div 
            variants={itemVariants}
            className="bg-white/90 dark:bg-gray-900/80 p-4 border-b backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  size="sm"
                  variant={filterStatus === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('all')}
                  className="h-8 text-xs transition-all duration-200 hover:shadow-md"
                >
                  All
                </Button>
                <Button
                  size="sm"
                  variant={filterStatus === 'verified' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('verified')}
                  className="h-8 text-xs transition-all duration-200 hover:shadow-md"
                >
                  Verified
                </Button>
                <Button
                  size="sm"
                  variant={filterStatus === 'unverified' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('unverified')}
                  className="h-8 text-xs transition-all duration-200 hover:shadow-md"
                >
                  Unverified
                </Button>
                <Button
                  size="sm"
                  variant={filterStatus === 'not-found' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('not-found')}
                  className="h-8 text-xs transition-all duration-200 hover:shadow-md"
                >
                  Not Found
                </Button>
              </div>
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 w-full sm:w-64 text-sm"
              />
            </div>
          </motion.div>
          
          <motion.div 
            variants={itemVariants}
            className="max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-gradient-to-r from-gray-100 to-blue-50 dark:from-gray-800 dark:to-blue-900/20">
                <TableRow>
                  <TableHead className="font-bold">Name</TableHead>
                  <TableHead className="font-bold">Company</TableHead>
                  <TableHead className="font-bold">Email</TableHead>
                  <TableHead className="font-bold w-32">Status</TableHead>
                  <TableHead className="font-bold w-48">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResults().length > 0 ? (
                  filteredResults().map((record, index) => (
                    <TableRow
                      key={index}
                      className={index % 2 === 0 ? "bg-white/90 hover:bg-blue-50/50 transition-colors duration-200" : "bg-gray-50/90 hover:bg-blue-50/50 transition-colors duration-200"}
                    >
                      <TableCell className="font-medium">
                        {record.firstName} {record.lastName}
                      </TableCell>
                      <TableCell>{record.companyName}</TableCell>
                      <TableCell>
                        {record.foundEmail ? (
                          <div className="font-mono text-sm bg-gradient-to-r from-black to-gray-800 text-white px-2 py-1 rounded-md shadow-sm">
                            {record.foundEmail}
                            {record.personalEmails?.length ? (
                              <div className="text-xs text-gray-300 mt-1">
                                +{record.personalEmails.length} personal
                              </div>
                            ) : null}
                          </div>
                        ) : record.personalEmails?.length ? (
                          <div className="font-mono text-sm bg-gradient-to-r from-gray-700 to-gray-600 text-white px-2 py-1 rounded-md shadow-sm">
                            {record.personalEmails[0]}
                            {record.personalEmails.length > 1 && (
                              <div className="text-xs text-gray-300 mt-1">
                                +{record.personalEmails.length - 1} more
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs bg-gray-100 px-2 py-1 rounded-md shadow-sm">
                            Not Found
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {record.foundEmail ? (
                          <div className="flex items-center">
                            {record.isVerified === true ? (
                              <div className="flex items-center text-green-600 bg-green-50/50 px-2 py-1 rounded-md shadow-sm">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                <span className="text-xs">Verified</span>
                              </div>
                            ) : record.isVerified === false ? (
                              <div className="flex items-center text-red-600 bg-red-50/50 px-2 py-1 rounded-md shadow-sm">
                                <XCircle className="h-4 w-4 mr-1" />
                                <span className="text-xs">Unverified</span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-500">Unknown</span>
                            )}
                            {record.emailQuality && (
                              <span className="ml-2 text-xs text-gray-500">
                                {record.emailQuality === 'business' ? '🏢' : '👤'}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">–</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {record.foundEmail && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2 transition-all duration-200 hover:shadow-md bg-white hover:bg-blue-50/50"
                              onClick={() => verifyEmail(record.foundEmail!, index)}
                              disabled={verifyingEmail === index}
                            >
                              {verifyingEmail === index ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <span className="text-xs">Verify</span>
                              )}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2 transition-all duration-200 hover:shadow-md bg-white hover:bg-blue-50/50"
                            onClick={() => retryFindEmail(record, index)}
                            disabled={retryingEmail === index}
                          >
                            {retryingEmail === index ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <div className="flex items-center">
                                <RefreshCw className="h-3 w-3 mr-1" />
                                <span className="text-xs">Retry</span>
                                {record.retryCount ? (
                                  <span className="ml-1 text-xs text-gray-500">({record.retryCount})</span>
                                ) : null}
                              </div>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-16 text-gray-500">
                      {results.length > 0 ? 'No results match your filters' : 'No results found'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </motion.div>
        </CardContent>
        
        <CardFooter className="py-3 flex justify-center border-t bg-gradient-to-r from-gray-50 to-blue-50/30 dark:from-gray-900/80 dark:to-blue-900/20">
          <Link href="/email" className="inline-flex items-center text-sm text-gray-600 hover:text-black transition-colors duration-200">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Switch to Single Email Lookup
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
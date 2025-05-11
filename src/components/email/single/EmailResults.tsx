'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardFooter, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Copy, Mail, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface EmailResultsProps {
  email: string;
  personalEmails: string[];
  error: string;
  success: boolean;
}

export default function EmailResults({ email, personalEmails, error, success }: EmailResultsProps) {
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');
  const [verifyingPersonalEmails, setVerifyingPersonalEmails] = useState<{ [key: string]: boolean }>({});
  const [verifiedPersonalEmails, setVerifiedPersonalEmails] = useState<{ [key: string]: boolean }>({});
  const [personalEmailMessages, setPersonalEmailMessages] = useState<{ [key: string]: string }>({});
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  // Function to verify email (unchanged)
  const verifyEmail = async (emailToVerify: string) => {
    if (!emailToVerify) return;
    setVerifying(true);
    setVerificationMessage('');
    setVerified(false);
    try {
      const response = await fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToVerify }),
      });
      const data = await response.json();
      if (response.ok) {
        setVerified(data.valid);
        setVerificationMessage(
          data.valid
            ? `Email verified successfully! (${data.emailQuality === 'business' ? 'Business email' : 'Personal email'})`
            : data.details?.disposable
            ? 'This appears to be a disposable email address.'
            : !data.details?.mxRecords
            ? 'This email domain does not have valid mail servers.'
            : data.message || 'Email verification failed.'
        );
      } else {
        setVerified(false);
        setVerificationMessage(data.message || 'Email verification failed.');
      }
    } catch (err) {
      console.error('Email verification error:', err);
      setVerificationMessage('Error during verification.');
      setVerified(false);
    } finally {
      setVerifying(false);
    }
  };

  // Function to verify personal email (unchanged)
  const verifyPersonalEmail = async (emailToVerify: string) => {
    if (!emailToVerify) return;
    setVerifyingPersonalEmails((prev) => ({ ...prev, [emailToVerify]: true }));
    setPersonalEmailMessages((prev) => ({ ...prev, [emailToVerify]: '' }));
    setVerifiedPersonalEmails((prev) => ({ ...prev, [emailToVerify]: false }));
    try {
      const response = await fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToVerify }),
      });
      const data = await response.json();
      if (response.ok) {
        setVerifiedPersonalEmails((prev) => ({ ...prev, [emailToVerify]: data.valid }));
        setPersonalEmailMessages((prev) => ({
          ...prev,
          [emailToVerify]: data.valid
            ? `Email verified successfully! (${data.emailQuality === 'business' ? 'Business email' : 'Personal email'})`
            : data.details?.disposable
            ? 'This appears to be a disposable email address.'
            : !data.details?.mxRecords
            ? 'This email domain does not have valid mail servers.'
            : data.message || 'Email verification failed.',
        }));
      } else {
        setVerifiedPersonalEmails((prev) => ({ ...prev, [emailToVerify]: false }));
        setPersonalEmailMessages((prev) => ({
          ...prev,
          [emailToVerify]: data.message || 'Email verification failed.',
        }));
      }
    } catch (err) {
      console.error('Email verification error:', err);
      setPersonalEmailMessages((prev) => ({
        ...prev,
        [emailToVerify]: 'Error during verification.',
      }));
      setVerifiedPersonalEmails((prev) => ({ ...prev, [emailToVerify]: false }));
    } finally {
      setVerifyingPersonalEmails((prev) => ({ ...prev, [emailToVerify]: false }));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(text);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  // Enhanced animation variants
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 20,
        staggerChildren: 0.15,
        delayChildren: 0.3,
      },
    },
  };

  const resultVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 120, damping: 15 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 100, damping: 12 },
    },
  };

  const messageVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: {
      opacity: 1,
      height: 'auto',
      transition: { duration: 0.3, ease: 'easeInOut' },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full space-y-6 p-4"
    >
      <AnimatePresence>
        {error && (
          <motion.div
            key="error"
            variants={resultVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -20 }}
          >
            <Alert
              variant="destructive"
              className="border-red-300 bg-red-50/80 backdrop-blur-sm dark:bg-red-900/30 dark:border-red-800 shadow-lg rounded-xl"
            >
              <AlertCircle className="h-5 w-5 text-red-600" />
              <AlertTitle className="font-bold text-red-700 dark:text-red-400">Email Not Found</AlertTitle>
              <AlertDescription className="text-sm text-red-600 dark:text-red-300">
                <div className="mt-2">{error}</div>
                <div className="mt-4 bg-white/60 dark:bg-black/30 p-4 rounded-lg border border-red-200 dark:border-red-700">
                  <p className="font-medium mb-2">Suggestions:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Check spelling of names and company</li>
                    <li>Try using the full LinkedIn URL</li>
                    <li>Try variations of the company name</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {(email || personalEmails.length > 0) && success && (
        <motion.div variants={resultVariants}>
          <Card
            className="border-green-200 bg-gradient-to-br from-white to-green-50/50 dark:from-gray-950 dark:to-green-950/30 shadow-xl rounded-2xl overflow-hidden backdrop-blur-md"
          >
            <CardContent className="pt-8 px-6">
              <div className="flex items-center gap-3 mb-6">
                <motion.div
                  className="bg-green-100 dark:bg-green-900/40 p-2 rounded-full"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Mail className="h-6 w-6 text-green-600 dark:text-green-400" />
                </motion.div>
                <h3 className="text-xl font-bold text-green-700 dark:text-green-300">Email Found</h3>
                <Badge
                  variant="outline"
                  className="ml-auto bg-green-100/90 text-green-800 border-green-300 dark:bg-green-900/50 dark:border-green-700 dark:text-green-300"
                >
                  Success
                </Badge>
              </div>

              <div className="space-y-8">
                {email && (
                  <motion.div variants={itemVariants} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Business Email</h4>
                      {verified && (
                        <Badge
                          variant="outline"
                          className="bg-green-100 text-green-800 border-green-300 dark:bg-green-900/50 dark:border-green-700 dark:text-green-300"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" /> Verified
                        </Badge>
                      )}
                    </div>

                    <div className="p-5 bg-white/80 dark:bg-gray-950/80 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="font-mono text-lg font-medium text-gray-900 dark:text-gray-100">{email}</div>
                        <div className="flex gap-3">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-9 w-9 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                    onClick={() => copyToClipboard(email)}
                                  >
                                    <Copy className="h-4 w-4" />
                                    <span className="sr-only">Copy</span>
                                  </Button>
                                </motion.div>
                              </TooltipTrigger>
                              <TooltipContent>
                                {copiedEmail === email ? 'Copied!' : 'Copy to clipboard'}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 text-xs font-medium"
                              onClick={() => window.open(`mailto:${email}`)}
                            >
                              <Mail className="h-3 w-3 mr-1" />
                              Compose
                            </Button>
                          </motion.div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-white/90 dark:bg-gray-900/90 hover:bg-green-50 dark:hover:bg-green-900/50 transition-colors"
                          onClick={() => verifyEmail(email)}
                          disabled={verifying}
                        >
                          {verifying ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Verifying...
                            </>
                          ) : verified ? (
                            'Verify Again'
                          ) : (
                            'Verify Email'
                          )}
                        </Button>
                      </motion.div>
                    </div>

                    <AnimatePresence>
                      {verificationMessage && (
                        <motion.div
                          variants={messageVariants}
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                          className={`p-4 rounded-lg text-sm ${
                            verified
                              ? 'bg-green-50 border border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-300'
                              : 'bg-amber-50 border border-amber-200 text-amber-700 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-300'
                          }`}
                        >
                          {verified ? (
                            <CheckCircle className="h-4 w-4 inline mr-2 align-text-bottom" />
                          ) : (
                            <AlertCircle className="h-4 w-4 inline mr-2 align-text-bottom" />
                          )}
                          {verificationMessage}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {!verified && verificationMessage && (
                      <motion.div
                        variants={itemVariants}
                        className="p-4 bg-gray-50/80 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800"
                      >
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Verification Tips:</p>
                        <ul className="text-xs text-gray-600 dark:text-gray-400 list-disc pl-5 space-y-1">
                          <li>Check for typos in the domain name</li>
                          <li>Business emails are more reliable than free providers</li>
                          <li>Some email servers may block verification attempts</li>
                        </ul>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {personalEmails.length > 0 && (
                  <motion.div variants={itemVariants} className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-800">
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Personal Emails</h4>

                    <div className="space-y-6">
                      {personalEmails.map((personalEmail, index) => (
                        <motion.div key={index} variants={itemVariants} className="space-y-4">
                          <div className="p-5 bg-white/80 dark:bg-gray-950/80 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                              <div className="font-mono text-lg font-medium text-gray-900 dark:text-gray-100">
                                {personalEmail}
                              </div>
                              <div className="flex gap-3">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-9 w-9 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                          onClick={() => copyToClipboard(personalEmail)}
                                        >
                                          <Copy className="h-4 w-4" />
                                          <span className="sr-only">Copy</span>
                                        </Button>
                                      </motion.div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {copiedEmail === personalEmail ? 'Copied!' : 'Copy to clipboard'}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>

                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 text-xs font-medium"
                                    onClick={() => window.open(`mailto:${personalEmail}`)}
                                  >
                                    <Mail className="h-3 w-3 mr-1" />
                                    Compose
                                  </Button>
                                </motion.div>
                              </div>
                            </div>

                            {verifiedPersonalEmails[personalEmail] && (
                              <div className="mt-3">
                                <Badge
                                  variant="outline"
                                  className="bg-green-100 text-green-800 border-green-300 dark:bg-green-900/50 dark:border-green-700 dark:text-green-300"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" /> Verified
                                </Badge>
                              </div>
                            )}
                          </div>

                          <div className="flex justify-center">
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-white/90 dark:bg-gray-900/90 hover:bg-green-50 dark:hover:bg-green-900/50 transition-colors"
                                onClick={() => verifyPersonalEmail(personalEmail)}
                                disabled={verifyingPersonalEmails[personalEmail]}
                              >
                                {verifyingPersonalEmails[personalEmail] ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Verifying...
                                  </>
                                ) : verifiedPersonalEmails[personalEmail] ? (
                                  'Verify Again'
                                ) : (
                                  'Verify Email'
                                )}
                              </Button>
                            </motion.div>
                          </div>

                          <AnimatePresence>
                            {personalEmailMessages[personalEmail] && (
                              <motion.div
                                variants={messageVariants}
                                initial="hidden"
                                animate="visible"
                                exit="hidden"
                                className={`p-4 rounded-lg text-sm ${
                                  verifiedPersonalEmails[personalEmail]
                                    ? 'bg-green-50 border border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-300'
                                    : 'bg-amber-50 border border-amber-200 text-amber-700 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-300'
                                }`}
                              >
                                {verifiedPersonalEmails[personalEmail] ? (
                                  <CheckCircle className="h-4 w-4 inline mr-2 align-text-bottom" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 inline mr-2 align-text-bottom" />
                                )}
                                {personalEmailMessages[personalEmail]}
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {!verifiedPersonalEmails[personalEmail] && personalEmailMessages[personalEmail] && (
                            <motion.div
                              variants={itemVariants}
                              className="p-4 bg-gray-50/80 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800"
                            >
                              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Verification Tips:
                              </p>
                              <ul className="text-xs text-gray-600 dark:text-gray-400 list-disc pl-5 space-y-1">
                                <li>Check for typos in the domain name</li>
                                <li>Business emails are more reliable than free providers</li>
                                <li>Some email servers may block verification attempts</li>
                              </ul>
                            </motion.div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </CardContent>

            <CardFooter className="bg-gray-50/80 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-800 px-6 py-4">
              <div className="flex items-center justify-between w-full text-sm text-gray-600 dark:text-gray-400">
                <span>Email successfully discovered</span>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs flex items-center gap-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    onClick={() => {}}
                  >
                    Save Results <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </motion.div>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      )}

      <motion.div variants={itemVariants} className="mt-8 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          This tool respects privacy and uses only publicly available information.
        </p>
      </motion.div>
    </motion.div>
  );
}
'use client';

import { useState, Dispatch, SetStateAction, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Loader2, 
  Search, 
  User, 
  Users, 
  Briefcase, 
  Linkedin,
  CheckCircle,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EmailSearchFormProps {
  onSearchResult: Dispatch<SetStateAction<{
    email: string;
    personalEmails: string[];
    error: string;
    success: boolean;
  }>>;
}

export default function EmailSearchForm({ onSearchResult }: EmailSearchFormProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [useFirstName, setUseFirstName] = useState(true);
  const [useLastName, setUseLastName] = useState(true);
  const [useLinkedin, setUseLinkedin] = useState(true);
  const [useCompanyName, setUseCompanyName] = useState(true);
  const [formCompletion, setFormCompletion] = useState(0);
  const [activeField, setActiveField] = useState<string | null>(null);

  // Calculate form completion percentage
  useEffect(() => {
    const fieldsInUse = [
      useFirstName && firstName.trim(),
      useLastName && lastName.trim(),
      useLinkedin && linkedin.trim(),
      useCompanyName && companyName.trim()
    ].filter(Boolean).length;
    
    const totalFieldsEnabled = [
      useFirstName,
      useLastName,
      useLinkedin,
      useCompanyName
    ].filter(Boolean).length;
    
    const completion = totalFieldsEnabled > 0 
      ? Math.min(100, Math.round((fieldsInUse / totalFieldsEnabled) * 100))
      : 0;
    
    setFormCompletion(completion);
  }, [firstName, lastName, linkedin, companyName, useFirstName, useLastName, useLinkedin, useCompanyName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that at least one field is filled
    if (
      (!useFirstName || !firstName.trim()) && 
      (!useLastName || !lastName.trim()) && 
      (!useLinkedin || !linkedin.trim()) && 
      (!useCompanyName || !companyName.trim())
    ) {
      onSearchResult({
        email: '',
        personalEmails: [],
        error: 'Please provide at least one search parameter.',
        success: false,
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/find-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName,
          lastName,
          linkedin,
          companyName,
          useFirstName,
          useLastName,
          useLinkedin,
          useCompanyName,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        onSearchResult({
          email: data.email || '',
          personalEmails: data.personalEmails || [],
          error: '',
          success: true,
        });
      } else {
        onSearchResult({
          email: '',
          personalEmails: [],
          error: data.error || 'Failed to find email. Please try different search parameters.',
          success: false,
        });
      }
    } catch (error) {
      console.error('Error finding email:', error);
      onSearchResult({
        email: '',
        personalEmails: [],
        error: 'An unexpected error occurred. Please try again later.',
        success: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const iconVariants = {
    initial: { opacity: 0.5, scale: 0.9 },
    enabled: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 400, damping: 10 } },
    disabled: { opacity: 0.3, scale: 0.9, transition: { type: "spring", stiffness: 400, damping: 17 } },
    active: { 
      opacity: 1, 
      scale: 1.1, 
      color: "#000000",
      transition: { type: "spring", stiffness: 500, damping: 10 } 
    }
  };

  const inputFieldVariants = {
    initial: { opacity: 0.7 },
    enabled: { opacity: 1, y: 0 },
    disabled: { opacity: 0.5, y: 0 },
    focused: { 
      boxShadow: "0 0 0 2px rgba(0, 0, 0, 0.2)", 
      scale: 1.01,
      transition: { type: "spring", stiffness: 500, damping: 10 }
    }
  };

  const fieldContainerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.12,
        duration: 0.4,
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    })
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        type: "spring",
        stiffness: 100,
        damping: 20,
        staggerChildren: 0.1
      }
    }
  };

  const progressVariants = {
    empty: { pathLength: 0 },
    filled: { 
      pathLength: formCompletion / 100,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={cardVariants}
    >
      <Card className="w-full shadow-xl border-gray-200 bg-white dark:bg-gray-900">
        <CardHeader className="pb-6 border-b border-gray-200 dark:border-gray-800">
          <motion.div 
            className="flex justify-center mb-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              delay: 0.2,
              duration: 0.7,
              type: "spring",
              stiffness: 200,
              damping: 20
            }}
          >
            <div className="relative h-24 w-24">
              <svg width="96" height="96" viewBox="0 0 100 100" className="transform -rotate-90">
                <motion.circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#e5e5e5"
                  strokeWidth="8"
                  fill="none"
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#000000"
                  strokeWidth="8"
                  fill="none"
                  initial="empty"
                  animate="filled"
                  variants={progressVariants}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold dark:text-white">{formCompletion}%</span>
              </div>
            </div>
          </motion.div>

          <CardTitle className="text-2xl font-bold text-center text-black dark:text-white mb-1">
            Email Finder
          </CardTitle>
          <p className="text-sm text-center text-gray-600 dark:text-gray-400">
            {formCompletion < 50 ? 'Fill in details to find email addresses' : 
             formCompletion < 100 ? 'Getting closer! Add more details for better results' : 
             'Ready to search!'}
          </p>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="pt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* First Name Field */}
              <motion.div 
                className="space-y-3"
                custom={0}
                initial="hidden"
                animate="visible"
                variants={fieldContainerVariants}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={
                        activeField === 'firstName' ? "active" : 
                        useFirstName ? "enabled" : "disabled"
                      }
                      variants={iconVariants}
                      className="p-2 rounded-full bg-gray-100 dark:bg-gray-800"
                    >
                      <User size={20} className="text-black dark:text-white" />
                    </motion.div>
                    <Label htmlFor="firstName" className="font-semibold text-black dark:text-white">
                      First Name
                    </Label>
                  </div>
                  <motion.div 
                    className="flex items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Label htmlFor="useFirstName" className="text-xs text-gray-500 dark:text-gray-400">
                      {useFirstName ? 'Enabled' : 'Disabled'}
                    </Label>
                    <Switch
                      id="useFirstName"
                      checked={useFirstName}
                      onCheckedChange={setUseFirstName}
                      className="data-[state=checked]:bg-black data-[state=unchecked]:bg-gray-300"
                    />
                  </motion.div>
                </div>
                
                <AnimatePresence mode="wait">
                  <motion.div
                    key={useFirstName ? 'enabled' : 'disabled'}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ 
                      opacity: useFirstName ? 1 : 0.5, 
                      y: 0,
                    }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div
                      animate={activeField === 'firstName' ? 'focused' : 'enabled'}
                      variants={inputFieldVariants}
                      className="relative"
                    >
                      <Input
                        type="text"
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        onFocus={() => setActiveField('firstName')}
                        onBlur={() => setActiveField(null)}
                        className="w-full transition-all duration-200 border-2 bg-gray-50 dark:bg-gray-800 dark:text-white py-6 px-4 rounded-lg border-gray-200 dark:border-gray-700 focus:border-black dark:focus:border-white"
                        placeholder="John"
                        disabled={!useFirstName}
                      />
                      {firstName && useFirstName && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                          <CheckCircle size={18} className="text-black dark:text-white" />
                        </motion.div>
                      )}
                    </motion.div>
                  </motion.div>
                </AnimatePresence>
              </motion.div>
              
              {/* Last Name Field */}
              <motion.div 
                className="space-y-3"
                custom={1}
                initial="hidden"
                animate="visible"
                variants={fieldContainerVariants}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={
                        activeField === 'lastName' ? "active" : 
                        useLastName ? "enabled" : "disabled"
                      }
                      variants={iconVariants}
                      className="p-2 rounded-full bg-gray-100 dark:bg-gray-800"
                    >
                      <Users size={20} className="text-black dark:text-white" />
                    </motion.div>
                    <Label htmlFor="lastName" className="font-semibold text-black dark:text-white">
                      Last Name
                    </Label>
                  </div>
                  <motion.div 
                    className="flex items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Label htmlFor="useLastName" className="text-xs text-gray-500 dark:text-gray-400">
                      {useLastName ? 'Enabled' : 'Disabled'}
                    </Label>
                    <Switch
                      id="useLastName"
                      checked={useLastName}
                      onCheckedChange={setUseLastName}
                      className="data-[state=checked]:bg-black data-[state=unchecked]:bg-gray-300"
                    />
                  </motion.div>
                </div>
                
                <AnimatePresence mode="wait">
                  <motion.div
                    key={useLastName ? 'enabled' : 'disabled'}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ 
                      opacity: useLastName ? 1 : 0.5, 
                      y: 0,
                    }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div
                      animate={activeField === 'lastName' ? 'focused' : 'enabled'}
                      variants={inputFieldVariants}
                      className="relative"
                    >
                      <Input
                        type="text"
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        onFocus={() => setActiveField('lastName')}
                        onBlur={() => setActiveField(null)}
                        className="w-full transition-all duration-200 border-2 bg-gray-50 dark:bg-gray-800 dark:text-white py-6 px-4 rounded-lg border-gray-200 dark:border-gray-700 focus:border-black dark:focus:border-white"
                        placeholder="Doe"
                        disabled={!useLastName}
                      />
                      {lastName && useLastName && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                          <CheckCircle size={18} className="text-black dark:text-white" />
                        </motion.div>
                      )}
                    </motion.div>
                  </motion.div>
                </AnimatePresence>
              </motion.div>
              
              {/* LinkedIn Field */}
              <motion.div 
                className="space-y-3"
                custom={2}
                initial="hidden"
                animate="visible"
                variants={fieldContainerVariants}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={
                        activeField === 'linkedin' ? "active" : 
                        useLinkedin ? "enabled" : "disabled"
                      }
                      variants={iconVariants}
                      className="p-2 rounded-full bg-gray-100 dark:bg-gray-800"
                    >
                      <Linkedin size={20} className="text-black dark:text-white" />
                    </motion.div>
                    <Label htmlFor="linkedin" className="font-semibold text-black dark:text-white">
                      LinkedIn URL
                    </Label>
                  </div>
                  <motion.div 
                    className="flex items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Label htmlFor="useLinkedin" className="text-xs text-gray-500 dark:text-gray-400">
                      {useLinkedin ? 'Enabled' : 'Disabled'}
                    </Label>
                    <Switch
                      id="useLinkedin"
                      checked={useLinkedin}
                      onCheckedChange={setUseLinkedin}
                      className="data-[state=checked]:bg-black data-[state=unchecked]:bg-gray-300"
                    />
                  </motion.div>
                </div>
                
                <AnimatePresence mode="wait">
                  <motion.div
                    key={useLinkedin ? 'enabled' : 'disabled'}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ 
                      opacity: useLinkedin ? 1 : 0.5, 
                      y: 0,
                    }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div
                      animate={activeField === 'linkedin' ? 'focused' : 'enabled'}
                      variants={inputFieldVariants}
                      className="relative"
                    >
                      <Input
                        type="text"
                        id="linkedin"
                        value={linkedin}
                        onChange={(e) => setLinkedin(e.target.value)}
                        onFocus={() => setActiveField('linkedin')}
                        onBlur={() => setActiveField(null)}
                        className="w-full transition-all duration-200 border-2 bg-gray-50 dark:bg-gray-800 dark:text-white py-6 px-4 rounded-lg border-gray-200 dark:border-gray-700 focus:border-black dark:focus:border-white"
                        placeholder="linkedin.com/in/johndoe"
                        disabled={!useLinkedin}
                      />
                      {linkedin && useLinkedin && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                          <CheckCircle size={18} className="text-black dark:text-white" />
                        </motion.div>
                      )}
                    </motion.div>
                  </motion.div>
                </AnimatePresence>
              </motion.div>
              
              {/* Company Name Field */}
              <motion.div 
                className="space-y-3"
                custom={3}
                initial="hidden"
                animate="visible"
                variants={fieldContainerVariants}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={
                        activeField === 'companyName' ? "active" : 
                        useCompanyName ? "enabled" : "disabled"
                      }
                      variants={iconVariants}
                      className="p-2 rounded-full bg-gray-100 dark:bg-gray-800"
                    >
                      <Briefcase size={20} className="text-black dark:text-white" />
                    </motion.div>
                    <Label htmlFor="companyName" className="font-semibold text-black dark:text-white">
                      Company Name
                    </Label>
                  </div>
                  <motion.div 
                    className="flex items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Label htmlFor="useCompanyName" className="text-xs text-gray-500 dark:text-gray-400">
                      {useCompanyName ? 'Enabled' : 'Disabled'}
                    </Label>
                    <Switch
                      id="useCompanyName"
                      checked={useCompanyName}
                      onCheckedChange={setUseCompanyName}
                      className="data-[state=checked]:bg-black data-[state=unchecked]:bg-gray-300"
                    />
                  </motion.div>
                </div>
                
                <AnimatePresence mode="wait">
                  <motion.div
                    key={useCompanyName ? 'enabled' : 'disabled'}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ 
                      opacity: useCompanyName ? 1 : 0.5, 
                      y: 0,
                    }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div
                      animate={activeField === 'companyName' ? 'focused' : 'enabled'}
                      variants={inputFieldVariants}
                      className="relative"
                    >
                      <Input
                        type="text"
                        id="companyName"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        onFocus={() => setActiveField('companyName')}
                        onBlur={() => setActiveField(null)}
                        className="w-full transition-all duration-200 border-2 bg-gray-50 dark:bg-gray-800 dark:text-white py-6 px-4 rounded-lg border-gray-200 dark:border-gray-700 focus:border-black dark:focus:border-white"
                        placeholder="Acme Inc"
                        disabled={!useCompanyName}
                      />
                      {companyName && useCompanyName && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                          <CheckCircle size={18} className="text-black dark:text-white" />
                        </motion.div>
                      )}
                    </motion.div>
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </div>
          </CardContent>
          
          <CardFooter className="pt-4 pb-8 flex justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="w-full md:w-auto"
            >
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="w-full"
              >
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full md:w-72 h-14 font-bold text-base rounded-xl shadow-lg bg-black hover:bg-gray-800 text-white transition-all duration-300"
                >
                  {loading ? (
                    <motion.div 
                      className="flex items-center justify-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                      <span>Searching...</span>
                    </motion.div>
                  ) : (
                    <motion.div 
                      className="flex items-center justify-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Search className="mr-3 h-5 w-5" />
                      <span>Find Email</span>
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </motion.div>
                  )}
                </Button>
              </motion.div>
            </motion.div>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
}
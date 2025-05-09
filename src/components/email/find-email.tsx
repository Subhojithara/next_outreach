'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Mail, User, Briefcase, Linkedin, CheckSquare } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';

export default function HomePage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [, setSuccess] = useState(false);

  // Define form schema with Zod
    const formSchema = z.object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      linkedin: z.string().optional(),
      companyName: z.string().optional(),
      // Search criteria options
      useFirstName: z.boolean(),
      useLastName: z.boolean(),
      useLinkedin: z.boolean(),
      useCompanyName: z.boolean(),
    }).refine(data => {
    // Ensure at least one search criteria is selected and has a value
    return (
      (data.useFirstName && data.firstName) ||
      (data.useLastName && data.lastName) ||
      (data.useLinkedin && data.linkedin) ||
      (data.useCompanyName && data.companyName)
    );
  }, {
    message: "Please select at least one search criteria and provide its value",
    path: ["useFirstName"], // This will show the error on the first checkbox
  });

  // Define types
  type FormValues = z.infer<typeof formSchema>;

  interface ApiResponse {
    email?: string;
    personalEmails?: string[];
    error?: string;
  }

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      linkedin: '',
      companyName: '',
      useFirstName: true,
      useLastName: true,
      useLinkedin: true,
      useCompanyName: true,
    },
  });

  const [personalEmails, setPersonalEmails] = useState<string[]>([]);

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    setError('');
    setEmail('');
    setPersonalEmails([]);
    setSuccess(false);

    // Filter out fields that are not selected by the user
    const searchParams = {
      ...(values.useFirstName && values.firstName ? { firstName: values.firstName } : {}),
      ...(values.useLastName && values.lastName ? { lastName: values.lastName } : {}),
      ...(values.useLinkedin && values.linkedin ? { linkedin: values.linkedin } : {}),
      ...(values.useCompanyName && values.companyName ? { companyName: values.companyName } : {}),
      // Include the search criteria flags
      useFirstName: values.useFirstName,
      useLastName: values.useLastName,
      useLinkedin: values.useLinkedin,
      useCompanyName: values.useCompanyName
    };

    try {
      const response = await fetch('/api/find-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchParams),
      });
      const data: ApiResponse = await response.json();

      if (!response.ok) {
        setError(data.error || 'An error occurred while fetching the email.');
      } else if (data.error) {
        if (data.error === 'No matching email found.') {
          setError('No matching email found. Please check your inputs and try again with different variations of the company name or LinkedIn URL.');
        } else {
          setError(data.error);
        }
      } else if (data.email || (data.personalEmails && data.personalEmails.length > 0)) {
        if (data.email) {
          setEmail(data.email);
        }
        if (data.personalEmails && data.personalEmails.length > 0) {
          setPersonalEmails(data.personalEmails);
        }
        setSuccess(true);
        
        // Save the search result to history
        try {
          await fetch('/api/single-result', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...values,
              email: data.email,
              personalEmails: data.personalEmails
            }),
          });
        } catch (saveErr) {
          console.error("Error saving search history:", saveErr);
          // Continue even if saving fails
        }
      } else {
        setError('No email found for the provided details.');
      }
    } catch (err) {
      setError('Error connecting to the server. Please try again later.');
      console.error("API fetch error:", err);
    }
    setLoading(false);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        duration: 0.5
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
  };

  const resultVariants = {
    hidden: { scale: 0.95, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { duration: 0.5 } }
  };

  return (
    <div className="">
      <motion.div
        className="w-full max-w-2xl mx-auto"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <Card className="border-border/40 shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold">Find Email Address</CardTitle>
            <CardDescription>Enter professional details to discover the correct business email</CardDescription>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <motion.div variants={itemVariants} className="mb-4">
                  <div className="text-sm font-medium mb-2 flex items-center gap-2">
                    <CheckSquare className="h-4 w-4" />
                    <span>Search Criteria Options</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 p-3 border rounded-md bg-muted/20">
                    <FormField
                      control={form.control}
                      name="useFirstName"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Use First Name</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="useLastName"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Use Last Name</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="useLinkedin"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Use LinkedIn</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="useCompanyName"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Use Company Name</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormMessage className="mt-2" />
                </motion.div>

                <div className="grid grid-cols-2 gap-4">
                  <motion.div variants={itemVariants}>
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>First Name</span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="John" 
                              {...field} 
                              className="focus-visible:ring-primary/20" 
                              disabled={!form.watch('useFirstName')}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>Last Name</span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Doe" 
                              {...field} 
                              className="focus-visible:ring-primary/20" 
                              disabled={!form.watch('useLastName')}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                </div>

                <motion.div variants={itemVariants}>
                  <FormField
                    control={form.control}
                    name="linkedin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Linkedin className="h-4 w-4" />
                          <span>LinkedIn URL</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://linkedin.com/in/johndoe" 
                            {...field} 
                            className="focus-visible:ring-primary/20" 
                            disabled={!form.watch('useLinkedin')}
                          />
                        </FormControl>
                        <div className="text-xs text-muted-foreground mt-1">
                          Enter the full LinkedIn profile URL or just the username (e.g., johndoe)
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          <span>Company Name</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Acme Inc" 
                            {...field} 
                            className="focus-visible:ring-primary/20" 
                            disabled={!form.watch('useCompanyName')}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>

                <motion.div variants={itemVariants} className="pt-2">
                  <Button
                    type="submit"
                    className="w-full font-medium transition-all"
                    disabled={loading}
                    size="lg"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Searching...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Mail className="h-4 w-4" />
                        Find Email
                      </span>
                    )}
                  </Button>
                </motion.div>
              </form>
            </Form>
          </CardContent>

          {error && (
            <CardFooter>
              <motion.div
                className="w-full"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Alert variant="destructive">
                  <AlertTitle>Email Not Found</AlertTitle>
                  <AlertDescription>
                    <div className="whitespace-pre-line">{error}</div>
                    <div className="mt-2 text-sm">
                      <p>Suggestions:</p>
                      <ul className="list-disc pl-5 mt-1">
                        <li>Check spelling of names and company</li>
                        <li>Try using the full LinkedIn URL</li>
                        <li>Try variations of the company name (e.g., &quot;Acme&quot; instead of &quot;Acme Inc&quot;)</li>
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              </motion.div>
            </CardFooter>
          )}

          {(email || personalEmails.length > 0) && (
            <CardFooter>
              <motion.div
                className="w-full"
                variants={resultVariants}
                initial="hidden"
                animate="visible"
              >
                <Alert variant="default" className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-900">
                  <Mail className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertTitle className="text-green-600 dark:text-green-400">Email Found</AlertTitle>
                  <AlertDescription>
                    {email && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Business Email:</h4>
                        <p className="p-3 bg-background border rounded-md text-center font-mono text-lg">{email}</p>
                      </div>
                    )}
                    
                    {personalEmails.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Personal Emails:</h4>
                        {personalEmails.map((personalEmail, index) => (
                          <p key={index} className="p-3 mb-2 bg-background border rounded-md text-center font-mono text-lg">{personalEmail}</p>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-sm text-muted-foreground mt-2">
                      Email successfully discovered. You can now use this for your outreach.
                    </p>
                  </AlertDescription>
                </Alert>
              </motion.div>
            </CardFooter>
          )}
        </Card>
        
        <motion.div 
          variants={itemVariants}
          className="mt-6 text-center text-sm text-muted-foreground"
        >
          <p>This tool respects privacy and uses only publicly available information.</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
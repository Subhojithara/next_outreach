'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileUp, Loader2, CheckCircle, X, Upload, Download, Settings, Info, FileType2 } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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

interface BulkResultPayload {
  fileName: string;
  recordCount: number;
  successCount: number;
  results: BulkResultRecord[];
}

interface BulkUploadFormProps {
  onResults: (results: BulkResultRecord[]) => void;
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

const fileDropVariants = {
  idle: { 
    scale: 1,
    borderColor: "var(--border)",
    backgroundColor: "transparent",
  },
  hover: { 
    scale: 1.01, 
    borderColor: "var(--primary)",
    backgroundColor: "var(--accent)",
    transition: { duration: 0.2 }
  },
  drag: { 
    scale: 1.02, 
    borderColor: "var(--primary)",
    backgroundColor: "var(--accent)",
    transition: { duration: 0.1 }
  }
};

// Sample template data
const templateData = `firstName,lastName,linkedin,companyName
John,Doe,linkedin.com/in/johndoe,Acme Inc
Jane,Smith,linkedin.com/in/janesmith,Globex Corp`;

export default function BulkUploadForm({ onResults }: BulkUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [uploadMethod, setUploadMethod] = useState<string>('standard');
  const [autoProcess, setAutoProcess] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [filePreview, setFilePreview] = useState<string[][]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<number>(0);
  const bytesLoadedRef = useRef<number>(0);

  // Handle file selection
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setUploadSuccess(false);
      
      // Generate preview if it's a CSV
      if (selectedFile.name.endsWith('.csv')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            const text = event.target.result as string;
            const rows = text.split('\n').slice(0, 5); // Get first 5 rows
            const preview = rows.map(row => row.split(','));
            setFilePreview(preview);
          }
        };
        reader.readAsText(selectedFile);
      }
      
      // Auto process if setting is enabled
      if (autoProcess) {
        setTimeout(() => {
          document.getElementById('submit-button')?.click();
        }, 500);
      }
    }
  }, [autoProcess]);

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  // Handle drop event
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const fileType = droppedFile.name.split('.').pop()?.toLowerCase();
      
      if (['csv', 'xlsx', 'xls'].includes(fileType || '')) {
        setFile(droppedFile);
        setUploadSuccess(false);
        
        // Generate preview if it's a CSV
        if (fileType === 'csv') {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              const text = event.target.result as string;
              const rows = text.split('\n').slice(0, 5); // Get first 5 rows
              const preview = rows.map(row => row.split(','));
              setFilePreview(preview);
            }
          };
          reader.readAsText(droppedFile);
        }
        
        // Auto process if setting is enabled
        if (autoProcess) {
          setTimeout(() => {
            document.getElementById('submit-button')?.click();
          }, 500);
        }
      } else {
        toast.error('Please upload a CSV or Excel file');
      }
    }
  }, [autoProcess]);

  // Handle button click to trigger file input
  const onButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Remove selected file
  const removeFile = useCallback(() => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setUploadProgress(0);
    setUploadSuccess(false);
    setUploadSpeed('');
    setTimeRemaining('');
    setFilePreview([]);
  }, []);

  // Download template function
  const downloadTemplate = () => {
    const element = document.createElement('a');
    const file = new Blob([templateData], {type: 'text/csv'});
    element.href = URL.createObjectURL(file);
    element.download = 'email_finder_template.csv';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Template downloaded');
  };

  // Update upload statistics during file upload
  useEffect(() => {
    if (isLoading && uploadProgress > 0 && uploadProgress < 100) {
      const currentTime = Date.now();
      const elapsedTime = (currentTime - startTimeRef.current) / 1000; // in seconds
      
      if (elapsedTime > 0) {
        // Calculate upload speed (simulated as this is just for UI)
        const loadedSize = file ? (file.size * (uploadProgress / 100)) : 0;
        const bytesPerSecond = loadedSize / elapsedTime;
        bytesLoadedRef.current = loadedSize;
        
        if (bytesPerSecond < 1024) {
          setUploadSpeed(`${bytesPerSecond.toFixed(1)} B/s`);
        } else if (bytesPerSecond < 1048576) {
          setUploadSpeed(`${(bytesPerSecond / 1024).toFixed(1)} KB/s`);
        } else {
          setUploadSpeed(`${(bytesPerSecond / 1048576).toFixed(1)} MB/s`);
        }
        
        // Calculate estimated time remaining
        if (file) {
          const remainingBytes = file.size - loadedSize;
          const estimatedSeconds = remainingBytes / bytesPerSecond;
          
          if (estimatedSeconds < 60) {
            setTimeRemaining(`${Math.ceil(estimatedSeconds)} seconds`);
          } else {
            setTimeRemaining(`${Math.ceil(estimatedSeconds / 60)} minutes`);
          }
        }
      }
    }
  }, [uploadProgress, isLoading, file]);

  // Submit handler
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!file) {
        toast.error('Please select a file.');
        return;
      }

      setIsLoading(true);
      setUploadProgress(0);
      startTimeRef.current = Date.now();
      bytesLoadedRef.current = 0;
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('method', uploadMethod);

      try {
        // Simulate progress for better UX
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            // Different progress speeds based on method
            const increment = uploadMethod === 'quick' ? Math.random() * 25 : 
                              uploadMethod === 'thorough' ? Math.random() * 8 : 
                              Math.random() * 15;
                              
            const newProgress = prev + increment;
            return newProgress >= 90 ? 90 : newProgress;
          });
        }, 300);

        const response = await fetch('/api/bulk-find-email', {
          method: 'POST',
          body: formData,
        });

        clearInterval(progressInterval);
        setUploadProgress(100);
        
        const data = await response.json();

        if (!response.ok) {
          const errorMessage = data.error || `Error: ${response.statusText}`;
          toast.error(errorMessage);
        } else {
          setUploadSuccess(true);
          onResults(data.results || []);
          toast.success(`Processed ${data.results?.length || 0} records successfully`, {
            description: `Found ${data.results?.filter((r: BulkResultRecord) => r.foundEmail).length || 0} valid emails`,
            icon: <CheckCircle className="h-5 w-5 text-green-500" />,
            duration: 5000,
          });

          // Save the bulk search result to history
          try {
            await fetch('/api/bulk-result', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fileName: file.name,
                recordCount: data.results?.length || 0,
                successCount: data.results?.filter((r: BulkResultRecord) => r.foundEmail).length || 0,
                results: data.results as BulkResultRecord[],
              } as BulkResultPayload),
            });
          } catch (saveErr) {
            console.error('Error saving bulk search history:', saveErr);
          }
          
          // Reset after 2 seconds of showing success
          setTimeout(() => {
            removeFile();
          }, 2000);
        }
      } catch (error) {
        console.error('Error processing file:', error);
        toast.error('Failed to process file. Please try again.');
      } finally {
        setIsLoading(false);
        setUploadSpeed('');
        setTimeRemaining('');
      }
    },
    [file, onResults, removeFile, uploadMethod]
  );

  return (
    <>
      <Toaster position="top-center" richColors closeButton />
      <motion.div 
        initial="hidden" 
        animate="visible" 
        variants={containerVariants}
        className="w-full"
      >
        <motion.div variants={itemVariants}>
          <Card className="border-gray-300 shadow-2xl overflow-hidden rounded-2xl bg-gradient-to-br from-white to-gray-200 dark:from-gray-800 dark:to-black">
            <CardHeader className="pb-4 border-b border-gray-300 dark:border-gray-700 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Bulk Email Finder
                </CardTitle>
                <CardDescription className="text-gray-700 dark:text-gray-400 mt-1">
                  Upload your data file to discover professional emails
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={downloadTemplate}
                        className="rounded-full h-9 w-9 transition-all hover:shadow-md"
                      >
                        <Download className="h-4 w-4 text-gray-900 dark:text-gray-100" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Download Template</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                  <SheetTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="rounded-full h-9 w-9 transition-all hover:shadow-md"
                    >
                      <Settings className="h-4 w-4 text-gray-900 dark:text-gray-100" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Upload Settings</SheetTitle>
                      <SheetDescription>
                        Configure how your file will be processed
                      </SheetDescription>
                    </SheetHeader>
                    <div className="py-6 space-y-6">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium leading-none">Processing Method</h4>
                        <Select value={uploadMethod} onValueChange={setUploadMethod}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select processing method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="quick">
                              <div className="flex items-center gap-2">
                                <span>Quick</span>
                                <Badge variant="outline" className="ml-2 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600">Fast</Badge>
                              </div>
                            </SelectItem>
                            <SelectItem value="standard">
                              <div className="flex items-center gap-2">
                                <span>Standard</span>
                                <Badge variant="outline" className="ml-2 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600">Balanced</Badge>
                              </div>
                            </SelectItem>
                            <SelectItem value="thorough">
                              <div className="flex items-center gap-2">
                                <span>Thorough</span>
                                <Badge variant="outline" className="ml-2 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600">Accurate</Badge>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {uploadMethod === 'quick' && "Faster processing but may miss some emails"}
                          {uploadMethod === 'standard' && "Balanced approach for speed and accuracy"}
                          {uploadMethod === 'thorough' && "Most thorough search but takes longer to process"}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="auto-process">Auto Process</Label>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Automatically process file after selection
                          </p>
                        </div>
                        <Switch
                          id="auto-process"
                          checked={autoProcess}
                          onCheckedChange={setAutoProcess}
                        />
                      </div>
                    </div>
                    <SheetFooter>
                      <Button onClick={() => setIsSettingsOpen(false)}>
                        Apply Settings
                      </Button>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
              </div>
            </CardHeader>
            <CardContent className="pt-6 pb-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <motion.div 
                  variants={fileDropVariants}
                  initial="idle"
                  animate={dragActive ? "drag" : file ? "hover" : "idle"}
                  className="relative border-2 border-dashed rounded-xl p-8 text-center transition-all backdrop-blur-sm bg-gray-100 dark:bg-gray-800"
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    id="file-upload"
                    type="file"
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  
                  <AnimatePresence mode="wait">
                    {!file ? (
                      <motion.div
                        key="upload-prompt"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center gap-3"
                      >
                        <motion.div 
                          className="bg-gray-300 p-5 rounded-full shadow-xl"
                          whileHover={{ scale: 1.05, rotate: 15 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Upload className="h-8 w-8 text-gray-900 dark:text-gray-100" />
                        </motion.div>
                        
                        <motion.div className="space-y-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Drag & drop your file here
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                            Upload CSV or Excel file with firstName, lastName, linkedin, and companyName columns
                          </p>
                          
                          <div className="flex flex-wrap gap-2 justify-center mt-4">
                            <Button 
                              type="button"
                              onClick={onButtonClick}
                              variant="outline" 
                              className="border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100 hover:bg-gray-900 hover:text-white dark:hover:bg-gray-100 dark:hover:text-black transition-all duration-300"
                            >
                              <FileUp className="mr-2 h-4 w-4" />
                              Browse Files
                            </Button>
                            
                            <Button 
                              type="button"
                              variant="ghost" 
                              onClick={downloadTemplate}
                              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-300"
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Get Template
                            </Button>
                          </div>
                        </motion.div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="file-selected"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center gap-4"
                      >
                        <div className="flex items-center justify-between w-full max-w-md p-4 bg-gray-200 dark:bg-gray-700 rounded-lg shadow-sm border border-gray-300 dark:border-gray-600">
                          <div className="flex items-center gap-3">
                            <div className="bg-gray-300 p-2 rounded-lg shadow-md">
                              <FileType2 className="h-5 w-5 text-gray-900 dark:text-gray-100" />
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[180px]">
                                {file.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {(file.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            {filePreview.length > 0 && (
                              <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                                <DialogTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                                  >
                                    <Info className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>File Preview</DialogTitle>
                                    <DialogDescription>
                                      First 5 rows of your data file
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="overflow-x-auto">
                                    <table className="w-full border-collapse text-sm">
                                      <thead>
                                        <tr className="bg-gray-300 dark:bg-gray-700">
                                          {filePreview[0]?.map((header, idx) => (
                                            <th key={idx} className="border border-gray-400 dark:border-gray-600 px-4 py-2 text-left">
                                              {header}
                                            </th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {filePreview.slice(1).map((row, rowIdx) => (
                                          <tr key={rowIdx} className="even:bg-gray-200 dark:even:bg-gray-800">
                                            {row.map((cell, cellIdx) => (
                                              <td key={cellIdx} className="border border-gray-400 dark:border-gray-600 px-4 py-2">
                                                {cell}
                                              </td>
                                            ))}
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                  <DialogFooter>
                                    <Button onClick={() => setIsPreviewOpen(false)}>Close</Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            )}
                            
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={removeFile}
                              className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {uploadSuccess && (
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-gray-900 dark:text-gray-100 flex items-center gap-2 bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-full"
                          >
                            <CheckCircle className="h-5 w-5" />
                            <span className="text-sm font-medium">File processed successfully!</span>
                          </motion.div>
                        )}
                        
                        {uploadProgress > 0 && !uploadSuccess && (
                          <div className="w-full max-w-md">
                            <div className="h-2 w-full bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-gray-900 dark:bg-gray-100"
                                initial={{ width: "0%" }}
                                animate={{ width: `${uploadProgress}%` }}
                                transition={{ type: "tween" }}
                              />
                            </div>
                            <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
                              <p>{Math.round(uploadProgress)}% complete</p>
                              <div className="flex gap-4">
                                {uploadSpeed && <p>{uploadSpeed}</p>}
                                {timeRemaining && <p>Est. {timeRemaining} left</p>}
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                <motion.div
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <div className="flex flex-col gap-2">
                    <Button
                      id="submit-button"
                      type="submit"
                      disabled={isLoading || !file}
                      className="w-full py-6 bg-gray-900 dark:bg-gray-100 text-white dark:text-black hover:opacity-90 transition-all duration-300 font-semibold text-lg rounded-xl shadow-lg disabled:opacity-50"
                    >
                      <AnimatePresence mode="wait">
                        {isLoading ? (
                          <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center justify-center gap-3 w-full"
                          >
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>
                              {uploadMethod === 'quick' ? 'Quickly Processing...' : 
                              uploadMethod === 'thorough' ? 'Thoroughly Processing...' : 
                              'Processing...'}
                            </span>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="find"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center justify-center gap-2"
                          >
                            <span>Find Emails</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Button>
                    
                    {file && (
                      <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                        Using {uploadMethod === 'quick' ? 'quick' : uploadMethod === 'thorough' ? 'thorough' : 'standard'} processing method
                      </p>
                    )}
                  </div>
                </motion.div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </>
  );
}
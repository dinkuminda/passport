import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Globe, 
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { format } from 'date-fns';

import { Button } from './ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Calendar } from './ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

const formSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  middle_name: z.string().optional(),
  date_of_birth: z.date({
    message: "Date of birth is required",
  }),
  gender: z.enum(['male', 'female', 'other']),
  place_of_birth: z.string().min(2, 'Place of birth is required'),
  nationality: z.string().min(2, 'Nationality is required'),
  occupation: z.string().min(2, 'Occupation is required'),
  email: z.string().email('Invalid email address'),
  phone_number: z.string().min(10, 'Phone number must be at least 10 digits'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  passport_type: z.enum(['standard', 'official', 'diplomatic']),
  validity_period: z.enum(['5_years', '10_years']),
  // New fields for Document Upload and Appointment
  birth_certificate_url: z.string().optional(),
  id_card_url: z.string().optional(),
  appointment_date: z.date().optional(),
  appointment_location: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const steps = [
  { id: 'personal', title: 'Personal Details', icon: User },
  { id: 'documents', title: 'Document Upload', icon: FileText },
  { id: 'appointment', title: 'Appointment', icon: CalendarIcon },
  { id: 'review', title: 'Review & Pay', icon: ShieldCheck },
];

export default function PassportForm({ onStepChange }: { onStepChange?: (step: number) => void }) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);

  useEffect(() => {
    if (onStepChange) {
      onStepChange(currentStep);
    }
  }, [currentStep, onStepChange]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      middle_name: '',
      gender: 'male',
      place_of_birth: '',
      nationality: '',
      occupation: '',
      email: '',
      phone_number: '',
      address: '',
      passport_type: 'standard',
      validity_period: '5_years',
    },
  });

  const saveDraft = async (data: Partial<FormValues>) => {
    if (!user) return;

    try {
      const payload = {
        ...data,
        user_id: user.id,
        status: 'pending',
      };

      if (data.date_of_birth) {
        (payload as any).date_of_birth = data.date_of_birth.toISOString();
      }

      const { data: result, error } = await supabase
        .from('passport_applications')
        .upsert({
          ...(applicationId ? { id: applicationId } : {}),
          ...payload,
        })
        .select()
        .single();

      if (error) throw error;
      if (result) setApplicationId(result.id);
      
      toast.success('Progress saved as draft');
    } catch (error: any) {
      console.error('Draft save error:', error);
      // Don't show error toast for background saves unless it's a major issue
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (!user) {
      toast.error('You must be logged in to submit an application');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('passport_applications').upsert([
        {
          ...(applicationId ? { id: applicationId } : {}),
          ...data,
          user_id: user.id,
          date_of_birth: data.date_of_birth.toISOString(),
          status: 'pending',
        },
      ]);

      if (error) throw error;

      toast.success('Application submitted successfully!');
      setIsSuccess(true);
    } catch (error: any) {
      console.error('Submission error:', error);
      toast.error(error.message || 'Failed to submit application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = async () => {
    const fields = getFieldsForStep(currentStep);
    const isValid = await form.trigger(fields as any);
    if (isValid) {
      // Save draft when moving forward
      const currentValues = form.getValues();
      saveDraft(currentValues);
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const getFieldsForStep = (step: number) => {
    switch (step) {
      case 0:
        return ['first_name', 'last_name', 'date_of_birth', 'gender', 'place_of_birth', 'nationality', 'email', 'phone_number', 'address', 'occupation'];
      case 1:
        return ['birth_certificate_url', 'id_card_url'];
      case 2:
        return ['appointment_date', 'appointment_location', 'passport_type', 'validity_period'];
      default:
        return [];
    }
  };

  if (isSuccess) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-12 text-center"
      >
        <div className="mb-6 rounded-full bg-green-100 p-4 text-green-600">
          <CheckCircle2 size={64} />
        </div>
        <h2 className="mb-2 text-3xl font-bold text-gray-900">Application Received!</h2>
        <p className="mb-8 text-gray-600 max-w-md">
          Your passport registration application has been successfully submitted. 
          You will receive a confirmation email shortly with your application ID.
        </p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Submit Another Application
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="mx-auto w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="rounded-xl border border-border bg-surface p-10 shadow-sm"
            >
              {currentStep === 0 && (
                <div className="grid grid-cols-1 gap-x-5 gap-y-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="form-label-minimal">First Name</FormLabel>
                        <FormControl>
                          <Input className="input-minimal" placeholder="e.g. Jonathan" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="form-label-minimal">Last Name</FormLabel>
                        <FormControl>
                          <Input className="input-minimal" placeholder="e.g. Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="form-label-minimal">Email Address</FormLabel>
                        <FormControl>
                          <Input className="input-minimal" type="email" placeholder="john@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="form-label-minimal">Phone Number</FormLabel>
                        <FormControl>
                          <Input className="input-minimal" placeholder="+1 (555) 000-0000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="date_of_birth"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="form-label-minimal">Date of Birth</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "input-minimal w-full text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="form-label-minimal">Gender</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="input-minimal">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="place_of_birth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="form-label-minimal">Place of Birth</FormLabel>
                        <FormControl>
                          <Input className="input-minimal" placeholder="City, Country" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nationality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="form-label-minimal">Nationality</FormLabel>
                        <FormControl>
                          <Input className="input-minimal" placeholder="Enter your nationality" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="occupation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="form-label-minimal">Occupation</FormLabel>
                        <FormControl>
                          <Input className="input-minimal" placeholder="e.g. Software Engineer" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="form-label-minimal">Residential Address</FormLabel>
                        <FormControl>
                          <Input className="input-minimal" placeholder="Full residential address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="rounded-lg border-2 border-dashed border-border p-10 text-center">
                    <FileText className="mx-auto mb-4 h-10 w-10 text-secondary" />
                    <h3 className="mb-2 text-sm font-bold uppercase tracking-wider">Birth Certificate</h3>
                    <p className="mb-4 text-xs text-secondary">Upload a clear scan of your original birth certificate (PDF, JPG, PNG)</p>
                    <Button type="button" variant="outline" className="input-minimal">
                      Select File
                    </Button>
                  </div>
                  <div className="rounded-lg border-2 border-dashed border-border p-10 text-center">
                    <User className="mx-auto mb-4 h-10 w-10 text-secondary" />
                    <h3 className="mb-2 text-sm font-bold uppercase tracking-wider">National ID Card</h3>
                    <p className="mb-4 text-xs text-secondary">Upload a clear scan of your National ID card (Front & Back)</p>
                    <Button type="button" variant="outline" className="input-minimal">
                      Select File
                    </Button>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="grid grid-cols-1 gap-x-5 gap-y-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="appointment_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="form-label-minimal">Preferred Appointment Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "input-minimal w-full text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Select Date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date()
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="appointment_location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="form-label-minimal">Appointment Location</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="input-minimal">
                              <SelectValue placeholder="Select center" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="central">Central Passport Office</SelectItem>
                            <SelectItem value="north">North Regional Center</SelectItem>
                            <SelectItem value="south">South Regional Center</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="passport_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="form-label-minimal">Passport Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="input-minimal">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="standard">Standard (32 Pages)</SelectItem>
                            <SelectItem value="official">Official (64 Pages)</SelectItem>
                            <SelectItem value="diplomatic">Diplomatic</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="validity_period"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="form-label-minimal">Validity Period</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="input-minimal">
                              <SelectValue placeholder="Select period" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="5_years">5 Years</SelectItem>
                            <SelectItem value="10_years">10 Years</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="rounded-lg border border-border p-6">
                    <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-secondary">
                      Application Summary
                    </h3>
                    <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                      <div>
                        <p className="text-secondary">Full Name</p>
                        <p className="font-semibold">{form.getValues('first_name')} {form.getValues('last_name')}</p>
                      </div>
                      <div>
                        <p className="text-secondary">Email</p>
                        <p className="font-semibold">{form.getValues('email')}</p>
                      </div>
                      <div>
                        <p className="text-secondary">Passport Type</p>
                        <p className="font-semibold capitalize">{form.getValues('passport_type')}</p>
                      </div>
                      <div>
                        <p className="text-secondary">Validity</p>
                        <p className="font-semibold">{form.getValues('validity_period')?.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <p className="text-secondary">Appointment</p>
                        <p className="font-semibold">
                          {form.getValues('appointment_date') ? format(form.getValues('appointment_date')!, "PPP") : 'Not set'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg bg-primary/5 p-6 border border-primary/10">
                    <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-primary">Payment Details</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-secondary">Application Fee</span>
                      <span className="text-lg font-bold text-primary">$150.00</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-10 flex items-center justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    if (currentStep === 0) {
                      saveDraft(form.getValues());
                    } else {
                      prevStep();
                    }
                  }}
                  disabled={isSubmitting}
                  className="text-secondary font-semibold hover:bg-transparent"
                >
                  {currentStep === 0 ? "Save as draft" : "Previous Step"}
                </Button>
                
                {currentStep < steps.length - 1 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="bg-primary px-6 py-3 font-bold text-white hover:bg-primary/90"
                  >
                    Save and Continue
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-primary px-8 py-3 font-bold text-white hover:bg-primary/90"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                  </Button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </form>
      </Form>
    </div>
  );
}

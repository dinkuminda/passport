import React from 'react';
import { Toaster } from 'sonner';
import { 
  Shield, 
  Globe, 
  HelpCircle, 
  FileText, 
  User,
  LogOut,
  Bell,
  Loader2
} from 'lucide-react';
import PassportForm from './components/PassportForm';
import LoginPage from './components/LoginPage';
import { Button } from './components/ui/button';
import { cn } from './lib/utils';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppContent() {
  const { user, loading, signOut } = useAuth();
  const [currentStep, setCurrentStep] = React.useState(0);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const sidebarSteps = [
    { id: '01', label: 'Personal Details' },
    { id: '02', label: 'Document Upload' },
    { id: '03', label: 'Appointment' },
    { id: '04', label: 'Review & Pay' },
  ];

  return (
    <div className="flex h-screen flex-col bg-background font-sans text-primary overflow-hidden">
      <Toaster position="top-center" />
      
      {/* Header */}
      <header className="flex h-[72px] items-center justify-between border-b border-border bg-surface px-10 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-md bg-primary" />
          <span className="text-lg font-bold tracking-tight uppercase">
            National Passport Service
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">{user.email}</span>
            <div className="h-9 w-9 rounded-full border border-border bg-[#E2E8F0] flex items-center justify-center">
              <User size={18} className="text-secondary" />
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={signOut}
            className="text-secondary hover:text-primary"
            title="Sign Out"
          >
            <LogOut size={20} />
          </Button>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex flex-1 overflow-hidden">
        {/* Sidebar - Hidden on small screens, fixed width on desktop */}
        <aside className="hidden w-[280px] border-r border-border bg-background p-10 md:block shrink-0">
          <nav>
            <ul className="space-y-8">
              {sidebarSteps.map((step, index) => (
                <li 
                  key={step.id} 
                  className={cn(
                    "flex items-center gap-4 transition-opacity",
                    index === currentStep ? "opacity-100" : "opacity-40"
                  )}
                >
                  <div className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full border-2 text-[12px] font-bold",
                    index === currentStep ? "border-primary" : "border-secondary"
                  )}>
                    {step.id}
                  </div>
                  <span className="text-sm font-semibold">{step.label}</span>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Content Area */}
        <section className="flex-1 overflow-y-auto bg-background px-10 py-12 md:px-20 md:py-16">
          <div className="mx-auto max-w-[800px]">
            <div className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-[#ECFDF5] px-3 py-1 text-[12px] font-semibold text-[#065F46]">
              <div className="h-1.5 w-1.5 rounded-full bg-success" />
              Draft Saved to Supabase
            </div>
            
            <div className="mb-10">
              <h1 className="text-2xl font-bold tracking-tight">
                {sidebarSteps[currentStep]?.label || 'Application Details'}
              </h1>
              <p className="mt-1 text-sm text-secondary">
                {currentStep === 0 && "Please provide your legal name exactly as it appears on your birth certificate."}
                {currentStep === 1 && "Upload the required documents to verify your identity."}
                {currentStep === 2 && "Schedule your biometric capture and select your passport options."}
                {currentStep === 3 && "Review your application details and proceed to payment."}
              </p>
            </div>

            <PassportForm onStepChange={setCurrentStep} />

            <footer className="mt-16 flex items-center justify-between border-t border-border pt-6 text-[12px] text-secondary">
              <span>Deployment: vercel-prod-77a2 (v1.2.0)</span>
              <div className="flex items-center gap-2">
                <Shield size={12} />
                <span>Secured by Supabase</span>
              </div>
            </footer>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

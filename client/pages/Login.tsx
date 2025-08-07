import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Building2, Calculator, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { AuthenticationStep } from '@shared/auth-service';

export default function Login() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authSteps, setAuthSteps] = useState<AuthenticationStep[]>([]);
  const [showSteps, setShowSteps] = useState(false);
  const [authProgress, setAuthProgress] = useState(0);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    setShowSteps(true);
    setAuthSteps([]);
    setAuthProgress(0);

    // Step 1: Show credential capture
    const step1: AuthenticationStep = {
      step: 1,
      title: 'User enters username and password',
      status: 'in_progress',
      message: 'Capturing credentials...'
    };
    setAuthSteps([step1]);
    setAuthProgress(20);
    await new Promise(resolve => setTimeout(resolve, 500));

    setAuthSteps([{ ...step1, status: 'completed', message: 'Credentials captured successfully' }]);
    setAuthProgress(40);
    await new Promise(resolve => setTimeout(resolve, 300));

    const loginResult = await login({ email, password });

    if (!loginResult.success) {
      const failedStep: AuthenticationStep = {
        step: 2,
        title: 'Hash input password and compare with stored hash',
        status: 'failed',
        message: 'Authentication failed - invalid credentials'
      };
      setAuthSteps(prev => [...prev, failedStep]);
      setError('Invalid email or password. Please try again.');
      setAuthProgress(100);
    } else {
      // Show successful completion of all steps
      const allSteps: AuthenticationStep[] = [
        { step: 1, title: 'User enters username and password', status: 'completed', message: 'Credentials captured' },
        { step: 2, title: 'Hash input password and compare with stored hash', status: 'completed', message: 'Password verified' },
        { step: 3, title: 'Fetch user role and permissions', status: 'completed', message: 'Role and permissions loaded' },
        { step: 4, title: 'Redirect to appropriate dashboard', status: 'completed', message: 'Dashboard determined' },
        { step: 5, title: 'Log login timestamp and IP address', status: 'completed', message: 'Audit trail updated' }
      ];

      for (let i = 1; i < allSteps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 300));
        setAuthSteps(allSteps.slice(0, i + 1));
        setAuthProgress(20 * (i + 1));
      }

      // Step 4 & 5: Redirect to role-based dashboard after completion
      if (loginResult.redirectUrl) {
        console.log(`[LOGIN] Redirecting to: ${loginResult.redirectUrl}`);
        setTimeout(() => {
          navigate(loginResult.redirectUrl!);
        }, 1000);
      }
    }

    setIsSubmitting(false);
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-500 animate-pulse" />;
      default: return <div className="w-4 h-4 rounded-full bg-gray-300" />;
    }
  };

  const getStepBadgeColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4">
            <Calculator className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">PayrollKE</h1>
          <p className="text-gray-600">Kenya's Complete Payroll Management System</p>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold text-center">
              Sign in to your account
            </CardTitle>
            <p className="text-sm text-gray-600 text-center">
              Enter your credentials to access the payroll system
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-11 px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>

            {/* Authentication Steps Progress */}
            {showSteps && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Authentication Process</h3>
                <Progress value={authProgress} className="mb-4" />
                <div className="space-y-2">
                  {authSteps.map((step) => (
                    <div key={step.step} className="flex items-center space-x-3">
                      {getStepIcon(step.status)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">Step {step.step}</span>
                          <Badge className={getStepBadgeColor(step.status)}>
                            {step.status.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600">{step.title}</p>
                        {step.message && (
                          <p className="text-xs text-gray-500 italic">{step.message}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Demo Credentials:</h3>
              <div className="text-xs text-gray-600 space-y-1">
                <div>Admin: admin@payrollke.co.ke / admin123</div>
                <div>HR Manager: hr@payrollke.co.ke / hr123</div>
                <div>Payroll Officer: payroll@payrollke.co.ke / payroll123</div>
                <div>Manager: manager@payrollke.co.ke / manager123</div>
                <div>Employee: employee@payrollke.co.ke / emp123</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-gray-600">
          <div className="flex items-center justify-center">
            <Building2 className="w-4 h-4 mr-1" />
            Secure payroll management for Kenyan businesses
          </div>
        </div>
      </div>
    </div>
  );
}

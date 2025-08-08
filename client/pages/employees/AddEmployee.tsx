import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Save, ArrowRight, CheckCircle } from 'lucide-react';

const AddEmployee: React.FC = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    nationalId: '',
    dateOfBirth: '',
    
    // Employment Details
    employeeNumber: '',
    department: '',
    position: '',
    hireDate: '',
    salary: '',
    
    // Bank Details
    bankName: '',
    accountNumber: '',
    accountHolderName: '',
    
    // Tax Information
    kraPin: '',
    nhifNumber: '',
    nssfNumber: ''
  });

  const steps = [
    { number: 1, title: 'Personal Information', description: 'Basic personal details' },
    { number: 2, title: 'Employment Details', description: 'Job and salary information' },
    { number: 3, title: 'Bank & Tax Details', description: 'Banking and tax information' },
    { number: 4, title: 'Review & Submit', description: 'Confirm and save employee' }
  ];

  const progress = (currentStep / steps.length) * 100;

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const submitEmployee = () => {
    console.log('Submitting employee:', formData);
    alert('Employee added successfully!');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Employee</h1>
          <p className="text-gray-600">Register a new employee in the system</p>
        </div>
        <Badge className="bg-green-100 text-green-800">
          <UserPlus className="w-4 h-4 mr-1" />
          New Registration
        </Badge>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium">Step {currentStep} of {steps.length}</span>
              <span className="text-sm text-gray-500">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="mb-4" />
          </div>
          
          <div className="flex justify-between">
            {steps.map((step) => (
              <div key={step.number} className={`flex flex-col items-center ${
                step.number <= currentStep ? 'text-indigo-600' : 'text-gray-400'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                  step.number < currentStep 
                    ? 'bg-indigo-600 text-white' 
                    : step.number === currentStep 
                    ? 'bg-indigo-100 text-indigo-600 border-2 border-indigo-600' 
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  {step.number < currentStep ? <CheckCircle className="w-4 h-4" /> : step.number}
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-xs">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Form Steps */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep - 1].title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  placeholder="Enter last name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <Label htmlFor="nationalId">National ID</Label>
                <Input
                  id="nationalId"
                  value={formData.nationalId}
                  onChange={(e) => setFormData({...formData, nationalId: e.target.value})}
                  placeholder="Enter national ID"
                />
              </div>
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                />
              </div>
            </div>
          )}

          {/* Step 2: Employment Details */}
          {currentStep === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="employeeNumber">Employee Number</Label>
                <Input
                  id="employeeNumber"
                  value={formData.employeeNumber}
                  onChange={(e) => setFormData({...formData, employeeNumber: e.target.value})}
                  placeholder="Auto-generated or manual"
                />
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => setFormData({...formData, department: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="hr">Human Resources</SelectItem>
                    <SelectItem value="it">Information Technology</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="operations">Operations</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({...formData, position: e.target.value})}
                  placeholder="Enter job position"
                />
              </div>
              <div>
                <Label htmlFor="hireDate">Hire Date</Label>
                <Input
                  id="hireDate"
                  type="date"
                  value={formData.hireDate}
                  onChange={(e) => setFormData({...formData, hireDate: e.target.value})}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="salary">Monthly Salary (KES)</Label>
                <Input
                  id="salary"
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData({...formData, salary: e.target.value})}
                  placeholder="Enter monthly salary"
                />
              </div>
            </div>
          )}

          {/* Step 3: Bank & Tax Details */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Bank Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Select
                      value={formData.bankName}
                      onValueChange={(value) => setFormData({...formData, bankName: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select bank" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equity">Equity Bank</SelectItem>
                        <SelectItem value="kcb">KCB Bank</SelectItem>
                        <SelectItem value="coop">Cooperative Bank</SelectItem>
                        <SelectItem value="absa">Absa Bank</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                      placeholder="Enter account number"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="accountHolderName">Account Holder Name</Label>
                    <Input
                      id="accountHolderName"
                      value={formData.accountHolderName}
                      onChange={(e) => setFormData({...formData, accountHolderName: e.target.value})}
                      placeholder="Enter account holder name"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Tax Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="kraPin">KRA PIN</Label>
                    <Input
                      id="kraPin"
                      value={formData.kraPin}
                      onChange={(e) => setFormData({...formData, kraPin: e.target.value})}
                      placeholder="Enter KRA PIN"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nhifNumber">NHIF Number</Label>
                    <Input
                      id="nhifNumber"
                      value={formData.nhifNumber}
                      onChange={(e) => setFormData({...formData, nhifNumber: e.target.value})}
                      placeholder="Enter NHIF number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nssfNumber">NSSF Number</Label>
                    <Input
                      id="nssfNumber"
                      value={formData.nssfNumber}
                      onChange={(e) => setFormData({...formData, nssfNumber: e.target.value})}
                      placeholder="Enter NSSF number"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review & Submit */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Review Employee Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <Label>Full Name</Label>
                      <p className="font-medium">{formData.firstName} {formData.lastName}</p>
                    </div>
                    <div>
                      <Label>Email</Label>
                      <p className="font-medium">{formData.email}</p>
                    </div>
                    <div>
                      <Label>Department</Label>
                      <p className="font-medium capitalize">{formData.department}</p>
                    </div>
                    <div>
                      <Label>Position</Label>
                      <p className="font-medium">{formData.position}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label>Salary</Label>
                      <p className="font-medium">KES {Number(formData.salary).toLocaleString()}</p>
                    </div>
                    <div>
                      <Label>Bank</Label>
                      <p className="font-medium capitalize">{formData.bankName}</p>
                    </div>
                    <div>
                      <Label>Account Number</Label>
                      <p className="font-medium">{formData.accountNumber}</p>
                    </div>
                    <div>
                      <Label>KRA PIN</Label>
                      <p className="font-medium">{formData.kraPin}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            
            {currentStep < steps.length ? (
              <Button onClick={nextStep}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={submitEmployee} className="bg-green-600 hover:bg-green-700">
                <Save className="w-4 h-4 mr-2" />
                Save Employee
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddEmployee;

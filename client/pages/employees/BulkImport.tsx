import React, { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Users,
  FileText,
  RefreshCw
} from 'lucide-react';
import { employeeService, handleAPIError } from '@shared/data-service';

interface ImportResult {
  success: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
    data: any;
  }>;
}

const BulkImport: React.FC = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);

  const downloadTemplate = () => {
    const template = [
      ['First Name', 'Last Name', 'Email', 'Phone', 'National ID', 'Department', 'Position', 'Salary', 'Bank Name', 'Account Number', 'KRA PIN'],
      ['John', 'Doe', 'john.doe@company.com', '+254700123456', '12345678', 'IT', 'Software Developer', '150000', 'Equity Bank', '1234567890', 'A123456789B'],
      ['Jane', 'Smith', 'jane.smith@company.com', '+254700987654', '87654321', 'Finance', 'Accountant', '120000', 'KCB Bank', '0987654321', 'A987654321B']
    ];

    const csvContent = template.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee_import_template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  };

  const parseFile = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim());
      
      const data = lines.slice(1).map((line, index) => {
        const values = line.split(',').map(v => v.trim());
        const row: any = { rowNumber: index + 2 };
        headers.forEach((header, i) => {
          row[header] = values[i] || '';
        });
        return row;
      });

      setPreviewData(data.slice(0, 10)); // Show first 10 rows for preview
    } catch (error) {
      alert('Error parsing file. Please ensure it\'s a valid CSV file.');
    }
  };

  const processImport = async () => {
    if (!file || previewData.length === 0) return;

    setImporting(true);
    setProgress(0);
    setResult(null);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Transform preview data to employee format
      const employees = previewData.map(row => ({
        firstName: row['First Name'],
        lastName: row['Last Name'],
        email: row['Email'],
        phone: row['Phone'],
        nationalId: row['National ID'],
        department: row['Department'],
        position: row['Position'],
        salary: parseFloat(row['Salary']) || 0,
        bankDetails: {
          bankName: row['Bank Name'],
          accountNumber: row['Account Number'],
          accountHolderName: `${row['First Name']} ${row['Last Name']}`,
          sortCode: ''
        },
        taxInformation: {
          kraPin: row['KRA PIN'],
          taxCode: '',
          nhifNumber: '',
          nssfNumber: '',
          pensionContribution: 0
        },
        address: '',
        dateOfBirth: '',
        hireDate: new Date().toISOString().split('T')[0],
        payrollCategory: 'monthly' as const,
        isActive: true
      }));

      const importResult = await employeeService.bulkImport(employees);
      
      clearInterval(progressInterval);
      setProgress(100);
      setResult(importResult);
    } catch (error) {
      alert(handleAPIError(error));
    } finally {
      setImporting(false);
    }
  };

  const resetImport = () => {
    setFile(null);
    setPreviewData([]);
    setResult(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bulk Employee Import</h1>
          <p className="text-gray-600">Import multiple employees from CSV file</p>
        </div>
        <Badge className="bg-blue-100 text-blue-800">
          <Upload className="w-4 h-4 mr-1" />
          Bulk Import
        </Badge>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Import Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Download className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <h3 className="font-medium">Step 1: Download Template</h3>
              <p className="text-sm text-gray-600 mb-3">Download the CSV template with required fields</p>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <FileSpreadsheet className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <h3 className="font-medium">Step 2: Fill Employee Data</h3>
              <p className="text-sm text-gray-600">Fill in employee information in the template</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Upload className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <h3 className="font-medium">Step 3: Upload & Import</h3>
              <p className="text-sm text-gray-600">Upload the completed file to import employees</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Employee Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".csv,.xlsx,.xls"
              className="hidden"
            />
            {file ? (
              <div className="space-y-4">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-gray-600">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={resetImport}>
                    Choose Different File
                  </Button>
                  <Button onClick={processImport} disabled={importing || previewData.length === 0}>
                    {importing ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Import Employees
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium">Choose a file to upload</p>
                  <p className="text-gray-600">CSV, Excel files are supported</p>
                </div>
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" />
                  Select File
                </Button>
              </div>
            )}
          </div>

          {importing && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Importing employees...</span>
                <span className="text-sm text-gray-500">{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Data */}
      {previewData.length > 0 && !result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Data Preview (First 10 rows)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Salary</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row['First Name']} {row['Last Name']}</TableCell>
                      <TableCell>{row['Email']}</TableCell>
                      <TableCell>{row['Department']}</TableCell>
                      <TableCell>{row['Position']}</TableCell>
                      <TableCell>KES {Number(row['Salary']).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.errors.length === 0 ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              )}
              Import Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-700">{result.success}</p>
                <p className="text-sm text-green-600">Successfully Imported</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-700">{result.errors.length}</p>
                <p className="text-sm text-red-600">Import Errors</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-700">{result.success + result.errors.length}</p>
                <p className="text-sm text-blue-600">Total Processed</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div>
                <h4 className="font-medium text-red-700 mb-3">Import Errors</h4>
                <div className="max-h-60 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Row</TableHead>
                        <TableHead>Field</TableHead>
                        <TableHead>Error</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.errors.map((error, index) => (
                        <TableRow key={index}>
                          <TableCell>{error.row}</TableCell>
                          <TableCell>{error.field}</TableCell>
                          <TableCell className="text-red-600">{error.message}</TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {JSON.stringify(error.data)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={resetImport} variant="outline">
                Import Another File
              </Button>
              {result.success > 0 && (
                <Button onClick={() => window.location.href = '/employees'}>
                  View Imported Employees
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BulkImport;

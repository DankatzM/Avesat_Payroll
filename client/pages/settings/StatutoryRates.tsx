import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  DollarSign,
  Percent,
  Calculator,
  FileText,
  AlertTriangle,
  Save,
  RefreshCw,
  Info,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  History,
  Download,
  Upload,
  Eye,
  Calendar,
  Building,
  Users,
} from "lucide-react";
import { UserRole } from "@shared/api";
import { formatKES } from "@shared/kenya-tax";

interface TaxBracket {
  id: string;
  name: string;
  minAmount: number;
  maxAmount: number;
  rate: number;
  personalRelief: number;
  effectiveDate: string;
  expiryDate?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  lastModified: string;
}

interface NHIFBand {
  id: string;
  minSalary: number;
  maxSalary: number;
  contribution: number;
  effectiveDate: string;
  expiryDate?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  lastModified: string;
}

interface StatutoryRate {
  id: string;
  name: string;
  description: string;
  rate: number;
  rateType: "percentage" | "fixed" | "tiered";
  ceiling?: number;
  floor?: number;
  calculation: string;
  authority: string;
  reference: string;
  effectiveDate: string;
  expiryDate?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  lastModified: string;
}

interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  authority: string;
  ruleType: "mandatory" | "optional" | "conditional";
  penalty?: string;
  deadline?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

interface AuditLog {
  id: string;
  action: string;
  description: string;
  performedBy: string;
  timestamp: string;
  oldValue?: string;
  newValue?: string;
  category: string;
}

export default function StatutoryRates() {
  const { user, hasAnyRole } = useAuth();
  const [activeTab, setActiveTab] = useState("paye");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // State for tax brackets
  const [taxBrackets, setTaxBrackets] = useState<TaxBracket[]>([
    {
      id: "1",
      name: "Band 1",
      minAmount: 0,
      maxAmount: 24000,
      rate: 10,
      personalRelief: 2400,
      effectiveDate: "2024-01-01",
      isActive: true,
      createdBy: "admin@avesat.co.ke",
      createdAt: "2024-01-01T00:00:00Z",
      lastModified: "2024-01-01T00:00:00Z",
    },
    {
      id: "2",
      name: "Band 2",
      minAmount: 24001,
      maxAmount: 32333,
      rate: 25,
      personalRelief: 2400,
      effectiveDate: "2024-01-01",
      isActive: true,
      createdBy: "admin@avesat.co.ke",
      createdAt: "2024-01-01T00:00:00Z",
      lastModified: "2024-01-01T00:00:00Z",
    },
    {
      id: "3",
      name: "Band 3",
      minAmount: 32334,
      maxAmount: 500000,
      rate: 30,
      personalRelief: 2400,
      effectiveDate: "2024-01-01",
      isActive: true,
      createdBy: "admin@avesat.co.ke",
      createdAt: "2024-01-01T00:00:00Z",
      lastModified: "2024-01-01T00:00:00Z",
    },
    {
      id: "4",
      name: "Band 4",
      minAmount: 500001,
      maxAmount: 800000,
      rate: 32.5,
      personalRelief: 2400,
      effectiveDate: "2024-01-01",
      isActive: true,
      createdBy: "admin@avesat.co.ke",
      createdAt: "2024-01-01T00:00:00Z",
      lastModified: "2024-01-01T00:00:00Z",
    },
    {
      id: "5",
      name: "Band 5",
      minAmount: 800001,
      maxAmount: 999999999,
      rate: 35,
      personalRelief: 2400,
      effectiveDate: "2024-01-01",
      isActive: true,
      createdBy: "admin@avesat.co.ke",
      createdAt: "2024-01-01T00:00:00Z",
      lastModified: "2024-01-01T00:00:00Z",
    },
  ]);

  // State for NHIF bands
  const [nhifBands, setNhifBands] = useState<NHIFBand[]>([
    {
      id: "1",
      minSalary: 0,
      maxSalary: 5999,
      contribution: 150,
      effectiveDate: "2024-01-01",
      isActive: true,
      createdBy: "admin@avesat.co.ke",
      createdAt: "2024-01-01T00:00:00Z",
      lastModified: "2024-01-01T00:00:00Z",
    },
    {
      id: "2",
      minSalary: 6000,
      maxSalary: 7999,
      contribution: 300,
      effectiveDate: "2024-01-01",
      isActive: true,
      createdBy: "admin@avesat.co.ke",
      createdAt: "2024-01-01T00:00:00Z",
      lastModified: "2024-01-01T00:00:00Z",
    },
    {
      id: "3",
      minSalary: 8000,
      maxSalary: 11999,
      contribution: 400,
      effectiveDate: "2024-01-01",
      isActive: true,
      createdBy: "admin@avesat.co.ke",
      createdAt: "2024-01-01T00:00:00Z",
      lastModified: "2024-01-01T00:00:00Z",
    },
    {
      id: "4",
      minSalary: 12000,
      maxSalary: 14999,
      contribution: 500,
      effectiveDate: "2024-01-01",
      isActive: true,
      createdBy: "admin@avesat.co.ke",
      createdAt: "2024-01-01T00:00:00Z",
      lastModified: "2024-01-01T00:00:00Z",
    },
    {
      id: "5",
      minSalary: 15000,
      maxSalary: 19999,
      contribution: 600,
      effectiveDate: "2024-01-01",
      isActive: true,
      createdBy: "admin@avesat.co.ke",
      createdAt: "2024-01-01T00:00:00Z",
      lastModified: "2024-01-01T00:00:00Z",
    },
    {
      id: "6",
      minSalary: 20000,
      maxSalary: 24999,
      contribution: 750,
      effectiveDate: "2024-01-01",
      isActive: true,
      createdBy: "admin@avesat.co.ke",
      createdAt: "2024-01-01T00:00:00Z",
      lastModified: "2024-01-01T00:00:00Z",
    },
    {
      id: "7",
      minSalary: 25000,
      maxSalary: 29999,
      contribution: 850,
      effectiveDate: "2024-01-01",
      isActive: true,
      createdBy: "admin@avesat.co.ke",
      createdAt: "2024-01-01T00:00:00Z",
      lastModified: "2024-01-01T00:00:00Z",
    },
    {
      id: "8",
      minSalary: 30000,
      maxSalary: 34999,
      contribution: 900,
      effectiveDate: "2024-01-01",
      isActive: true,
      createdBy: "admin@avesat.co.ke",
      createdAt: "2024-01-01T00:00:00Z",
      lastModified: "2024-01-01T00:00:00Z",
    },
    {
      id: "9",
      minSalary: 35000,
      maxSalary: 39999,
      contribution: 950,
      effectiveDate: "2024-01-01",
      isActive: true,
      createdBy: "admin@avesat.co.ke",
      createdAt: "2024-01-01T00:00:00Z",
      lastModified: "2024-01-01T00:00:00Z",
    },
    {
      id: "10",
      minSalary: 40000,
      maxSalary: 44999,
      contribution: 1000,
      effectiveDate: "2024-01-01",
      isActive: true,
      createdBy: "admin@avesat.co.ke",
      createdAt: "2024-01-01T00:00:00Z",
      lastModified: "2024-01-01T00:00:00Z",
    },
    {
      id: "11",
      minSalary: 45000,
      maxSalary: 49999,
      contribution: 1100,
      effectiveDate: "2024-01-01",
      isActive: true,
      createdBy: "admin@avesat.co.ke",
      createdAt: "2024-01-01T00:00:00Z",
      lastModified: "2024-01-01T00:00:00Z",
    },
    {
      id: "12",
      minSalary: 50000,
      maxSalary: 59999,
      contribution: 1200,
      effectiveDate: "2024-01-01",
      isActive: true,
      createdBy: "admin@avesat.co.ke",
      createdAt: "2024-01-01T00:00:00Z",
      lastModified: "2024-01-01T00:00:00Z",
    },
    {
      id: "13",
      minSalary: 60000,
      maxSalary: 69999,
      contribution: 1300,
      effectiveDate: "2024-01-01",
      isActive: true,
      createdBy: "admin@avesat.co.ke",
      createdAt: "2024-01-01T00:00:00Z",
      lastModified: "2024-01-01T00:00:00Z",
    },
    {
      id: "14",
      minSalary: 70000,
      maxSalary: 79999,
      contribution: 1400,
      effectiveDate: "2024-01-01",
      isActive: true,
      createdBy: "admin@avesat.co.ke",
      createdAt: "2024-01-01T00:00:00Z",
      lastModified: "2024-01-01T00:00:00Z",
    },
    {
      id: "15",
      minSalary: 80000,
      maxSalary: 89999,
      contribution: 1500,
      effectiveDate: "2024-01-01",
      isActive: true,
      createdBy: "admin@avesat.co.ke",
      createdAt: "2024-01-01T00:00:00Z",
      lastModified: "2024-01-01T00:00:00Z",
    },
    {
      id: "16",
      minSalary: 90000,
      maxSalary: 99999,
      contribution: 1600,
      effectiveDate: "2024-01-01",
      isActive: true,
      createdBy: "admin@avesat.co.ke",
      createdAt: "2024-01-01T00:00:00Z",
      lastModified: "2024-01-01T00:00:00Z",
    },
    {
      id: "17",
      minSalary: 100000,
      maxSalary: 999999999,
      contribution: 1700,
      effectiveDate: "2024-01-01",
      isActive: true,
      createdBy: "admin@avesat.co.ke",
      createdAt: "2024-01-01T00:00:00Z",
      lastModified: "2024-01-01T00:00:00Z",
    },
  ]);

  // State for other statutory rates
  const [statutoryRates, setStatutoryRates] = useState<StatutoryRate[]>([
    {
      id: "1",
      name: "NSSF Rate",
      description: "National Social Security Fund contribution rate",
      rate: 6,
      rateType: "percentage",
      ceiling: 36000,
      calculation: "Min(Gross Salary * 6%, 2160)",
      authority: "NSSF",
      reference: "NSSF Act Cap 258",
      effectiveDate: "2024-01-01",
      isActive: true,
      createdBy: "admin@avesat.co.ke",
      createdAt: "2024-01-01T00:00:00Z",
      lastModified: "2024-01-01T00:00:00Z",
    },
    {
      id: "2",
      name: "Housing Levy",
      description: "Affordable Housing Levy",
      rate: 1.5,
      rateType: "percentage",
      calculation: "Gross Salary * 1.5%",
      authority: "KRA",
      reference: "Finance Act 2023",
      effectiveDate: "2024-07-01",
      isActive: true,
      createdBy: "admin@avesat.co.ke",
      createdAt: "2024-01-01T00:00:00Z",
      lastModified: "2024-01-01T00:00:00Z",
    },
    {
      id: "3",
      name: "HELB Recovery",
      description: "Higher Education Loans Board recovery",
      rate: 1.0,
      rateType: "percentage",
      calculation: "Gross Salary * 1% (if Gross > 20,000)",
      authority: "HELB",
      reference: "HELB Regulations",
      effectiveDate: "2024-01-01",
      isActive: true,
      createdBy: "admin@avesat.co.ke",
      createdAt: "2024-01-01T00:00:00Z",
      lastModified: "2024-01-01T00:00:00Z",
    },
    {
      id: "4",
      name: "Training Levy",
      description: "Industrial Training Levy",
      rate: 0.5,
      rateType: "percentage",
      ceiling: 2000,
      calculation: "Gross Salary * 0.5% (Max 2000)",
      authority: "NITA",
      reference: "Industrial Training Act",
      effectiveDate: "2024-01-01",
      isActive: true,
      createdBy: "admin@avesat.co.ke",
      createdAt: "2024-01-01T00:00:00Z",
      lastModified: "2024-01-01T00:00:00Z",
    },
    {
      id: "5",
      name: "Service Charge",
      description: "Skills Development Fund service charge",
      rate: 2500,
      rateType: "fixed",
      calculation: "Fixed amount of 2500 per employee per year",
      authority: "NITA",
      reference: "Skills Development Act",
      effectiveDate: "2024-01-01",
      isActive: true,
      createdBy: "admin@avesat.co.ke",
      createdAt: "2024-01-01T00:00:00Z",
      lastModified: "2024-01-01T00:00:00Z",
    },
  ]);

  // State for compliance rules
  const [complianceRules, setComplianceRules] = useState<ComplianceRule[]>([
    {
      id: "1",
      name: "PAYE Filing",
      description: "File monthly PAYE returns by 9th of following month",
      authority: "KRA",
      ruleType: "mandatory",
      penalty: "25% of tax due or KES 10,000 whichever is higher",
      deadline: "9th of following month",
      isActive: true,
      createdBy: "admin@avesat.co.ke",
      createdAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "2",
      name: "NHIF Remittance",
      description: "Remit NHIF contributions by 15th of following month",
      authority: "NHIF",
      ruleType: "mandatory",
      penalty: "5% penalty plus 1% interest per month",
      deadline: "15th of following month",
      isActive: true,
      createdBy: "admin@avesat.co.ke",
      createdAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "3",
      name: "NSSF Remittance",
      description: "Remit NSSF contributions by 15th of following month",
      authority: "NSSF",
      ruleType: "mandatory",
      penalty: "5% penalty plus 1% interest per month",
      deadline: "15th of following month",
      isActive: true,
      createdBy: "admin@avesat.co.ke",
      createdAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "4",
      name: "P9A Filing",
      description: "Submit annual P9A forms by 31st January",
      authority: "KRA",
      ruleType: "mandatory",
      penalty: "KES 20,000 or 5% of tax due",
      deadline: "31st January",
      isActive: true,
      createdBy: "admin@avesat.co.ke",
      createdAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "5",
      name: "Housing Levy Return",
      description:
        "File monthly Housing Levy returns by 9th of following month",
      authority: "KRA",
      ruleType: "mandatory",
      penalty: "KES 10,000 or 5% of levy due",
      deadline: "9th of following month",
      isActive: true,
      createdBy: "admin@avesat.co.ke",
      createdAt: "2024-01-01T00:00:00Z",
    },
  ]);

  // State for audit logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    {
      id: "1",
      action: "UPDATE_TAX_BRACKET",
      description: "Updated Band 5 tax rate from 32.5% to 35%",
      performedBy: "admin@avesat.co.ke",
      timestamp: "2024-03-15T14:30:00Z",
      oldValue: "32.5",
      newValue: "35",
      category: "PAYE Tax",
    },
    {
      id: "2",
      action: "UPDATE_NHIF_BAND",
      description: "Updated NHIF contribution for salary band 100,000+",
      performedBy: "admin@avesat.co.ke",
      timestamp: "2024-03-10T10:15:00Z",
      oldValue: "1600",
      newValue: "1700",
      category: "NHIF",
    },
    {
      id: "3",
      action: "CREATE_STATUTORY_RATE",
      description: "Added new Housing Levy rate",
      performedBy: "compliance@avesat.co.ke",
      timestamp: "2024-03-01T09:00:00Z",
      category: "Statutory Rates",
    },
  ]);

  const canManageRates = hasAnyRole([UserRole.ADMIN]);
  const canViewRates = hasAnyRole([
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
    UserRole.PAYROLL_OFFICER,
  ]);

  if (!canViewRates) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Access denied. You don't have permission to view statutory rates.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const saveRates = async (rateType: string) => {
    if (!canManageRates) {
      alert("You do not have permission to modify statutory rates.");
      return;
    }

    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setLastSaved(new Date().toISOString());

      // Add to audit log
      const newLog: AuditLog = {
        id: Date.now().toString(),
        action: "UPDATE_STATUTORY_RATES",
        description: `Updated ${rateType} rates`,
        performedBy: user?.email || "unknown",
        timestamp: new Date().toISOString(),
        category: rateType,
      };
      setAuditLogs((prev) => [newLog, ...prev]);

      alert(`${rateType} rates saved successfully!`);
    } catch (error) {
      alert("Error saving rates. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleRate = async (rateId: string, rateType: string) => {
    if (!canManageRates) {
      alert("You do not have permission to modify statutory rates.");
      return;
    }

    if (rateType === "tax") {
      setTaxBrackets((prev) =>
        prev.map((bracket) =>
          bracket.id === rateId
            ? {
                ...bracket,
                isActive: !bracket.isActive,
                lastModified: new Date().toISOString(),
              }
            : bracket,
        ),
      );
    } else if (rateType === "nhif") {
      setNhifBands((prev) =>
        prev.map((band) =>
          band.id === rateId
            ? {
                ...band,
                isActive: !band.isActive,
                lastModified: new Date().toISOString(),
              }
            : band,
        ),
      );
    } else if (rateType === "statutory") {
      setStatutoryRates((prev) =>
        prev.map((rate) =>
          rate.id === rateId
            ? {
                ...rate,
                isActive: !rate.isActive,
                lastModified: new Date().toISOString(),
              }
            : rate,
        ),
      );
    }

    // Add to audit log
    const newLog: AuditLog = {
      id: Date.now().toString(),
      action: "TOGGLE_RATE_STATUS",
      description: `Toggled status for ${rateType} rate ID: ${rateId}`,
      performedBy: user?.email || "unknown",
      timestamp: new Date().toISOString(),
      category: rateType,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const exportRates = () => {
    const dataStr = JSON.stringify(
      {
        taxBrackets,
        nhifBands,
        statutoryRates,
        complianceRules,
      },
      null,
      2,
    );
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `statutory-rates-${new Date().toISOString().split("T")[0]}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const importRates = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        if (importedData.taxBrackets) setTaxBrackets(importedData.taxBrackets);
        if (importedData.nhifBands) setNhifBands(importedData.nhifBands);
        if (importedData.statutoryRates)
          setStatutoryRates(importedData.statutoryRates);
        if (importedData.complianceRules)
          setComplianceRules(importedData.complianceRules);
        alert("Statutory rates imported successfully!");
      } catch (error) {
        alert("Error importing rates. Please check the file format.");
      }
    };
    reader.readAsText(file);
  };

  const calculatePAYE = (grossSalary: number): number => {
    let totalTax = 0;
    let remainingAmount = grossSalary;

    for (const bracket of taxBrackets
      .filter((b) => b.isActive)
      .sort((a, b) => a.minAmount - b.minAmount)) {
      if (remainingAmount <= 0) break;

      const taxableInThisBracket = Math.min(
        remainingAmount,
        bracket.maxAmount - bracket.minAmount + 1,
      );

      if (taxableInThisBracket > 0) {
        totalTax += (taxableInThisBracket * bracket.rate) / 100;
        remainingAmount -= taxableInThisBracket;
      }
    }

    return Math.max(0, totalTax - 2400); // Subtract personal relief
  };

  const calculateNHIF = (grossSalary: number): number => {
    const band = nhifBands.find(
      (b) =>
        b.isActive && grossSalary >= b.minSalary && grossSalary <= b.maxSalary,
    );
    return band ? band.contribution : 0;
  };

  const getRuleTypeColor = (type: string) => {
    switch (type) {
      case "mandatory":
        return "bg-red-100 text-red-800";
      case "optional":
        return "bg-blue-100 text-blue-800";
      case "conditional":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getAuthorityColor = (authority: string) => {
    switch (authority) {
      case "KRA":
        return "bg-purple-100 text-purple-800";
      case "NHIF":
        return "bg-green-100 text-green-800";
      case "NSSF":
        return "bg-blue-100 text-blue-800";
      case "HELB":
        return "bg-orange-100 text-orange-800";
      case "NITA":
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Statutory Rates & Compliance
          </h1>
          <p className="text-gray-600">
            Configure tax brackets and statutory deduction rates
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastSaved && (
            <div className="text-sm text-gray-500">
              Last saved: {new Date(lastSaved).toLocaleString()}
            </div>
          )}
          <Badge
            className={
              canManageRates
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }
          >
            <Shield className="w-4 h-4 mr-1" />
            {canManageRates ? "Full Access" : "Read Only"}
          </Badge>
        </div>
      </div>

      {/* Main Interface */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="paye">PAYE Tax</TabsTrigger>
          <TabsTrigger value="nhif">NHIF</TabsTrigger>
          <TabsTrigger value="statutory">Other Statutory</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>

        {/* PAYE Tax Brackets */}
        <TabsContent value="paye" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Percent className="w-5 h-5" />
                  PAYE Tax Brackets (2024)
                </div>
                {canManageRates && (
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Bracket
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Band Name</TableHead>
                    <TableHead>Income Range (KES)</TableHead>
                    <TableHead>Tax Rate (%)</TableHead>
                    <TableHead>Personal Relief</TableHead>
                    <TableHead>Effective Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taxBrackets.map((bracket) => (
                    <TableRow key={bracket.id}>
                      <TableCell className="font-medium">
                        {bracket.name}
                      </TableCell>
                      <TableCell>
                        {formatKES(bracket.minAmount)} -{" "}
                        {bracket.maxAmount === 999999999
                          ? "No Limit"
                          : formatKES(bracket.maxAmount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{bracket.rate}%</Badge>
                      </TableCell>
                      <TableCell>{formatKES(bracket.personalRelief)}</TableCell>
                      <TableCell>
                        {new Date(bracket.effectiveDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={bracket.isActive ? "default" : "secondary"}
                        >
                          {bracket.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {canManageRates && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleRate(bracket.id, "tax")}
                            >
                              {bracket.isActive ? (
                                <XCircle className="w-4 h-4" />
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {canManageRates && (
                <div className="flex justify-end mt-4">
                  <Button
                    onClick={() => saveRates("PAYE Tax")}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Tax Brackets
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              PAYE tax brackets are set by KRA and should only be updated when
              official rates change. Personal relief is currently KES 2,400 per
              month as per Finance Act 2023.
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* NHIF Bands */}
        <TabsContent value="nhif" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  NHIF Contribution Bands
                </div>
                {canManageRates && (
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Band
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Band</TableHead>
                    <TableHead>Salary Range (KES)</TableHead>
                    <TableHead>Monthly Contribution (KES)</TableHead>
                    <TableHead>Effective Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nhifBands.slice(0, 10).map((band) => (
                    <TableRow key={band.id}>
                      <TableCell className="font-medium">
                        Band {band.id}
                      </TableCell>
                      <TableCell>
                        {formatKES(band.minSalary)} -{" "}
                        {band.maxSalary === 999999999
                          ? "Above"
                          : formatKES(band.maxSalary)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {formatKES(band.contribution)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(band.effectiveDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={band.isActive ? "default" : "secondary"}
                        >
                          {band.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {canManageRates && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleRate(band.id, "nhif")}
                            >
                              {band.isActive ? (
                                <XCircle className="w-4 h-4" />
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4 text-center">
                <Button variant="outline">
                  View All {nhifBands.length} NHIF Bands
                </Button>
              </div>

              {canManageRates && (
                <div className="flex justify-end mt-4">
                  <Button onClick={() => saveRates("NHIF")} disabled={isSaving}>
                    {isSaving ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save NHIF Bands
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              NHIF contribution bands are set by the National Hospital Insurance
              Fund. Contributions are mandatory for all employees earning above
              KES 1,000 per month.
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* Other Statutory Rates */}
        <TabsContent value="statutory" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Other Statutory Rates
                </div>
                {canManageRates && (
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Rate
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rate Name</TableHead>
                    <TableHead>Authority</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Calculation</TableHead>
                    <TableHead>Effective Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statutoryRates.map((rate) => (
                    <TableRow key={rate.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{rate.name}</div>
                          <div className="text-sm text-gray-500">
                            {rate.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getAuthorityColor(rate.authority)}>
                          {rate.authority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {rate.rateType === "percentage"
                            ? `${rate.rate}%`
                            : rate.rateType === "fixed"
                              ? formatKES(rate.rate)
                              : "Tiered"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{rate.rateType}</Badge>
                      </TableCell>
                      <TableCell className="max-w-48 truncate text-sm">
                        {rate.calculation}
                      </TableCell>
                      <TableCell>
                        {new Date(rate.effectiveDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={rate.isActive ? "default" : "secondary"}
                        >
                          {rate.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {canManageRates && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleRate(rate.id, "statutory")}
                            >
                              {rate.isActive ? (
                                <XCircle className="w-4 h-4" />
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {canManageRates && (
                <div className="flex justify-end mt-4">
                  <Button
                    onClick={() => saveRates("Statutory Rates")}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Statutory Rates
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Rules */}
        <TabsContent value="compliance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Compliance Rules & Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule</TableHead>
                    <TableHead>Authority</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Penalty</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complianceRules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{rule.name}</div>
                          <div className="text-sm text-gray-500">
                            {rule.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getAuthorityColor(rule.authority)}>
                          {rule.authority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRuleTypeColor(rule.ruleType)}>
                          {rule.ruleType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          {rule.deadline}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-red-600">
                        {rule.penalty}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={rule.isActive ? "default" : "secondary"}
                        >
                          {rule.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Compliance with statutory requirements is mandatory. Late filings
              and payments attract penalties. Ensure all deadlines are met to
              avoid additional charges.
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* Tax Calculator */}
        <TabsContent value="calculator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Statutory Deductions Calculator
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="grossSalary">Gross Salary (KES)</Label>
                    <Input
                      id="grossSalary"
                      type="number"
                      placeholder="Enter gross salary"
                      onChange={(e) => {
                        const salary = Number(e.target.value);
                        if (salary > 0) {
                          // Calculate and display results
                          const paye = calculatePAYE(salary);
                          const nhif = calculateNHIF(salary);
                          const nssf = Math.min(salary * 0.06, 2160);
                          const housingLevy = salary * 0.015;

                          document.getElementById("paye-result")!.textContent =
                            formatKES(paye);
                          document.getElementById("nhif-result")!.textContent =
                            formatKES(nhif);
                          document.getElementById("nssf-result")!.textContent =
                            formatKES(nssf);
                          document.getElementById(
                            "housing-result",
                          )!.textContent = formatKES(housingLevy);
                          document.getElementById(
                            "total-deductions",
                          )!.textContent = formatKES(
                            paye + nhif + nssf + housingLevy,
                          );
                          document.getElementById("net-salary")!.textContent =
                            formatKES(
                              salary - (paye + nhif + nssf + housingLevy),
                            );
                        }
                      }}
                    />
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      This calculator uses current statutory rates. Results are
                      for estimation purposes only.
                    </AlertDescription>
                  </Alert>
                </div>

                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>PAYE Tax:</span>
                      <span id="paye-result" className="font-medium">
                        KES 0
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>NHIF:</span>
                      <span id="nhif-result" className="font-medium">
                        KES 0
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>NSSF:</span>
                      <span id="nssf-result" className="font-medium">
                        KES 0
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Housing Levy:</span>
                      <span id="housing-result" className="font-medium">
                        KES 0
                      </span>
                    </div>
                    <hr />
                    <div className="flex justify-between font-medium">
                      <span>Total Deductions:</span>
                      <span id="total-deductions" className="text-red-600">
                        KES 0
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Net Salary:</span>
                      <span id="net-salary" className="text-green-600">
                        KES 0
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Logs */}
        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Audit Logs
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={exportRates}>
                    <Download className="w-4 h-4 mr-2" />
                    Export Rates
                  </Button>
                  {canManageRates && (
                    <>
                      <input
                        type="file"
                        accept=".json"
                        onChange={importRates}
                        className="hidden"
                        id="import-rates"
                      />
                      <label htmlFor="import-rates">
                        <Button variant="outline" size="sm" asChild>
                          <span>
                            <Upload className="w-4 h-4 mr-2" />
                            Import Rates
                          </span>
                        </Button>
                      </label>
                    </>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Performed By</TableHead>
                    <TableHead>Changes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.action}</Badge>
                      </TableCell>
                      <TableCell>{log.description}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{log.category}</Badge>
                      </TableCell>
                      <TableCell>{log.performedBy}</TableCell>
                      <TableCell>
                        {log.oldValue && log.newValue && (
                          <div className="text-sm">
                            <span className="text-red-600">{log.oldValue}</span>{" "}
                            →{" "}
                            <span className="text-green-600">
                              {log.newValue}
                            </span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Kenya Tax Calculation Utilities
 * Based on Kenya Revenue Authority (KRA) tax brackets and rates
 */

export interface KenyaTaxBracket {
  min: number;
  max: number;
  rate: number;
  cumulativeMax: number;
}

// Kenya PAYE Tax Brackets 2025 (Annual amounts in KES)
export const KENYA_TAX_BRACKETS: KenyaTaxBracket[] = [
  { min: 0, max: 288000, rate: 0.10, cumulativeMax: 28800 },
  { min: 288001, max: 388000, rate: 0.25, cumulativeMax: 53800 },
  { min: 388001, max: 6000000, rate: 0.30, cumulativeMax: 1737400 },
  { min: 6000001, max: 9600000, rate: 0.325, cumulativeMax: 2907400 },
  { min: 9600001, max: Infinity, rate: 0.35, cumulativeMax: Infinity }
];

// Kenya tax constants (2025)
export const KENYA_TAX_CONSTANTS = {
  PERSONAL_RELIEF: 28800, // Annual personal relief in KES
  INSURANCE_RELIEF_LIMIT: 60000, // Maximum insurance relief per year
  PENSION_RELIEF_RATE: 0.30, // 30% of pension contribution
  PENSION_RELIEF_LIMIT: 240000, // Maximum pension relief per year
  
  // SHIF rates (monthly) - Social Health Insurance Fund
  SHIF_RATES: [
    { min: 0, max: 5999, amount: 150 },
    { min: 6000, max: 7999, amount: 300 },
    { min: 8000, max: 11999, amount: 400 },
    { min: 12000, max: 14999, amount: 500 },
    { min: 15000, max: 19999, amount: 600 },
    { min: 20000, max: 24999, amount: 750 },
    { min: 25000, max: 29999, amount: 850 },
    { min: 30000, max: 34999, amount: 900 },
    { min: 35000, max: 39999, amount: 950 },
    { min: 40000, max: 44999, amount: 1000 },
    { min: 45000, max: 49999, amount: 1100 },
    { min: 50000, max: 59999, amount: 1200 },
    { min: 60000, max: 69999, amount: 1300 },
    { min: 70000, max: 79999, amount: 1400 },
    { min: 80000, max: 89999, amount: 1500 },
    { min: 90000, max: 99999, amount: 1600 },
    { min: 100000, max: Infinity, amount: 1700 }
  ],
  
  // NSSF rates (2025)
  NSSF_TIER_1_RATE: 0.06, // 6% of pensionable earnings (max KES 1080)
  NSSF_TIER_1_LIMIT: 18000, // Monthly limit for tier 1
  NSSF_TIER_2_RATE: 0.06, // 6% of pensionable earnings above tier 1
  NSSF_TIER_2_LIMIT: 18000, // Monthly limit for tier 2 (KES 18,000)
  
  // Housing Levy (2025)
  HOUSING_LEVY_RATE: 0.015, // 1.5% of gross salary
  HOUSING_LEVY_LIMIT: 5000, // Maximum monthly deduction
};

export interface KenyaTaxCalculationResult {
  grossSalary: number;
  pensionContribution: number;
  taxableIncome: number;
  payeTax: number;
  personalRelief: number;
  netTax: number;
  shifDeduction: number;
  nssfTier1: number;
  nssfTier2: number;
  totalNssf: number;
  housingLevy: number;
  totalDeductions: number;
  netSalary: number;
}

/**
 * Calculate PAYE tax for Kenya
 */
export function calculateKenyaPAYE(annualIncome: number): { tax: number; bracket: string } {
  let tax = 0;
  let bracket = '';
  
  for (const taxBracket of KENYA_TAX_BRACKETS) {
    if (annualIncome > taxBracket.min) {
      const taxableInThisBracket = Math.min(
        annualIncome - taxBracket.min + 1,
        taxBracket.max - taxBracket.min + 1
      );
      tax += taxableInThisBracket * (taxBracket.rate / 100);
      bracket = `${taxBracket.rate}%`;
    }
    
    if (annualIncome <= taxBracket.max) {
      break;
    }
  }
  
  return { tax, bracket };
}

/**
 * Calculate SHIF deduction based on gross salary
 */
export function calculateSHIF(grossSalary: number): number {
  for (const rate of KENYA_TAX_CONSTANTS.SHIF_RATES) {
    if (grossSalary >= rate.min && grossSalary <= rate.max) {
      return rate.amount;
    }
  }
  return 0;
}

/**
 * Calculate NSSF deduction
 */
export function calculateNSSF(grossSalary: number): { tier1: number; tier2: number; total: number } {
  // Tier 1: 6% of first KES 18,000
  const tier1Base = Math.min(grossSalary, KENYA_TAX_CONSTANTS.NSSF_TIER_1_LIMIT);
  const tier1 = tier1Base * KENYA_TAX_CONSTANTS.NSSF_TIER_1_RATE;
  
  // Tier 2: 6% of next KES 18,000 (if salary > KES 18,000)
  const tier2Base = Math.max(0, Math.min(grossSalary - KENYA_TAX_CONSTANTS.NSSF_TIER_1_LIMIT, KENYA_TAX_CONSTANTS.NSSF_TIER_2_LIMIT));
  const tier2 = tier2Base * KENYA_TAX_CONSTANTS.NSSF_TIER_2_RATE;
  
  return {
    tier1: Math.round(tier1),
    tier2: Math.round(tier2),
    total: Math.round(tier1 + tier2)
  };
}

/**
 * Calculate Housing Levy
 */
export function calculateHousingLevy(grossSalary: number): number {
  const levy = grossSalary * KENYA_TAX_CONSTANTS.HOUSING_LEVY_RATE;
  return Math.min(levy, KENYA_TAX_CONSTANTS.HOUSING_LEVY_LIMIT);
}

/**
 * Complete Kenya payroll calculation
 */
export function calculateKenyaPayroll(
  grossMonthlySalary: number,
  pensionContributionRate: number = 0.05
): KenyaTaxCalculationResult {
  const annualGross = grossMonthlySalary * 12;
  
  // Calculate pension contribution
  const pensionContribution = grossMonthlySalary * pensionContributionRate;
  
  // Calculate NSSF
  const nssf = calculateNSSF(grossMonthlySalary);
  
  // Taxable income (after pension and NSSF deductions)
  const monthlyTaxableIncome = grossMonthlySalary - pensionContribution - nssf.total;
  const annualTaxableIncome = monthlyTaxableIncome * 12;
  
  // Calculate PAYE tax
  const payeResult = calculateKenyaPAYE(annualTaxableIncome);
  const monthlyPayeTax = payeResult.tax / 12;
  
  // Personal relief (monthly)
  const monthlyPersonalRelief = KENYA_TAX_CONSTANTS.PERSONAL_RELIEF / 12;
  
  // Net tax after personal relief
  const netTax = Math.max(0, monthlyPayeTax - monthlyPersonalRelief);
  
  // Calculate other deductions
  const shifDeduction = calculateSHIF(grossMonthlySalary);
  const housingLevy = calculateHousingLevy(grossMonthlySalary);

  // Total deductions
  const totalDeductions = netTax + shifDeduction + nssf.total + housingLevy + pensionContribution;
  
  // Net salary
  const netSalary = grossMonthlySalary - totalDeductions;
  
  return {
    grossSalary: grossMonthlySalary,
    pensionContribution: Math.round(pensionContribution),
    taxableIncome: Math.round(monthlyTaxableIncome),
    payeTax: Math.round(monthlyPayeTax),
    personalRelief: Math.round(monthlyPersonalRelief),
    netTax: Math.round(netTax),
    shifDeduction: shifDeduction,
    nssfTier1: nssf.tier1,
    nssfTier2: nssf.tier2,
    totalNssf: nssf.total,
    housingLevy: Math.round(housingLevy),
    totalDeductions: Math.round(totalDeductions),
    netSalary: Math.round(netSalary)
  };
}

/**
 * Format Kenya Shillings
 */
export function formatKES(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

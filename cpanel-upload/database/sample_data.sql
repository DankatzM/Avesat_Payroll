-- Sample Data for Avesat Payroll System
-- This file inserts initial data for testing and demo purposes

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- =====================================================
-- DEFAULT USERS
-- =====================================================

INSERT INTO `users` (`id`, `email`, `firstName`, `lastName`, `role`, `department`, `password_hash`) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'admin@avesat.com', 'System', 'Administrator', 'admin', 'IT', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('550e8400-e29b-41d4-a716-446655440002', 'hr@avesat.com', 'Grace', 'Wanjiku', 'hr_manager', 'Human Resources', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('550e8400-e29b-41d4-a716-446655440003', 'payroll@avesat.com', 'John', 'Mwangi', 'payroll_officer', 'Finance', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('550e8400-e29b-41d4-a716-446655440004', 'manager@avesat.com', 'Peter', 'Kiprotich', 'manager', 'Operations', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('550e8400-e29b-41d4-a716-446655440005', 'employee@avesat.com', 'Mary', 'Achieng', 'employee', 'Sales', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- =====================================================
-- EMPLOYEES
-- =====================================================

INSERT INTO `employees` (`id`, `employee_number`, `user_id`, `first_name`, `last_name`, `email`, `phone`, `national_id`, `hire_date`, `position`, `department`, `salary`) VALUES
('550e8400-e29b-41d4-a716-446655440101', 'EMP001', '550e8400-e29b-41d4-a716-446655440003', 'John', 'Mwangi', 'john.mwangi@avesat.com', '+254700123456', '12345678', '2020-01-15', 'Payroll Officer', 'Finance', 150000.00),
('550e8400-e29b-41d4-a716-446655440102', 'EMP002', '550e8400-e29b-41d4-a716-446655440002', 'Grace', 'Wanjiku', 'grace.wanjiku@avesat.com', '+254700234567', '23456789', '2018-03-20', 'HR Manager', 'Human Resources', 200000.00),
('550e8400-e29b-41d4-a716-446655440103', 'EMP003', '550e8400-e29b-41d4-a716-446655440004', 'Peter', 'Kiprotich', 'peter.kiprotich@avesat.com', '+254700345678', '34567890', '2019-06-10', 'Operations Manager', 'Operations', 300000.00),
('550e8400-e29b-41d4-a716-446655440104', 'EMP004', '550e8400-e29b-41d4-a716-446655440005', 'Mary', 'Achieng', 'mary.achieng@avesat.com', '+254700456789', '45678901', '2021-08-01', 'Sales Executive', 'Sales', 80000.00),
('550e8400-e29b-41d4-a716-446655440105', 'EMP005', NULL, 'Samuel', 'Otieno', 'samuel.otieno@avesat.com', '+254700567890', '56789012', '2022-11-15', 'Senior Developer', 'IT', 450000.00);

-- =====================================================
-- EMPLOYEE BANK DETAILS
-- =====================================================

INSERT INTO `employee_bank_details` (`id`, `employee_id`, `bank_name`, `account_number`, `sort_code`, `account_holder_name`) VALUES
('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440101', 'Equity Bank', '1234567890', '68000', 'John Mwangi'),
('550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440102', 'KCB Bank', '2345678901', '01000', 'Grace Wanjiku'),
('550e8400-e29b-41d4-a716-446655440203', '550e8400-e29b-41d4-a716-446655440103', 'Cooperative Bank', '3456789012', '11000', 'Peter Kiprotich'),
('550e8400-e29b-41d4-a716-446655440204', '550e8400-e29b-41d4-a716-446655440104', 'NCBA Bank', '4567890123', '07000', 'Mary Achieng'),
('550e8400-e29b-41d4-a716-446655440205', '550e8400-e29b-41d4-a716-446655440105', 'Standard Chartered', '5678901234', '02000', 'Samuel Otieno');

-- =====================================================
-- EMPLOYEE TAX INFORMATION
-- =====================================================

INSERT INTO `employee_tax_info` (`id`, `employee_id`, `kra_pin`, `nhif_number`, `nssf_number`) VALUES
('550e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440101', 'A123456789P', 'NHIF001234567', 'NSSF001234567'),
('550e8400-e29b-41d4-a716-446655440302', '550e8400-e29b-41d4-a716-446655440102', 'A987654321P', 'NHIF001234568', 'NSSF001234568'),
('550e8400-e29b-41d4-a716-446655440303', '550e8400-e29b-41d4-a716-446655440103', 'A555666777P', 'NHIF001234569', 'NSSF001234569'),
('550e8400-e29b-41d4-a716-446655440304', '550e8400-e29b-41d4-a716-446655440104', 'A111222333P', 'NHIF001234570', 'NSSF001234570'),
('550e8400-e29b-41d4-a716-446655440305', '550e8400-e29b-41d4-a716-446655440105', 'A888999000P', 'NHIF001234571', 'NSSF001234571');

-- =====================================================
-- SALARY COMPONENTS
-- =====================================================

INSERT INTO `salary_components` (`id`, `name`, `code`, `type`, `category`, `is_taxable`, `is_fixed`) VALUES
('550e8400-e29b-41d4-a716-446655440401', 'Basic Salary', 'BASIC', 'earning', 'basic', 1, 1),
('550e8400-e29b-41d4-a716-446655440402', 'House Allowance', 'HOUSE_ALW', 'earning', 'allowance', 1, 0),
('550e8400-e29b-41d4-a716-446655440403', 'Transport Allowance', 'TRANSPORT_ALW', 'earning', 'allowance', 1, 0),
('550e8400-e29b-41d4-a716-446655440404', 'Medical Allowance', 'MEDICAL_ALW', 'earning', 'allowance', 0, 0),
('550e8400-e29b-41d4-a716-446655440405', 'Overtime Pay', 'OVERTIME', 'earning', 'overtime', 1, 0),
('550e8400-e29b-41d4-a716-446655440406', 'PAYE Tax', 'PAYE', 'deduction', 'tax', 0, 0),
('550e8400-e29b-41d4-a716-446655440407', 'SHIF Contribution', 'SHIF', 'deduction', 'insurance', 0, 0),
('550e8400-e29b-41d4-a716-446655440408', 'NSSF Contribution', 'NSSF', 'deduction', 'insurance', 0, 0),
('550e8400-e29b-41d4-a716-446655440409', 'Housing Levy', 'HOUSING_LEVY', 'deduction', 'other', 0, 0);

-- =====================================================
-- SALARY GRADES
-- =====================================================

INSERT INTO `salary_grades` (`id`, `name`, `code`, `min_salary`, `max_salary`, `description`) VALUES
('550e8400-e29b-41d4-a716-446655440501', 'Entry Level', 'GRADE_1', 30000.00, 80000.00, 'Entry level positions'),
('550e8400-e29b-41d4-a716-446655440502', 'Junior Level', 'GRADE_2', 70000.00, 150000.00, 'Junior level positions'),
('550e8400-e29b-41d4-a716-446655440503', 'Mid Level', 'GRADE_3', 140000.00, 300000.00, 'Mid level positions'),
('550e8400-e29b-41d4-a716-446655440504', 'Senior Level', 'GRADE_4', 280000.00, 500000.00, 'Senior level positions'),
('550e8400-e29b-41d4-a716-446655440505', 'Executive Level', 'GRADE_5', 450000.00, 1000000.00, 'Executive level positions');

-- =====================================================
-- TAX BRACKETS (2025)
-- =====================================================

INSERT INTO `tax_brackets` (`id`, `min_income`, `max_income`, `rate`, `description`, `effective_date`, `created_by`) VALUES
('550e8400-e29b-41d4-a716-446655440601', 0.00, 288000.00, 0.1000, 'KRA 2025 Tax Bracket 1', '2025-01-01', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440602', 288001.00, 388000.00, 0.2500, 'KRA 2025 Tax Bracket 2', '2025-01-01', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440603', 388001.00, 6000000.00, 0.3000, 'KRA 2025 Tax Bracket 3', '2025-01-01', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440604', 6000001.00, 9600000.00, 0.3250, 'KRA 2025 Tax Bracket 4', '2025-01-01', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440605', 9600001.00, 999999999.00, 0.3500, 'KRA 2025 Tax Bracket 5', '2025-01-01', '550e8400-e29b-41d4-a716-446655440001');

-- =====================================================
-- SHIF RATES (2025)
-- =====================================================

INSERT INTO `shif_rates` (`id`, `min_salary`, `max_salary`, `amount`, `description`, `effective_date`, `created_by`) VALUES
('550e8400-e29b-41d4-a716-446655440701', 0.00, 5999.00, 150.00, 'SHIF Band 1', '2025-01-01', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440702', 6000.00, 7999.00, 300.00, 'SHIF Band 2', '2025-01-01', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440703', 8000.00, 11999.00, 400.00, 'SHIF Band 3', '2025-01-01', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440704', 12000.00, 14999.00, 500.00, 'SHIF Band 4', '2025-01-01', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440705', 15000.00, 19999.00, 600.00, 'SHIF Band 5', '2025-01-01', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440706', 20000.00, 24999.00, 750.00, 'SHIF Band 6', '2025-01-01', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440707', 25000.00, 29999.00, 850.00, 'SHIF Band 7', '2025-01-01', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440708', 30000.00, 34999.00, 900.00, 'SHIF Band 8', '2025-01-01', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440709', 35000.00, 39999.00, 950.00, 'SHIF Band 9', '2025-01-01', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440710', 40000.00, 44999.00, 1000.00, 'SHIF Band 10', '2025-01-01', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440711', 45000.00, 49999.00, 1100.00, 'SHIF Band 11', '2025-01-01', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440712', 50000.00, 59999.00, 1200.00, 'SHIF Band 12', '2025-01-01', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440713', 60000.00, 69999.00, 1300.00, 'SHIF Band 13', '2025-01-01', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440714', 70000.00, 79999.00, 1400.00, 'SHIF Band 14', '2025-01-01', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440715', 80000.00, 89999.00, 1500.00, 'SHIF Band 15', '2025-01-01', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440716', 90000.00, 99999.00, 1600.00, 'SHIF Band 16', '2025-01-01', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440717', 100000.00, 999999999.00, 1700.00, 'SHIF Band 17', '2025-01-01', '550e8400-e29b-41d4-a716-446655440001');

-- =====================================================
-- NSSF TIERS (2025)
-- =====================================================

INSERT INTO `nssf_tiers` (`id`, `tier_name`, `min_pensionable_earnings`, `max_pensionable_earnings`, `employee_rate`, `employer_rate`, `max_monthly_contribution`, `description`, `effective_date`, `created_by`) VALUES
('550e8400-e29b-41d4-a716-446655440801', 'Tier I', 0.00, 18000.00, 6.00, 6.00, 1080.00, 'NSSF Tier I - Lower earnings band', '2025-01-01', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440802', 'Tier II', 18001.00, 36000.00, 6.00, 6.00, 1080.00, 'NSSF Tier II - Higher earnings band', '2025-01-01', '550e8400-e29b-41d4-a716-446655440001');

-- =====================================================
-- HOUSING LEVY RATES (2025)
-- =====================================================

INSERT INTO `housing_levy_rates` (`id`, `rate_name`, `levy_rate`, `max_monthly_deduction`, `min_salary_threshold`, `description`, `effective_date`, `created_by`) VALUES
('550e8400-e29b-41d4-a716-446655440901', 'Standard Housing Levy', 1.50, 5000.00, 0.00, 'Standard housing development levy for all employees', '2025-01-01', '550e8400-e29b-41d4-a716-446655440001');

-- =====================================================
-- LEAVE TYPES
-- =====================================================

INSERT INTO `leave_types` (`id`, `name`, `code`, `days_per_year`, `carry_forward`, `max_carry_forward`, `is_paid`, `requires_approval`) VALUES
('550e8400-e29b-41d4-a716-446655441001', 'Annual Leave', 'ANNUAL', 21, 1, 5, 1, 1),
('550e8400-e29b-41d4-a716-446655441002', 'Sick Leave', 'SICK', 7, 0, 0, 1, 0),
('550e8400-e29b-41d4-a716-446655441003', 'Maternity Leave', 'MATERNITY', 90, 0, 0, 1, 1),
('550e8400-e29b-41d4-a716-446655441004', 'Paternity Leave', 'PATERNITY', 14, 0, 0, 1, 1),
('550e8400-e29b-41d4-a716-446655441005', 'Study Leave', 'STUDY', 30, 0, 0, 0, 1),
('550e8400-e29b-41d4-a716-446655441006', 'Compassionate Leave', 'COMPASSIONATE', 3, 0, 0, 1, 1);

-- =====================================================
-- SYSTEM SETTINGS
-- =====================================================

INSERT INTO `system_settings` (`id`, `setting_key`, `setting_value`, `description`, `data_type`, `is_public`, `updated_by`) VALUES
('550e8400-e29b-41d4-a716-446655441101', 'company_name', 'Avesat Systems Ltd', 'Company name', 'string', 1, '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655441102', 'company_address', 'Nairobi, Kenya', 'Company address', 'string', 1, '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655441103', 'payroll_frequency', 'monthly', 'Default payroll frequency', 'string', 0, '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655441104', 'tax_year', '2025', 'Current tax year', 'number', 1, '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655441105', 'personal_relief', '28800', 'Annual personal relief amount', 'number', 1, '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655441106', 'currency', 'KES', 'System currency', 'string', 1, '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655441107', 'working_days_per_month', '22', 'Standard working days per month', 'number', 1, '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655441108', 'overtime_rate', '1.5', 'Overtime rate multiplier', 'number', 0, '550e8400-e29b-41d4-a716-446655440001');

COMMIT;

-- Note: The password for all sample users is 'password123'
-- In production, use proper password hashing and secure passwords

# cPanel Deployment Guide for Avesat Payroll System

This guide will help you deploy the Avesat Payroll System on cPanel hosting.

## Prerequisites

- cPanel hosting account with PHP 7.4+ and MySQL/MariaDB
- Domain name configured
- FTP/File Manager access
- Database creation privileges

## Step 1: Database Setup

### 1.1 Create Database and User

1. Log into your cPanel account
2. Go to **MySQL Databases**
3. Create a new database (e.g., `yourusername_avesat_payroll`)
4. Create a new MySQL user with a strong password
5. Add the user to the database with **ALL PRIVILEGES**
6. Note down the database details:
   - Database name: `yourusername_avesat_payroll`
   - Username: `yourusername_dbuser`
   - Password: `your_secure_password`
   - Host: `localhost`

### 1.2 Import Database Schema

1. Go to **phpMyAdmin** in cPanel
2. Select your database
3. Go to **Import** tab
4. Upload and execute `database/schema.sql`
5. Upload and execute `database/sample_data.sql` (optional, for demo data)

## Step 2: File Upload

### 2.1 Upload Application Files

1. Using **File Manager** or FTP client:
   - Upload all files to your domain's `public_html` directory
   - Ensure proper file permissions (644 for files, 755 for directories)

### 2.2 Directory Structure

```
public_html/
├── api/                    # PHP backend files
│   ├── config/
│   ├── endpoints/
│   └── index.php
├── assets/                 # Built frontend assets (after build)
├── database/              # Database files (remove after setup)
├── .htaccess             # Apache configuration
├── .env                  # Environment configuration
├── index.html           # Main application entry point
└── ...other frontend files
```

## Step 3: Configuration

### 3.1 Environment Configuration

1. Copy `.env.example` to `.env`
2. Update database credentials:
   ```
   DB_HOST=localhost
   DB_USERNAME=yourusername_dbuser
   DB_PASSWORD=your_secure_password
   DB_DATABASE=yourusername_avesat_payroll
   ```
3. Generate a secure JWT secret (minimum 32 characters)
4. Update company information and other settings

### 3.2 Security Configuration

1. **Remove database files** after setup:

   ```bash
   rm -rf database/
   ```

2. **Update file permissions**:

   ```bash
   chmod 600 .env
   chmod 644 api/config/*.php
   chmod 755 api/
   ```

3. **Update JWT secret** in `.env`:
   ```
   JWT_SECRET=your-unique-32-character-secret-key-here
   ```

## Step 4: Frontend Build

### 4.1 Local Build (if not pre-built)

If you need to build the frontend locally:

```bash
# Install dependencies
npm install

# Build for cPanel
npm run build:cpanel

# Upload dist/cpanel/* to public_html/
```

### 4.2 Update API Endpoint

Update the frontend to point to your cPanel API:

1. Find API configuration in the frontend code
2. Update base URL to: `https://yourdomain.com/api/`

## Step 5: Testing

### 5.1 Test Database Connection

Visit: `https://yourdomain.com/api/health`

Should return:

```json
{
  "status": "ok",
  "database": "connected"
}
```

### 5.2 Test Authentication

**Login Test:**

```bash
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@avesat.com","password":"password123"}'
```

### 5.3 Test Frontend

Visit: `https://yourdomain.com`

Default login credentials (change immediately):

- Email: `admin@avesat.com`
- Password: `password123`

## Step 6: Production Setup

### 6.1 Change Default Passwords

1. Login with default credentials
2. Go to User Management
3. Update admin password
4. Create new users as needed

### 6.2 Security Hardening

1. **Remove demo data** (if imported):

   ```sql
   -- Connect to phpMyAdmin and run:
   DELETE FROM users WHERE email = 'admin@avesat.com';
   -- Add your admin user
   ```

2. **Update .htaccess** for your domain

3. **Enable SSL** in cPanel if available

### 6.3 Backup Setup

1. Enable cPanel automatic backups
2. Set up database backups via cron jobs:
   ```bash
   # Add to cPanel Cron Jobs (daily at 2 AM)
   0 2 * * * mysqldump -u username -p'password' database_name > backup_$(date +\%Y\%m\%d).sql
   ```

## Step 7: Maintenance

### 7.1 Regular Updates

- Check for application updates
- Monitor error logs in cPanel
- Regular database backups
- Security updates

### 7.2 Monitoring

- Check `Error Logs` in cPanel regularly
- Monitor database size and performance
- Review audit logs for security

## Troubleshooting

### Common Issues

1. **Database Connection Failed**

   - Verify database credentials in `.env`
   - Check if database user has proper privileges
   - Ensure database exists

2. **Permission Denied**

   - Check file permissions (644/755)
   - Verify `.env` file exists and is readable

3. **API Endpoints Not Working**

   - Check `.htaccess` file is uploaded
   - Verify mod_rewrite is enabled
   - Check error logs

4. **Frontend Not Loading**
   - Ensure all built files are uploaded
   - Check console for JavaScript errors
   - Verify API endpoint URLs

### Error Logs

Check cPanel Error Logs for detailed error information:

- cPanel → Error Logs
- Look for PHP errors and API request errors

### Database Issues

Access phpMyAdmin to:

- Check table structure
- Verify data integrity
- Run SQL queries for debugging

## Security Checklist

- [ ] Changed default passwords
- [ ] Removed database setup files
- [ ] Updated JWT secret
- [ ] Configured proper file permissions
- [ ] Enabled SSL certificate
- [ ] Configured backup system
- [ ] Reviewed error logs
- [ ] Tested all major functionality

## Support

For issues specific to this deployment:

1. Check error logs first
2. Verify configuration settings
3. Test database connectivity
4. Review file permissions

For cPanel-specific issues, contact your hosting provider.

## Performance Optimization

### PHP Configuration

Add to `.htaccess` for better performance:

```apache
# PHP optimizations
php_value memory_limit 256M
php_value max_execution_time 300
php_value upload_max_filesize 10M
php_value post_max_size 10M
```

### Database Optimization

- Regular database optimization via phpMyAdmin
- Monitor slow query logs
- Consider database indexing for large datasets

---

**Note**: Replace all placeholder values (yourdomain.com, yourusername, etc.) with your actual values.

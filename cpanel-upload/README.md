# Avesat Payroll System - cPanel Upload Package

This folder contains all the files needed to deploy the Avesat Payroll System to cPanel hosting.

## Quick Deployment Steps

1. **Database Setup**
   - Create MySQL database in cPanel
   - Import `database/schema.sql`
   - Optionally import `database/sample_data.sql` for demo data

2. **File Upload**
   - Upload all contents of this folder to your `public_html` directory
   - Ensure proper file permissions (644 for files, 755 for directories)

3. **Configuration**
   - Copy `.env.example` to `.env`
   - Update database credentials in `.env`
   - Update company information in `.env`

4. **Security**
   - Change default passwords immediately
   - Remove `database/` folder after setup
   - Set `.env` file permissions to 600

## Folder Structure

```
cpanel-upload/
├── api/                 # PHP backend API
│   ├── config/         # Database and auth configuration
│   ├── endpoints/      # API endpoint handlers
│   └── index.php       # Main API router
├── database/           # Database setup files (remove after setup)
│   ├── schema.sql      # Database structure
│   └── sample_data.sql # Demo data (optional)
├── assets/             # Frontend assets (populated after build)
├── .htaccess           # Apache configuration
├── .env.example        # Environment configuration template
├── index.html          # Main application entry (created after build)
└── README.md           # This file
```

## Default Login (Change Immediately)

- **Email**: admin@avesat.com
- **Password**: password123

## Support

For detailed deployment instructions, see the main project documentation.

## Security Notes

- Always use HTTPS in production
- Change all default passwords
- Remove database files after setup
- Set up regular backups
- Monitor error logs regularly

---

**Important**: This package is ready for cPanel deployment. Follow the steps above for successful installation.

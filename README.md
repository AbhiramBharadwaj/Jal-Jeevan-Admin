# Water Management System Backend

A comprehensive backend system for managing water billing and administration across Gram Panchayats in India. Built with Node.js, Express, and MongoDB.

## 🌟 Features

### Super Admin Features
- **Dashboard**: Overview of all Gram Panchayats, villages, and houses
- **Gram Panchayat Management**: Create, view, update, and delete Gram Panchayats
- **Admin Management**: Create and manage GP admins for each Gram Panchayat
- **Super Admin Management**: Create and manage other super admins
- **Authentication**: Secure login with JWT and OTP-based password reset

### GP Admin Features
- **Dashboard**: Village and house statistics, monthly collection reports
- **Village Management**: Create and manage villages within the GP
- **House Management**: Individual and bulk Excel import of house data
- **Water Bill Management**: Generate bills, process payments, print PDFs
- **Payment Processing**: Cash and UPI payments with QR code generation
- **User Management**: Manage mobile users and admin users
- **Tariff Management**: Configure water tariff rates
- **Reports**: Comprehensive billing and collection reports

### Biller (Mobile User) Features
- **Dashboard**: Real-time statistics and recent bills overview
- **Customer Search**: Advanced search by meter ID, name, mobile, or Aadhaar
- **House Management**: Create new houses and manage existing ones
- **Bill Generation**: Generate water bills with automatic tariff calculation
- **Payment Processing**: Process payments with multiple modes (Cash, UPI, Online, Pay Later)
- **QR Code Generation**: Generate payment QR codes for bills and houses
- **Final Bill View**: Complete post-payment bill view with transaction details
- **PDF Downloads**: Generate and download bills and receipts
- **Profile Management**: View and manage biller profile

## 🏗️ Architecture

```
├── config/                 # Configuration files
│   ├── database.js        # MongoDB connection
│   └── swagger.js         # API documentation config
├── controllers/           # Business logic
│   ├── authController.js
│   ├── superAdminController.js
│   ├── gpAdminController.js
│   └── billerController.js
├── middleware/           # Custom middleware
│   ├── auth.js          # JWT authentication
│   ├── validation.js    # Request validation
│   └── errorHandler.js  # Global error handling
├── models/              # Database models
│   ├── User.js
│   ├── GramPanchayat.js
│   ├── Village.js
│   ├── House.js
│   ├── WaterBill.js
│   └── Payment.js
├── routes/              # API routes
│   ├── auth.js
│   ├── superAdmin.js
│   ├── gpAdmin.js
│   └── biller.js
├── utils/               # Utility functions
│   ├── emailService.js
│   ├── pdfGenerator.js
│   ├── qrCodeGenerator.js
│   ├── excelProcessor.js
│   └── billCalculator.js
└── index.js            # Main application file
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd water-management-system
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
Create a `.env` file in the root directory:
```env
NODE_ENV=development
PORT=5000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/water_management

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Email Configuration (for OTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# OTP Configuration
OTP_EXPIRES_IN=10

# File Upload
MAX_FILE_SIZE=5242880

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

4. **Start the server**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

5. **Access the API**
- Server: `http://localhost:5000`
- API Documentation: `http://localhost:5000/api/docs`
- Health Check: `http://localhost:5000/health`

## 📖 API Documentation

The API is fully documented using Swagger. Access the interactive documentation at:
```
http://localhost:5000/api/docs
```

### Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Key Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Request OTP for password reset
- `POST /api/auth/verify-otp` - Verify OTP code
- `POST /api/auth/reset-password` - Reset password with OTP
- `GET /api/auth/profile` - Get user profile

#### Super Admin
- `GET /api/super-admin/dashboard` - Dashboard data
- `GET/POST /api/super-admin/gram-panchayats` - Manage Gram Panchayats
- `GET/PUT/DELETE /api/super-admin/gram-panchayats/:id` - Individual GP operations
- `POST /api/super-admin/gram-panchayats/:id/admins` - Create GP admin
- `GET/POST /api/super-admin/super-admins` - Manage super admins

#### GP Admin
- `GET /api/gp-admin/dashboard` - Dashboard data
- `GET/POST /api/gp-admin/villages` - Manage villages
- `GET /api/gp-admin/villages/:id` - Village details
- `POST /api/gp-admin/houses` - Create house
- `POST /api/gp-admin/houses/upload` - Bulk upload houses from Excel
- `GET /api/gp-admin/houses/:id` - House details with bills
- `POST /api/gp-admin/houses/:id/bills` - Generate water bill
- `GET /api/gp-admin/bills/:id` - Bill details
- `GET /api/gp-admin/bills/:id/pdf` - Download bill PDF
- `POST /api/gp-admin/bills/:id/payment` - Process payment
- `GET /api/gp-admin/bills/:id/qr-code` - Generate payment QR code

#### Biller (Mobile User)
- `GET /api/biller/dashboard` - Dashboard with GP statistics
- `GET /api/biller/search` - Search customers by various criteria
- `GET /api/biller/villages` - Get villages for house creation
- `POST /api/biller/houses` - Create new house
- `GET /api/biller/houses/:houseId` - Get house details
- `POST /api/biller/houses/:houseId/generate-bill` - Generate water bill
- `GET /api/biller/houses/:houseId/qr-code` - Generate QR code for house
- `GET /api/biller/bills/:billId` - Get bill details
- `GET /api/biller/final-view-bill/:billId` - Final bill view (post-payment)
- `GET /api/biller/final-view-bill/:billId/print` - Download receipt PDF
- `POST /api/biller/bills/:billId/payment` - Process payment
- `GET /api/biller/bills/:billId/qr-code` - Generate payment QR code
- `GET /api/biller/bills/:billId/pdf` - Download bill PDF
- `GET /api/biller/profile` - Get biller profile

## 💾 Database Schema

### User Model
- Authentication and role management
- Supports: super_admin, gp_admin, mobile_user roles
- OTP-based password reset

### GramPanchayat Model
- GP information and contact details
- Water tariff configuration
- UPI payment configuration

### Village Model
- Village information within GPs
- Population tracking

### House Model
- Individual house details
- Water meter information
- Usage type classification

### WaterBill Model
- Monthly water bills
- Payment tracking
- Arrears calculation
- Field mapping for frontend compatibility

### Payment Model
- Payment transaction records
- Multiple payment modes support

## 🔧 Features in Detail

### Water Bill Calculation
- Tiered pricing based on usage
- Different rates for residential/commercial/institutional/industrial
- Automatic arrears calculation
- Interest and penalty support

### Payment Processing
- **Cash Payments**: Manual entry without transaction ID
- **UPI Payments**: QR code generation with transaction ID validation
- **Online Payments**: Transaction ID required
- **Pay Later**: Deferred payment option
- Payment history tracking
- Partial payment support
- Automatic paid date insertion

### QR Code Generation
- **Bill-based QR**: Generate QR for specific bills
- **House-based QR**: Generate QR for houses without bills
- UPI payment integration
- Dynamic amount configuration
- Real-time payment verification

### Excel Import
- Bulk house data import
- Flexible column mapping
- Data validation and error reporting

### PDF Generation
- Professional bill layout with GP details
- Detailed billing information
- Post-payment receipt generation
- Downloadable receipts with payment history

### Enhanced CORS Support
- Configurable origin allowlist
- Development and production modes
- Credential support
- Preflight request handling

## 🔒 Security Features

- JWT-based authentication
- Role-based access control
- Input validation with Joi
- Conditional validation based on payment modes
- Rate limiting
- CORS protection
- Helmet security headers
- Password hashing with bcrypt

## 🧪 Testing

The API can be tested using:
1. **Swagger UI**: Interactive testing at `/api/docs`
2. **Postman**: Import the API collection
3. **Jest**: Run automated tests with `npm test`

## 📊 Monitoring

- Health check endpoint: `/health`
- Request logging middleware
- Error tracking and reporting
- Performance monitoring

## 🚀 Deployment

### Production Setup
1. Set NODE_ENV=production
2. Use environment variables for all sensitive data
3. Set up proper MongoDB instance
4. Configure email service (SMTP)
5. Set up SSL/HTTPS
6. Configure reverse proxy (nginx)
7. Set up monitoring and logging

### Environment Variables (Production)
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://your-production-db
JWT_SECRET=your-super-secure-secret
EMAIL_HOST=your-email-service
EMAIL_USER=your-email
EMAIL_PASSWORD=your-password
```

## 🔄 Recent Updates (v1.1.0)

### New Features
- **QR Code for Houses**: Generate QR codes without bill ID
- **Final View Bill**: Complete post-payment bill view
- **Enhanced Payment Processing**: Conditional transaction ID validation
- **Full GP Data**: All endpoints return complete Gram Panchayat information

### Improvements
- **Transaction ID Handling**: Optional for Cash and Pay Later modes
- **Field Mapping**: Frontend-compatible field names (billAmount → amount)
- **CORS Configuration**: Enhanced cross-origin support
- **Paid Date Tracking**: Automatic insertion when payments processed
- **Error Handling**: Improved validation and error messages

### Bug Fixes
- Fixed paidDate registration in database
- Resolved CORS errors across APIs
- Enhanced field validation for all payment modes
- Improved bill generation validation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions about this release:
1. Check the API documentation at `/api/docs`
2. Review the health check at `/health`
3. Check server logs for error details
4. Create an issue in the repository

## 🔄 Version History

- **v1.1.0**: Enhanced payment processing, QR code improvements, CORS fixes
- **v1.0.0**: Initial release with full water management features
  - Complete authentication system
  - Super admin and GP admin portals
  - Bill generation and payment processing
  - Excel import/export functionality
  - PDF generation and QR code payments

---

**Built with ❤️ for digital governance in Indian Gram Panchayats**

Contact us to get the whole system
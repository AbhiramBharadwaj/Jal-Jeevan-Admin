# Changelog

All notable changes to the Water Management System will be documented in this file.

## [1.2.0] - 2025-01-15

### 🚀 New Features
- **Static GP QR Code**: Added endpoint for generating static QR code for entire Gram Panchayat
- **Auto-generated Sequence Numbers**: Sequence numbers are now auto-generated for houses
- **Enhanced Field Mapping**: Added support for both `village` and `villageId` field names
- **Overpayment Support**: Users can now pay more than the remaining bill amount
- **Improved Error Handling**: Better validation and error messages across all APIs

### 🔧 Improvements
- **Removed Sequence Number Requirement**: Sequence numbers are now optional in house creation
- **Enhanced Amount Rounding**: All amounts are now properly rounded to 2 decimal places
- **Better Null Handling**: Improved null property handling in final-view-bill endpoint
- **Field Validation**: Enhanced validation for house creation with flexible field names
- **Payment Processing**: Improved payment processing with better amount validation

### 🐛 Bug Fixes
- **Bill Generation**: Fixed paymentMode validation error during bill generation
- **Final View Bill**: Fixed null property errors in final-view-bill endpoint
- **Payment Amount**: Fixed "payment amount cannot exceed remaining amount" error
- **House Creation**: Fixed village ID validation issues
- **CORS Issues**: Resolved remaining CORS errors across all APIs

### 📚 API Enhancements

#### New Endpoints
- `GET /api/biller/gp-qr-code` - Generate static QR code for entire GP
- Enhanced house creation with flexible field mapping

#### Updated Endpoints
- `POST /api/biller/houses` - Now supports both `village` and `villageId` fields
- `POST /api/biller/bills/:billId/payment` - Now allows overpayment
- `GET /api/biller/final-view-bill/:billId` - Enhanced null handling and field mapping

### 🔒 Enhanced Validation
- **Flexible Field Names**: Support for both `village` and `villageId` in requests
- **Optional Sequence Numbers**: Sequence numbers are auto-generated if not provided
- **Better Amount Validation**: Improved validation for payment amounts
- **Enhanced Error Messages**: More descriptive error messages for validation failures

### 📱 Frontend Compatibility
- **Dual Field Support**: APIs now support both old and new field naming conventions
- **Consistent Response Format**: All responses include both `id` and corresponding `Id` fields
- **Rounded Amounts**: All monetary values are properly rounded to 2 decimal places
- **Better Error Handling**: Improved error response structure

### 🛠️ Technical Improvements
- **Auto-generation**: Sequence numbers are automatically generated using timestamp
- **Null Safety**: Enhanced null checking in all data transformations
- **Field Mapping**: Consistent field mapping across all endpoints
- **Validation Enhancement**: Improved Joi validation schemas

### 📖 Documentation
- **Updated API Documentation**: Enhanced Swagger documentation for all endpoints
- **Field Mapping Guide**: Documentation for supported field name variations
- **Error Handling Guide**: Comprehensive error handling documentation

## [1.1.0] - 2024-01-15

### 🚀 New Features
- **QR Code Generation**: Added QR code generation for houses without bill ID
- **Final View Bill**: Complete post-payment bill view with all transaction details
- **Enhanced Payment Processing**: Conditional transaction ID validation based on payment mode
- **Full GP Data**: All endpoints now return complete Gram Panchayat information

### 🔧 Improvements
- **Transaction ID Handling**: Made transaction ID optional for Cash and Pay Later payment modes
- **Field Mapping**: Updated JSON field names to match frontend requirements (billAmount → amount)
- **CORS Configuration**: Enhanced CORS settings for better cross-origin support
- **Paid Date Tracking**: Automatic insertion of paid date when payments are processed
- **Error Handling**: Improved error messages and validation

### 🐛 Bug Fixes
- **Payment API**: Fixed paidDate registration issue in database
- **Bill Generation**: Resolved validation errors in water bill creation
- **CORS Errors**: Fixed cross-origin resource sharing issues
- **Field Validation**: Enhanced validation for all payment modes

## [1.0.0] - 2024-01-01

### 🎉 Initial Release
- **Authentication System**: Complete JWT-based authentication
- **Role Management**: Super Admin, GP Admin, and Mobile User roles
- **Bill Generation**: Water bill calculation and generation
- **Payment Processing**: Multiple payment modes support
- **PDF Generation**: Bill and receipt PDF downloads
- **QR Code Payments**: UPI payment QR code generation
- **Dashboard**: Comprehensive dashboard for all user types
- **House Management**: Complete house and customer management
- **Village Management**: Village creation and management
- **Excel Import**: Bulk house data import from Excel
- **Swagger Documentation**: Complete API documentation

---

## 🔄 Migration Guide

### From v1.1.0 to v1.2.0

1. **API Changes**: 
   - House creation now supports both `village` and `villageId` fields
   - Sequence numbers are now optional and auto-generated
   - Payment processing now allows overpayment

2. **Frontend Updates**: 
   - Update forms to handle auto-generated sequence numbers
   - Update payment validation to allow overpayment
   - Use new static GP QR code endpoint if needed

3. **Database**: No schema changes required

### Breaking Changes
- None in this release (backward compatible)

### Deprecated Features
- Manual sequence number entry (still supported but optional)

---

## 🚀 Upcoming Features (v1.3.0)

- **SMS Notifications**: Automated SMS for bill generation and payments
- **Email Reports**: Automated email reports for administrators
- **Advanced Analytics**: Detailed analytics and reporting dashboard
- **Mobile App**: Dedicated mobile application for billers
- **Bulk Operations**: Bulk bill generation and payment processing
- **Integration APIs**: Third-party payment gateway integrations

---

## 📞 Support

For technical support or questions about this release:
- Check the API documentation at `/api/docs`
- Review the README.md for setup instructions
- Contact the development team for assistance

---

**Note**: This changelog follows the [Keep a Changelog](https://keepachangelog.com/) format.
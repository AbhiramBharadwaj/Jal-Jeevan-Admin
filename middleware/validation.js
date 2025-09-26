const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};

// Validation schemas
const schemas = {
  register: Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    mobile: Joi.string().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('super_admin', 'gp_admin', 'mobile_user', 'pillar_admin').required(),
    gramPanchayat: Joi.string().when('role', {
      is: Joi.valid('gp_admin', 'mobile_user', 'pillar_admin'),
      then: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
      otherwise: Joi.string().optional()
    })
  }),

  requestOTP: Joi.object({
    email: Joi.string().email().required()
  }),

  verifyOTP: Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().length(6).required()
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required()
  }),

  resetPassword: Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().length(6).required(),
    newPassword: Joi.string().min(6).required()
  }),

  createGramPanchayat: Joi.object({
    name: Joi.string().required(),
    uniqueId: Joi.string().required(),
    district: Joi.string().required(),
    taluk: Joi.string().required(),
    address: Joi.string().required(),
    pincode: Joi.string().required(),
    state: Joi.string().required(),
    contactPerson: Joi.object({
      name: Joi.string().required(),
      mobile: Joi.string().required()
    }).required()
  }),

  createUser: Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    mobile: Joi.string().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('super_admin', 'gp_admin', 'mobile_user', 'pillar_admin').required(),
    gramPanchayat: Joi.string().when('role', {
      is: Joi.valid('gp_admin', 'mobile_user', 'pillar_admin'),
      then: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
      otherwise: Joi.string().optional()
    })
  }),

  createVillage: Joi.object({
    name: Joi.string().required(),
    uniqueId: Joi.string().required(),
    population: Joi.number().integer().min(1).required()
  }),

  createHouse: Joi.object({
    village: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
    villageId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
    ownerName: Joi.string().required(),
    aadhaarNumber: Joi.string().required(),
    mobileNumber: Joi.string().required(),
    address: Joi.string().required(),
    waterMeterNumber: Joi.string().required(),
    previousMeterReading: Joi.number().min(0).default(0),
    sequenceNumber: Joi.string().optional(),
    usageType: Joi.string().valid('residential', 'commercial', 'institutional', 'industrial').required(),
    propertyNumber: Joi.string().required()
  }).or('village', 'villageId'),

  generateBill: Joi.object({
    previousReading: Joi.number().min(0).required(),
    currentReading: Joi.number().min(0).required(),
    totalUsage: Joi.number().min(0).required(),
    month: Joi.string().required(),
    year: Joi.number().integer().min(2020).max(2030).required(),
    // dueDate: Joi.string().required()
  }),

  makePayment: Joi.object({
    amount: Joi.number().min(0).required(),
    paymentMode: Joi.string().valid('cash', 'upi', 'online', 'pay_later').required(),
    transactionId: Joi.when('paymentMode', {
      is: Joi.valid('upi', 'online'),
      then: Joi.string().required(),
      otherwise: Joi.string().optional().allow(null, '')
    }),
    remarks: Joi.string().optional().allow('')
  }),

  createHouseAndBill: Joi.object({
    village: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
    villageId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
    ownerName: Joi.string().required(),
    aadhaarNumber: Joi.string().required(),
    mobileNumber: Joi.string().required(),
    address: Joi.string().required(),
    waterMeterNumber: Joi.string().required(),
    previousMeterReading: Joi.number().min(0).default(0),
    sequenceNumber: Joi.string().optional(),
    usageType: Joi.string().valid('residential', 'commercial', 'institutional', 'industrial').required(),
    propertyNumber: Joi.string().required(),
    currentReading: Joi.number().min(0).required(),
    month: Joi.string().required(),
    year: Joi.number().integer().min(2020).max(2030).required(),
    dueDate: Joi.date().required()
  }).or('village', 'villageId')
};

module.exports = { validate, schemas };
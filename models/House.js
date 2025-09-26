const mongoose = require('mongoose');

const houseSchema = new mongoose.Schema({
  village: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Village',
    required: true
  },
  gramPanchayat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GramPanchayat',
    required: true
  },
  ownerName: {
    type: String,
    required: true,
    trim: true
  },
  aadhaarNumber: {
    type: String,
    required: true,
    trim: true
  },
  mobileNumber: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  waterMeterNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  previousMeterReading: {
    type: Number,
    default: 0
  },
  sequenceNumber: {
    type: String,
    required: true,
    trim: true
  },
  usageType: {
    type: String,
    enum: ['residential', 'commercial', 'institutional', 'industrial'],
    required: true
  },
  propertyNumber: {
    type: String,
    required: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('House', houseSchema);
const mongoose = require('mongoose');

const waterBillSchema = new mongoose.Schema({
  house: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'House',
    required: true
  },
  gramPanchayat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GramPanchayat',
    required: true
  },
  billNumber: {
    type: String,
    unique: true
  },
  month: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  previousReading: {
    type: Number,
    required: true
  },
  currentReading: {
    type: Number,
    required: true
  },
  totalUsage: {
    type: Number,
    required: true
  },
  currentDemand: {
    type: Number,
    required: true
  },
  arrears: {
    type: Number,
    default: 0
  },
  interest: {
    type: Number,
    default: 0
  },
  others: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  remainingAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'partial', 'paid'],
    default: 'pending'
  },
  paymentMode: {
    type: String,
    enum: ['cash', 'upi', 'online', 'pay_later', null],
    default: null
  },
  transactionId: {
    type: String,
    default: null
  },
  paidDate: {
    type: Date,
    default: null
  },
  dueDate: {
    type: String,
    required: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Generate bill number before saving
waterBillSchema.pre('save', async function(next) {
  if (!this.billNumber) {
    try {
      const count = await this.constructor.countDocuments();
      this.billNumber = `WB${String(count + 1).padStart(6, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Transform output to match frontend requirements with proper rounding
waterBillSchema.methods.toJSON = function() {
  const bill = this.toObject();
  
  // Round all amounts to 2 decimal places
  const roundToTwo = (num) => Math.round((num + Number.EPSILON) * 100) / 100;
  
  return {
    ...bill,
    // Original fields
    totalAmount: roundToTwo(bill.totalAmount),
    paidAmount: roundToTwo(bill.paidAmount),
    remainingAmount: roundToTwo(bill.remainingAmount),
    currentDemand: roundToTwo(bill.currentDemand),
    arrears: roundToTwo(bill.arrears),
    interest: roundToTwo(bill.interest),
    others: roundToTwo(bill.others),
    
    // Frontend aliases
    amount: roundToTwo(bill.totalAmount),
    billAmount: roundToTwo(bill.totalAmount),
    paid: roundToTwo(bill.paidAmount),
    remaining: roundToTwo(bill.remainingAmount),
    demand: roundToTwo(bill.currentDemand),
    usage: bill.totalUsage,
    previous: bill.previousReading,
    current: bill.currentReading
  };
};

module.exports = mongoose.model('WaterBill', waterBillSchema);
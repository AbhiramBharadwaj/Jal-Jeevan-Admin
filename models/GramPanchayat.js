const { required } = require('joi');
const mongoose = require('mongoose');

const gramPanchayatSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  uniqueId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  district: {
    type: String,
    required: true,
    trim: true
  },
  taluk: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  pincode: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  DueDays:{
    type:String,
    required:true,
    default:'Not Set'
  },
  contactPerson: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    mobile: {
      type: String,
      required: true,
      trim: true
    }
  },
  waterTariff: {
    domestic: {
      upTo7KL: {
        type: Number,
        default: 0
      },
      from7to10KL: {
        type: Number,
        default: 0
      },
      from10to15KL: {
        type: Number,
        default: 0
      },
      from15to20KL: {
        type: Number,
        default: 0
      },
      above20KL: {
        type: Number,
        default: 0
      }
    },
    nonDomestic: {
      publicPrivateInstitutions: {
        type: Number,
        default: 0
      },
      commercialEnterprises: {
        type: Number,
        default: 0
      },
      industrialEnterprises: {
        type: Number,
        default: 0
      }
    },
    fixedAmount:{
      type:Number,
      default:0
    }
  },
  qrCodeData: {
    upiId: String,
    merchantName: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('GramPanchayat', gramPanchayatSchema);
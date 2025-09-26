const mongoose = require('mongoose');

const villageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  uniqueId: {
    type: String,
    required: true,
    trim: true
  },
  population: {
    type: Number,
    required: true
  },
  gramPanchayat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GramPanchayat',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for unique village per GP
villageSchema.index({ uniqueId: 1, gramPanchayat: 1 }, { unique: true });

module.exports = mongoose.model('Village', villageSchema);
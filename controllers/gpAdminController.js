const User = require('../models/User');
const GramPanchayat = require('../models/GramPanchayat');
const Village = require('../models/Village');
const House = require('../models/House');
const WaterBill = require('../models/WaterBill');
const Payment = require('../models/Payment');
const { calculateWaterBill } = require('../utils/billCalculator');
const { generateBillPDF, generateReceiptPDF } = require('../utils/pdfGenerator');
const { generatePaymentQR } = require('../utils/qrCodeGenerator');
const { processHouseExcel } = require('../utils/excelProcessor');
const moment = require('moment');
const mongoose = require('mongoose');
const fs = require('fs');
const XLSX = require('xlsx');

// Helper function to round to 2 decimal places
const roundToTwo = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

// @desc    Get GP admin dashboard data
// @route   GET /api/gp-admin/dashboard
// @access  Private (GP Admin)
const getDashboard = async (req, res) => {
  try {
    const gpId = req.user.gramPanchayat._id;
    const currentMonth = moment().format('MMMM');
    const currentYear = moment().year();

    const totalVillages = await Village.countDocuments({ 
      gramPanchayat: gpId, 
      isActive: true 
    });

    const totalHouses = await House.countDocuments({ 
      gramPanchayat: gpId, 
      isActive: true 
    });

    const totalUsers = await User.countDocuments({ 
      gramPanchayat: gpId, 
      isActive: true 
    });

    // Current month bills
    const monthlyBills = await WaterBill.find({
      gramPanchayat: gpId,
      month: currentMonth,
      year: currentYear
    });

    const thisMonthCollection = roundToTwo(monthlyBills.reduce((sum, bill) => sum + bill.paidAmount, 0));
    console.log(monthlyBills);
    
    const paidBills = monthlyBills.filter(bill => bill.status === 'paid' || bill.status =='partial').length;
    const unpaidBills = monthlyBills.filter(bill => bill.status === 'pending').length;

    // Recent bills
    const recentBills = await WaterBill.find({
      gramPanchayat: gpId
    })
      .populate({
        path: 'house',
        populate: {
          path: 'village'
        }
      })
      .limit(10)
      .sort({ createdAt: -1 });

    // Get full GP data
    const gramPanchayat = await GramPanchayat.findById(gpId);

    res.json({
      success: true,
      data: {
        totalVillages,
        totalHouses,
        totalUsers,
        thisMonthCollection,
        paidBills,
        unpaidBills,
        recentBills,
        gramPanchayat: {
          id: gramPanchayat._id,
          gramPanchayatId: gramPanchayat._id,
          name: gramPanchayat.name,
          uniqueId: gramPanchayat.uniqueId,
          district: gramPanchayat.district,
          taluk: gramPanchayat.taluk,
          address: gramPanchayat.address,
          pincode: gramPanchayat.pincode,
          state: gramPanchayat.state,
          contactPerson: gramPanchayat.contactPerson,
          waterTariff: gramPanchayat.waterTariff,
          qrCodeData: gramPanchayat.qrCodeData
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all villages for GP
// @route   GET /api/gp-admin/villages
// @access  Private (GP Admin)
const getVillages = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const gpId = req.user.gramPanchayat._id;

    const query = search 
      ? { 
          gramPanchayat: gpId,
          isActive: true,
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { uniqueId: { $regex: search, $options: 'i' } }
          ]
        }
      : { gramPanchayat: gpId, isActive: true };

    const villages = await Village.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    // Get house count for each village
    const enrichedVillages = await Promise.all(
      villages.map(async (village) => {
        const houseCount = await House.countDocuments({ 
          village: village._id, 
          isActive: true 
        });

        return {
          ...village.toObject(),
          villageId: village._id,
          houseCount
        };
      })
    );

    const total = await Village.countDocuments(query);
    const gramPanchayat = await GramPanchayat.findById(gpId);

    res.json({
      success: true,
      data: {
        villages: enrichedVillages,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: enrichedVillages.length,
          totalRecords: total
        },
        gramPanchayat: {
          id: gramPanchayat._id,
          gramPanchayatId: gramPanchayat._id,
          name: gramPanchayat.name,
          uniqueId: gramPanchayat.uniqueId
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create new village
// @route   POST /api/gp-admin/villages
// @access  Private (GP Admin)
const createVillage = async (req, res) => {
  try {
    const { name, uniqueId, population } = req.body;
    const gpId = req.user.gramPanchayat._id;

    const village = new Village({
      name,
      uniqueId,
      population,
      gramPanchayat: gpId
    });

    await village.save();

    res.status(201).json({
      success: true,
      message: 'Village created successfully',
      data: {
        ...village.toObject(),
        villageId: village._id
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Village with this unique ID already exists in this Gram Panchayat'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get village details with houses
// @route   GET /api/gp-admin/villages/:id
// @access  Private (GP Admin)
const getVillageDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const gpId = req.user.gramPanchayat._id;

    const village = await Village.findOne({
      _id: id,
      gramPanchayat: gpId,
      isActive: true
    });

    if (!village) {
      return res.status(404).json({
        success: false,
        message: 'Village not found'
      });
    }

    const houses = await House.find({
      village: village._id,
      isActive: true
    })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await House.countDocuments({
      village: village._id,
      isActive: true
    });

    const gramPanchayat = await GramPanchayat.findById(gpId);

    res.json({
      success: true,
      data: {
        village: {
          ...village.toObject(),
          villageId: village._id
        },
        houses,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: houses.length,
          totalRecords: total
        },
        gramPanchayat: {
          id: gramPanchayat._id,
          gramPanchayatId: gramPanchayat._id,
          name: gramPanchayat.name,
          uniqueId: gramPanchayat.uniqueId
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update village
// @route   PUT /api/gp-admin/villages/:id
// @access  Private (GP Admin)
const updateVillage = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, uniqueId, population } = req.body;
    const gpId = req.user.gramPanchayat._id;

    const village = await Village.findOneAndUpdate(
      { _id: id, gramPanchayat: gpId },
      { name, uniqueId, population },
      { new: true, runValidators: true }
    );

    if (!village) {
      return res.status(404).json({
        success: false,
        message: 'Village not found'
      });
    }

    res.json({
      success: true,
      message: 'Village updated successfully',
      data: village
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete village
// @route   DELETE /api/gp-admin/villages/:id
// @access  Private (GP Admin)
const deleteVillage = async (req, res) => {
  try {
    const { id } = req.params;
    const gpId = req.user.gramPanchayat._id;

    const village = await Village.findOneAndUpdate(
      { _id: id, gramPanchayat: gpId },
      { isActive: false },
      { new: true }
    );

    if (!village) {
      return res.status(404).json({
        success: false,
        message: 'Village not found'
      });
    }

    res.json({
      success: true,
      message: 'Village deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all houses for GP
// @route   GET /api/gp-admin/houses
// @access  Private (GP Admin)
const getHouses = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const gpId = req.user.gramPanchayat._id;

    const query = search 
      ? { 
          gramPanchayat: gpId,
          isActive: true,
          $or: [
            { ownerName: { $regex: search, $options: 'i' } },
            { waterMeterNumber: { $regex: search, $options: 'i' } },
            { aadhaarNumber: { $regex: search, $options: 'i' } },
            { mobileNumber: { $regex: search, $options: 'i' } }
          ]
        }
      : { gramPanchayat: gpId, isActive: true };

    const houses = await House.find(query)
      .populate('village')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    // Get unpaid bills count and total due for each house
    const enrichedHouses = await Promise.all(
      houses.map(async (house) => {
        const unpaidBillsCount = await WaterBill.countDocuments({
          house: house._id,
          status: { $in: ['pending', 'partial'] }
        });

        const unpaidBills = await WaterBill.find({
          house: house._id,
          status: { $in: ['pending', 'partial'] }
        });

        const totalDue = roundToTwo(unpaidBills.reduce((sum, bill) => sum + bill.remainingAmount, 0));

        return {
          ...house.toObject(),
          unpaidBillsCount,
          totalDue
        };
      })
    );

    const total = await House.countDocuments(query);

    res.json({
      success: true,
      data: {
        houses: enrichedHouses,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: enrichedHouses.length,
          totalRecords: total
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create new house
// @route   POST /api/gp-admin/houses
// @access  Private (GP Admin)
const createHouse = async (req, res) => {
  try {
    const {
      village,
      villageId,
      ownerName,
      aadhaarNumber,
      mobileNumber,
      address,
      waterMeterNumber,
      previousMeterReading,
      usageType,
      propertyNumber
    } = req.body;

    const gpId = req.user.gramPanchayat._id;
    const selectedVillageId = villageId || village;

    // Validate village belongs to this GP
    const villageDoc = await Village.findOne({
      _id: selectedVillageId,
      gramPanchayat: gpId,
      isActive: true
    });

    if (!villageDoc) {
      return res.status(400).json({
        success: false,
        message: 'Village not found or does not belong to your Gram Panchayat'
      });
    }

    const house = new House({
      village: selectedVillageId,
      gramPanchayat: gpId,
      ownerName,
      aadhaarNumber,
      mobileNumber,
      address,
      waterMeterNumber,
      previousMeterReading: previousMeterReading || 0,
      sequenceNumber: `SEQ${Date.now()}`, // Auto-generate
      usageType,
      propertyNumber
    });

    await house.save();

    const populatedHouse = await House.findById(house._id).populate('village');

    res.status(201).json({
      success: true,
      message: 'House created successfully',
      data: {
        ...populatedHouse.toObject(),
        village: {
          ...populatedHouse.village.toObject(),
          villageId: populatedHouse.village._id
        }
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Water meter number already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Upload houses from Excel file
// @route   POST /api/gp-admin/houses/upload
// @access  Private (GP Admin)
const uploadHousesFromExcel = async (req, res) => {
  try {
    const { villageId } = req.body;
    const gpId = req.user.gramPanchayat._id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Validate village
    const village = await Village.findOne({
      _id: villageId,
      gramPanchayat: gpId,
      isActive: true
    });

    if (!village) {
      return res.status(400).json({
        success: false,
        message: 'Village not found'
      });
    }

    const result = processHouseExcel(req.file.path);

    if (!result.success) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Failed to process Excel file',
        error: result.error
      });
    }

    const houses = [];
    const errors = [];

    for (const houseData of result.data) {
      try {
        const house = new House({
          village: villageId,
          gramPanchayat: gpId,
          ownerName: houseData.ownerName,
          aadhaarNumber: houseData.aadhaarNumber,
          mobileNumber: houseData.mobileNumber,
          address: houseData.address,
          waterMeterNumber: houseData.waterMeterNumber,
          previousMeterReading: houseData.previousMeterReading || 0,
          sequenceNumber: houseData.sequenceNumber || `SEQ${Date.now()}-${Math.random()}`,
          usageType: houseData.usageType,
          propertyNumber: houseData.propertyNumber
        });

        await house.save();
        houses.push(house);
      } catch (error) {
        errors.push({
          data: houseData,
          error: error.message
        });
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: `${houses.length} houses uploaded successfully`,
      data: {
        successCount: houses.length,
        errorCount: errors.length,
        errors: errors.slice(0, 10) // Return first 10 errors
      }
    });
  } catch (error) {
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Export houses data
// @route   GET /api/gp-admin/houses/export
// @access  Private (GP Admin)
const exportHousesData = async (req, res) => {
  try {
    const gpId = req.user.gramPanchayat._id;

    const houses = await House.find({
      gramPanchayat: gpId,
      isActive: true
    }).populate('village');

    const exportData = houses.map(house => ({
      'Owner Name': house.ownerName,
      'Aadhaar Number': house.aadhaarNumber,
      'Mobile Number': house.mobileNumber,
      'Address': house.address,
      'Water Meter Number': house.waterMeterNumber,
      'Previous Meter Reading': house.previousMeterReading,
      'Sequence Number': house.sequenceNumber,
      'Usage Type': house.usageType,
      'Property Number': house.propertyNumber,
      'Village': house.village?.name || '',
      'Created Date': house.createdAt.toLocaleDateString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Houses');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=houses_export.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get house details with bills
// @route   GET /api/gp-admin/houses/:id
// @access  Private (GP Admin)
const getHouseDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const gpId = req.user.gramPanchayat._id;

    const house = await House.findOne({
      _id: id,
      gramPanchayat: gpId,
      isActive: true
    }).populate('village');

    if (!house) {
      return res.status(404).json({
        success: false,
        message: 'House not found'
      });
    }

    const bills = await WaterBill.find({
      house: house._id
    }).sort({ createdAt: -1 });

    const gramPanchayat = await GramPanchayat.findById(gpId);

    res.json({
      success: true,
      data: {
        house: {
          ...house.toObject(),
          village: {
            ...house.village.toObject(),
            villageId: house.village._id
          }
        },
        bills,
        gramPanchayat: {
          id: gramPanchayat._id,
          gramPanchayatId: gramPanchayat._id,
          name: gramPanchayat.name,
          uniqueId: gramPanchayat.uniqueId,
          waterTariff: gramPanchayat.waterTariff
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update house
// @route   PUT /api/gp-admin/houses/:id
// @access  Private (GP Admin)
const updateHouse = async (req, res) => {
  try {
    const { id } = req.params;
    const gpId = req.user.gramPanchayat._id;

    const house = await House.findOneAndUpdate(
      { _id: id, gramPanchayat: gpId },
      req.body,
      { new: true, runValidators: true }
    ).populate('village');

    if (!house) {
      return res.status(404).json({
        success: false,
        message: 'House not found'
      });
    }

    res.json({
      success: true,
      message: 'House updated successfully',
      data: house
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete house
// @route   DELETE /api/gp-admin/houses/:id
// @access  Private (GP Admin)
const deleteHouse = async (req, res) => {
  try {
    const { id } = req.params;
    const gpId = req.user.gramPanchayat._id;

    const house = await House.findOneAndUpdate(
      { _id: id, gramPanchayat: gpId },
      { isActive: false },
      { new: true }
    );

    if (!house) {
      return res.status(404).json({
        success: false,
        message: 'House not found'
      });
    }

    res.json({
      success: true,
      message: 'House deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Generate water bill for house
// @route   POST /api/gp-admin/houses/:id/bills
// @access  Private (GP Admin)
const generateWaterBill = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(req.body);
    
    const { currentReading, month, year} = req.body;
    const gpId = req.user.gramPanchayat._id;

    const house = await House.findOne({
      _id: id,
      gramPanchayat: gpId,
      isActive: true
    });

    if (!house) {
      return res.status(404).json({
        success: false,
        message: 'House not found'
      });
    }

    const previousReading = house.previousMeterReading;
    const totalUsage = currentReading - previousReading;
    console.log(house);
    

    if (totalUsage < 0) {
      return res.status(400).json({
        success: false,
        message: 'Current reading cannot be less than previous reading'
      });
    }

    const gramPanchayat = await GramPanchayat.findById(gpId);
    const currentDemand = calculateWaterBill(totalUsage, gramPanchayat.waterTariff, house.usageType);

    // Check for arrears
    const unpaidBills = await WaterBill.find({
      house: house._id,
      status: { $in: ['pending', 'partial'] }
    });

    const arrears = roundToTwo(unpaidBills.reduce((sum, bill) => sum + bill.remainingAmount, 0));

    const bill = new WaterBill({
      house: house._id,
      gramPanchayat: gpId,
      month,
      year: parseInt(year),
      previousReading,
      currentReading,
      totalUsage,
      currentDemand: roundToTwo(currentDemand),
      arrears,
      interest: 0,
      others: 0,
      totalAmount: roundToTwo(currentDemand + arrears),
      remainingAmount: roundToTwo(currentDemand + arrears),
      dueDate: gramPanchayat.DueDays?gramPanchayat.DueDays: "Not Set",
      status: 'pending'
    });

    await bill.save();

    // Update house previous reading
    house.previousMeterReading = currentReading;
    await house.save();

    const populatedBill = await WaterBill.findById(bill._id).populate({
      path: 'house',
      populate: {
        path: 'village'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Water bill generated successfully',
      data: {
        bill: populatedBill,
        gramPanchayat: {
          id: gramPanchayat._id,
          gramPanchayatId: gramPanchayat._id,
          name: gramPanchayat.name,
          uniqueId: gramPanchayat.uniqueId
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all bills for GP
// @route   GET /api/gp-admin/bills
// @access  Private (GP Admin)
const getBills = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    const gpId = req.user.gramPanchayat._id;

    let query = { gramPanchayat: gpId };

    if (search) {
      const houses = await House.find({
        gramPanchayat: gpId,
        $or: [
          { ownerName: { $regex: search, $options: 'i' } },
          { waterMeterNumber: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');

      query.$or = [
        { billNumber: { $regex: search, $options: 'i' } },
        { house: { $in: houses.map(h => h._id) } }
      ];
    }

    if (status) {
      query.status = status;
    }

    const bills = await WaterBill.find(query)
      .populate({
        path: 'house',
        populate: {
          path: 'village'
        }
      })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await WaterBill.countDocuments(query);

    res.json({
      success: true,
      data: {
        bills,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: bills.length,
          totalRecords: total
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get bill details
// @route   GET /api/gp-admin/bills/:id
// @access  Private (GP Admin)
const getBillDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const gpId = req.user.gramPanchayat._id;

    const bill = await WaterBill.findOne({
      _id: id,
      gramPanchayat: gpId
    }).populate({
      path: 'house',
      populate: {
        path: 'village'
      }
    });

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    const payments = await Payment.find({
      bill: bill._id
    }).populate('collectedBy', 'name').sort({ createdAt: -1 });

    const gramPanchayat = await GramPanchayat.findById(gpId);

    res.json({
      success: true,
      data: {
        bill,
        payments,
        gramPanchayat: {
          id: gramPanchayat._id,
          gramPanchayatId: gramPanchayat._id,
          name: gramPanchayat.name,
          uniqueId: gramPanchayat.uniqueId,
          qrCodeData: gramPanchayat.qrCodeData
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Download bill PDF
// @route   GET /api/gp-admin/bills/:id/pdf
// @access  Private (GP Admin)
const downloadBillPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const gpId = req.user?.gramPanchayat?._id;

    // Validate inputs
    if (!id || !gpId) {
      console.error('Invalid input:', { id, gpId });
      return res.status(400).json({
        success: false,
        message: 'Bill ID or Gram Panchayat ID is missing',
      });
    }

    // Fetch bill
    const bill = await WaterBill.findOne({
      _id: id,
      gramPanchayat: gpId,
    }).populate({
      path: 'house',
      populate: {
        path: 'village',
      },
    });

    if (!bill) {
      console.error('Bill not found:', { id, gpId });
      return res.status(404).json({
        success: false,
        message: 'Bill not found',
      });
    }

    // Fetch Gram Panchayat
    const gramPanchayat = await GramPanchayat.findById(gpId);
    if (!gramPanchayat) {
      console.error('Gram Panchayat not found:', { gpId });
      return res.status(404).json({
        success: false,
        message: 'Gram Panchayat not found',
      });
    }

    // Generate PDF
    const pdfPath = await generateBillPDF(bill, bill.house, gramPanchayat);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=bill_${bill.billNumber}.pdf`);

    // Stream the file
    const fileStream = require('fs').createReadStream(pdfPath);
    fileStream.pipe(res);

    // Clean up file after streaming
    fileStream.on('end', async () => {
      try {
        await fs.unlink(pdfPath);
        console.log(`Temporary file deleted: ${pdfPath}`);
      } catch (err) {
        console.error('Error deleting temporary file:', err);
      }
    });

    fileStream.on('error', (err) => {
      console.error('File stream error:', err);
      res.status(500).json({
        success: false,
        message: 'Error streaming PDF',
        error: err.message,
      });
    });

  } catch (error) {
    console.error('Download PDF error:', {
      message: error.message,
      stack: error.stack,
      id,
      gpId,
    });
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Make payment for bill
// @route   POST /api/gp-admin/bills/:id/payment
// @access  Private (GP Admin)
const makePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, paymentMode, transactionId, remarks } = req.body;
    const gpId = req.user.gramPanchayat._id;

    const bill = await WaterBill.findOne({
      _id: id,
      gramPanchayat: gpId
    });

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    const paymentAmount = roundToTwo(parseFloat(amount));

    if (paymentAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be greater than zero'
      });
    }

    // Create payment record
    const payment = new Payment({
      bill: bill._id,
      amount: paymentAmount,
      paymentMode,
      transactionId: (paymentMode === 'cash' || paymentMode === 'pay_later') ? null : transactionId,
      collectedBy: req.user.id,
      remarks
    });

    await payment.save();

    // Update bill
    if (paymentMode !== 'pay_later') {
      bill.paidAmount = roundToTwo(bill.paidAmount + paymentAmount);
      bill.remainingAmount = roundToTwo(Math.max(0, bill.totalAmount - bill.paidAmount));
      
      if (bill.remainingAmount === 0) {
        bill.status = 'paid';
      } else if (bill.paidAmount > 0) {
        bill.status = 'partial';
      }

      bill.paymentMode = paymentMode;
      bill.transactionId = (paymentMode === 'cash' || paymentMode === 'pay_later') ? null : transactionId;
      bill.paidDate = new Date();

      await bill.save();
    }

    const updatedBill = await WaterBill.findById(bill._id).populate({
      path: 'house',
      populate: {
        path: 'village'
      }
    });

    const gramPanchayat = await GramPanchayat.findById(gpId);

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        bill: updatedBill,
        payment,
        gramPanchayat: {
          id: gramPanchayat._id,
          gramPanchayatId: gramPanchayat._id,
          name: gramPanchayat.name,
          uniqueId: gramPanchayat.uniqueId
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Generate payment QR code for bill
// @route   GET /api/gp-admin/bills/:id/qr-code
// @access  Private (GP Admin)
const generatePaymentQRCode = async (req, res) => {
  try {
    const { id } = req.params;
    const gpId = req.user.gramPanchayat._id;

    const bill = await WaterBill.findOne({
      _id: id,
      gramPanchayat: gpId
    }).populate('house');

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    const gramPanchayat = await GramPanchayat.findById(gpId);
    
    const upiId = gramPanchayat.qrCodeData?.upiId || 'payment@gp.com';
    const merchantName = gramPanchayat.qrCodeData?.merchantName || gramPanchayat.name;

    const qrResult = await generatePaymentQR(
      bill.remainingAmount,
      upiId,
      merchantName,
      bill.billNumber
    );

    if (!qrResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate QR code',
        error: qrResult.error
      });
    }

    res.json({
      success: true,
      data: {
        qrCode: qrResult.qrCode,
        amount: bill.remainingAmount,
        billNumber: bill.billNumber,
        upiId: upiId,
        merchantName: merchantName,
        gramPanchayat: {
          id: gramPanchayat._id,
          gramPanchayatId: gramPanchayat._id,
          name: gramPanchayat.name,
          uniqueId: gramPanchayat.uniqueId
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Generate GP QR code
// @route   GET /api/gp-admin/qr-code
// @access  Private (GP Admin)
const generateGPQRCode = async (req, res) => {
  try {
    const gpId = req.user.gramPanchayat._id;
    const gramPanchayat = await GramPanchayat.findById(gpId);
    
    const upiId = gramPanchayat.qrCodeData?.upiId || 'payment@gp.com';
    const merchantName = gramPanchayat.qrCodeData?.merchantName || gramPanchayat.name;

    const qrResult = await generatePaymentQR(
      0, // Static QR
      upiId,
      merchantName,
      `GP-${gramPanchayat.uniqueId}`
    );

    if (!qrResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate QR code',
        error: qrResult.error
      });
    }

    res.json({
      success: true,
      data: {
        qrCode: qrResult.qrCode,
        upiId: upiId,
        merchantName: merchantName,
        gramPanchayat: {
          id: gramPanchayat._id,
          gramPanchayatId: gramPanchayat._id,
          name: gramPanchayat.name,
          uniqueId: gramPanchayat.uniqueId
        },
        isStaticQR: true,
        description: 'Static QR code for all payments to this Gram Panchayat'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update water tariff rates
// @route   PUT /api/gp-admin/tariff
// @access  Private (GP Admin)
const updateWaterTariff = async (req, res) => {
  try {
    const gpId = req.user.gramPanchayat._id;
    const { domestic, nonDomestic, fixedAmount } = req.body;
    console.log({domestic, nonDomestic, fixedAmount});
    
    const gramPanchayat = await GramPanchayat.findByIdAndUpdate(
      gpId,
      {
        $set: {
          'waterTariff.domestic': domestic,
          'waterTariff.nonDomestic': nonDomestic,
          'waterTariff.fixedAmount':fixedAmount
        }
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Water tariff updated successfully',
      data: {
        gramPanchayat: {
          id: gramPanchayat._id,
          gramPanchayatId: gramPanchayat._id,
          name: gramPanchayat.name,
          uniqueId: gramPanchayat.uniqueId,
          waterTariff: gramPanchayat.waterTariff
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all users for GP
// @route   GET /api/gp-admin/users
// @access  Private (GP Admin)
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, userType = '', search = '' } = req.query;
    const gpId = req.user.gramPanchayat._id;

    let query = {
      gramPanchayat: gpId,
      isActive: true
    };

    if (userType) {
      query.role = userType;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);
    const gramPanchayat = await GramPanchayat.findById(gpId);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: users.length,
          totalRecords: total
        },
        gramPanchayat: {
          id: gramPanchayat._id,
          gramPanchayatId: gramPanchayat._id,
          name: gramPanchayat.name,
          uniqueId: gramPanchayat.uniqueId
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create new user for GP
// @route   POST /api/gp-admin/users
// @access  Private (GP Admin)
const createUser = async (req, res) => {
  try {
    const { name, email, mobile, password, role } = req.body;
    const gpId = req.user.gramPanchayat._id;

    // Only allow creating gp_admin and mobile_user roles
    if (!['gp_admin', 'mobile_user'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Only gp_admin and mobile_user roles are allowed'
      });
    }

    const user = new User({
      name,
      email,
      mobile,
      password,
      role,
      gramPanchayat: gpId
    });

    await user.save();

    const userResponse = await User.findById(user._id).select('-password');

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userResponse
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get user details
// @route   GET /api/gp-admin/users/:id
// @access  Private (GP Admin)
const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const gpId = req.user.gramPanchayat._id;

    const user = await User.findOne({
      _id: id,
      gramPanchayat: gpId
    }).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update user
// @route   PUT /api/gp-admin/users/:id
// @access  Private (GP Admin)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const gpId = req.user.gramPanchayat._id;

    const user = await User.findOneAndUpdate(
      { _id: id, gramPanchayat: gpId },
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/gp-admin/users/:id
// @access  Private (GP Admin)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const gpId = req.user.gramPanchayat._id;

    const user = await User.findOneAndUpdate(
      { _id: id, gramPanchayat: gpId },
      { isActive: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Export users data
// @route   GET /api/gp-admin/users/export
// @access  Private (GP Admin)
const exportUsersData = async (req, res) => {
  try {
    const gpId = req.user.gramPanchayat._id;

    const users = await User.find({
      gramPanchayat: gpId,
      isActive: true
    }).select('-password');

    const exportData = users.map(user => ({
      'Name': user.name,
      'Email': user.email,
      'Mobile': user.mobile,
      'Role': user.role,
      'Created Date': user.createdAt.toLocaleDateString(),
      'Last Login': user.lastLogin ? user.lastLogin.toLocaleDateString() : 'Never'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=users_export.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Export villages data
// @route   GET /api/gp-admin/villages/export
// @access  Private (GP Admin)
const exportVillagesData = async (req, res) => {
  try {
    const gpId = req.user.gramPanchayat._id;

    const villages = await Village.find({
      gramPanchayat: gpId,
      isActive: true
    });

    const exportData = await Promise.all(
      villages.map(async (village) => {
        const houseCount = await House.countDocuments({ 
          village: village._id, 
          isActive: true 
        });

        return {
          'Village Name': village.name,
          'Unique ID': village.uniqueId,
          'Population': village.population,
          'House Count': houseCount,
          'Created Date': village.createdAt.toLocaleDateString()
        };
      })
    );

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Villages');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=villages_export.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Export bills data
// @route   GET /api/gp-admin/bills/export
// @access  Private (GP Admin)
const exportBillsData = async (req, res) => {
  try {
    const gpId = req.user.gramPanchayat._id;

    const bills = await WaterBill.find({
      gramPanchayat: gpId
    }).populate({
      path: 'house',
      populate: {
        path: 'village'
      }
    });

    const exportData = bills.map(bill => ({
      'Bill Number': bill.billNumber,
      'Customer Name': bill.house?.ownerName || '',
      'Village': bill.house?.village?.name || '',
      'Month': bill.month,
      'Year': bill.year,
      'Total Amount': bill.totalAmount,
      'Paid Amount': bill.paidAmount,
      'Remaining Amount': bill.remainingAmount,
      'Status': bill.status,
      'Due Date': bill.dueDate.toLocaleDateString(),
      'Created Date': bill.createdAt.toLocaleDateString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bills');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=bills_export.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update GP settings
// @route   PUT /api/gp-admin/settings
// @access  Private (GP Admin)
const updateGPSettings = async (req, res) => {
  try {
    const gpId = req.user.gramPanchayat._id;

    const gramPanchayat = await GramPanchayat.findByIdAndUpdate(
      gpId,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: gramPanchayat
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
// @desc    Edit water bill
// @route   PUT /api/gp-admin/bills/:id
// @access  Private (GP Admin)
const editWaterBill = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentReading, month, year, dueDate, interest, others } = req.body;
    const gpId = req.user.gramPanchayat._id;

    // Find the bill
    const bill = await WaterBill.findOne({
      _id: id,
      gramPanchayat: gpId,
      isActive: true
    }).populate({
      path: 'house',
      populate: {
        path: 'village'
      }
    });

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    // Check if bill is editable (not fully paid)
    if (bill.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit a fully paid bill'
      });
    }

    // Get house and Gram Panchayat for calculations
    const house = await House.findById(bill.house._id);
    const gramPanchayat = await GramPanchayat.findById(gpId);

    // Calculate new values if currentReading is updated
    let updatedFields = { month, year, dueDate: new Date(dueDate), interest, others };
    if (currentReading !== undefined) {
      if (currentReading < bill.previousReading) {
        return res.status(400).json({
          success: false,
          message: 'Current reading cannot be less than previous reading'
        });
      }
      const totalUsage = currentReading - bill.previousReading;
      const currentDemand = calculateWaterBill(totalUsage, gramPanchayat.waterTariff, house.usageType);

      // Update arrears (exclude the current bill from arrears calculation)
      const unpaidBills = await WaterBill.find({
        house: house._id,
        _id: { $ne: bill._id },
        status: { $in: ['pending', 'partial'] },
        isActive: true
      });
      const arrears = roundToTwo(unpaidBills.reduce((sum, b) => sum + b.remainingAmount, 0));

      updatedFields = {
        ...updatedFields,
        currentReading,
        totalUsage,
        currentDemand: roundToTwo(currentDemand),
        arrears,
        totalAmount: roundToTwo(currentDemand + arrears + (interest || bill.interest) + (others || bill.others)),
        remainingAmount: roundToTwo(
          currentDemand + arrears + (interest || bill.interest) + (others || bill.others) - bill.paidAmount
        )
      };
    } else {
      // If currentReading is not updated, recalculate totalAmount and remainingAmount with new interest/others
      updatedFields.totalAmount = roundToTwo(
        bill.currentDemand + bill.arrears + (interest || bill.interest) + (others || bill.others)
      );
      updatedFields.remainingAmount = roundToTwo(updatedFields.totalAmount - bill.paidAmount);
    }

    // Update bill
    const updatedBill = await WaterBill.findByIdAndUpdate(
      id,
      { $set: updatedFields },
      { new: true, runValidators: true }
    ).populate({
      path: 'house',
      populate: {
        path: 'village'
      }
    });

    // Update house previousMeterReading if currentReading was updated
    if (currentReading !== undefined) {
      house.previousMeterReading = currentReading;
      await house.save();
    }

    res.json({
      success: true,
      message: 'Bill updated successfully',
      data: {
        bill: updatedBill,
        gramPanchayat: {
          id: gramPanchayat._id,
          gramPanchayatId: gramPanchayat._id,
          name: gramPanchayat.name,
          uniqueId: gramPanchayat.uniqueId
        }
      }
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete water bill
// @route   DELETE /api/gp-admin/bills/:id
// @access  Private (GP Admin)
const deleteWaterBill = async (req, res) => {
  try {
    const { id } = req.params;
    const gpId = req.user.gramPanchayat._id;

    // Find the bill
    const bill = await WaterBill.findOne({
      _id: id,
      gramPanchayat: gpId,
      isActive: true
    });

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    // Check if bill is deletable (not fully paid)
    if (bill.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a fully paid bill'
      });
    }

    // Soft delete the bill
    bill.isActive = false;
    await bill.save();

    // Revert house's previousMeterReading to the bill's previousReading
    const house = await House.findById(bill.house);
    house.previousMeterReading = bill.previousReading;
    await house.save();

    // Delete associated payments
    await Payment.deleteMany({ bill: bill._id });

    res.json({
      success: true,
      message: 'Bill deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  getDashboard,
  getVillages,
  createVillage,
  getVillageDetails,
  updateVillage,
  deleteVillage,
  getHouses,
  createHouse,
  uploadHousesFromExcel,
  exportHousesData,
  getHouseDetails,
  updateHouse,
  deleteHouse,
  generateWaterBill,
  getBills,
  getBillDetails,
  downloadBillPDF,
  makePayment,
  generatePaymentQRCode,
  generateGPQRCode,
  updateWaterTariff,
  getUsers,
  createUser,
  getUserDetails,
  updateUser,
  deleteUser,
  exportUsersData,
  exportVillagesData,
  exportBillsData,
  updateGPSettings,
  editWaterBill,
  deleteWaterBill
};
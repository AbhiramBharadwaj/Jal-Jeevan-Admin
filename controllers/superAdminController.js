const User = require('../models/User');
const GramPanchayat = require('../models/GramPanchayat');
const Village = require('../models/Village');
const House = require('../models/House');
const WaterBill = require('../models/WaterBill');
const mongoose = require('mongoose');

// @desc    Get super admin dashboard data
// @route   GET /api/super-admin/dashboard
// @access  Private (Super Admin)
const getDashboard = async (req, res) => {
  try {
    const totalGramPanchayats = await GramPanchayat.countDocuments({ isActive: true });
    const totalVillages = await Village.countDocuments({ isActive: true });
    const totalHouses = await House.countDocuments({ isActive: true });

    res.json({
      success: true,
      data: {
        totalGramPanchayats,
        totalVillages,
        totalHouses
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

// @desc    Get all gram panchayats
// @route   GET /api/super-admin/gram-panchayats
// @access  Private (Super Admin)
const getGramPanchayats = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    
    const query = search 
      ? { 
          isActive: true,
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { uniqueId: { $regex: search, $options: 'i' } },
            { district: { $regex: search, $options: 'i' } }
          ]
        }
      : { isActive: true };

    const gramPanchayats = await GramPanchayat.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    // Get admin and mobile user counts for each GP
    const enrichedGPs = await Promise.all(
      gramPanchayats.map(async (gp) => {
        const adminUsers = await User.countDocuments({ 
          gramPanchayat: gp._id, 
          role: 'gp_admin', 
          isActive: true 
        });
        const mobileUsers = await User.countDocuments({ 
          gramPanchayat: gp._id, 
          role: 'mobile_user', 
          isActive: true 
        });

        return {
          ...gp.toObject(),
          adminUsers,
          mobileUsers
        };
      })
    );

    const total = await GramPanchayat.countDocuments(query);

    res.json({
      success: true,
      data: {
        gramPanchayats: enrichedGPs,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          count: enrichedGPs.length,
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

// @desc    Create new gram panchayat
// @route   POST /api/super-admin/gram-panchayats
// @access  Private (Super Admin)
const createGramPanchayat = async (req, res) => {
  try {
    const gramPanchayat = new GramPanchayat(req.body);
    await gramPanchayat.save();

    res.status(201).json({
      success: true,
      message: 'Gram Panchayat created successfully',
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

// @desc    Get gram panchayat details
// @route   GET /api/super-admin/gram-panchayats/:id
// @access  Private (Super Admin)
const getGramPanchayatDetails = async (req, res) => {
  try {
    const gramPanchayat = await GramPanchayat.findById(req.params.id);
    
    if (!gramPanchayat) {
      return res.status(404).json({
        success: false,
        message: 'Gram Panchayat not found'
      });
    }

    // Get admins for this GP
    const admins = await User.find({
      gramPanchayat: gramPanchayat._id,
      role: 'gp_admin',
      isActive: true
    }).select('-password');

    res.json({
      success: true,
      data: {
        gramPanchayat,
        admins
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

// @desc    Update gram panchayat
// @route   PUT /api/super-admin/gram-panchayats/:id
// @access  Private (Super Admin)
const updateGramPanchayat = async (req, res) => {
  try {
    const gramPanchayat = await GramPanchayat.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!gramPanchayat) {
      return res.status(404).json({
        success: false,
        message: 'Gram Panchayat not found'
      });
    }

    res.json({
      success: true,
      message: 'Gram Panchayat updated successfully',
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

// @desc    Delete gram panchayat
// @route   DELETE /api/super-admin/gram-panchayats/:id
// @access  Private (Super Admin)
const deleteGramPanchayat = async (req, res) => {
  try {
    const gramPanchayat = await GramPanchayat.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!gramPanchayat) {
      return res.status(404).json({
        success: false,
        message: 'Gram Panchayat not found'
      });
    }

    res.json({
      success: true,
      message: 'Gram Panchayat deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create GP admin
// @route   POST /api/super-admin/gram-panchayats/:id/admins
// @access  Private (Super Admin)
const createGPAdmin = async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;
    const gramPanchayatId = req.params.id;

    // Check if GP exists
    const gramPanchayat = await GramPanchayat.findById(gramPanchayatId);
    if (!gramPanchayat) {
      return res.status(404).json({
        success: false,
        message: 'Gram Panchayat not found'
      });
    }

    const admin = new User({
      name,
      email,
      mobile,
      password,
      role: 'gp_admin',
      gramPanchayat: gramPanchayatId
    });

    await admin.save();

    res.status(201).json({
      success: true,
      message: 'GP Admin created successfully',
      data: admin
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all super admins
// @route   GET /api/super-admin/super-admins
// @access  Private (Super Admin)
const getSuperAdmins = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const superAdmins = await User.find({ 
      role: 'super_admin', 
      isActive: true 
    })
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments({ 
      role: 'super_admin', 
      isActive: true 
    });

    res.json({
      success: true,
      data: {
        superAdmins,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          count: superAdmins.length,
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

// @desc    Create super admin
// @route   POST /api/super-admin/super-admins
// @access  Private (Super Admin)
const createSuperAdmin = async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;

    const superAdmin = new User({
      name,
      email,
      mobile,
      password,
      role: 'super_admin'
    });

    await superAdmin.save();

    res.status(201).json({
      success: true,
      message: 'Super Admin created successfully',
      data: superAdmin
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete super admin
// @route   DELETE /api/super-admin/super-admins/:id
// @access  Private (Super Admin)
const deleteSuperAdmin = async (req, res) => {
  try {
    const superAdmin = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!superAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Super Admin not found'
      });
    }

    res.json({
      success: true,
      message: 'Super Admin deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
// @desc    Get single super admin details
// @route   GET /api/super-admin/super-admins/:id
// @access  Private (Super Admin)
const getSuperAdminDetails = async (req, res) => {
  try {
    const superAdmin = await User.findById(req.params.id)
      .select('-password')
      .where({ role: 'super_admin' });

    if (!superAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Super Admin not found'
      });
    }

    res.json({
      success: true,
      data: { superAdmin }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update super admin
// @route   PUT /api/super-admin/super-admins/:id
// @access  Private (Super Admin)
const updateSuperAdmin = async (req, res) => {
  try {
    const { name, email, mobile, password, isActive } = req.body;

    const updateData = {
      name,
      email,
      mobile,
      isActive
    };

    if (password) {
      updateData.password = password;
    }

    const superAdmin = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).where({ role: 'super_admin' })
     .select('-password');

    if (!superAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Super Admin not found'
      });
    }

    res.json({
      success: true,
      message: 'Super Admin updated successfully',
      data: superAdmin
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
   getSuperAdminDetails,
  updateSuperAdmin,
  getDashboard,
  getGramPanchayats,
  createGramPanchayat,
  getGramPanchayatDetails,
  updateGramPanchayat,
  deleteGramPanchayat,
  createGPAdmin,
  getSuperAdmins,
  createSuperAdmin,
  deleteSuperAdmin
};
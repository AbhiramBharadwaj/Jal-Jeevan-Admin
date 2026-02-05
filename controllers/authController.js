const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendOTPEmail } = require('../utils/emailService');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const buildUserPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  gramPanchayat: user.gramPanchayat
});

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, mobile, password, role, gramPanchayat } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    const validRoles = ['super_admin', 'gp_admin', 'mobile_user', 'pillar_admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    if (['gp_admin', 'mobile_user', 'pillar_admin'].includes(role) && !gramPanchayat) {
      return res.status(400).json({
        success: false,
        message: 'gramPanchayat is required for this role'
      });
    }

    const newUser = new User({
      name,
      email,
      mobile,
      password,
      role,
      gramPanchayat
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        gramPanchayat: newUser.gramPanchayat
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
};

// @desc    Login with email and password
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, isActive: true }).populate('gramPanchayat');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: buildUserPayload(user)
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// --------------------------------------------------------------------
// OTP for secured actions (edit/delete flows)
// --------------------------------------------------------------------

// @desc    Request OTP for secured action
// @route   POST /api/auth/request-otp
// @access  Private
const requestLoginOTP = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.user.id, isActive: true });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized user'
      });
    }

    const otp = user.generateOTP();
    await user.save();

    const emailResult = await sendOTPEmail(user.email, otp, user.name);
    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email'
      });
    }

    return res.json({
      success: true,
      message: 'OTP sent to your registered email',
      data: { email: user.email }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Verify OTP for secured action
// @route   POST /api/auth/verify-login-otp
// @access  Private
const verifyLoginOTP = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp || !/^[0-9]{6}$/.test(String(otp))) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 6-digit OTP'
      });
    }

    const user = await User.findOne({
      _id: req.user.id,
      otpCode: otp,
      otpExpires: { $gt: Date.now() },
      isActive: true
    }).populate('gramPanchayat');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    user.otpCode = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        verified: true,
        user: buildUserPayload(user)
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

// --------------------------------------------------------------------
// The rest of your file stays the same
// --------------------------------------------------------------------

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const otp = user.generateOTP();
    await user.save();

    const emailResult = await sendOTPEmail(email, otp, user.name);
    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email'
      });
    }

    res.json({
      success: true,
      message: 'OTP sent to your email'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({
      email,
      otpCode: otp,
      otpExpires: { $gt: Date.now() },
      isActive: true
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    res.json({
      success: true,
      message: 'OTP verified successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({
      email,
      otpCode: otp,
      otpExpires: { $gt: Date.now() },
      isActive: true
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    user.password = newPassword;
    user.otpCode = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('gramPanchayat');

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

module.exports = {
  register,
  login,
  requestLoginOTP,
  verifyLoginOTP,
  forgotPassword,
  verifyOTP,
  resetPassword,
  getProfile
};

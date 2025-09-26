// const express = require('express');
// const router = express.Router();
// const multer = require('multer');
// const path = require('path');
// const { auth, authorize } = require('../middleware/auth');
// const { validate, schemas } = require('../middleware/validation');
// const {
//   getDashboard,
//   getVillages,
//   createVillage,
//   getVillageDetails,
//   createHouse,
//   uploadHousesFromExcel,
//   getHouseDetails,
//   generateWaterBill,
//   getBillDetails,
//   downloadBillPDF,
//   makePayment,
//   generatePaymentQRCode,
//   updateWaterTariff,
//   getUsers,
//   createUser
// } = require('../controllers/gpAdminController');

// // Multer configuration for file uploads
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/');
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   }
// });

// const upload = multer({
//   storage,
//   limits: {
//     fileSize: 5 * 1024 * 1024 // 5MB limit
//   },
//   fileFilter: (req, file, cb) => {
//     const allowedTypes = ['.xlsx', '.xls'];
//     const fileExt = path.extname(file.originalname).toLowerCase();
    
//     if (allowedTypes.includes(fileExt)) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only Excel files are allowed'));
//     }
//   }
// });

// // Apply auth and GP admin authorization to all routes
// router.use(auth);
// router.use(authorize('gp_admin'));

// /**
//  * @swagger
//  * components:
//  *   schemas:
//  *     Village:
//  *       type: object
//  *       required:
//  *         - name
//  *         - uniqueId
//  *         - population
//  *       properties:
//  *         name:
//  *           type: string
//  *         uniqueId:
//  *           type: string
//  *         population:
//  *           type: integer
//  *     House:
//  *       type: object
//  *       required:
//  *         - village
//  *         - ownerName
//  *         - aadhaarNumber
//  *         - mobileNumber
//  *         - address
//  *         - waterMeterNumber
//  *         - sequenceNumber
//  *         - usageType
//  *         - propertyNumber
//  *       properties:
//  *         village:
//  *           type: string
//  *         ownerName:
//  *           type: string
//  *         aadhaarNumber:
//  *           type: string
//  *         mobileNumber:
//  *           type: string
//  *         address:
//  *           type: string
//  *         waterMeterNumber:
//  *           type: string
//  *         previousMeterReading:
//  *           type: number
//  *         sequenceNumber:
//  *           type: string
//  *         usageType:
//  *           type: string
//  *           enum: [residential, commercial, institutional, industrial]
//  *         propertyNumber:
//  *           type: string
//  */

// /**
//  * @swagger
//  * /api/gp-admin/dashboard:
//  *   get:
//  *     summary: Get GP admin dashboard data
//  *     tags: [GP Admin]
//  *     security:
//  *       - bearerAuth: []
//  *     responses:
//  *       200:
//  *         description: Dashboard data retrieved successfully
//  */
// router.get('/dashboard', getDashboard);

// /**
//  * @swagger
//  * /api/gp-admin/villages:
//  *   get:
//  *     summary: Get all villages for GP
//  *     tags: [GP Admin]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: query
//  *         name: page
//  *         schema:
//  *           type: integer
//  *         description: Page number
//  *       - in: query
//  *         name: limit
//  *         schema:
//  *           type: integer
//  *         description: Number of items per page
//  *       - in: query
//  *         name: search
//  *         schema:
//  *           type: string
//  *         description: Search term
//  *     responses:
//  *       200:
//  *         description: Villages retrieved successfully
//  *   post:
//  *     summary: Create new village
//  *     tags: [GP Admin]
//  *     security:
//  *       - bearerAuth: []
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             $ref: '#/components/schemas/Village'
//  *     responses:
//  *       201:
//  *         description: Village created successfully
//  */
// router.route('/villages')
//   .get(getVillages)
//   .post(validate(schemas.createVillage), createVillage);

// /**
//  * @swagger
//  * /api/gp-admin/villages/{id}:
//  *   get:
//  *     summary: Get village details with houses
//  *     tags: [GP Admin]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *     responses:
//  *       200:
//  *         description: Village details retrieved successfully
//  */
// router.get('/villages/:id', getVillageDetails);

// /**
//  * @swagger
//  * /api/gp-admin/houses:
//  *   post:
//  *     summary: Create new house
//  *     tags: [GP Admin]
//  *     security:
//  *       - bearerAuth: []
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             $ref: '#/components/schemas/House'
//  *     responses:
//  *       201:
//  *         description: House created successfully
//  */
// router.post('/houses', validate(schemas.createHouse), createHouse);

// /**
//  * @swagger
//  * /api/gp-admin/houses/upload:
//  *   post:
//  *     summary: Upload houses from Excel file
//  *     tags: [GP Admin]
//  *     security:
//  *       - bearerAuth: []
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         multipart/form-data:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               file:
//  *                 type: string
//  *                 format: binary
//  *               villageId:
//  *                 type: string
//  *     responses:
//  *       200:
//  *         description: Houses uploaded successfully
//  */
// router.post('/houses/upload/:villageId', upload.single('file'), uploadHousesFromExcel);

// /**
//  * @swagger
//  * /api/gp-admin/houses/{id}:
//  *   get:
//  *     summary: Get house details with bills
//  *     tags: [GP Admin]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *     responses:
//  *       200:
//  *         description: House details retrieved successfully
//  */
// router.get('/houses/:id', getHouseDetails);

// /**
//  * @swagger
//  * /api/gp-admin/houses/{id}/bills:
//  *   post:
//  *     summary: Generate water bill for house
//  *     tags: [GP Admin]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - currentReading
//  *               - month
//  *               - year
//  *               - dueDate
//  *             properties:
//  *               currentReading:
//  *                 type: number
//  *               month:
//  *                 type: string
//  *               year:
//  *                 type: integer
//  *               dueDate:
//  *                 type: string
//  *                 format: date
//  *     responses:
//  *       201:
//  *         description: Water bill generated successfully
//  */
// router.post('/houses/:id/bills', validate(schemas.generateBill), generateWaterBill);

// /**
//  * @swagger
//  * /api/gp-admin/bills/{id}:
//  *   get:
//  *     summary: Get bill details
//  *     tags: [GP Admin]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *     responses:
//  *       200:
//  *         description: Bill details retrieved successfully
//  */
// router.get('/bills/:id', getBillDetails);

// /**
//  * @swagger
//  * /api/gp-admin/bills/{id}/pdf:
//  *   get:
//  *     summary: Generate and download bill PDF
//  *     tags: [GP Admin]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *     responses:
//  *       200:
//  *         description: PDF generated and downloaded successfully
//  */
// router.get('/bills/:id/pdf', downloadBillPDF);

// /**
//  * @swagger
//  * /api/gp-admin/bills/{id}/payment:
//  *   post:
//  *     summary: Make payment for bill
//  *     tags: [GP Admin]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - amount
//  *               - paymentMode
//  *             properties:
//  *               amount:
//  *                 type: number
//  *               paymentMode:
//  *                 type: string
//  *                 enum: [cash, upi, online]
//  *               transactionId:
//  *                 type: string
//  *               remarks:
//  *                 type: string
//  *     responses:
//  *       200:
//  *         description: Payment recorded successfully
//  */
// router.post('/bills/:id/payment', validate(schemas.makePayment), makePayment);

// /**
//  * @swagger
//  * /api/gp-admin/bills/{id}/qr-code:
//  *   get:
//  *     summary: Generate payment QR code for bill
//  *     tags: [GP Admin]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *     responses:
//  *       200:
//  *         description: QR code generated successfully
//  */
// router.get('/bills/:id/qr-code', generatePaymentQRCode);

// /**
//  * @swagger
//  * /api/gp-admin/tariff:
//  *   put:
//  *     summary: Update water tariff rates
//  *     tags: [GP Admin]
//  *     security:
//  *       - bearerAuth: []
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               domestic:
//  *                 type: object
//  *                 properties:
//  *                   upTo7KL:
//  *                     type: number
//  *                   from7to10KL:
//  *                     type: number
//  *                   from10to15KL:
//  *                     type: number
//  *                   from15to20KL:
//  *                     type: number
//  *                   above20KL:
//  *                     type: number
//  *               nonDomestic:
//  *                 type: object
//  *                 properties:
//  *                   publicPrivateInstitutions:
//  *                     type: number
//  *                   commercialEnterprises:
//  *                     type: number
//  *                   industrialEnterprises:
//  *                     type: number
//  *     responses:
//  *       200:
//  *         description: Water tariff updated successfully
//  */
// router.put('/tariff', updateWaterTariff);

// /**
//  * @swagger
//  * /api/gp-admin/users:
//  *   get:
//  *     summary: Get all users for GP
//  *     tags: [GP Admin]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: query
//  *         name: page
//  *         schema:
//  *           type: integer
//  *         description: Page number
//  *       - in: query
//  *         name: limit
//  *         schema:
//  *           type: integer
//  *         description: Number of items per page
//  *       - in: query
//  *         name: userType
//  *         schema:
//  *           type: string
//  *         description: Filter by user type
//  *     responses:
//  *       200:
//  *         description: Users retrieved successfully
//  *   post:
//  *     summary: Create new user for GP
//  *     tags: [GP Admin]
//  *     security:
//  *       - bearerAuth: []
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - name
//  *               - email
//  *               - mobile
//  *               - password
//  *               - role
//  *             properties:
//  *               name:
//  *                 type: string
//  *               email:
//  *                 type: string
//  *                 format: email
//  *               mobile:
//  *                 type: string
//  *               password:
//  *                 type: string
//  *                 minLength: 6
//  *               role:
//  *                 type: string
//  *                 enum: [gp_admin, mobile_user]
//  *     responses:
//  *       201:
//  *         description: User created successfully
//  */
// router.route('/users')
//   .get(getUsers)
//   .post(createUser);

// module.exports = router;

// /**
//  * Complete Swagger annotations for remaining GP Admin routes
//  */

// /**
//  * @swagger
//  * /api/gp-admin/villages/{id}:
//  *   put:
//  *     summary: Update village details
//  *     tags: [GP Admin]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: Village ID
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             $ref: '#/components/schemas/Village'
//  *     responses:
//  *       200:
//  *         description: Village updated successfully
//  *
//  *   delete:
//  *     summary: Delete a village
//  *     tags: [GP Admin]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *     responses:
//  *       200:
//  *         description: Village deleted successfully
//  */

// /**
//  * @swagger
//  * /api/gp-admin/houses/{id}:
//  *   put:
//  *     summary: Update house details
//  *     tags: [GP Admin]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             $ref: '#/components/schemas/House'
//  *     responses:
//  *       200:
//  *         description: House updated successfully
//  *
//  *   delete:
//  *     summary: Delete a house
//  *     tags: [GP Admin]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *     responses:
//  *       200:
//  *         description: House deleted successfully
//  */

// /**
//  * @swagger
//  * /api/gp-admin/bills:
//  *   get:
//  *     summary: Get all bills (with optional filters)
//  *     tags: [GP Admin]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: query
//  *         name: page
//  *         schema:
//  *           type: integer
//  *       - in: query
//  *         name: limit
//  *         schema:
//  *           type: integer
//  *       - in: query
//  *         name: status
//  *         schema:
//  *           type: string
//  *         description: Filter by status (paid, unpaid, etc.)
//  *     responses:
//  *       200:
//  *         description: Bills retrieved successfully
//  */

// /**
//  * @swagger
//  * /api/gp-admin/qr-code:
//  *   get:
//  *     summary: Generate QR code for GP settings
//  *     tags: [GP Admin]
//  *     security:
//  *       - bearerAuth: []
//  *     responses:
//  *       200:
//  *         description: QR code generated successfully
//  */

// /**
//  * @swagger
//  * /api/gp-admin/users/{id}:
//  *   get:
//  *     summary: Get user details
//  *     tags: [GP Admin]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *     responses:
//  *       200:
//  *         description: User details retrieved successfully
//  *
//  *   put:
//  *     summary: Update a user
//  *     tags: [GP Admin]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               name:
//  *                 type: string
//  *               email:
//  *                 type: string
//  *                 format: email
//  *               mobile:
//  *                 type: string
//  *               role:
//  *                 type: string
//  *                 enum: [gp_admin, mobile_user]
//  *     responses:
//  *       200:
//  *         description: User updated successfully
//  *
//  *   delete:
//  *     summary: Delete a user
//  *     tags: [GP Admin]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *     responses:
//  *       200:
//  *         description: User deleted successfully
//  */

// /**
//  * @swagger
//  * /api/gp-admin/settings:
//  *   put:
//  *     summary: Update GP settings
//  *     tags: [GP Admin]
//  *     security:
//  *       - bearerAuth: []
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               panchayatName:
//  *                 type: string
//  *               address:
//  *                 type: string
//  *               contact:
//  *                 type: string
//  *               email:
//  *                 type: string
//  *                 format: email
//  *     responses:
//  *       200:
//  *         description: Settings updated successfully
//  */


const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { auth, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const {
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
  deleteWaterBill,
  editWaterBill
} = require('../controllers/gpAdminController');

/**
 * @swagger
 * tags:
 *   - name: GP Admin
 *     description: Endpoints for Gram Panchayat Admin
 *
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.xlsx', '.xls'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'));
    }
  }
});

router.use(auth);
router.use(authorize('gp_admin'));

/**
 * @swagger
 * /api/gp-admin/dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [GP Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data
 */
router.get('/dashboard', getDashboard);

/**
 * @swagger
 * /api/gp-admin/villages:
 *   get:
 *     summary: Get all villages
 *     tags: [GP Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of villages
 *   post:
 *     summary: Create a new village
 *     tags: [GP Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Village'
 *     responses:
 *       201:
 *         description: Village created
 */
router.route('/villages')
  .get(getVillages)
  .post(validate(schemas.createVillage), createVillage);

/**
 * @swagger
 * /api/gp-admin/villages/export:
 *   get:
 *     summary: Export villages data
 *     tags: [GP Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Villages exported
 */
router.get('/villages/export', exportVillagesData);

/**
 * @swagger
 * /api/gp-admin/villages/{id}:
 *   get:
 *     summary: Get village details
 *     tags: [GP Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Village detail fetched
 *   put:
 *     summary: Update village
 *     tags: [GP Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Village updated
 *   delete:
 *     summary: Delete village
 *     tags: [GP Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Village deleted
 */
router.route('/villages/:id')
  .get(getVillageDetails)
  .put(updateVillage)
  .delete(deleteVillage);

/**
 * @swagger
 * /api/gp-admin/houses:
 *   get:
 *     summary: Get all houses
 *     tags: [GP Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of houses
 *   post:
 *     summary: Create new house
 *     tags: [GP Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/House'
 *     responses:
 *       201:
 *         description: House created
 */
router.route('/houses')
  .get(getHouses)
  .post(validate(schemas.createHouse), createHouse);

/**
 * @swagger
 * /api/gp-admin/houses/upload:
 *   post:
 *     summary: Upload houses from Excel
 *     tags: [GP Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Houses uploaded
 */
router.post('/houses/upload', upload.single('file'), uploadHousesFromExcel);

/**
 * @swagger
 * /api/gp-admin/houses/export:
 *   get:
 *     summary: Export houses data
 *     tags: [GP Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Houses exported
 */
router.get('/houses/export', exportHousesData);

/**
 * @swagger
 * /api/gp-admin/houses/{id}:
 *   get:
 *     summary: Get house details
 *     tags: [GP Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: House details
 *   put:
 *     summary: Update house
 *     tags: [GP Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: House updated
 *   delete:
 *     summary: Delete house
 *     tags: [GP Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: House deleted
 */
router.route('/houses/:id')
  .get(getHouseDetails)
  .put(updateHouse)
  .delete(deleteHouse);

/**
 * @swagger
 * /api/gp-admin/bills:
 *   get:
 *     summary: Get all bills
 *     tags: [GP Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of bills
 */
router.get('/bills', getBills);

/**
 * @swagger
 * /api/gp-admin/bills/export:
 *   get:
 *     summary: Export bills data
 *     tags: [GP Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bills exported
 */
router.get('/bills/export', exportBillsData);

/**
 * @swagger
 * /api/gp-admin/houses/{id}/bills:
 *   post:
 *     summary: Generate water bill
 *     tags: [GP Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Bill generated
 */
router.post('/houses/:id/bills', validate(schemas.generateBill), generateWaterBill);

/**
 * @swagger
 * /api/gp-admin/bills/{id}:
 *   get:
 *     summary: Get bill details
 *     tags: [GP Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bill details
 */
router.get('/bills/:id', getBillDetails);

/**
 * @swagger
 * /api/gp-admin/bills/{id}/pdf:
 *   get:
 *     summary: Download bill PDF
 *     tags: [GP Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: PDF downloaded
 */
router.get('/bills/:id/pdf', downloadBillPDF);

/**
 * @swagger
 * /api/gp-admin/bills/{id}/payment:
 *   post:
 *     summary: Make bill payment
 *     tags: [GP Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Payment made
 */
router.post('/bills/:id/payment', validate(schemas.makePayment), makePayment);

/**
 * @swagger
 * /api/gp-admin/bills/{id}/qr-code:
 *   get:
 *     summary: Generate payment QR code
 *     tags: [GP Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: QR code generated
 */
router.get('/bills/:id/qr-code', generatePaymentQRCode);

/**
 * @swagger
 * /api/gp-admin/qr-code:
 *   get:
 *     summary: Generate general GP QR code
 *     tags: [GP Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: QR code generated
 */
router.get('/qr-code', generateGPQRCode);

/**
 * @swagger
 * /api/gp-admin/tariff:
 *   put:
 *     summary: Update water tariff
 *     tags: [GP Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tariff updated
 */
router.put('/tariff', updateWaterTariff);

/**
 * @swagger
 * /api/gp-admin/users:
 *   get:
 *     summary: Get all users
 *     tags: [GP Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *   post:
 *     summary: Create user
 *     tags: [GP Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: User created
 */
router.route('/users')
  .get(getUsers)
  .post(createUser);

/**
 * @swagger
 * /api/gp-admin/users/export:
 *   get:
 *     summary: Export users data
 *     tags: [GP Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users exported
 */
router.get('/users/export', exportUsersData);

/**
 * @swagger
 * /api/gp-admin/users/{id}:
 *   get:
 *     summary: Get user details
 *     tags: [GP Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 *   put:
 *     summary: Update user
 *     tags: [GP Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User updated
 *   delete:
 *     summary: Delete user
 *     tags: [GP Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User deleted
 */
router.route('/users/:id')
  .get(getUserDetails)
  .put(updateUser)
  .delete(deleteUser);

/**
 * @swagger
 * /api/gp-admin/settings:
 *   put:
 *     summary: Update GP settings
 *     tags: [GP Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Settings updated
 */
router.put('/settings', updateGPSettings);
router.get('/houses/:houseId', getHouseDetails);
// router.get('/bills/:id', getHouseDetails);
router.put('/bills/:id', editWaterBill);
router.delete('/bills/:id', deleteWaterBill);

module.exports = router;

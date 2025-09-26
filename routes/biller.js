const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const {
  getDashboard,
  searchCustomers,
  getVillages,
  createHouse,
  getHouseDetails,
  generateWaterBill,
  getBillDetails,
  getFinalViewBill,
  processPayment,
  generatePaymentQRCode,
  generateGPQRCode,
  downloadBillPDF,
  downloadFinalBillReceipt,
  getBillerProfile
} = require('../controllers/billerController');

// Apply auth and mobile user (biller) authorization to all routes
router.use(auth);
router.use(authorize('mobile_user'));

/**
 * @swagger
 * components:
 *   schemas:
 *     BillerDashboard:
 *       type: object
 *       properties:
 *         totalVillages:
 *           type: integer
 *         totalHouses:
 *           type: integer
 *         thisMonthCollection:
 *           type: number
 *         paidBills:
 *           type: integer
 *         unpaidBills:
 *           type: integer
 *         recentBills:
 *           type: array
 *         gramPanchayat:
 *           type: object
 *     SearchResult:
 *       type: object
 *       properties:
 *         houses:
 *           type: array
 *         pagination:
 *           type: object
 *     GenerateBillRequest:
 *       type: object
 *       required:
 *         - previousReading
 *         - currentReading
 *         - totalUsage
 *         - month
 *         - year
 *         - dueDate
 *       properties:
 *         previousReading:
 *           type: number
 *         currentReading:
 *           type: number
 *         totalUsage:
 *           type: number
 *         month:
 *           type: string
 *         year:
 *           type: integer
 *         dueDate:
 *           type: string
 *           format: date
 *     PaymentRequest:
 *       type: object
 *       required:
 *         - amount
 *         - paymentMode
 *       properties:
 *         amount:
 *           type: number
 *         paymentMode:
 *           type: string
 *           enum: [cash, upi, online, pay_later]
 *         transactionId:
 *           type: string
 *           description: Required for UPI and online payments, optional for cash and pay_later
 *         remarks:
 *           type: string
 */

/**
 * @swagger
 * /api/biller/dashboard:
 *   get:
 *     summary: Get biller dashboard data
 *     tags: [Biller]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/BillerDashboard'
 */
router.get('/dashboard', getDashboard);

/**
 * @swagger
 * /api/biller/search:
 *   get:
 *     summary: Search customers by meter ID, name, mobile, or Aadhaar
 *     tags: [Biller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term (meter ID, customer name, mobile, or Aadhaar)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/SearchResult'
 */
router.get('/search', searchCustomers);

/**
 * @swagger
 * /api/biller/villages:
 *   get:
 *     summary: Get all villages for house creation
 *     tags: [Biller]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Villages retrieved successfully
 */
router.get('/villages', getVillages);

/**
 * @swagger
 * /api/biller/houses:
 *   post:
 *     summary: Create new house (sequenceNumber auto-generated)
 *     tags: [Biller]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - village
 *               - ownerName
 *               - aadhaarNumber
 *               - mobileNumber
 *               - address
 *               - waterMeterNumber
 *               - usageType
 *               - propertyNumber
 *             properties:
 *               village:
 *                 type: string
 *                 description: Village ID (can also use villageId)
 *               villageId:
 *                 type: string
 *                 description: Alternative field name for village ID
 *               ownerName:
 *                 type: string
 *               aadhaarNumber:
 *                 type: string
 *               mobileNumber:
 *                 type: string
 *               address:
 *                 type: string
 *               waterMeterNumber:
 *                 type: string
 *               previousMeterReading:
 *                 type: number
 *                 default: 0
 *               usageType:
 *                 type: string
 *                 enum: [residential, commercial, institutional, industrial]
 *               propertyNumber:
 *                 type: string
 *     responses:
 *       201:
 *         description: House created successfully
 */
router.post('/houses', createHouse);

/**
 * @swagger
 * /api/biller/houses/{houseId}:
 *   get:
 *     summary: Get house details for bill generation
 *     tags: [Biller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: houseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: House details retrieved successfully
 *       404:
 *         description: House not found or does not belong to your Gram Panchayat
 */
router.get('/houses/:houseId', getHouseDetails);

/**
 * @swagger
 * /api/biller/houses/{houseId}/generate-bill:
 *   post:
 *     summary: Generate water bill for house
 *     tags: [Biller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: houseId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - previousReading
 *               - currentReading
 *               - totalUsage
 *               - month
 *               - year
 *             properties:
 *               previousReading:
 *                 type: number
 *               currentReading:
 *                 type: number
 *               totalUsage:
 *                 type: number
 *               month:
 *                 type: string
 *               year:
 *                 type: number
 *     responses:
 *       201:
 *         description: Water bill generated successfully
 *       400:
 *         description: Invalid readings or calculation mismatch
 *       404:
 *         description: House not found
 */
router.post('/houses/:houseId/generate-bill', validate(schemas.generateBill), generateWaterBill);

/**
 * @swagger
 * /api/biller/gp-qr-code:
 *   get:
 *     summary: Generate static QR code for Gram Panchayat (one QR for all houses)
 *     tags: [Biller]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Static QR code generated successfully
 *       400:
 *         description: UPI details not configured
 */
router.get('/gp-qr-code', generateGPQRCode);

/**
 * @swagger
 * /api/biller/bills/{billId}:
 *   get:
 *     summary: Get bill details
 *     tags: [Biller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: billId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bill details retrieved successfully
 *       404:
 *         description: Bill not found or does not belong to your Gram Panchayat
 */
router.get('/bills/:billId', getBillDetails);

/**
 * @swagger
 * /api/biller/final-view-bill/{billId}:
 *   get:
 *     summary: Get final view bill with complete post-payment details
 *     tags: [Biller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: billId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Final bill view retrieved successfully
 *       404:
 *         description: Bill not found or does not belong to your Gram Panchayat
 */
router.get('/final-view-bill/:billId', getFinalViewBill);

/**
 * @swagger
 * /api/biller/final-view-bill/{billId}/print:
 *   get:
 *     summary: Download final bill receipt PDF (post-payment)
 *     tags: [Biller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: billId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Receipt PDF generated and downloaded successfully
 *       404:
 *         description: Bill not found
 */
router.get('/final-view-bill/:billId/print', downloadFinalBillReceipt);

/**
 * @swagger
 * /api/biller/bills/{billId}/payment:
 *   post:
 *     summary: Process payment for bill (allows overpayment)
 *     tags: [Biller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: billId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentRequest'
 *     responses:
 *       200:
 *         description: Payment processed successfully
 *       400:
 *         description: Invalid payment amount or missing transaction ID
 *       404:
 *         description: Bill not found
 */
router.post('/bills/:billId/payment', validate(schemas.makePayment), processPayment);

// /**
//  * @swagger
//  * /api/biller/bills/{billId}/qr-code:
//  *   get:
//  *     summary: Generate payment QR code for specific bill
//  *     tags: [Biller]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: billId
//  *         required: true
//  *         schema:
//  *           type: string
//  *     responses:
//  *       200:
//  *         description: QR code generated successfully
//  *       400:
//  *         description: UPI details not configured
//  *       404:
//  *         description: Bill not found
//  */
// router.get('/bills/:billId/qr-code', generatePaymentQRCode);

/**
 * @swagger
 * /api/biller/bills/{billId}/pdf:
 *   get:
 *     summary: Download bill PDF
 *     tags: [Biller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: billId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: PDF generated and downloaded successfully
 *       404:
 *         description: Bill not found
 */
router.get('/bills/:billId/pdf', downloadBillPDF);

/**
 * @swagger
 * /api/biller/profile:
 *   get:
 *     summary: Get biller profile
 *     tags: [Biller]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 */
router.get('/profile', getBillerProfile);



module.exports = router;
const fs = require('fs').promises;
const path = require('path');
const WaterBill = require('../models/WaterBill'); // Adjust path as needed
const GramPanchayat = require('../models/GramPanchayat'); // Adjust path as needed
const PDFDocument = require('pdfkit');

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

const generateBillPDF = async (billData, houseData, gramPanchayat) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const filename = `bill_${billData.billNumber || 'unknown'}.pdf`;
      const filepath = path.join(__dirname, '../temp', filename);

      fs.mkdir(path.dirname(filepath), { recursive: true })
        .then(() => {
          const writeStream = require('fs').createWriteStream(filepath);
          doc.pipe(writeStream);

          // Header
          doc.fontSize(20).font('Helvetica-Bold').text('Water Management System', 50, 50);
          doc.fontSize(16).text('Water Bill', 50, 80);

          // GP Details
          doc.fontSize(12).font('Helvetica');
          doc.text(`Gram Panchayat: ${gramPanchayat.name || 'N/A'}`, 50, 100);
          doc.text(`District: ${gramPanchayat.district || 'N/A'}`, 300, 100);
          doc.text(`Address: ${gramPanchayat.address || 'N/A'}`, 50, 120);

          // Bill Details
          doc.text(`Bill No: ${billData.billNumber || 'N/A'}`, 50, 150);
          doc.text(`Month: ${billData.month || 'N/A'} ${billData.year || ''}`, 200, 150);
          doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 350, 150);

          // House Details
          doc.fontSize(14).font('Helvetica-Bold').text('House Details:', 50, 190);
          doc.fontSize(12).font('Helvetica');
          doc.text(`Owner: ${houseData.ownerName || 'N/A'}`, 50, 210);
          doc.text(`Address: ${houseData.address || 'N/A'}`, 50, 230);
          doc.text(`Property No: ${houseData.propertyNumber || 'N/A'}`, 50, 250);
          doc.text(`Meter No: ${houseData.waterMeterNumber || 'N/A'}`, 300, 210);
          doc.text(`Usage Type: ${houseData.usageType || 'N/A'}`, 300, 230);
          doc.text(`Mobile: ${houseData.mobileNumber || 'N/A'}`, 300, 250);

          // Meter Reading
          doc.fontSize(14).font('Helvetica-Bold').text('Meter Reading:', 50, 290);
          doc.fontSize(12).font('Helvetica');
          doc.text(`Previous Reading: ${billData.previousReading || 0}`, 50, 310);
          doc.text(`Current Reading: ${billData.currentReading || 0}`, 200, 310);
          doc.text(`Total Usage: ${billData.totalUsage || 0} KL`, 350, 310);

          // Bill Amount Details
          doc.fontSize(14).font('Helvetica-Bold').text('Bill Details:', 50, 350);
          doc.fontSize(12).font('Helvetica');
          doc.text(`Current Demand: ₹${billData.currentDemand || 0}`, 50, 370);
          doc.text(`Arrears: ₹${billData.arrears || 0}`, 200, 370);
          doc.text(`Interest: ₹${billData.interest || 0}`, 350, 370);
          doc.text(`Others: ₹${billData.others || 0}`, 50, 390);
          doc.text(`Total Amount: ₹${billData.totalAmount || 0}`, 200, 390);
          doc.text(`Paid: ₹${billData.paidAmount || 0}`, 350, 390);

          // Payment Status
          doc.fontSize(14).font('Helvetica-Bold').text(`Status: ${billData.status?.toUpperCase() || 'N/A'}`, 50, 430);
          if (billData.remainingAmount > 0) {
            doc.text(`Remaining: ₹${billData.remainingAmount || 0}`, 200, 430);
          }

          // Due Date
          const dueDate = billData.dueDate && !isNaN(new Date(billData.dueDate).getTime())
            ? new Date(billData.dueDate).toLocaleDateString('en-IN')
            : 'N/A';
          doc.text(`Due Date: ${dueDate}`, 50, 460);

          // Payment Details if paid
          if (billData.paidDate && !isNaN(new Date(billData.paidDate).getTime())) {
            doc.text(`Paid Date: ${new Date(billData.paidDate).toLocaleDateString('en-IN')}`, 50, 480);
            if (billData.paymentMode) {
              doc.text(`Payment Mode: ${billData.paymentMode.toUpperCase()}`, 200, 480);
            }
            if (billData.transactionId) {
              doc.text(`Transaction ID: ${billData.transactionId}`, 350, 480);
            }
          }

          // Footer
          doc.fontSize(10).font('Helvetica');
          doc.text('Please pay your bill on time to avoid late fees.', 50, 520);
          doc.text('Thank you for using our services.', 50, 540);

          // DueDays from GramPanchayat (if needed)
          if (gramPanchayat.DueDays) {
            doc.text(`Default Due Days: ${gramPanchayat.DueDays}`, 350, 120);
          }

          doc.end();

          writeStream.on('finish', () => {
            resolve(filepath);
          });

          writeStream.on('error', (err) => {
            console.error('Write stream error:', err);
            reject(err);
          });
        })
        .catch((err) => {
          console.error('Directory creation error:', err);
          reject(err);
        });
    } catch (error) {
      console.error('PDF generation error:', error);
      reject(error);
    }
  });
};

module.exports = { downloadBillPDF, generateBillPDF };
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
          const toMoney = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;
          const addSectionTitle = (title) => {
            doc.moveDown(0.5);
            doc.fontSize(13).font('Helvetica-Bold').text(title);
            doc.moveDown(0.2);
            doc.font('Helvetica').fontSize(11);
          };

          // Header
          doc.fontSize(18).font('Helvetica-Bold').text('Water Bill');
          doc.fontSize(11).font('Helvetica').text(`Bill No: ${billData.billNumber || 'N/A'}`, { continued: true });
          doc.text(`   Date: ${new Date().toLocaleDateString('en-IN')}`);
          doc.text(`Month: ${billData.month || 'N/A'} ${billData.year || ''}`);

          // GP Details
          addSectionTitle('Gram Panchayat');
          doc.text(`Name: ${gramPanchayat.name || 'N/A'}`);
          doc.text(`District: ${gramPanchayat.district || 'N/A'}`);
          doc.text(`Address: ${gramPanchayat.address || 'N/A'}`);
          if (gramPanchayat.DueDays) {
            doc.text(`Default Due Days: ${gramPanchayat.DueDays}`);
          }

          // House Details
          addSectionTitle('House Details');
          doc.text(`Owner: ${houseData.ownerName || 'N/A'}`);
          doc.text(`Address: ${houseData.address || 'N/A'}`);
          doc.text(`Property No: ${houseData.propertyNumber || 'N/A'}`);
          doc.text(`Meter No: ${houseData.waterMeterNumber || 'N/A'}`);
          doc.text(`Usage Type: ${houseData.usageType || 'N/A'}`);
          doc.text(`Mobile: ${houseData.mobileNumber || 'N/A'}`);
          if (billData.noMeter || billData.damagedMeter) {
            doc.text(`Meter Status: ${billData.noMeter ? 'No Meter' : 'Damaged Meter'}`);
          }

          // Meter Reading
          addSectionTitle('Meter Reading');
          doc.text(`Previous Reading: ${billData.previousReading || 0} KL`);
          doc.text(`Current Reading: ${billData.currentReading || 0} KL`);
          doc.text(`Total Usage: ${billData.totalUsage || 0} KL`);

          // Bill Details
          addSectionTitle('Bill Details');
          doc.text(`Current Demand: ${toMoney(billData.currentDemand)}`);
          doc.text(`Arrears: ${toMoney(billData.arrears)}`);
          const interestLabel = billData.interestRate ? `Interest (${billData.interestRate}%/yr)` : 'Interest';
          doc.text(`${interestLabel}: ${toMoney(billData.interest)}`);
          doc.text(`Penalty: ${toMoney(billData.penaltyAmount)}`);
          doc.text(`Others: ${toMoney(billData.others)}`);
          doc.text(`Total Amount: ${toMoney(billData.totalAmount)}`);
          doc.text(`Paid Amount: ${toMoney(billData.paidAmount)}`);
          doc.text(`Remaining: ${toMoney(billData.remainingAmount)}`);
          doc.text(`Status: ${(billData.status || 'N/A').toUpperCase()}`);

          // Due Date
          const dueDate = billData.dueDate && !isNaN(new Date(billData.dueDate).getTime())
            ? new Date(billData.dueDate).toLocaleDateString('en-IN')
            : (billData.dueDate || 'N/A');
          doc.text(`Due Date/Days: ${dueDate}`);

          // Payment Details if paid
          if (billData.paidDate && !isNaN(new Date(billData.paidDate).getTime())) {
            addSectionTitle('Payment Details');
            doc.text(`Paid Date: ${new Date(billData.paidDate).toLocaleDateString('en-IN')}`);
            doc.text(`Payment Mode: ${billData.paymentMode ? billData.paymentMode.toUpperCase() : 'N/A'}`);
            doc.text(`Transaction ID: ${billData.transactionId || 'N/A'}`);
          }

          // Footer
          doc.moveDown(0.5);
          doc.fontSize(9).font('Helvetica').text('Please pay your bill on time to avoid late fees.');
          doc.text('Thank you for using our services.');

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

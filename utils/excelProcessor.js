const XLSX = require('xlsx');

const processHouseExcel = (filePath) => {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const processedData = data.map(row => ({
      // village: row['Village'] || row['village'],
      ownerName: row['Owner Name'] || row['OwnerName'] || row['owner_name'],
      aadhaarNumber: row['Aadhaar Number'] || row['AadhaarNumber'] || row['aadhaar_number'],
      mobileNumber: row['Mobile Number'] || row['MobileNumber'] || row['mobile_number'],
      address: row['Address'] || row['address'],
      waterMeterNumber: row['Water Meter Number'] || row['WaterMeterNumber'] || row['water_meter_number'],
      previousMeterReading: parseFloat(row['Previous Meter Reading'] || row['PreviousMeterReading'] || row['previous_meter_reading'] || 0),
      sequenceNumber: row['Sequence Number'] || row['SequenceNumber'] || row['sequence_number'],
      usageType: row['Usage Type'] || row['UsageType'] || row['usage_type'],
      propertyNumber: row['Property Number'] || row['PropertyNumber'] || row['property_number']
    }));

    return {
      success: true,
      data: processedData
    };
  } catch (error) {
    console.error('Excel processing error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  processHouseExcel
};
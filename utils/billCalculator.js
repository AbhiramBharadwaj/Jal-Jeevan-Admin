const calculateWaterBill = (usage, tariff, usageType) => {
  let amount = 0;

  if (usageType === 'residential') {
    if (usage <= 7) {
      amount = usage * tariff.domestic.upTo7KL;
    } else if (usage <= 10) {
      amount = (7 * tariff.domestic.upTo7KL) + ((usage - 7) * tariff.domestic.from7to10KL);
    } else if (usage <= 15) {
      amount = (7 * tariff.domestic.upTo7KL) + 
               (3 * tariff.domestic.from7to10KL) + 
               ((usage - 10) * tariff.domestic.from10to15KL);
    } else if (usage <= 20) {
      amount = (7 * tariff.domestic.upTo7KL) + 
               (3 * tariff.domestic.from7to10KL) + 
               (5 * tariff.domestic.from10to15KL) + 
               ((usage - 15) * tariff.domestic.from15to20KL);
    } else {
      amount = (7 * tariff.domestic.upTo7KL) + 
               (3 * tariff.domestic.from7to10KL) + 
               (5 * tariff.domestic.from10to15KL) + 
               (5 * tariff.domestic.from15to20KL) + 
               ((usage - 20) * tariff.domestic.above20KL);
    }
  } else if (usageType === 'institutional') {
    amount = usage * tariff.nonDomestic.publicPrivateInstitutions;
  } else if (usageType === 'commercial') {
    amount = usage * tariff.nonDomestic.commercialEnterprises;
  } else if (usageType === 'industrial') {
    amount = usage * tariff.nonDomestic.industrialEnterprises;
  }

  return Math.round(amount * 100) / 100; // Round to 2 decimal places
};

module.exports = {
  calculateWaterBill
};
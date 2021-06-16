
const startCronJob = require('./helpers/start.cron.job');
const Helpers = require('./helpers');
const invs = require('./modules/invoices');
const directOrder = require('./modules/direct.orders');
const part = require('./modules/parts');
const directOrderPart = require('./modules/direct.order.parts');

async function createInvoice () {
  try {
     const dps = await directOrderPart.findDirectOrderPart();
     const all_ps = await part.findPart();

    const allParts = all_ps.concat(dps);

    const directOrderPartsGroups = Helpers.groupBy(allParts, 'directOrderId');

    const invcs = [];

    invcs =   await calculate(directOrderPartsGroups);
    
    return { case: 1, message: 'invoices created successfully.', invoicesIds: invcs };
  } catch (err) {
    Helpers.reportError(err);
  }
}


async function calculate (directOrderPartsGroups){
    try {
        
    for (const allDirectOrderParts of directOrderPartsGroups) {

        const direct = await directOrder.findDirectOrder(allDirectOrderParts[0].directOrderId);
        const inv = await invs.findInvoice(allDirectOrderParts[0].directOrderId);

        const directOrderParts = allDirectOrderParts.filter(directOrderPart => directOrderPart.partClass === 'StockPart' ||
                                                            directOrderPart.partClass === 'QuotaPart');
        const requestParts = allDirectOrderParts.filter(part => part.partClass === 'requestPart');
        const dpsprice = directOrderParts.reduce((sum, part) => sum + part.priceBeforeDiscount, 0);
        const rpsprice = requestParts.reduce((sum, part) => sum + part.premiumPriceBeforeDiscount, 0);
        const dps_id = directOrderParts.map(part => part._id);
        const rps_id = requestParts.map(part => part._id);
        const TotalPrice = Helpers.Numbers.toFixedNumber(rpsprice + dpsprice);
        const { deliveryFees } = directOrder;
        
        let { walletPaymentAmount, discountAmount } = directOrder;
        let totalAmount = TotalPrice;

       let s = summtion(directOrder.deliveryFees, invoces, invoces.length, totalAmount, walletPaymentAmount, discountAmount, directOrder._id)
        
        const invoice = await Invoice.Model.create({ directOrderId: directOrder._id, directOrderPartsIds: dps_id, requestPartsIds: rps_id, totalPartsAmount: TotalPrice, totalAmount, deliveryFees, walletPaymentAmount, discountAmount });
  
        await DirectOrder.Model.updateOne({ _id: directOrder._id }, { $addToSet: { invoicesIds: invoice._id } });
        for (const dp_id of dps_id) {
          await DirectOrderPart.Model.updateOne({ _id: dp_id }, { invoiceId: invoice._id });
        }
  
        await rps_id.map((rp_id) => {
          return new Promise((resolve, reject) => {
            Part.Model.updateOne({ _id: rp_id }, { invoiceId: invoice._id }).then(function (result) {
              return resolve();
            })
              .catch(() => {
                reject();
              });
          });
        });
  
    return  invcs.push(invoice._id);
      }
    } catch (error) {     
    }
}

async function summtion(deliveryFees, invoces, invoiceLength, totalAmount, walletPaymentAmount, discountAmount, directOrderId){
      if (deliveryFees && invoiceLength === 0) {
            return totalAmount += deliveryFees;
        }
    
      if (walletPaymentAmount) {
        invoces.forEach(invoice => {
          walletPaymentAmount = Math.min(0, walletPaymentAmount - invoice.walletPaymentAmount);
        });

        walletPaymentAmount = Math.min(walletPaymentAmount, totalAmount);
        return totalAmount -= walletPaymentAmount;
        }
    
      if (discountAmount) {
            invoces.forEach(invoice => {
              discountAmount = Math.min(0, discountAmount - invoice.discountAmount);
            });
            discountAmount = Math.min(discountAmount, totalAmount);
        return totalAmount -= discountAmount;
        }

      if (totalAmount < 0) {
            throw Error(`Could not create invoice for directOrder: ${directOrderId} with totalAmount: ${totalAmount}. `);
        }
}

startCronJob('*/1 * * * *', createInvoice, true); // at 00:00 every day

module.exports = createInvoice;

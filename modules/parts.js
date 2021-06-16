

let part = {
    
async findPart(){

   return await Part.Model.find({
        directOrderId: { $exists: true },
        createdAt: { $gt: new Date('2021-04-01') },
        partClass: 'requestPart',
        pricedAt: { $exists: true },
        invoiceId: { $exists: false } }).select('_id directOrderId partClass premiumPriceBeforeDiscount');
   }
}

module.exports = part
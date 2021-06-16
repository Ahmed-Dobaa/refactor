


let directOrderPart = {

    async findDirectOrderPart(){

        return await DirectOrderPart.Model.find({
             createdAt: { $gt: new Date('2021-04-01') },
             fulfillmentCompletedAt: { $exists: true }, invoiceId: { $exists: false } }).select('_id directOrderId partClass priceBeforeDiscount');
    
    }

}


module.exports = directOrderPart
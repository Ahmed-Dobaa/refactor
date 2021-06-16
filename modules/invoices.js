

let invoice = {
    
    async findInvoice (directOrderId){
        return await Invoice.Model.find({
             directOrderId: directOrderId })
             .select('walletPaymentAmount discountAmount deliveryFees');
    } 
}
    
module.exports = invoice
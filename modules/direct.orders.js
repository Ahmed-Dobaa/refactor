


let directOrder = {
    
    async findDirectOrder(directOrderId){
    
        return await DirectOrder.Model.findOne({ 
            _id: directOrderId })
            .select('partsIds requestPartsIds discountAmount deliveryFees walletPaymentAmount');
    } 
    }
    
module.exports = directOrder
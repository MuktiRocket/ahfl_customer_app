const Joi = require("joi");

const validateCreatePaytmPayment = Joi.object({
    paymentAmount: Joi.number()
        .positive()
        .required(),

    paymentDesc: Joi.string()
        .trim()
        .min(2)
        .required(),

    paymentType: Joi.string()
        .valid("emi", "part_payment", "full_payment")
        .required(),

    loanAccountNumber: Joi.string()
        .pattern(/^\d{11}$/)
        .required(),
});

const validatePaytmTransactionResponse = Joi.object({
    responseCode: Joi.string()
        .length(2)
        .required(),

    responseMsg: Joi.string()
        .trim()
        .required(),

    responseStatus: Joi.string()
        .valid("TXN_SUCCESS", "TXN_FAILURE", "PENDING")
        .required(),

    bankName: Joi.string()
        .trim()
        .required(),

    bankTransactionId: Joi.string()
        .trim()
        .required(),

    currency: Joi.string()
        .valid("INR")
        .required(),

    deviceId: Joi.string()
        .trim()
        .required(),

    gatewayName: Joi.string()
        .trim()
        .required(),

    orderId: Joi.string()
        .pattern(/^AHLFORDERID_\d+$/)
        .required(),

    mode: Joi.string()
        .valid("NB", "UPI", "CC", "DC", "WALLET")
        .required(),

    paymentType: Joi.string()
        .valid("emi", "part_payment", "full_payment")
        .required(),

    loanAccountNumber: Joi.string()
        .pattern(/^\d{16}$/)
        .required(),

    transactionAmount: Joi.string()
        .pattern(/^\d+(\.\d{1,2})?$/)
        .required(),

    transactionId: Joi.string()
        .trim()
        .required(),

    checkSumHash: Joi.string()
        .trim()
        .required(),

    isUAT: Joi.boolean(),

    isDev: Joi.boolean(),
});


module.exports = {
    validateCreatePaytmPayment, validatePaytmTransactionResponse
}
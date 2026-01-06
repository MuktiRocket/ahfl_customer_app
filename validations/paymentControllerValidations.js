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

module.exports = {
    validateCreatePaytmPayment
}
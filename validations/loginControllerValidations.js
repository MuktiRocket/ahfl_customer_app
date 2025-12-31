const Joi = require("joi");

const dobLogin = Joi.object({
    loanAccountNumber: Joi.string().trim().required().messages({
        "any.required": "Loan account number is required",
        "string.empty": "Loan account number cannot be empty",
    }),

    dob: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
        "any.required": "DOB is required",
        "string.pattern.base": "DOB must be in YYYY-MM-DD format",
    }),

    isUAT: Joi.boolean().optional(),
});

const otpLogin = Joi.object({
    mobileNumber: Joi.string()
        .pattern(/^[6-9]\d{9}$/)
        .required()
        .messages({
            "any.required": "Mobile number is required",
            "string.pattern.base": "Mobile number must be a valid 10-digit Indian number",
        }),

    isDeveloped: Joi.boolean().optional(),
});

const otpVerify = Joi.object({
    enteredOtp: Joi.string()
        .length(6)
        .pattern(/^\d+$/)
        .required()
        .messages({
            "any.required": "OTP is required",
            "string.length": "OTP must be 6 digits",
            "string.pattern.base": "OTP must contain only numbers",
        }),

    isDOB: Joi.boolean().optional(),
});

module.exports = { dobLogin, otpLogin, otpVerify };

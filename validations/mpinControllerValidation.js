const Joi = require("joi");

const setMpinSchema = Joi.object({
    enteredMpin: Joi.string()
        .pattern(/^\d{4}$/)
        .required()
        .messages({
            "string.pattern.base": "MPIN must be a 4 digit number",
            "any.required": "MPIN is required",
        }),
});

const mpinLoginSchema = Joi.object({
    enteredMpin: Joi.string()
        .pattern(/^\d{4}$/)
        .required()
        .messages({
            "string.pattern.base": "MPIN must be a 4 digit number",
            "any.required": "MPIN is required",
        }),
});

const resetMpinSchema = Joi.object({
    currentMpin: Joi.string()
        .pattern(/^\d{4}$/)
        .required()
        .messages({
            "string.pattern.base": "Current MPIN must be a 4 digit number",
            "any.required": "Current MPIN is required",
        }),

    newMpin: Joi.string()
        .pattern(/^\d{4}$/)
        .required()
        .disallow(Joi.ref("currentMpin"))
        .messages({
            "string.pattern.base": "New MPIN must be a 4 digit number",
            "any.invalid": "New MPIN must be different from current MPIN",
            "any.required": "New MPIN is required",
        }),
});

const forgotMpinSchema = Joi.object({
    mobileNumber: Joi.string()
        .pattern(/^[6-9]\d{9}$/)
        .required()
        .messages({
            "string.pattern.base": "Invalid mobile number",
            "any.required": "Mobile number is required",
        }),

    isUAT: Joi.boolean().optional(),
});



module.exports = { setMpinSchema, mpinLoginSchema, resetMpinSchema, forgotMpinSchema };

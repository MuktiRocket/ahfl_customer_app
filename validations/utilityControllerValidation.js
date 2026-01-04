const Joi = require("joi");

const feedbackValidation = Joi.object({

    rating: Joi.number()
        .integer()
        .min(1)
        .max(5)
        .required()
        .messages({
            "any.required": "Rating is required",
            "number.base": "Rating must be a number",
            "number.min": "Rating must be at least 1",
            "number.max": "Rating cannot be more than 5",
        }),

    comment: Joi.string()
        .trim()
        .min(3)
        .optional()
        .allow("")
        .messages({
            "string.min": "Comment must be at least 3 characters long",
        }),
});

module.exports = { feedbackValidation };

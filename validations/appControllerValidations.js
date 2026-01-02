const Joi = require("joi");

const validateCRMRequest = Joi.object({
  firstName: Joi.string().trim().min(2).required(),
  lastName: Joi.string().trim().min(1).required(),

  clientId: Joi.string().required(),

  contactEmailId: Joi.string().email().required(),
  contactMobileNo: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required(),

  probCategory: Joi.string().required(),
  probType: Joi.string().required(),
  probItem: Joi.string().required(),
  probSummary: Joi.string().min(5).required(),

  description: Joi.string(),

  source: Joi.string().required(),
  type: Joi.string().required(),
  source_AppId: Joi.string().optional(),

  changedEmail: Joi.string().email().optional(),
  changedMobile: Joi.string().empty("").optional(),
});

const validateLetterGenerationRequest = Joi.object({
  nbfcName: Joi.string().trim().required(),

  reportID: Joi.string().trim().required(),

  queryFilters: Joi.array()
    .items(
      Joi.object({
        filterName: Joi.string().trim().required(),
        filterValue: Joi.string().trim().required(),
        paramIndex: Joi.string().trim().required(),
      })
    )
    .min(1)
    .required(),
});

module.exports = { validateCRMRequest, validateLetterGenerationRequest };

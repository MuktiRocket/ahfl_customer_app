const thirdPartyApi = require("../utils/thirdPartyApi");
const { logger } = require("../utils/logger");
const { sendRequest } = require("../utils/thirdPartyApiService");
const { saveApplyLoanData, saveTopUpApplyLoanData } = require("../models/userModel");


const LEAD_CATEGORY = {
  LOAN_REQUEST: "loan-request",
  TOP_UP_LOAN_REQUEST: "top-up-loan-request",
};

const createApplyLoanLeadBank = async (req, res, next) => {
  try {
    const requestData = req.body;
    const bodyStr = JSON.stringify(requestData);
    const loanId = await saveApplyLoanData(requestData);
    const payload = {
      method: thirdPartyApi.getApplyLoanLeadBank.method,
      url: thirdPartyApi.getApplyLoanLeadBank.endpoint,
      headers: thirdPartyApi.getApplyLoanLeadBank.headers,
      data: bodyStr,
    };
    const result = await sendRequest(payload);
    // Attach API response for next middleware
    req.apiData = result;
    req.loanId = loanId;
    return next();

  } catch (error) {
    logger.error(`Error fetching data from ApplyLoanLeadBank API :: ${error?.message, error?.response?.data}`);
    return res.status(500).json({ success: false, status: 500, message: "Internal Server Error while fetching data from ApplyLoanLeadBank API" });
  }
};

const createTopUpApplyLoanLeadBank = async (req, res, next) => {
  try {
    const requestData = req.body;
    const bodyStr = JSON.stringify(requestData);
    const loanId = await saveTopUpApplyLoanData(requestData);
    const payload = {
      method: thirdPartyApi.getApplyLoanLeadBank.method,
      url: thirdPartyApi.getApplyLoanLeadBank.endpoint,
      headers: thirdPartyApi.getApplyLoanLeadBank.headers,
      data: bodyStr,
    };
    const result = await sendRequest(payload);
    // Attach API response for next middleware
    req.apiData = result;
    req.loanId = loanId;
    return next();

  } catch (error) {
    logger.error(`Error fetching data from ApplyLoanLeadBank API :: ${error?.message, error?.response?.data}`);
    return res.status(500).json({ success: false, status: 500, message: "Internal Server Error while fetching data from ApplyLoanLeadBank API" });
  }
};



module.exports = { createApplyLoanLeadBank, createTopUpApplyLoanLeadBank, LEAD_CATEGORY };

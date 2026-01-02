const thirdPartyApi = require("../utils/thirdPartyApi");
const { logger } = require("../utils/logger");
const { sendRequest } = require("../utils/thirdPartyApiService");
const { saveApplyLoanData } = require("../models/userModel");

const createApplyLoanLeadBank = async (req, res, next) => {
  try {
    const requestData = req.body;
    const bodyStr = JSON.stringify(requestData);
    const loanId = await saveApplyLoanData(requestData)
    const payload = {
      method: thirdPartyApi.getApplyLoanLeadBank.method,
      url: thirdPartyApi.getApplyLoanLeadBank.endpoint,
      headers: thirdPartyApi.getApplyLoanLeadBank.headers,
      data: bodyStr,
    };
    const result = await sendRequest(payload);

    // Attach API response for next middleware
    req.apiData = result?.data;
    req.loanId = loanId;
    return next();

  } catch (error) {
    logger.error("Error fetching data from ApplyLoanLeadBank API:", error?.message, error?.response?.data);
    return res.status(500).json({ success: false, status: 500, message: "Internal Server Error while fetching data from ApplyLoanLeadBank API" });
  }
};



module.exports = { createApplyLoanLeadBank };

const request = require("request");
const thirdPartyApi = require("../utils/thirdPartyApi");
const apiFetcher = require("../utils/apiFetcher");
const { logger } = require("../utils/logger");
const { sendRequest } = require("../utils/thirdPartyApiService");
const { saveApplyLoanData } = require("../models/userModel");

/*const createApplyLoanLeadBank = async (req, res, next) => {
  const requestData = req.body;
  try {
    const fetchLoanLeadBank = (callback) => {
      const options = {
        method: thirdPartyApi.getApplyLoanLeadBank.method,
        url: thirdPartyApi.getApplyLoanLeadBank.endpoint,
        headers: thirdPartyApi.getApplyLoanLeadBank.headers,
        data: JSON.stringify(requestData),
    //data: requestData,
    proxy: "http://10.130.1.1:8080" 
      };
    console.log(typeof requestData)
  console.log({
        method: thirdPartyApi.getApplyLoanLeadBank.method,
        url: thirdPartyApi.getApplyLoanLeadBank.endpoint,
        headers: thirdPartyApi.getApplyLoanLeadBank.headers,
        //data: JSON.stringify(requestData),
    data: requestData,
    proxy: "http://10.130.1.1:8080" 
      })
      request(options, function (error, response) {
        if (error) {
          callback(error, null);
        } else {
          const apiResponse = response.body;
          callback(null, apiResponse);
        }
      });
    };

    fetchLoanLeadBank((error, apiResponse) => {
      if (error) {
        console.error(error);
      } else {
        req.apiData = apiResponse;
        next();
      }
    });
  } catch (error) {
    //console.log("Error is fetching data from server:", error);
    res.status(500).json({
      success: false,
      statuse: 500,
      message: "Internal Server Error",
    });
  }
};*/

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

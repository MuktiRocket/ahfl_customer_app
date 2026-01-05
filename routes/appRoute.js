const express = require("express");
const { pool } = require("../models/db");
const {
  fetchLoanApplicationStatus,
} = require("../middlewares/fetchLoanApplicationStatus");
const {
  createApplyLoanLeadBank,
  createTopUpApplyLoanLeadBank,
} = require("../middlewares/createApplyLoanLeadBank");
const { verifyToken } = require("../middlewares/verifyToken");
const { saveTransactionDetails } = require("../models/userModel");
const appController = require("../controllers/appController");
const apiFetcher = require("../utils/apiFetcher");
const thirdPartyApi = require("../utils/thirdPartyApi");
const { formatLoanAccountNumber } = require("../utils/generateOtp");
const {
  letterGeneration,
} = require("../middlewares/letterGenarate/letterGeneration");
const {
  getTokenForLetterGeneration,
} = require("../middlewares/letterGenarate/getTokenForLetterGeneration");
const { validateCRMRequest, validateLetterGenerationRequest, validateTopUpApplyLoanRequest } = require("../validations/appControllerValidations");
const validate = require("../middlewares/ValidationMiddleware");

const router = express.Router();

router.get("/getCustomerDetails", verifyToken, appController.getCustomerDetailsModified);

// router.get("/getCustomerDetails", verifyToken, appController.getCustomerDetails)

router.post("/applyLoan", createApplyLoanLeadBank, appController.applyLoan);

router.post("/applyTopUpLoan", verifyToken, validate(validateTopUpApplyLoanRequest), createTopUpApplyLoanLeadBank, appController.applyTopUpLoan);

router.get("/loanApplicationStatus", async (req, res) => {
  const { applicationId } = req.query;

  try {
    const result = await apiFetcher({
      method: thirdPartyApi.getLoanApplicationStatus.method,
      url: thirdPartyApi.getLoanApplicationStatus.endpoint,
      headers: thirdPartyApi.getLoanApplicationStatus.headers,
      data: JSON.stringify({ applicationId }),
      //useReverseProxy: true,  // Use reverse proxy
      //proxy: 'http://10.130.1.1:8080',  // Custom proxy URL
    });
    console.log("loan application issue", { result });

    const applicationStatusData = JSON.parse(result);

    res.json({
      success: true,
      status: 200,
      message: "Successfully fetched application status",
      data: applicationStatusData,
    });
  } catch (error) {
    //console.log("Error in fetching data from server:", error);
    res.status(500).json({
      success: false,
      status: 500,
      message: "Error occured while fetching loan application status",
    });
  }
});

router.post("/letterGeneration", verifyToken, validate(validateLetterGenerationRequest), appController.getLetterGenerationData);

router.post("/crmRequest", verifyToken, validate(validateCRMRequest), appController.getCRMRequestData);

router.post("/transaction", verifyToken, async (req, res) => {
  try {
    const { uid } = req.data;
    const { transactionId, amount, status, paymentMode, loanAccountNumber } =
      req.body;

    const query = `SELECT * FROM user_data WHERE uid = ?`;
    const [userDataRows] = await pool.promise().execute(query, [uid]);

    if (userDataRows.length === 0) {
      return res.json({
        success: false,
        status: 401,
        message: "Invalid access token or expired",
        data: {},
      });
    }

    const { customer_data } = userDataRows[0];

    const customerNumber = JSON.parse(customer_data)[0].customerNumber;

    if (!req.body) {
      return res.status(500).json({
        success: true,
        status: 500,
        message: "Request payload is missing",
      });
    } else {
      await saveTransactionDetails({
        transactionId,
        amount,
        status,
        paymentMode,
        loanAccountNumber,
        customerNumber,
      });

      return res.status(200).json({
        success: true,
        status: 200,
        message: "Transaction Details successfully updated",
        data: {},
      });
    }
  } catch (error) {
    //console.log("Error adding transaction:", error.message);
    res.status(200).json({
      success: false,
      status: 200,
      message:
        "Error in updating trnasaction or same transaction id not allowed",
    });
  }
});

router.get("/getTransactionDetails", verifyToken, async (req, res) => {
  try {
    const { loanAccountNumber } = req.query;

    const querry = `SELECT * FROM transaction WHERE loanAccountNumber = ? ORDER BY timestamp DESC`;
    const [userDataRows] = await pool
      .promise()
      .execute(querry, [loanAccountNumber]);

    if (userDataRows.length === 0) {
      return res.json({
        success: false,
        status: 401,
        message: "Invalid access token or Account Number",
        data: {},
      });
    }

    const transactionDetails = userDataRows;

    if (!req.query) {
      return res.status(200).json({
        success: true,
        status: 200,
        message: "Request Params missing",
      });
    } else {
      return res.status(201).json({
        success: true,
        status: 201,
        message: "Successfully fetched transaction details",
        data: { transactionDetails },
      });
    }
  } catch (error) {
    //console.log("Error fetching transaction:", error.message);
    res.status(500).json({
      success: false,
      status: 500,
      message: "Internal Server Error",
    });
  }
});

module.exports = [router];

const express = require("express");
const { pool } = require("../models/db");
const {
  fetchLoanApplicationStatus,
} = require("../middlewares/fetchLoanApplicationStatus");
const {
  createApplyLoanLeadBank,
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
const validateCRMRequest = require("../validations/appControllerValidations");
const validate = require("../middlewares/ValidationMiddleware");

const router = express.Router();

router.get("/getCustomerDetails", verifyToken, async (req, res) => {
  try {
    const { uid } = req.data;

    const query = `SELECT * FROM user_data WHERE uid = ?`;
    const [userDataRows] = await pool.promise().execute(query, [uid]);

    if (userDataRows.length === 0 || userDataRows[0].auth_token === null) {
      return res.status(401).json({
        success: false,
        message: "Invalid auth token or expired",
      });
    }

    const { customer_data } = userDataRows[0];
    //const parsedData = JSON.parse(customer_data);
    const parsedData = JSON.parse(customer_data).filter((item) => {
      //console.log(5555, item.loanstatus.trim().toLowerCase())
      return item?.loanstatus?.trim()?.toLowerCase() != "closed";
    });

    //console.log({ parsedData });

    //using request
    let outstandingData = [];
    const customerDetailsWithOutstandingData = Array.isArray(parsedData)
      ? parsedData
      : [parsedData];
    //console.log({ customerDetailsWithOutstandingData });

    const fetchData = (formattedLoanAccountNumber, callback) => {
      try {
        const options = {
          url: thirdPartyApi.getLoanOutstanding.endpoint,
          method: thirdPartyApi.getLoanOutstanding.method,
          headers: thirdPartyApi.getLoanOutstanding.headers,
          body: JSON.stringify({
            lm_applno: formattedLoanAccountNumber,
          }),
        };
        console.log(options);
        apiFetcher(options, false)
          .then((apiResponse) => {
            callback(null, apiResponse);
          })
          .catch((error) => {
            //console.log(error.message);
            callback(error, null);
          });
      } catch (err) {
        console.log(err.message);
      }
    };

    const fetchOutstandingData = async () => {
      const promises = customerDetailsWithOutstandingData.map((customer) => {
        return new Promise((resolve, reject) => {
          const { applicationNo, loanAccountNumber } = customer;

          const formattedLoanAccountNumber =
            formatLoanAccountNumber(loanAccountNumber);
          //console.log({ loanAccountNumber, formattedLoanAccountNumber })

          fetchData(formattedLoanAccountNumber, (error, apiResponse) => {
            //console.log(apiResponse)
            if (error) {
              console.error(
                `Failed to fetch data for loanAccountNumber ${formattedLoanAccountNumber}:`,
                error
              );
              resolve({
                // ...customer,
                outstandingData: null,
              });
            } else {
              //console.log(`Response for loanAccountNumber ${formattedLoanAccountNumber}:`, apiResponse);
              resolve({
                // ...customer,
                outstandingData: apiResponse,
              });
            }
          });
        });
      });

      outstandingData = await Promise.all(promises);
    };

    //await fetchOutstandingData();

    res.json({
      success: true,
      message: "Successfully fetched customer details",
      data: {
        customerDetails: parsedData,
        //loanOutstanding: outstandingData.filter(data => data !== null), // Filter out null values
        loanOutstanding: [
          {
            applicationid: "V0140940",
            custmername: "Balaji K V",
            totalout: "0.00", // Can be a string or numeric value
            branchcode: "BR123",
          },
        ],
      },
    });
  } catch (error) {
    //console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal server error from get customer details route",
    });
  }
});

// router.get("/getCustomerDetails", verifyToken, appController.getCustomerDetails)

router.post("/applyLoan", createApplyLoanLeadBank, (req, res) => {
  console.log(555555, req.apiData);
  // const applyLoanData = JSON.parse(req.apiData);
  const applyLoanData = req.apiData;
  console.log(333333, applyLoanData);
  if (
    applyLoanData &&
    applyLoanData.lead_id &&
    applyLoanData.status_code === "0001"
  ) {
    const leadId = applyLoanData.lead_id;
    return res.status(200).json({
      success: true,
      status: 200,
      message: applyLoanData.message,
      data: {
        lead_id: leadId,
      },
    });
  } else {
    return res.status(200).json({
      success: false,
      status: 200,
      message: applyLoanData?.message || "Something went wrong",
      data: {
        lead_id: applyLoanData?.leadId,
      },
    });
  }
});

router.post(
  "/applyTopUpLoan",
  verifyToken,
  createApplyLoanLeadBank,
  (req, res) => {
    const applyLoanData = JSON.parse(req.apiData);
    if (
      applyLoanData &&
      applyLoanData.lead_id &&
      applyLoanData.status_code === "0001"
    ) {
      const leadId = applyLoanData.lead_id;
      return res.status(200).json({
        success: true,
        status: 200,
        message: applyLoanData.message,
        data: {
          lead_id: leadId,
        },
      });
    } else {
      return res.status(200).json({
        success: false,
        status: 200,
        message: applyLoanData.message,
        data: {
          lead_id: applyLoanData.leadId,
        },
      });
    }
  }
);

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

// router.post("/letterGeneration", verifyToken, getTokenForLetterGeneration, letterGeneration, (req, res) => {
//   if (req.pdfGenerated) {
//     if (req.pdfData) {
//       return res.json({
//         success: true,
//         status: 200,
//         message: "Pdf Generated successfully",
//         data: req.pdfData,
//       });
//     } else {
//       return res.json({
//         success: false,
//         status: 500,
//         message: "Error in Pdf Generation: PDF data not available",
//       });
//     }
//   } else {
//     return res.json({
//       success: false,
//       status: 200,
//       message: "Error in Pdf Generation",
//     });
//   }
// }
// );

router.post(
  "/letterGeneration",
  verifyToken,
  appController.getLetterGenerationData
);

router.post(
  "/crmRequest",
  verifyToken,
  // validate(validateCRMRequest),
  appController.getCRMRequestData
);

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

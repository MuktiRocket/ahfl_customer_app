const apiFetcher = require("../utils/apiFetcher");
const { pool } = require("../models/db");
const responseMessage = require("../utils/responseMessage");
const responseSender = require("../utils/responseSender");
const thirdPartyApi = require("../utils/thirdPartyApi");
const FormData = require("form-data");
const qs = require("qs");
const { saveCRMRequestData, updateCRMRequestDataByTicketId } = require("../models/crmDataModel");
const { sendRequest } = require("../utils/thirdPartyApiService");
const { updateApplyLoanLeadId } = require("../models/userModel");
const { logger } = require("../utils/logger");
const { formatLoanAccountNumber } = require("../utils/generateOtp");

const PROB_SUMMARY_FOR_EMAIL = "Updation/Rectification of Email ID";
const PROB_SUMMARY_FOR_MOBILE = "Updation/Rectification of Mobile number";
const ARRAY_BUFFER_RESPONSE = "arraybuffer";

module.exports = {

  getCRMRequestData: async (req, res) => {
    try {
      const lang = req.headers["language"] || req.headers["Language"];

      let { lastName, clientId, contactEmailId, probCategory, contactMobileNo, description, source, type, probType, probSummary, firstName, source_AppId, probItem, changedEmail, changedMobile } = req.body;

      let prodDesc = description;

      if (probSummary === PROB_SUMMARY_FOR_EMAIL && changedEmail) {
        contactEmailId = changedEmail;
        prodDesc = changedEmail;
      }

      if (probSummary === PROB_SUMMARY_FOR_MOBILE && changedMobile) {
        contactMobileNo = changedMobile;
        prodDesc = changedMobile;
      }

      const requestData = { lastName, clientId, contactEmailId, probCategory, contactMobileNo, description: prodDesc, source, type, probType, probSummary, firstName, source_AppId, probItem, changedMobile };

      const requestId = await saveCRMRequestData(requestData);

      // ---------- GET CRM TOKEN ----------
      const tokenPayload = {
        method: thirdPartyApi.getCRMToken.method,
        url: thirdPartyApi.getCRMToken.endpoint,
        headers: thirdPartyApi.getCRMToken.headers,
      };
      const tokenResult = await sendRequest(tokenPayload);

      if (!tokenResult || tokenResult?.Status !== "Success")
        return res.status(401).json({ success: false, status: 401, message: "Error in getting token id from third party api" });

      // ---------- SEND CRM REQUEST ----------
      const formData = new FormData();
      formData.append("casebody", JSON.stringify(requestData));

      const crmRequestPayload = {
        method: thirdPartyApi.getCRMDetails.method,
        url: thirdPartyApi.getCRMDetails.endpoint,
        headers: { ...thirdPartyApi.getCRMDetails.headers, token_id: tokenResult?.token_id },
        data: formData,
      };
      const crmData = await sendRequest(crmRequestPayload);

      if (!crmData || crmData?.response_type === "FAILURE")
        return res.status(200).json({ success: true, status: 200, message: "Error in fetching crm request", data: { crmData }, });

      const responseStatus = crmData?.respose_status;
      const ticketId = responseStatus ? responseStatus.split(" ")[2] : undefined;

      await updateCRMRequestDataByTicketId({ ticketId, id: requestId });

      return responseSender(res, 200, responseMessage.crmSuccessMessage.description[lang], true, { crmData, ticketId }
      );

    } catch (error) {
      console.log("Error is:", error);
      return responseSender(res, 500, "Internal server error while fetching CRM request", false);
    }
  },

  getLetterGenerationData: async (req, res) => {
    try {
      const lang = req.headers["language"] || req.headers["Language"];
      const requestData = req.body;

      // ---------- GET ACCESS TOKEN ----------
      const tokenPayload = {
        method: thirdPartyApi.getTokenForLetterGeneration.method,
        url: thirdPartyApi.getTokenForLetterGeneration.endpoint,
        headers: thirdPartyApi.getTokenForLetterGeneration.headers,
        data: qs.stringify(thirdPartyApi.getTokenForLetterGeneration.data),
      };

      const tokenResult = await sendRequest(tokenPayload);

      if (!tokenResult?.access_token)
        return res.status(401).json({ success: false, status: 401, message: "Error in getting access token from third party api" });

      const access_token = tokenResult.access_token;

      // ---------- PDF GENERATION ----------
      const response = await sendRequest({
        method: thirdPartyApi.getGeneratedToken.method,
        url: thirdPartyApi.getGeneratedToken.endpoint,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
        data: requestData,
        responseType: ARRAY_BUFFER_RESPONSE,
      });

      const { status, headers, data } = response;
      console.log(status, headers, data)
      const contentType = headers?.["content-type"] || "";

      // ❌ THIRD-PARTY ERROR (500, 400 etc.)
      if (status !== 200) {
        let errorMessage = "PDF generation failed";

        try {
          const errorJson = JSON.parse(Buffer.from(data).toString());
          errorMessage = errorJson?.error || errorJson?.message || errorMessage;
        } catch (_) {
          errorMessage = Buffer.from(data).toString();
        }

        return res.status(500).json({
          success: false,
          status: 500,
          message: errorMessage,
        });
      }

      // ❌ NOT A PDF RESPONSE
      if (!contentType.includes("application/pdf")) {
        return responseSender(
          res,
          responseMessage.errorPdfGeneration.statusCode,
          responseMessage.errorPdfGeneration.description[lang],
          false
        );
      }

      // ✅ SUCCESS PDF
      const base64PDF = Buffer.from(data).toString("base64");

      return res.json({
        success: true,
        status: 200,
        message: "PDF Generated successfully",
        data: base64PDF,
      });

    } catch (error) {
      const errorJSON = JSON.parse(error)
      return res.status(500).json({
        success: false,
        status: 500,
        message: errorJSON || "Internal server error while generating PDF",
      });
    }
  },

  getCustomerDetails: async (req, res) => {
    try {
      const { uid } = req.data;

      // ---------- AUTH VALIDATION ----------
      const [rows] = await pool.promise().execute(
        `SELECT customer_data, auth_token FROM user_data WHERE uid = ?`,
        [uid]
      );

      if (!rows.length || !rows[0].auth_token)
        return res.status(401).json({ success: false, message: "Invalid auth token or expired" });

      // ---------- CUSTOMER DATA ----------
      const parsedData = JSON.parse(rows[0].customer_data);
      const customerList = Array.isArray(parsedData) ? parsedData : [parsedData];

      // ---------- FETCH OUTSTANDING USING sendRequest ----------
      const fetchOutstanding = async (loanAccountNumber) => {
        try {
          const payload = {
            method: thirdPartyApi.getLoanOutstanding.method,
            url: thirdPartyApi.getLoanOutstanding.endpoint,
            headers: thirdPartyApi.getLoanOutstanding.headers,
            data: { lm_applno: formatLoanAccountNumber(loanAccountNumber) },
          };
          return await sendRequest(payload);
        } catch (err) {
          logger.error(`Outstanding fetch failed for ${loanAccountNumber} :: ${err}`);
          return null;
        }
      };

      const loanOutstanding = await Promise.all(
        customerList.map(async ({ loanAccountNumber }) => ({
          outstandingData: await fetchOutstanding(loanAccountNumber),
        }))
      );

      // ---------- RESPONSE ----------
      return res.json({
        success: true,
        message: "Successfully fetched customer details",
        data: {
          customerDetails: parsedData,
          loanOutstanding: loanOutstanding.filter(o => o.outstandingData),
        },
      });

    } catch (error) {
      console.error("getCustomerDetails error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error from get customer details route",
      });
    }
  },

  getCustomerDetailsModified: async (req, res) => {
    try {
      const { uid } = req.data;

      // ---------- AUTH CHECK ----------
      const [rows] = await pool.promise().execute(
        `SELECT customer_data, auth_token FROM user_data WHERE uid = ?`,
        [uid]
      );

      if (!rows.length || !rows[0].auth_token)
        return res.status(401).json({ success: false, message: "Invalid auth token or expired" });

      // ---------- CUSTOMER DATA (FILTER CLOSED LOANS) ----------
      const parsedData = JSON.parse(rows[0].customer_data).filter(
        i => i?.loanstatus?.trim()?.toLowerCase() !== "closed"
      );

      const customerList = Array.isArray(parsedData) ? parsedData : [parsedData];


      /*
      const loanOutstanding = await Promise.all(
        customerList.map(async ({ loanAccountNumber }) => ({
          outstandingData: await fetchOutstanding(loanAccountNumber),
        }))
      );
      */

      // ---------- RESPONSE ----------
      return res.json({
        success: true,
        message: "Successfully fetched customer details",
        data: {
          customerDetails: parsedData,
          loanOutstanding: [
            {
              applicationid: "V0140940",
              custmername: "Balaji K V",
              totalout: "0.00",
              branchcode: "BR123",
            },
          ],
        },
      });

    } catch (error) {
      logger.error(`getCustomerDetails error :: ${error}`);
      return res.status(500).json({ success: false, message: "Internal server error from get customer details route", });
    }
  },

  fetchOutstanding: async (loanAccountNumber) => {
    try {
      const payload = {
        method: thirdPartyApi.getLoanOutstanding.method,
        url: thirdPartyApi.getLoanOutstanding.endpoint,
        headers: thirdPartyApi.getLoanOutstanding.headers,
        data: { lm_applno: formatLoanAccountNumber(loanAccountNumber) },
      };
      return await sendRequest(payload);
    } catch (err) {
      logger.error(`Outstanding fetch failed for ${loanAccountNumber} :: ${err}`);
      return null;
    }
  },

  applyLoan: async (req, res) => {
    try {
      const applyLoanData = req.apiData;
      const loanId = req.loanId;

      if (applyLoanData?.lead_id && applyLoanData?.status_code === "0001") {
        await updateApplyLoanLeadId({ id: loanId, lead_id: applyLoanData.lead_id })
        return res.status(200).json({ success: true, status: 200, message: applyLoanData.message, data: { lead_id: applyLoanData.lead_id }, });
      }

      return res.status(200).json({ success: false, status: 200, message: applyLoanData?.message || "Something went wrong", data: { lead_id: applyLoanData?.leadId }, });
    } catch (error) {
      logger.error(`Error fetching for apply loan :: ${error}`);
    }
  }

};

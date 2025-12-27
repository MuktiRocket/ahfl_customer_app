const apiFetcher = require("../utils/apiFetcher");
const responseMessage = require("../utils/responseMessage");
const responseSender = require("../utils/responseSender");
const thirdPartyApi = require("../utils/thirdPartyApi");
const { HttpsProxyAgent } = require("https-proxy-agent");
const { default: axios } = require("axios");
const request = require("request");
const FormData = require("form-data");
const qs = require("qs");
const {
  saveCRMRequestData,
  updateCRMRequestDataByTicketId,
} = require("../models/crmDataModel");

const PROB_SUMMARY_FOR_EMAIL = "Updation/Rectification of Email ID";
const PROB_SUMMARY_FOR_MOBILE = "Updation/Rectification of Mobile number";

module.exports = {
  getCRMRequestData: async (req, res) => {
    try {
      const lang = req.headers["language"] || req.headers["Language"];

      let {
        lastName,
        clientId,
        contactEmailId,
        probCategory,
        contactMobileNo,
        description,
        source,
        type,
        probType,
        probSummary,
        firstName,
        source_AppId,
        probItem,
        changedEmail,
        changedMobile,
      } = req.body;
      let prodDesc = description;

      if (probSummary === PROB_SUMMARY_FOR_EMAIL && changedEmail) {
        contactEmailId = changedEmail;
        prodDesc = changedEmail;
      }
      if (probSummary === PROB_SUMMARY_FOR_MOBILE && changedMobile) {
        contactMobileNo = changedMobile;
        prodDesc = changedMobile;
      }

      let requestData = {
        lastName,
        clientId,
        contactEmailId,
        probCategory,
        contactMobileNo,
        description: prodDesc,
        source,
        type,
        probType,
        probSummary,
        firstName,
        source_AppId,
        probItem,
        changedMobile,
      };

      const requestId = await saveCRMRequestData(requestData);

      console.log(updatedId);
      const result = await apiFetcher({
        url: thirdPartyApi.getCRMToken.endpoint,
        method: thirdPartyApi.getCRMToken.method,
        headers: thirdPartyApi.getCRMToken.headers,
        useReverseProxy: true,
        proxy: "http://10.130.1.1:8080",
      });

      if (!result || result?.Status !== "Success") {
        return res.status(401).json({
          success: false,
          status: 401,
          message: "Error in getting token id from third party api",
        });
      }

      let formData = new FormData();
      formData.append("casebody", JSON.stringify(requestData));

      const crmData = await apiFetcher({
        url: thirdPartyApi.getCRMDetails.endpoint,
        method: thirdPartyApi.getCRMDetails.method,
        headers: {
          ...thirdPartyApi.getCRMDetails.headers,
          token_id: result?.token_id,
        },
        data: formData,
        useReverseProxy: true,
        proxy: "http://10.130.1.1:8080",
      });

      if (!crmData || crmData?.response_type === "FAILURE") {
        return res.status(200).json({
          success: true,
          status: 200,
          message: "Error in fetching crm request",
          data: {
            crmData,
          },
        });
      } else {
        const resposeStatus = crmData?.respose_status;
        let ticketId;
        if (resposeStatus) {
          ticketId = resposeStatus.split(" ")[2];
          //console.log({ ticketId });
        }

        const updatedId = await updateCRMRequestDataByTicketId({
          ticketId,
          id: requestId,
        });

        return responseSender(
          res,
          200,
          responseMessage.crmSuccessMessage.description[lang],
          true,
          { crmData, ticketId }
        );
      }
    } catch (error) {
      //console.log("Error is:", error)
      return responseSender(
        res,
        500,
        "Internal server error while fetching CRM request",
        false
      );
    }
  },

  getLetterGenerationData: async (req, res) => {
    try {
      const lang = req.headers["language"] || req.headers["Language"];
      const requestData = req.body;

      const result = await apiFetcher({
        url: thirdPartyApi.getTokenForLetterGeneration.endpoint,
        method: thirdPartyApi.getTokenForLetterGeneration.method,
        headers: thirdPartyApi.getTokenForLetterGeneration.headers,
        data: qs.stringify(thirdPartyApi.getTokenForLetterGeneration.data),
        useReverseProxy: true, // Use reverse proxy
        proxy: "http://10.130.1.1:8080", // Custom proxy URL
      });
      //console.log({ result })

      if (!result || !result?.access_token) {
        return result.status(401).json({
          success: false,
          status: 401,
          message: "Error in getting access token from third party api",
        });
      }
      const access_token = result?.access_token;

      /*const proxy = "http://10.130.1.1:8080";
      const agent = new HttpsProxyAgent(proxy);
    	
      const letterData = await axios.post(thirdPartyApi.getGeneratedToken.endpoint, {
        headers: {
                    'Content-Type' : 'application/json',
                    'Authorization' : `Bearer ${access_token}`,
           Accept: 'application/pdf',
                },
        responseType: 'arraybuffer',
        httpsAgent: agent,
        timeout: 10000
      });*/

      /*const letterData = await apiFetcher({
                url: thirdPartyApi.getGeneratedToken.endpoint,
                method: thirdPartyApi.getGeneratedToken.method,
                headers: {
                    ...thirdPartyApi.getGeneratedToken.headers,
                    Authorization: `Bearer ${access_token}`,
                },
                data: requestData,
                //useReverseProxy: true,  // Use reverse proxy
                //proxy: 'http://10.130.1.1:8080',  // Custom proxy URL
            });*/

      //console.log(thirdPartyApi.getGeneratedToken.endpoint);
      //console.log( 12313232, letterData )

      // OLD CODE
      // const letter = Buffer.from(letterData).toString('base64')
      // if (!letterData) {
      //     return responseSender(res, responseMessage.errorPdfGeneration.statusCode, responseMessage.errorPdfGeneration.description[lang], false)
      // } else {
      //     return res.json({
      //         success: true,
      //         status: 200,
      //         message: "Pdf Generated successfully",
      //         data: letter,
      //     });
      // }

      var options = {
        method: thirdPartyApi.getGeneratedToken.method,
        url: thirdPartyApi.getGeneratedToken.endpoint,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify(requestData),
        encoding: null,
      };
      console.log(111, options);
      request(options, function (error, response) {
        if (error) throw new Error(error);
        console.log(222, response.body);
        const pdfBuffer = response.body;

        // Optional: check content-type header
        const contentType = response.headers["content-type"];
        console.log(contentType);
        if (contentType === "application/pdf") {
          const base64PDF = Buffer.from(pdfBuffer).toString("base64");
          return res.json({
            success: true,
            status: 200,
            message: "PDF Generated successfully",
            data: base64PDF,
          });
        } else {
          //console.log(123)
          const base64PDF = Buffer.from(pdfBuffer).toString("base64");
          return responseSender(
            res,
            responseMessage.errorPdfGeneration.statusCode,
            responseMessage.errorPdfGeneration.description[lang],
            false,
            base64PDF
          );
        }
        //return res.json({ success: true, status: 200, message: "Pdf Generated successfully", data: response.body });
      });

      //console.log(132132132, letterData)
      /*if (letterData && letterData?.status != 500 && letterData?.error != 'Internal Server Error') {
                const letterDataString = typeof letterData === 'object' ? JSON.stringify(letterData) : letterData;
                const letter = Buffer.from(letterDataString).toString('base64');

                return res.json({ success: true, status: 200, message: "Pdf Generated successfully", data: letterData });
            } else {
                return responseSender(res, responseMessage.errorPdfGeneration.statusCode, responseMessage.errorPdfGeneration.description[lang], false, letterData)
            }*/
    } catch (error) {
      // console.log("Error is:", error)
      return res.status(500).json({
        success: false,
        status: 500,
        message: error.message,
      });
    }
  },

  getCustomerDetails: async (req, res) => {
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
      const parsedData = JSON.parse(customer_data);
      console.log({ parsedData });

      //using request
      let outstandingData = [];
      const customerDetailsWithOutstandingData = Array.isArray(parsedData)
        ? parsedData
        : [parsedData];
      console.log({ customerDetailsWithOutstandingData });

      const fetchData = (formattedLoanAccountNumber, callback) => {
        const options = {
          url: thirdPartyApi.getLoanOutstanding.endpoint,
          method: thirdPartyApi.getLoanOutstanding.method,
          headers: thirdPartyApi.getLoanOutstanding.headers,
          body: JSON.stringify({
            lm_applno: formattedLoanAccountNumber,
          }),
        };

        apiFetcher(options, false)
          .then((apiResponse) => {
            callback(null, apiResponse);
          })
          .catch((error) => {
            callback(error, null);
          });
      };

      const fetchOutstandingData = async () => {
        const promises = customerDetailsWithOutstandingData.map((customer) => {
          return new Promise((resolve, reject) => {
            const { applicationNo, loanAccountNumber } = customer;

            const formattedLoanAccountNumber =
              formatLoanAccountNumber(loanAccountNumber);
            //console.log({ loanAccountNumber, formattedLoanAccountNumber })

            fetchData(formattedLoanAccountNumber, (error, apiResponse) => {
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
                console.log(
                  `Response for loanAccountNumber ${formattedLoanAccountNumber}:`,
                  apiResponse
                );
                resolve({
                  // ...customer,
                  outstandingData: apiResponse,
                });
              }
            });
          });
        });

        outstandingData = await Promise.all(promises);
        //console.log({ outstandingData });
      };

      await fetchOutstandingData();

      res.json({
        success: true,
        message: "Successfully fetched customer details",
        data: {
          customerDetails: parsedData,
          loanOutstanding: outstandingData.filter((data) => data !== null), // Filter out null values
        },
      });
    } catch (error) {
      //console.log(error);
      res.status(500).json({
        success: false,
        message: "Internal server error from get customer details route",
      });
    }
  },
};

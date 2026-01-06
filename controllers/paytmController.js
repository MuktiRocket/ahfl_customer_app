const Paytm = require("paytmchecksum");
const https = require("https");
const { HttpsProxyAgent } = require("https-proxy-agent");
const { saveRequestPaymentDetails, getCustomerDetails, saveResponsePaymentDetails, insertPaymentDetails, updatePaymentDetailsByOrderId } = require("../models/userModel");
const { pool } = require("../models/db");
const encryptData = require("../utils/encryptData");
const crypto = require('crypto');
const thirdPartyApi = require("../utils/thirdPartyApi");
const apiFetcher = require("../utils/apiFetcher");
const request = require('request');
const { verifyTransactionResponse } = require("../utils/verifyTransactionResponse");
const responseSender = require("../utils/responseSender");
const responseMessage = require("../utils/responseMessage");
const { sendRequest } = require("../utils/thirdPartyApiService");
const { logger } = require("../utils/logger");

const PAYTM_APIS = {
    PAYTM_CALLBACK_API: process.env.PAYTM_CALLBACK_API,
    PAYTM_INITIATE_PAYMENT: process.env.PAYTM_INITIATE_PAYMENT,
    WEBSITE_APP: process.env.WEBSITE_APP,
    MID: process.env.MID,
    MERCHANT_KEY: process.env.MERCHANT_KEY
}

const PAYTM_CONSTANTS = {
    REQUEST_TYPE: "Payment",
    CURRENCY: "INR"
}


module.exports = {

    createPaytmPayment: async (req, res) => {
        try {
            const { uid } = req.data;
            const { paymentAmount, paymentDesc, paymentType, loanAccountNumber } = req.body;

            const { applicationNo, applicantMobileNo, customerNumber, crmClientID, dob } =
                await getCustomerDetails(uid);

            const orderId = `AHLFORDERID_${Math.floor(100000 + Math.random() * 900000)}`;
            const custId = `CUST_${Math.floor(100000 + Math.random() * 900000)}`;

            const paytmBody = {
                requestType: PAYTM_CONSTANTS.REQUEST_TYPE,
                mid: PAYTM_APIS.MID,
                websiteName: PAYTM_APIS.WEBSITE_APP,
                orderId,
                callbackUrl: `${PAYTM_APIS.PAYTM_CALLBACK_API}?ORDER_ID=${orderId}`,
                txnAmount: { value: paymentAmount, currency: PAYTM_CONSTANTS.CURRENCY },
                userInfo: { custId },
                paymentDesc
            };

            const checksum = await Paytm.generateSignature(
                JSON.stringify(paytmBody),
                PAYTM_APIS.MERCHANT_KEY
            );

            const paytmPayload = JSON.stringify({
                body: paytmBody,
                head: { signature: checksum }
            });

            const payload = {
                method: thirdPartyApi.methods.POST,
                url: `${PAYTM_APIS.PAYTM_INITIATE_PAYMENT}?mid=${process.env.MID}&orderId=${orderId}`,
                headers: {
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(paytmPayload)
                },
                data: paytmPayload,
            }

            const paytmResponse = await sendRequest(payload);

            const requestObj = {
                applicationId: applicationNo,
                paymentAmount,
                paymentType,
                paymentDesc,
                customerNumber,
                dob: dob || "",
                mobileNumber: String(applicantMobileNo),
                crmClientID: String(applicantMobileNo)
            };

            const salt = crypto.randomBytes(16).toString("hex");

            const finalEncryptedData = {
                ...requestObj,
                orderId,
                loanAccountNumber,
                salt
            };

            const paymentDetailsPayload = {
                customerId: custId,
                mobile: applicantMobileNo,
                orderId,
                amount: paymentAmount,
                responseCode: "",
                responseMsg: "",
                responseStatus: "",
                txnId: "",
                mode: "",
                loanAccountNumber
            };

            await insertPaymentDetails(paymentDetailsPayload);
            await saveRequestPaymentDetails(finalEncryptedData);

            res.status(200).json({
                success: true,
                status: 200,
                message: "Successfully created transaction token",
                data: { mid: process.env.MID, orderId, amount: paymentAmount, result: paytmResponse.body }
            });

        } catch (error) {
            logger.error(`Error creating Paytm payment :: ${error}`);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    },

    postResponsePayment: async (req, res) => {
        try {
            const lang = req.headers.language || req.headers.Language;
            const { uid } = req.data;
            const { isDev, isUAT, paymentType, loanAccountNumber } = req.body;

            const [[userRow]] = await pool.promise().execute(
                `SELECT auth_token, customer_data FROM user_data WHERE uid = ?`,
                [uid]
            );

            if (!userRow?.auth_token)
                return res.status(401).json({ success: false, message: "Invalid auth token or expired" });

            const customers = Array.isArray(JSON.parse(userRow.customer_data))
                ? JSON.parse(userRow.customer_data)
                : [JSON.parse(userRow.customer_data)];

            const user = customers.find(u => u.loanAccountNumber === loanAccountNumber);

            if (!user)
                return res.status(404).json({ success: false, message: "Loan account number not found" });

            const {
                responseCode, responseMsg, responseStatus, bankName, bankTransactionId,
                currency, deviceId, gatewayName, orderId, mode,
                transactionAmount, transactionId, CHECKSUMHASH, paytmParam
            } = req.body;

            const responseObj = { responseCode, responseMsg, responseStatus, bankName, bankTransactionId, currency, deviceId, gatewayName, mode, transactionAmount, transactionId };

            /* ===================== UAT FLOW ===================== */
            if (isUAT) {

                if (responseStatus === "TXN_SUCCESS" && paymentType === "emi") {
                    const emiRequest = {
                        MARCHANT_NAME: "Aadhar Housing Finance Limited",
                        APPLICATION_NUMBER: user.loanAccountNumber,
                        MOBILE_NUMBER: user.applicantMobileNo,
                        CUTOMER_NAME: user.applicantFullName,
                        AMOUNT: transactionAmount,
                        PAYMENTBANK: "BBPS",
                        PAYMENTMODE: mode,
                        PAYTMORDERID: orderId,
                        PAY_SOURCE: "PAYTW"
                    };
                    const payload = {
                        method: thirdPartyApi.postEmiPayment.method,
                        url: thirdPartyApi.postEmiPayment.endpoint,
                        headers: thirdPartyApi.postEmiPayment.headers,
                        data: JSON.stringify(emiRequest)
                    }

                    await sendRequest(payload);
                }

                const [[saltRow]] = await pool.promise().execute(
                    `SELECT salt FROM request_payment WHERE order_id = ?`,
                    [orderId]
                );

                const encryptedResponse = encryptData.encrypt(responseObj, saltRow.salt);

                await saveResponsePaymentDetails({ ...encryptedResponse, orderId, salt: saltRow.salt });

                await updatePaymentDetailsByOrderId({
                    orderId,
                    responseCode,
                    responseMsg,
                    responseStatus,
                    txnId: bankTransactionId,
                    mode
                });

                return responseSender(
                    res,
                    responseMessage.completeTransaction.statusCode,
                    responseMessage.completeTransaction.description[lang],
                    true
                );
            }

            /* ===================== PROD FLOW ===================== */

            if (paytmParam) {
                const checksum = paytmParam.CHECKSUMHASH;
                delete paytmParam.CHECKSUMHASH;
                Paytm.verifySignature(paytmParam, process.env.MERCHANT_KEY, checksum);
            }

            const salt = crypto.randomBytes(16).toString("hex");
            const encryptedResponse = encryptData.encrypt(responseObj, salt);

            await saveResponsePaymentDetails({ ...encryptedResponse, orderId, salt });

            await updatePaymentDetailsByOrderId({
                orderId,
                responseCode,
                responseMsg,
                responseStatus,
                txnId: bankTransactionId,
                mode
            });

            if (responseCode !== "01")
                return responseSender(
                    res,
                    responseMessage.inCompleteTransaction.statusCode,
                    responseMessage.inCompleteTransaction.description[lang],
                    true
                );

            return responseSender(
                res,
                responseMessage.completeTransaction.statusCode,
                responseMessage.completeTransaction.description[lang],
                true
            );

        } catch (error) {
            logger.error(`Error while saving response payment details :: ${error}`);
            res.status(500).json({ success: false, status: 500, message: "Internal server error" });
        }
    },

    getTransactionHistory: async (req, res) => {
        try {
            const { loanAccountNumber } = req.query;

            const query = ` SELECT rp.* 
      FROM response_payment rp
      JOIN request_payment rq ON rp.request_id = rq.id
      WHERE rq.loan_account_no = ?
      ORDER BY rp.inserted_date DESC`;

            // const query = `SELECT * FROM response_payment WHERE loanAccountNumber = ? ORDER BY timestamp DESC`;
            const [userDataRows] = await pool.promise().execute(query, [loanAccountNumber]);
            //console.log({ userDataRows })

            if (userDataRows.length === 0) {
                return res.status(200).json({
                    success: false,
                    status: 200,
                    message: "No data found for this account number",
                });
            } else {
                const finalDecryptedData = userDataRows.map((item) => {
                    try {
                        const { salt, id, request_id, order_id, is_active, inserted_date, ...dataToDecrypt } = item;

                        const decryptedEntry = encryptData.decryptData(dataToDecrypt, salt);
                        decryptedEntry.id = id;
                        decryptedEntry.request_id = request_id;
                        decryptedEntry.order_id = order_id;
                        decryptedEntry.is_active = is_active;
                        decryptedEntry.inserted_date = inserted_date;
                        //console.log({ decryptedEntry });
                        return decryptedEntry;
                    } catch (error) {
                        console.error('Error decrypting data for item:', item, error);
                        return null;
                    }
                });
                //console.log({ finalDecryptedData })

                const transactionDetails = finalDecryptedData;

                if (!req.query) {
                    res.status(200).json({
                        success: true,
                        status: 200,
                        message: "Request Params missing",
                    });
                } else {
                    res.status(201).json({
                        success: true,
                        status: 201,
                        message: "Successfully fetched transaction details",
                        data: { transactionDetails },
                    });
                }
            }

        } catch (error) {
            //console.log("Error fetching transaction:", error.message);
            res.status(500).json({
                success: false,
                status: 500,
                message: "Internal Server Error",
            });
        }
    },

    getPaymentStatus: async (req, res) => {
        const { orderId } = req.query
        var paytmParams = {};

        paytmParams.body = {
            "mid": process.env.MID,
            "orderId": orderId,
        };

        PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), process.env.MERCHANT_KEY).then(function (checksum) {
            paytmParams.head = {
                "signature": checksum
            };

            var post_data = JSON.stringify(paytmParams);

            var options = {

                /* for Staging */
                // hostname: 'securegw-stage.paytm.in',

                /* for Production */
                hostname: 'securegw.paytm.in',

                port: 443,
                path: '/v3/order/status',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': post_data.length
                }
            };

            // Set up the request
            var response = "";
            var post_req = https.request(options, function (post_res) {
                post_res.on('data', function (chunk) {
                    response += chunk;
                });

                post_res.on('end', function () {
                    console.log('Response: ', response);
                });
            });

            // post the data
            post_req.write(post_data);
            post_req.end();
        });
    }

};

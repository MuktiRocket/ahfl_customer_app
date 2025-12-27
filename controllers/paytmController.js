const Paytm = require("paytmchecksum");
const https = require("https");
const { HttpsProxyAgent } = require("https-proxy-agent");
const { saveRequestPaymentDetails, getCustomerDetails, saveResponsePaymentDetails, insertPaymentDetails, updatePaymentDetailsByOrderId  } = require("../models/userModel");
const { pool } = require("../models/db");
const encryptData = require("../utils/encryptData");
const crypto = require('crypto');
const thirdPartyApi = require("../utils/thirdPartyApi");
const apiFetcher = require("../utils/apiFetcher");
const request = require('request');
const {verifyTransactionResponse} = require("../utils/verifyTransactionResponse");
const responseSender = require("../utils/responseSender");
const responseMessage = require("../utils/responseMessage");


module.exports = {

    createPaytmPayment: async (req, res) => {
        try {
			/*res.status(200).json({ success: true, status: 200, message: "We are currently facing an issue while attempting to process your payment and sincerely apologize for the inconvenience caused." })*/
            const { uid } = req.data
			const proxy = "http://10.130.1.1:8080";
			const agent = new HttpsProxyAgent(proxy);
            const customerDetails = await getCustomerDetails(uid)
            //console.log({ customerDetails })
            const { applicationNo, applicantMobileNo, customerNumber, crmClientID, dob } = customerDetails
            //console.log({ applicationNo, applicantMobileNo, customerNumber, crmClientID, dob })

            let { paymentAmount, paymentDesc, paymentType, loanAccountNumber } = req.body
            const orderId = "AHLFORDERID_" + Math.floor(100000 + Math.random() * 900000);
            const custId = "CUST_" + Math.floor(100000 + Math.random() * 900000);

            var paytmParams = {};
			//paymentAmount = "1";
            paytmParams.body = {
                requestType: "Payment",
                mid: process.env.MID,
				//websiteName: process.env.WEBSITE_APP_STAGING,
				websiteName: process.env.WEBSITE_APP,
                orderId: orderId,
                // callbackUrl: `https://securegw-stage.paytm.in/theia/paytmCallback?ORDER_ID=${orderId}`,
                callbackUrl: `https://securegw.paytm.in/theia/paytmCallback?ORDER_ID=${orderId}`,
                txnAmount: {
                    value: paymentAmount,
                    currency: "INR",
                },
                userInfo: {
                    custId: custId,
                },
                paymentDesc: paymentDesc
            };

            Paytm.generateSignature(JSON.stringify(paytmParams.body), process.env.MERCHANT_KEY)
                .then(function (checksum) {
					//console.log(checksum)
                    paytmParams.head = {
                        signature: checksum
                    };

                    var post_data = JSON.stringify(paytmParams);
                    //console.log({ post_data })

                    var options = {
                        //for Staging 
                        // hostname: "securegw-stage.paytm.in",

                        //for Production 
                        hostname: "securegw.paytm.in",

                        port: 443,
                        path: `/theia/api/v1/initiateTransaction?mid=${process.env.MID}&orderId=${orderId}`,
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Content-Length": post_data.length,
                        },
						agent: agent
                    };

                    var response = "";
                    var post_req = https.request(options, function (post_res) {
                        post_res.on("data", function (chunk) {
                            response += chunk;
                        });


                        post_res.on("end", async function () {
                            // console.log({ response });
                            const { body } = JSON.parse(response)
                            // console.log({ callbackUrl })
                            const responseData = { mid: process.env.MID, orderId: orderId, amount: paymentAmount, result: body }

                            //request payment table
                            const requestObj = {
                                applicationId: applicationNo,
                                paymentAmount,
                                paymentType,
                                paymentDesc,
                                // loanAccountNumber,
                                customerNumber,
                                dob : dob ? dob : '',
                                mobileNumber: String(applicantMobileNo),
                                // orderId,
                                crmClientID: String(applicantMobileNo)
                            }

                            const salt = crypto.randomBytes(16).toString('hex');
                            //console.log({ salt })

                            const encryptedRequestData = encryptData.encrypt(JSON.stringify(requestObj), salt)
                            //console.log({ encryptedRequestData, requestObj })

                            const finalEncryptedData = {
                                //...encryptedRequestData,
								...requestObj,
                                orderId: orderId,
                                loanAccountNumber: loanAccountNumber,
                                salt: salt
                            }
							
							const paymentDetailsPayload = {
								customerId: custId,
								mobile: applicantMobileNo, 
								orderId: orderId,
								amount: paymentAmount,
								responseCode: "",
								responseMsg: "",
								responseStatus: "",
								txnId: "",
								mode: "",
								loanAccountNumber: loanAccountNumber
							};
							console.log(paymentDetailsPayload);
							await insertPaymentDetails(paymentDetailsPayload);
                            await saveRequestPaymentDetails(finalEncryptedData)

                            res.status(200).json({ success: true, status: 200, message: "Successfully created transaction token", data: responseData })
                        });
                    });

                    post_req.write(post_data);
                    post_req.end();
                });

        } catch (error) {
            console.error("Error creating Paytm payment:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    },

    postResponsePayment: async (req, res) => {
        try {
            const lang = req.headers['language'] || req.headers['Language'];
            const { isDev, paymentType, loanAccountNumber, isUAT } = req.body
            //console.log({ paymentType, loanAccountNumber })

            const { uid } = req.data
            const query = `SELECT * FROM user_data WHERE uid = ?`;
            const [userDataRows] = await pool.promise().execute(query, [uid]);

            if (userDataRows.length === 0 || userDataRows[0].auth_token === null) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid auth token or expired",
                });
            }

            const customerDetails = JSON.parse(userDataRows[0]?.customer_data)

            if (!Array.isArray(customerDetails)) {
                customerDetails = [customerDetails];
            }

            const user = customerDetails.find(u => u.loanAccountNumber === loanAccountNumber)
            //console.log({ user })
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "Loan account number not found",
                });
            }

            if (isUAT) {
                const { responseCode, responseMsg, responseStatus, bankName, bankTransactionId, currency, deviceId, gatewayName, orderId, mode, transactionAmount, transactionId, CHECKSUMHASH } = req.body;
                const responseObj = { responseCode, responseMsg, responseStatus, bankName, bankTransactionId, currency, deviceId, gatewayName, mode, transactionAmount, transactionId }

                //need to check the data tampering while paytm payment
                // async function handleTransaction(responseObj) {
                //   try {
                //     const result = await verifyTransactionResponse(responseObj);
                //     console.log({ result });
                //     const isValidChecksum = result.isValid;
                //     console.log("Is valid checksum:", isValidChecksum);
                //     if (isValidChecksum) {
                //       console.log("Transaction status:", result.status);
                //     } else {
                //       console.log("Invalid checksum.");
                //     }
                //   } catch (error) {
                //     console.error("Error:", error);
                //   }
                // }
                // handleTransaction(responseObj);


                if (responseStatus === 'TXN_SUCCESS' && paymentType === 'emi') {
                    const requestBody = {
                        "MARCHANT_NAME": "Aadhar Housing Finance Limited",
                        "APPLICATION_NUMBER": user?.loanAccountNumber,
                        "MOBILE_NUMBER": user?.applicantMobileNo,
                        "CUTOMER_NAME": user?.applicantFullName,
                        "AMOUNT": transactionAmount,
                        "PAYMENTBANK": "BBPS",
                        "PAYMENTMODE": mode,
                        "PAYTMORDERID": orderId,
                        "PAY_SOURCE": "PAYTW"
                    }

                    try {
                        // const result = await apiFetcher({
                        //   url: thirdPartyApi.postEmiPayment.endpoint,
                        //   method: thirdPartyApi.postEmiPayment.method,
                        //   headers: thirdPartyApi.postEmiPayment.headers,
                        //   data: requestBody
                        // })
                        // console.log({ result })
                        const fetchData = (callback) => {
                            const options = {
                                url: thirdPartyApi.postEmiPayment.endpoint,
                                method: thirdPartyApi.postEmiPayment.method,
                                headers: thirdPartyApi.postEmiPayment.headers,
                                body: JSON.stringify(requestBody)
                            };

                            request(options, function (error, response, body) {
                                if (error) {
                                    callback(error, null);
                                } else {
                                    callback(null, body);
                                }
                            });
                        };

                        fetchData((error, apiResponse) => {
                            if (error) {
                                console.log({ error });
                            } else {
                                console.log(apiResponse);
                            }
                        });

                    } catch (error) {
                        console.log("Error in calling Postin api", error)
                    }
                }

                const query = `SELECT salt FROM request_payment WHERE order_id = ?`;
                const [userDataRows] = await pool.promise().execute(query, [orderId]);
                //console.log({ userDataRows })
                const salt = userDataRows[0].salt

                const encryptResponseData = encryptData.encrypt(responseObj, salt)
                //console.log({ encryptResponseData })

                const finalEncryptedData = {
                    ...encryptResponseData,
                    orderId: orderId,
                    salt: salt
                }
				
				const paymentDetailsPayload = {
					orderId: orderId,
					responseCode: responseCode,
					responseMsg: responseMsg,
					responseStatus: responseStatus,
					txnId: bankTransactionId,
					mode: mode,
				};
				console.log(paymentDetailsPayload)
                await saveResponsePaymentDetails(finalEncryptedData);
				await updatePaymentDetailsByOrderId(paymentDetailsPayload);

                return responseSender(res, responseMessage.completeTransaction.statusCode, responseMessage.completeTransaction.description[lang], true)
                // res.status(200).json({ success: true, status: 200, message: "Your transaction is completed" });

            } else {
                /*const { uid } = req.data;
				console.log(2222222, req.body)
                const { responseCode, responseMsg, responseStatus, bankName, bankTransactionId, currency, deviceId, gatewayName, orderId, mode, transactionAmount, transactionId, checkSumHash } = req.body;
				
                const response = {   responseCode,responseMsg,  responseStatus,  bankName, bankTransactionId, currency, deviceId, gatewayName, mode, transactionAmount, transactionId, checkSumHash }
				const responseObj = { RESPCODE: responseCode, RESPMSG:responseMsg, STATUS: responseStatus, BANKNAME: bankName, BANKTXNID:bankTransactionId, CURRENCY: currency, GATEWAYNAME: gatewayName, ORDERID: orderId, PAYMENTMODE: mode, TXNAMOUNT: transactionAmount, TXNID: transactionId, CHECKSUMHASH: checkSumHash }
                //need to check the data tampering while paytm payment
                const isValildChecksum = verifyTransactionResponse(responseObj)
                //console.log({ isValildChecksum })

                const salt = crypto.randomBytes(16).toString('hex');
                //console.log({ salt })

                const encryptResponseData = encryptData.encrypt(response, salt)
                //console.log({ encryptResponseData })

                const finalEncryptedData = {
                    ...encryptResponseData,
                    orderId: orderId,
                    salt: salt
                }
                await saveResponsePaymentDetails(finalEncryptedData)

                return responseSender(res, responseMessage.completeTransaction.statusCode, responseMessage.completeTransaction.description[lang], true)
                // res.status(200).json({ success: true, status: 200, message: "Your transaction is completed" });*/
				const { responseCode, responseMsg, responseStatus, bankName, bankTransactionId, currency, deviceId, gatewayName, orderId, mode, transactionAmount, transactionId, CHECKSUMHASH, paytmParam } = req.body;
                const responseObj = { responseCode, responseMsg, responseStatus, bankName, bankTransactionId, currency, deviceId, gatewayName, mode, transactionAmount, transactionId }
				
				async function handleTransaction(paytmParam, paytmChecksum) {
                  try {
                    /* const result = await verifyTransactionResponse(paytmParam);
                     console.log("valid",{result });
                    const isValidChecksum = result.isValid;
                    console.log("Is valid checksum:", isValidChecksum);
                    if (isValidChecksum) {
                      console.log("Transaction status:", result.status);
                     } else {
                     console.log("Invalid checksum.");
                     }
					 */
					 
					 const isVerify = Paytm.verifySignature(
					 paytmParam,  process.env.MERCHANT_KEY, paytmChecksum
					 )
					 if (isVerify) {
                      console.log("Transaction success:");
                     } else {
                     console.log("Invalid checksum.");
                     }
					 
                  } catch (error) {
                     console.error("Error:", error);
                   }
                 }
				 const paytmChecksum = paytmParam.CHECKSUMHASH
				 delete paytmParam.CHECKSUMHASH
                 handleTransaction(paytmParam, paytmChecksum);
				 
				 const salt = crypto.randomBytes(16).toString('hex');
				//console.log({ salt })

				const encryptResponseData = encryptData.encrypt(responseObj, salt)
				//console.log({ encryptResponseData })

				const finalEncryptedData = {
					...encryptResponseData,
					orderId: orderId,
					salt: salt
				}
				
				const paymentDetailsPayload = {
					orderId: orderId,
					responseCode: responseCode,
					responseMsg: responseMsg,
					responseStatus: responseStatus,
					txnId: bankTransactionId,
					mode: mode,
				};
				console.log(paymentDetailsPayload)
                await saveResponsePaymentDetails(finalEncryptedData);
				await updatePaymentDetailsByOrderId(paymentDetailsPayload);
				
				if(responseCode != "01")
					return responseSender(res, responseMessage.inCompleteTransaction.statusCode, responseMessage.inCompleteTransaction.description[lang], true)
				return responseSender(res, responseMessage.completeTransaction.statusCode, responseMessage.completeTransaction.description[lang], true)
            }

        } catch (error) {
            console.error("Error while saving response payment details:", error);
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

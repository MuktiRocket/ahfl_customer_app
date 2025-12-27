const https = require('https');
const PaytmChecksum = require('paytmchecksum');

const verifyTransactionResponse = (response) => {
    return new Promise((resolve, reject) => {
        //console.log({ "response from paytm server": response });

        const paytmParams = { ...response };
        const checksumReceived = paytmParams.CHECKSUMHASH;
        delete paytmParams.CHECKSUMHASH;
		console.log(11111111, paytmParams, process.env.MERCHANT_KEY, checksumReceived)
        const isChecksumValid = PaytmChecksum.verifySignature(paytmParams, process.env.MERCHANT_KEY, checksumReceived);
		console.log(3333333, isChecksumValid)
        if (isChecksumValid) {
            //console.log("Checksum is valid.");
            verifyTransactionStatus(paytmParams.ORDERID)
                .then(status => {
                    //console.log("Transaction status:", status);
                    resolve({ isValid: true, status });
                })
                .catch(error => {
                    console.error("Error verifying transaction status:", error);
                    resolve({ isValid: true, status: null, error });
                });
        } else {
            //console.log("Checksum is invalid.");
            resolve({ isValid: false });
        }
    });
};

const verifyTransactionStatus = (orderId) => {
    return new Promise((resolve, reject) => {
        const paytmParams = {
            body: {
                "mid": process.env.MID,
                "orderId": orderId,
            }
        };

        PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), process.env.MERCHANT_KEY).then(checksum => {
            paytmParams.head = {
                "signature": checksum
            };

            const post_data = JSON.stringify(paytmParams);

            const options = {
                // hostname: 'securegw.paytm.in', // For Production
                hostname: 'securegw-stage.paytm.in', // For Staging
                port: 443,
                path: '/v3/order/status',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': post_data.length
                }
            };

            // Set up the request
            let response = "";
            const post_req = https.request(options, (post_res) => {
                post_res.on('data', (chunk) => {
                    response += chunk;
                });

                post_res.on('end', () => {
                    //console.log('Transaction Status Response: ', response);
                    // Handle the response here
                    try {
                        const parsedResponse = JSON.parse(response);
                        // Process the parsed response
                        if (parsedResponse.body.resultInfo.resultStatus === "TXN_SUCCESS") {
                            //console.log("Transaction successful.");
                            resolve("Transaction successful");
                        } else {
                            //console.log("Transaction failed or is under review.");
                            resolve("Transaction failed or is under review");
                        }
                    } catch (error) {
                        console.error("Error parsing response:", error);
                        reject(error);
                    }
                });
            });

            // Handle request errors
            post_req.on('error', (error) => {
                console.error("Error in transaction status request:", error);
                reject(error);
            });

            // Post the data
            post_req.write(post_data);
            post_req.end();
        }).catch(error => {
            console.error("Error generating checksum for transaction status verification:", error);
            reject(error);
        });
    });
};

module.exports = { verifyTransactionResponse, verifyTransactionStatus };

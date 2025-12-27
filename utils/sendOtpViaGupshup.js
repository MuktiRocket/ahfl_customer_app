const axios = require("axios");
const { HttpsProxyAgent } = require("https-proxy-agent");
const crypto = require("crypto");
const https = require('https');
const logger = require("./logger");
const { smartPingApi, gupshupApi } = require('../utils/otpSending')
const proxy = "http://10.130.1.1:8080";

// Create the HttpsProxyAgent with custom options
const agent = new HttpsProxyAgent(proxy);

// Set SSL options directly on the agent
agent.options.rejectUnauthorized = true;
agent.options.secureOptions = crypto.constants.SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION;
const OTP_MAX_RETRY = process.env.OTP_MAX_RETRY

async function sendOTP(mobileNumber, otp) {
	try {
		let response;
		
		// SmartPing API as primary
		response = await tryApi(smartPingApi, mobileNumber, otp, "SmartPing");
		if (response.success) {
			return response;
		}
		
		// Gupshup API as fallback
		response = await tryApi(gupshupApi, mobileNumber, otp, "Guphsup");
		if (response.success) {
			return response;
		}

		// If all attempts fail
		console.log('All attempts failed.');
		return { success: false };

	} catch (error) {
		console.log(error)
		// console.error("Error in sendOTP:", error);
		//return {success : false, message : "Failed to send OTP" }
		logger.error(error.response?.data)
		throw error.response?.data?.error || error.response;
	}
}

async function tryApi(apiFunction, mobileNumber, otp, apiName) {
	for (let attempt = 1; attempt <= OTP_MAX_RETRY; attempt++) {
		const data = await apiFunction(mobileNumber, otp);
		logger.info(`Attempt ${attempt} with ${apiName} API:`, data);
		if (data.success) {
			return data;
		}
	}
	return { success: false };
}

module.exports = { sendOTP };
const axios = require("axios");
const { logger } = require("./logger");
const { smartPingApi, gupshupApi } = require('../utils/otpSending')
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
		logger.error(`Error at sendOTP :: ${error.response?.data}`)
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
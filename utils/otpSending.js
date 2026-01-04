const { sendRequest } = require("./thirdPartyApiService"); // adjust path if needed
const { logger } = require("./logger");
const thirdPartyApi = require("./thirdPartyApi");
const { saveAuditTrail, AUDIT_TRAIL_CATEGORY, AUDIT_TRAIL_REMARK } = require("../models/userModel");

const smartPingApi = async (mobileNumber, otp) => {
    try {
        const url =
            `https://pgapi.vispl.in/fe/api/v1/send` +
            `?username=${process.env.SP_USERNAME}` +
            `&password=${process.env.SP_PASSWORD}` +
            `&unicode=${process.env.SP_UNICODE}` +
            `&from=${process.env.SP_FROM}` +
            `&to=${mobileNumber}` +
            `&dltContentId=${process.env.SP_DLTPRINCIPLEENTITYID}` +
            `&text=Use%20OTP%20${otp}%20for%20authenticating%20your%20contact%20no.%20with%20Aadhar%20Housing%20Finance.%20Valid%20for%2030%20Mins%20only.`;

        const response = await sendRequest({ method: thirdPartyApi.methods.GET, url, headers: { "Content-Type": "application/json" } });

        const savingAuditTrail = await saveAuditTrail({ mobile: mobileNumber, uid: "", category: AUDIT_TRAIL_CATEGORY.SMS, remark: AUDIT_TRAIL_REMARK.SMART_PING_OTP });

        return { success: response?.statusCode == 200 };

    } catch (error) {
        logger.error(`Error sending sms using smart ping :: ${error}`);
        throw error;
    }
};

const gupshupApi = async (mobileNumber, otp) => {
    try {
        const response = await sendRequest({
            method: thirdPartyApi.methods.POST,
            url: "https://ahfuat.aadharhousing.com/GatewayAPI/1.0.0/gupshup",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.GUPSHUP_TOKEN_THIRDPARTY}`,
            },
            data: {
                userid: process.env.GUPSHUP_USERID,
                password: process.env.GUPSHUP_PASSWORD,
                method: "SendMessage",
                send_to: mobileNumber,
                message_type: "TEXT",
                auth_scheme: "plain",
                v: "1.1",
                format: "text",
                linkTrakingEnabled: "TRUE",
                msg: `Use OTP ${otp} for authenticating your contact no. with Aadhar Housing Finance. Valid for 30 Mins only.`,
            },
            useProxy: true,
        });
        const savingAuditTrail = await saveAuditTrail({ mobile: mobileNumber, uid: "", category: AUDIT_TRAIL_CATEGORY.SMS, remark: AUDIT_TRAIL_REMARK.GUPSHUP_OTP });
        return { success: response?.response == 200 };

    } catch (error) {
        logger.error(`Error sending sms using Gupshup Api :: ${error}`);
        throw error;
    }
};

module.exports = { smartPingApi, gupshupApi };

const { default: axios } = require("axios");
const { HttpsProxyAgent } = require("https-proxy-agent");
const logger = require("./logger");

const proxy = "http://10.130.1.1:8080";
const agent = new HttpsProxyAgent(proxy);

const smartPingApi = async (mobileNumber, otp) => {
    try {
        const url =
            "https://pgapi.vispl.in/fe/api/v1/send?username=" + process.env.SP_USERNAME + "&password=" + process.env.SP_PASSWORD + "&unicode=" + process.env.SP_UNICODE + "&from=" + process.env.SP_FROM + "&to=" + mobileNumber + "&dltContentId=" + process.env.SP_DLTPRINCIPLEENTITYID + "&text=Use%20OTP%20" + otp + "%20for%20authenticating%20your%20contact%20no.%20with%20Aadhar%20Housing%20Finance.%20Valid%20for%2030%20Mins%20only."

        const response = await axios.get(url, {
			httpsAgent: agent, 
			headers: {
                "Content-Type": "application/json",
            },
        });

        // console.log(response.data);
        if (response?.data?.statusCode == 200) {
            data = {
                success: true
            };
        } else {
            data = {
                success: false
            };
        }

        return data;
    } catch (error) {
        logger.error(error.response?.data)
        throw error.response?.data?.error || error.response;
    }

}

const gupshupApi = async (mobileNumber, otp) => {
    try {
        const response = await axios.post(
            //"http://enterpriseapi.smsgupshup.com/GatewayAPI/rest",
            "https://ahfuat.aadharhousing.com/GatewayAPI/1.0.0/gupshup",
            {
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
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + process.env.GUPSHUP_TOKEN_THIRDPARTY
                },
                httpsAgent: agent
                //httpsAgent: new https.Agent({
                //rejectUnauthorized: true,
                //secureOptions: crypto.constants.SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION,
                //})
            }
        );
		
        //const status = response?.data?.text?.split('|')[0];
        if (status.response == 200) {
            data = {
                success: true
            }
        } else {
            data = {
                success: false
            }
        }
        return data
    } catch (error) {
        logger.error(error.response?.data)
        throw error.response?.data?.error || error.response;
    }
}


module.exports = { smartPingApi, gupshupApi };
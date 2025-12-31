const axios = require("axios");
const { logger } = require("../utils/logger");

/**
 * Send third-party API request (with optional proxy)
 */
const sendRequest = async ({ method, url, headers, data, useProxy = true, proxyUrl = "http://10.130.1.1:8080", }) => {
    const dataOrParams = ["get", "delete"].includes(method) ? "params" : "data";

    const axiosRequest = { method, url, headers, [dataOrParams]: data, timeout: 15000, };

    const isLocal = ["local"].some((name) => process.env.NODE_ENV === name);
    if (!isLocal && useProxy) {

        axiosRequest.proxy = false;

        const { HttpsProxyAgent } = require("https-proxy-agent");
        axiosRequest.httpsAgent = new HttpsProxyAgent(proxyUrl);
    }

    logger.info(`${method.toUpperCase()} ${url} :: [ThirdPartyRequest] :: `, { ...axiosRequest, httpsAgent: !isLocal && useProxy ? "ENABLED" : "DISABLED" });

    try {
        const res = await axios.request(axiosRequest);
        logger.info(`${method.toUpperCase()} ${url} :: [ThirdPartyResponse] :: `, { Response: res.data });
        return res.data;
    } catch (err) {
        const logError = {
            error: err?.response?.data || err?.message,
        };

        logger.error(`${method.toUpperCase()} ${url} :: [ThirdPartyError] :: `, logError);

        throw err?.response?.data || err;
    }
};

module.exports = {
    sendRequest,
};

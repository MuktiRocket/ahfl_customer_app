const request = require("request");
const thirdPartyApi = require("../utils/thirdPartyApi");

const fetchLoanApplicationStatus = async (req, res, next) => {
  const { applicationId } = req.query;

  try {
    if (!applicationId) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "request params missing",
      });
    }

    const fetchApplicationStatus = (callback) => {
      const options = {
        // method: "POST",
        // url: "https://amwuat.aadharhousing.com/lmsApplicationCustomerStatus/1.0.0/lmsApplicationCustomerStatus",
        // headers: {
        //   Authorization: "Bearer bb6e3357-ab80-3d68-a7df-0f3ccaed59da",
        //   "Content-Type": "application/json",
        // },
        method: thirdPartyApi.getLoanApplicationStatus.method,
        url: thirdPartyApi.getLoanApplicationStatus.endpoint,
        headers: thirdPartyApi.getLoanApplicationStatus.headers,
        body: JSON.stringify({ applicationId }),
        useReverseProxy: true,  // Use reverse proxy
        proxy: 'http://10.130.1.1:8080',  // Custom proxy URL
      };

      request(options, function (error, response) {
        if (error) {
          callback(error, null);
        } else {
          const apiResponse = response.body;
          callback(null, apiResponse);
        }
      });
    };

    fetchApplicationStatus((error, apiResponse) => {
      if (error) {
        console.error(error);
      } else {
        //console.log(apiResponse)
        req.apiData = apiResponse;
        next();
      }
    });
  } catch (error) {
    //console.log("Error in fetching data from server:", error);
    res.status(500).json({
      success: false,
      status: 500,
      message: "Internal Server Error",
    });
  }
};

module.exports = { fetchLoanApplicationStatus };

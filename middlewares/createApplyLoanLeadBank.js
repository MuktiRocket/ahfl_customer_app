const request = require("request");
const thirdPartyApi = require("../utils/thirdPartyApi");
const apiFetcher = require("../utils/apiFetcher");

/*const createApplyLoanLeadBank = async (req, res, next) => {
  const requestData = req.body;
  try {
    const fetchLoanLeadBank = (callback) => {
      const options = {
        method: thirdPartyApi.getApplyLoanLeadBank.method,
        url: thirdPartyApi.getApplyLoanLeadBank.endpoint,
        headers: thirdPartyApi.getApplyLoanLeadBank.headers,
        data: JSON.stringify(requestData),
		//data: requestData,
		proxy: "http://10.130.1.1:8080" 
      };
	  console.log(typeof requestData)
	console.log({
        method: thirdPartyApi.getApplyLoanLeadBank.method,
        url: thirdPartyApi.getApplyLoanLeadBank.endpoint,
        headers: thirdPartyApi.getApplyLoanLeadBank.headers,
        //data: JSON.stringify(requestData),
		data: requestData,
		proxy: "http://10.130.1.1:8080" 
      })
      request(options, function (error, response) {
        if (error) {
          callback(error, null);
        } else {
          const apiResponse = response.body;
          callback(null, apiResponse);
        }
      });
    };

    fetchLoanLeadBank((error, apiResponse) => {
      if (error) {
        console.error(error);
      } else {
        req.apiData = apiResponse;
        next();
      }
    });
  } catch (error) {
    //console.log("Error is fetching data from server:", error);
    res.status(500).json({
      success: false,
      statuse: 500,
      message: "Internal Server Error",
    });
  }
};*/

const createApplyLoanLeadBank = async (req, res, next) => {
  const requestData = req.body;
  try {
    console.log(1111111, JSON.stringify(requestData));
    bodyStr = JSON.stringify(requestData);
	console.log(2222222, typeof bodyStr)
    const result = await apiFetcher({
		url: thirdPartyApi.getApplyLoanLeadBank.endpoint,
		method:thirdPartyApi.getApplyLoanLeadBank.method,
		headers: thirdPartyApi.getApplyLoanLeadBank.headers,
		data: bodyStr,
	})
	console.log(66666, result)
    // Attach API response for the next middleware
    req.apiData = result.data;
    next();

  } catch (error) {
    console.error("Error fetching data from ApplyLoanLeadBank API:", error.message);

    if (error.response) {
      console.error("Response data:", error.response.data);
    }

    res.status(500).json({
      success: false,
      status: 500,
      message: "Internal Server Error while fetching data from ApplyLoanLeadBank API",
    });
  }
};


module.exports = { createApplyLoanLeadBank };

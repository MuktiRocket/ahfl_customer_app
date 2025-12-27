const request = require("request");
const thirdPartyApi = require("../utils/thirdPartyApi");

const fetchLoanAccountDOB = async (req, res, next) => {
  try {
    const { dob, loanAccountNumber } = req.body;
    const fetchData = (callback) => {
      const options = {
        // method: "POST",
        // url: "https://amwuat.aadharhousing.com/lmsApplicationCustomerApi/1.0.0/lmsApplicationCustomerApi",
        // headers: {
        //   Authorization: "Bearer bb6e3357-ab80-3d68-a7df-0f3ccaed59da",
        //   "Content-Type": "application/json",
        // },
        method: thirdPartyApi.getCustomerDetailsUsingDob.method,
        url: thirdPartyApi.getCustomerDetailsUsingDob.endpoint,
        headers: thirdPartyApi.getCustomerDetailsUsingDob.headers,
        body: JSON.stringify({
          loanAccountNumber: loanAccountNumber,
          date_of_birth: dob,
        }),
      };

      let apiResponse
      request(options, function (error, response) {
        if (error) {
          callback(error, null);
        } else {
          console.log({ response })
          apiResponse = JSON.parse(response.body);
          if (!Array.isArray(apiResponse.customerDetails)) {
            apiResponse.customerDetails = [apiResponse.customerDetails];
          }
          callback(null, apiResponse);
        }
      });
    };

    fetchData((error, apiResponse) => {
      if (error) {
        res.status(200).json({
          success: false,
          status: 200,
          message: "Invalid Account Number or Invalid DOB"
        });
      } else {
        console.log({ apiResponse })
        req.apiData = apiResponse;
        next();
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 500,
      message: "Invalid Account Number or Invalid DOB",
      data: {},
    });
  }
};

module.exports = fetchLoanAccountDOB;

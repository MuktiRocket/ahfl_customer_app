const axios = require("axios");
const request = require('request');
const thirdPartyApi = require("../utils/thirdPartyApi");

const checkUserDetailsExist = async (req, res, next) => {

  try {

    const { isDeveloped, mobileNumber, isUAT } = req.body
    let requestData;

    // if (!isDeveloped) {
    //   requestData = {
    //     mobileNo: "9004928811",
    //   }
    // } else {
    //   //client uat 
    //   requestData = {
    //     mobileNo: mobileNumber,
    //   };
    // }

    if (isUAT) {
      requestData = {
        mobileNo: mobileNumber
      }
    } else {
      requestData = {
        mobileNo: "9004928811"
      };
    }

    const options = {
      // method: "POST",
      // url: "https://amwuat.aadharhousing.com/direct/0.1/getCustDet",
      // headers: {
      //   "Content-Type": "application/json",
      //   Authorization: "Bearer bb6e3357-ab80-3d68-a7df-0f3ccaed59da",
      // },
      method: thirdPartyApi.getCustomerDetailsUsingMobile.method,
      url: thirdPartyApi.getCustomerDetailsUsingMobile.endpoint,
      headers: thirdPartyApi.getCustomerDetailsUsingMobile.headers,
      body: JSON.stringify(requestData),
    };

    request(options, function (error, response, body) {
      if (error) {
        //console.log("Error is fetching data from server:", error);
        res.status(200).json({
          success: "false",
          status: 200,
          message: "Invalid mobile number or not registered yet",
        });
      } else {
        //console.log({ apiResponse: body });
        req.apiData = JSON.parse(body);
        next();
      }
    });
  } catch (err) {
    //console.log("Error is fetching data from server:", err);
    res.status(500).json({
      success: "false",
      status: 500,
      message: "Internal Server Error",
    });
  }
};

module.exports = { checkUserDetailsExist };

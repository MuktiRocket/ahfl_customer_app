require("dotenv").config()

module.exports = {

    getCustomerDetailsUsingMobile: {
        //endpoint: "https://amw.ahflonline.com/intCust/1.0/getCustDet",
		endpoint: process.env.THIRD_PARTY_API_CUSTOMER_DETAILS_USING_MOBILE,
        method: "post",
        headers: {
            "Content-Type": "application/json",
            Authorization: 'Bearer ' + process.env["Third_Party_Api_Token"],
        }
    },

    getCustomerDetailsUsingDob: {
        //endpoint: "https://amw.ahflonline.com/lmsApplicationCustomerApi/1.0.0/lmsApplicationCustomerApi",
		endpoint: process.env.THIRD_PARTY_API_CUSTOMER_DETAILS_USING_DOB,
        method: "post",
        headers: {
            "Content-Type": "application/json",
            Authorization: 'Bearer ' + process.env["Third_Party_Api_Token"],
        }
    },

    getLoanOutstanding: {
        //endpoint: "https://amw.ahflonline.com/custdue/1.0/ahfl_outstanding",
		endpoint: process.env.THIRD_PARTY_API_LOAN_OUTSTANDING,
        method: 'post',
        headers: {
            Authorization: 'Bearer ' + process.env["Third_Party_Api_Token"],
            "Content-Type": 'application/json',
        }
    },

    getLoanApplicationStatus: {
        //endpoint: "https://amw.ahflonline.com/lmsApplicationCustomerStatus/1.0.0/lmsApplicationCustomerStatus",
		endpoint: process.env.THIRD_PARTY_API_LOAN_APPLICATION_STATUS,
        method: 'post',
        headers: {
            "Content-Type": "application/json",
            Authorization: 'Bearer ' + process.env["Third_Party_Api_Token"],
        }
    },

    getApplyLoanLeadBank: {
        //endpoint: "https://amw.ahflonline.com/lead/1.0/LeadBank",
		endpoint: process.env.THIRD_PARTY_API_APPLY_LOAN_LEAD_BANK,
        method: "post",
        headers: {
            "Content-Type": "application/json",
            Authorization: 'Bearer ' + process.env["Third_Party_Api_Token"],
        }
    },

    getCRMToken: {
        //endpoint: "https://g21m17.tcsion.com/CRM/crmrest/clientCom/generateToken",
		endpoint: process.env.THIRD_PARTY_API_CRM_TOKEN,
        method: "post",
        headers: {
            'Content-type': 'application/json',
            user_name: process.env.CRM_TOKEN_USERNAME,
            password: process.env.CRM_TOKEN_PASSWORD,
            identifier: process.env.CRM_TOKEN_IDENTIFIER,
        },
    },

    getCRMDetails: {
        //endpoint: "https://g21m17.tcsion.com/CRM/crmrest/crmGetCase/casefileuploadsknew",
		endpoint: process.env.THIRD_PARTY_API_CRM_DETAILS,
        method: "post",
        headers: {
            "Content-Type": "multipart/form-data",
            identifier: process.env.CRM_TOKEN_IDENTIFIER,
        },
    },

    getTokenForLetterGeneration: {
        //endpoint: "https://ihbmum-tcslsp.tcsapps.com/ihbmum000/token",
		endpoint: process.env.THIRD_PARTY_API_LETTER_GENERATION_TOKEN,
        method: "post",
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: 'Basic ' + Buffer.from(`${process.env.Third_Party_LetterApi_Username}:${process.env.Third_Party_LetterApi_Password}`).toString('base64'),
        },
        data: {
            grant_type: process.env.GRANT_TYPE_LETTER_GENERATION,
        }
    },

    getGeneratedToken: {
        //endpoint: "https://ihbmum-tcslsp.tcsapps.com/ihbmum000/ReportGeneration/1.0/LetterGeneration",
		endpoint: process.env.THIRD_PARTY_API_LETTER_GENERATION,
        method: "post",
        headers: {
            "Content-Type": "application/json",
        },
    },

    postEmiPayment: {
        //endpoint: "https://amw.ahflonline.com/paypost/1.0/ahfl_post",0
		endpoint: process.env.THIRD_PARTY_API_POST_EMI_PAYMENT,
        method: "post",
        headers: {
            "Content-Type": "application/json",
            Authorization: 'Bearer ' + process.env["Third_Party_Api_Token"],
        }
    }
};
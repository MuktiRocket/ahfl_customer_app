require("dotenv").config();

const methods = {
    POST: "post",
    GET: "get",
    PUT: "put",
    PATCH: "patch"
};

const isLocalAndUAT = ["local"].some((name) => process.env.NODE_ENV === name);
//credentials
const thirdPartyApiToken = isLocalAndUAT ? process.env.UAT_THIRD_PARTY_API_TOKEN : process.env.THIRD_PARTY_API_TOKEN;
const CRMTokenUsername = isLocalAndUAT ? process.env.UAT_CRM_TOKEN_USERNAME : process.env.CRM_TOKEN_USERNAME;
const CRMTokenPassword = isLocalAndUAT ? process.env.UAT_CRM_TOKEN_PASSWORD : process.env.CRM_TOKEN_PASSWORD;
const CRMTokenIdentifier = isLocalAndUAT ? process.env.UAT_CRM_TOKEN_IDENTIFIER : process.env.CRM_TOKEN_IDENTIFIER;
const grantTypeLetterGeneration = isLocalAndUAT ? process.env.UAT_GRANT_TYPE_LETTER_GENERATION : process.env.GRANT_TYPE_LETTER_GENERATION;
const letterApiUsername = isLocalAndUAT ? process.env.Third_Party_LetterApi_Username : process.env.Third_Party_LetterApi_Username;
const letterApiPassword = isLocalAndUAT ? process.env.Third_Party_LetterApi_Password : process.env.Third_Party_LetterApi_Password;
const letterApiToken = isLocalAndUAT ? process.env.UAT_Third_Party_LetterApi_Token : process.env.Third_Party_LetterApi_Token;
//apis
const customerDetailsUsingMobile = isLocalAndUAT ? process.env.UAT_THIRD_PARTY_API_CUSTOMER_DETAILS_USING_MOBILE : process.env.THIRD_PARTY_API_CUSTOMER_DETAILS_USING_MOBILE;
const customerDetailsUsingDOB = isLocalAndUAT ? process.env.UAT_THIRD_PARTY_API_CUSTOMER_DETAILS_USING_DOB : process.env.THIRD_PARTY_API_CUSTOMER_DETAILS_USING_DOB;
const loanOutstanding = isLocalAndUAT ? process.env.UAT_THIRD_PARTY_API_LOAN_OUTSTANDING : process.env.THIRD_PARTY_API_LOAN_OUTSTANDING;
const loanApplicationStatus = isLocalAndUAT ? process.env.UAT_THIRD_PARTY_API_LOAN_APPLICATION_STATUS : process.env.THIRD_PARTY_API_LOAN_APPLICATION_STATUS;
const applyLoanLeadBank = isLocalAndUAT ? process.env.UAT_THIRD_PARTY_API_APPLY_LOAN_LEAD_BANK : process.env.THIRD_PARTY_API_APPLY_LOAN_LEAD_BANK;
const CRMToken = isLocalAndUAT ? process.env.UAT_THIRD_PARTY_API_CRM_TOKEN : process.env.THIRD_PARTY_API_CRM_TOKEN;
const CRMDetails = isLocalAndUAT ? process.env.UAT_THIRD_PARTY_API_CRM_DETAILS : process.env.THIRD_PARTY_API_CRM_DETAILS;
const tokenForLetterGeneration = isLocalAndUAT ? process.env.UAT_THIRD_PARTY_API_LETTER_GENERATION_TOKEN : process.env.THIRD_PARTY_API_LETTER_GENERATION_TOKEN;
const generatedToken = isLocalAndUAT ? process.env.UAT_THIRD_PARTY_API_LETTER_GENERATION : process.env.THIRD_PARTY_API_LETTER_GENERATION;
const postEMIPayment = isLocalAndUAT ? process.env.UAT_THIRD_PARTY_API_POST_EMI_PAYMENT : process.env.THIRD_PARTY_API_POST_EMI_PAYMENT;

//Authorization for letter generation
let authorization = "";
if (isLocalAndUAT)
    authorization = 'Basic ' + Buffer.from(letterApiToken);
else
    authorization = 'Basic ' + Buffer.from(`${letterApiUsername}:${letterApiPassword}`).toString('base64');


module.exports = {
    getCustomerDetailsUsingMobile: {
        endpoint: customerDetailsUsingMobile,
        method: methods.POST,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${thirdPartyApiToken}`,
        }
    },

    getCustomerDetailsUsingDob: {
        endpoint: customerDetailsUsingDOB,
        method: methods.POST,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${thirdPartyApiToken}`,
        }
    },

    getLoanOutstanding: {
        endpoint: loanOutstanding,
        method: methods.POST,
        headers: {
            Authorization: `Bearer ${thirdPartyApiToken}`,
            "Content-Type": "application/json",
        }
    },

    getLoanApplicationStatus: {
        endpoint: loanApplicationStatus,
        method: 'post',
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${thirdPartyApiToken}`,
        }
    },

    getApplyLoanLeadBank: {
        endpoint: applyLoanLeadBank,
        method: methods.POST,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${thirdPartyApiToken}`,
        }
    },

    getCRMToken: {
        endpoint: CRMToken,
        method: methods.POST,
        headers: {
            'Content-type': 'application/json',
            user_name: CRMTokenUsername,
            password: CRMTokenPassword,
            identifier: CRMTokenIdentifier,
        },
    },

    getCRMDetails: {
        endpoint: CRMDetails,
        method: methods.POST,
        headers: {
            "Content-Type": "multipart/form-data",
            identifier: CRMTokenIdentifier,
        },
    },

    getTokenForLetterGeneration: {
        endpoint: tokenForLetterGeneration,
        method: methods.POST,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: authorization,
        },
        data: {
            grant_type: grantTypeLetterGeneration,
        }
    },

    getGeneratedToken: {
        endpoint: generatedToken,
        method: methods.POST,
        headers: {
            "Content-Type": "application/json",
        },
    },

    postEmiPayment: {
        endpoint: postEMIPayment,
        method: methods.POST,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${thirdPartyApiToken}`,
        }
    }
};
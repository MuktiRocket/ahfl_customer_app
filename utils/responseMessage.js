module.exports = {
    crmSuccessMessage: {
        statusCode: 200,
        description: {
            en: "Successfully fetched CRM request details",
            hi: "सफलतापूर्वक प्राप्त किए गए CRM अनुरोध विवरण"
        }
    },

    incorrectMPIN: {
        statusCode: 401,
        description: {
            en: "Incorrect MPIN",
            hi: "अमान्य एमपिन"
        }
    },

    mismatchMPIN: {
        statusCode: 401,
        description: {
            en: "MPIN Mismatch",
            hi: "MPIN मैच नहीं हो रहा है"
        }
    },

    completeTransaction: {
        statusCode: 200,
        description: {
            en: "Your transaction is completed",
            hi: "आपका लेन-देन पूरा हो गया है"
        }
    },
	
	inCompleteTransaction: {
        statusCode: 400,
        description: {
            en: "We’re unable to complete the transaction at the moment.",
            hi: "हम इस समय लेन-देन पूरा करने में असमर्थ हैं।"
        }
    },

    internalServerError: {
        statusCode: 500,
        description: {
            en: "Internal server error",
            hi: "आंतरिक सर्वर त्रुटि"
        }
    },

    errorPdfGeneration: {
        statusCode: 200,
        description: {
            en: "Error in Pdf Generation: PDF data not available",
            hi: "पीडीएफ जनरेशन में त्रुटि: पीडीएफ डेटा उपलब्ध नहीं है"
        }
    }
};

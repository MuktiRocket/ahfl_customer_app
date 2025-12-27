const axios = require("axios");
const letterGeneration = async (req, res, next) => {
    try {
        const apiGeneratedToken = JSON.parse(req.apiToken);
        const access_token = apiGeneratedToken.access_token;
        const requestData = req.body;
        if (!requestData) {
            return res.status(200).json({
                success: false,
                status: 200,
                message: "Invalid payload or missing data",
            });
        }
        let config = {
            method: "post",
            maxBodyLength: Infinity,
            url: "https://ihbuat-tcslsp.tcsapps.com/ihbuat001/ReportGeneration/1.0/LetterGeneration",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${access_token}`,
            },
            data: JSON.stringify(requestData),
            responseType: "arraybuffer",
        };
        axios
            .request(config)
            .then((response) => {
                const pdfData = Buffer.from(response.data, "binary").toString("base64");
                req.pdfGenerated = true;
                req.pdfData = pdfData;
                next();
            })
            .catch((error) => {
                req.pdfGenerated = false;
                next();
            });
    } catch (error) {
        res.status(200).json({
            success: false,
            status: 200,
            message: "Internal Server Error",
        });
    }
};
module.exports = { letterGeneration };
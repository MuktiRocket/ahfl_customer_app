// const generalConfig = require("../configs/generalConfig");
const { logger } = require('../utils/logger');
// const responseSender = require("../../utils/responseSender");
const utils = require('../utils/commonUtils');

const gErrorHandler = (err, req, res, next) => {
    const headers = JSON.parse(JSON.stringify(req.headers));
    const fileArrayOrObject = req.files && req.files.file ? req.files.file : {};
    logger.error(`${req.method} ${req.originalUrl}`, {
        message: err?.message,
        stack: err?.stack,
        method: req.method,
        path: req.originalUrl,
        headers: utils.secureSensitiveFields(headers),
        body: req.body,
        files: Array.isArray(fileArrayOrObject) && fileArrayOrObject.length ? fileArrayOrObject.map(file => ({
            filename: file.name,
            mimetype: file.mimetype
        })) : {
            filename: fileArrayOrObject.name,
            mimetype: fileArrayOrObject.mimetype
        },
        ip: req.ip,
    });

    // For older verison 1.0.1 of mobile app response must be this
    if (err?.status == 401 && req.version <= "1.0.2")
        return res.json(errors.bearerTokenError.statusCode, errors.bearerTokenError.description);

    if (err?.status == 401 && req.version > "1.0.2")
        return res.json(err.status, { success: false, message: err.message });

    if (err?.status && err?.status < 500)
        return res.status(err.status).json({ success: false, message: err.message });

    // For unexpected errors, respond with a generic 500 Internal Server Error
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: err.message,
    });
};

module.exports = gErrorHandler
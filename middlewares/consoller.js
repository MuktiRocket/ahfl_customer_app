const { requestLogger, responseLogger } = require('../utils/logger');
const utils = require('../utils/commonUtils');
const { randomUUID: guid4 } = require('crypto');

const isNotFullResponseRequired = true;
const LOGS_MAX_CHAR = 500;

const middleware = (req, res, next) => {
    const startTime = Date.now();

    // Log the incoming request details
    req.headers['guid'] = guid4();
    const query = JSON.parse(JSON.stringify(req.query));
    const body = JSON.parse(JSON.stringify(req.body));
    const headers = JSON.parse(JSON.stringify(req.headers));
    const fileArrayOrObject = req.files && req.files.file ? req.files.file : {};
    requestLogger.info(`${req.method} ${req.path}`, {
        query: utils.secureSensitiveFields(query),
        body: utils.secureSensitiveFields(body),
        headers: utils.secureSensitiveFields(headers),
        files: Array.isArray(fileArrayOrObject) && fileArrayOrObject.length ? fileArrayOrObject.map(file => ({
            filename: file.name,
            mimetype: file.mimetype
        })) : {
            filename: fileArrayOrObject.name,
            mimetype: fileArrayOrObject.mimetype
        },
        ip: req.ip,
    });

    // Ensure response is logged only once by using 'once'
    res.once('finish', () => {
        const responseTime = Date.now() - startTime;

        // Capture the status code & generated request unique id
        const statusCode = res.statusCode;
        const guid = req.headers['guid'];

        // Log the response details with the response body truncated to 500 characters
        const body = utils.secureSensitiveFields(res.locals.body);
        const truncatedBody = isNotFullResponseRequired && body && typeof body === 'string' && body.length > LOGS_MAX_CHAR ? body.substring(0, LOGS_MAX_CHAR) + '...' : body;
        responseLogger.info(`${req.method} ${req.originalUrl}`, {
            statusCode,
            guid,
            responseTime: utils.formatResponseTime(responseTime),
            responseBody: truncatedBody || 'No body content'
        });
    });

    // Capture the response body into res.locals to log it later
    const originalSend = res.send;
    res.send = function (body) {
        res.locals.body = body;
        return originalSend.apply(this, arguments);
    };

    next();
};

module.exports = middleware;
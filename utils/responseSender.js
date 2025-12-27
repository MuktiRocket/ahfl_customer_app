const responseSender = (res, statusCode, message, successStatus, data) => {
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.status(statusCode).json({
        success: successStatus,
        status: statusCode,
        message: message,
        data: data,
    });
}

module.exports = responseSender
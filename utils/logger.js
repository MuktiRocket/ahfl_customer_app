const { createLogger, format, transports } = require('winston');
const path = require('path');
const DailyRotateFile = require('winston-daily-rotate-file');

const LOG_RETENTION_PERIOD = '14d';
const LOG_FOLDER_PATH = path.join(__dirname, '..', 'logs');

const customTransports = [
    new transports.Console(), // Logs to the console
    new transports.DailyRotateFile({
        level: 'error',
        filename: 'logs/error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        maxFiles: LOG_RETENTION_PERIOD,
        zippedArchive: true,
    }),
    new transports.DailyRotateFile({
        filename: 'logs/combined-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxFiles: LOG_RETENTION_PERIOD,
        zippedArchive: true,
    }),
];

// Create a winston logger instance
const logger = createLogger({
    level: 'info',
    format: format.combine(
        // format.padLevels(),
        format.prettyPrint({ colorize: true }),
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // Add a timestamp
        format.printf(({ timestamp, level, message, ...meta }) => {
            return `\n\n${timestamp} [${level.toUpperCase()}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
        })
    ),
    transports: customTransports,
    exceptionHandlers: [
        new DailyRotateFile({
            filename: path.join(LOG_FOLDER_PATH, 'exceptions-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxFiles: LOG_RETENTION_PERIOD,
            zippedArchive: true,
        })
    ],
    rejectionHandlers: [
        new DailyRotateFile({
            filename: path.join(LOG_FOLDER_PATH, 'rejections-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxFiles: LOG_RETENTION_PERIOD,
            zippedArchive: true,
        })
    ]
});

const requestLogFormat = format.printf(({ timestamp, level, message, ...meta }) => {
    return `\n\n${timestamp} [REQUEST]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
});
const requestLogger = createLogger({
    level: 'info',
    transports: customTransports,
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        requestLogFormat
    )
});

const getEmojiForStatusCode = (statusCode) => {
    switch (statusCode) {
        // 2XX
        case 200: return '😉';
        case 201: return '🎉';
        case 204: return '🤐';

        // 3XX
        case 301: return '🔀';
        case 304: return '😏';

        // 4XX
        case 400: return '❗';
        case 401: return '🔒';
        case 403: return '🚷';
        case 404: return '❓';
        case 422: return '❌';
        case 429: return '🚫';

        // 5XX
        case 500: return '🔥';
        case 502: return '⚡';
        case 503: return '💤';
        case 504: return '⏳';
        default: return '❔';
    }
};

const responseLogFormat = format.printf(({ timestamp, level, message, ...meta }) => {
    const statusCode = meta.statusCode ? meta.statusCode : 500;
    const emoji = getEmojiForStatusCode(statusCode);
    return `\n\n${timestamp} [RESP ${statusCode} ${emoji}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta).replace(/\\/g, '') : ''}`;
});
const responseLogger = createLogger({
    level: 'info',
    transports: customTransports,
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        responseLogFormat
    )
});

module.exports = {
    logger,
    requestLogger,
    responseLogger,
};
const securePassword = (body) => {
    if (body.password)
        body.password = '*********';
    if (body.jwt)
        body.jwt = '**************************************************';
    return body;
}

const secureSensitiveFields = (body) => {
    const isFullSecure = process.env.ENV_NAME == 'prod';

    // If body is a string (like a plain JWT token), just return it
    if (typeof body === 'string') {
        if (body.includes('token') && isFullSecure)
            return body.replace(/"token":\s*"(.*?)"/, '"token": "**************************************************"');
        if (body.includes('jwt'))
            return body.replace(/"jwt":\s*"(.*?)"/, '"jwt": "**************************************************"');
    }

    // If body is an object (JSON), loop over its properties and secure sensitive fields
    const secureObject = (obj) => {
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    secureObject(obj[key]);  // Recursive call for nested objects
                } else if (key === 'password') {
                    obj[key] = '*********';  // Replace password
                } else if (key === 'jwt' || key === 'aadharToken' || key === 'x-api-key') {
                    obj[key] = '**************************************************';
                } else if (isFullSecure && (key === 'authorization' || key === 'token')) {
                    obj[key] = obj[key].substring(0, 17) + '*************************' + obj[key].slice(-10);
                }
            }
        }
        return obj;
    };

    // If body is a JSON object, secure it
    if (typeof body === 'object' && body !== null) {
        return secureObject(body);
    }

    // If body is not an object or string (e.g., null or undefined), return it as is
    return body;
};

const formatResponseTime = (responseTime) => {
    if (responseTime < 1000) {
        return `${responseTime}ms`;
    } else if (responseTime < 60000) {
        return `${(responseTime / 1000).toFixed(2)}s`;
    } else if (responseTime < 3600000) {
        return `${(responseTime / 60000).toFixed(2)}min`;
    } else {
        return `${(responseTime / 3600000).toFixed(2)}hr`;
    }
};

const csvGenerator = (data) => {
    if (!data || data.length === 0) {
        return '';
    }
    const header = Object.keys(data[0]);
    const rows = data.map(row => header.map(field => row[field]).join(','));
    return [header.join(','), ...rows].join('\n');
};

module.exports = {
    securePassword,
    secureSensitiveFields,
    formatResponseTime,
    csvGenerator
};

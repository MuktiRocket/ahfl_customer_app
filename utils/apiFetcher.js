// const http = require('http');
// const https = require('https');

// const apiFetcher = async (options) => {
//     return new Promise((resolve, reject) => {
//         try {
//             const url = new URL(options.url);
//             const isHttps = url.protocol === 'https:';
//             const lib = isHttps ? https : http;

//             const bodyString = (options.data || options.body || '');

//             // Request options
//             const requestOptions = {
//                 hostname: url.hostname,
//                 port: url.port || (isHttps ? 443 : 80),
//                 path: url.pathname + url.search,
//                 method: options.method || 'GET',
//                 headers: {
//                     ...options.headers,
//                     'Content-Length': Buffer.byteLength(bodyString),  // Ensure the Content-Length is correctly set
//                 },
//             };

//             console.log('Request Options:', requestOptions);  // Log request options for debugging
//             console.log('Request Body:', bodyString);  // Log request body

//             const req = lib.request(requestOptions, (res) => {
//                 let responseData = '';

//                 res.on('data', (chunk) => {
//                     responseData += chunk;
//                 });

//                 res.on('end', () => {
//                     try {
//                         const apiResponse = JSON.parse(responseData);
//                         resolve(apiResponse);
//                     } catch (parseError) {
//                         reject(new Error(`Failed to parse response: ${parseError.message}`));
//                     }
//                 });
//             });

//             req.on('error', (error) => {
//                 reject(new Error(`Request failed: ${error.message}`));
//             });

//             // Write the request body only if it's defined and not empty
//             if (bodyString) {
//                 req.write(bodyString);  // Send the body as a string
//             }

//             req.end();  // End the request

//         } catch (error) {
//             reject(new Error(`Invalid request: ${error.message}`));
//         }
//     });
// };

// module.exports = apiFetcher;


const http = require('http');
const https = require('https');
const { HttpsProxyAgent } = require('https-proxy-agent');
const FormData = require('form-data');

const apiFetcher = async (options) => {
    return new Promise((resolve, reject) => {
        try {
            const url = new URL(options.url);
            const isHttps = url.protocol === 'https:';
            const lib = isHttps ? https : http;

            let body;
            let isFormData = false;

            // Check if the data is an instance of FormData
            if (options.data instanceof FormData) {
                body = options.data;
                isFormData = true;
            } else if (typeof options.data === 'object') {
                // If data is a JSON object, stringify it
                body = JSON.stringify(options.data);
            } else {
                // If data is already a string, pass it as is
                body = options.data || '';
            }

            // Proxy configuration (optional based on `useReverseProxy` flag)
            let agent;
            //if (options.useReverseProxy) {
                const proxy = options.proxy || 'http://10.130.1.1:8080';
                agent = new HttpsProxyAgent(proxy);
            //}

            // Request options
            const requestOptions = {
                hostname: url.hostname,
                port: url.port || (isHttps ? 443 : 80),
                path: url.pathname + url.search,
                method: options.method || 'GET',
                headers: {
                    ...options.headers,
                },
                agent, // Add proxy agent conditionally
            };

            // If FormData, append the correct headers from FormData itself
            if (isFormData) {
                requestOptions.headers = {
                    ...requestOptions.headers,
                    ...body.getHeaders(),  // Get headers from FormData (includes Content-Type with boundary)
                };
            } else if (body && typeof body === 'string') {
                // Add Content-Length header for non-FormData requests
                requestOptions.headers['Content-Length'] = Buffer.byteLength(body);
            }

            // console.log('Request Options:', requestOptions);
            // console.log('Request Body:', body);

            const req = lib.request(requestOptions, (res) => {
                let responseData = '';

                res.on('data', (chunk) => {
                    responseData += chunk;
                });

                res.on('end', () => {
                    try {
                        const apiResponse = JSON.parse(responseData);
                        resolve(apiResponse);
                    } catch (parseError) {
                        // reject(new Error(`Failed to parse response: ${parseError.message}`));
                        throw parseError.response?.data?.error || parseError.response;
                    }
                });
            });

            req.on('error', (error) => {
                // reject(new Error(`Request failed: ${error.message}`));
                throw error.response?.data?.error || error.response;
            });

            // Write the form data or JSON body
            if (isFormData) {
                body.pipe(req);  // Pipe the FormData into the request
            } else if (body) {
                req.write(body);  // Send the JSON or string body
            }

            req.end();  // End the request

        } catch (error) {
            // reject(new Error(`Invalid request: ${error.message}`));
			console.log('Error Message', error.message);
            throw error.response?.data?.error || error.response;
        }
    });
};

module.exports = apiFetcher;




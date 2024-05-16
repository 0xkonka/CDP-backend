import { TOO_MANY_CODE, TOO_MANY_MSG } from "../utils/response.js";

const requestStore = new Map();

const generateKey = (req) => {
    const method = req.method;
    const url = req.originalUrl.split('?')[0]; // Endpoint without query string
    const params = JSON.stringify(req.query); // Query parameters
    const body = JSON.stringify(req.body); // Request body

    return `${method}-${url}-${params}-${body}`;
};

export function rateLimitMiddleware (req, res, next) {
    // const key = generateKey(req);
    const key = `${req.method}-${req.originalUrl}-${req.body.inviteCode}`
    const now = Date.now();

    if (requestStore.has(key)) {
        const lastRequestTime = requestStore.get(key);
        if (now - lastRequestTime < 60000) {
            return res.status(TOO_MANY_CODE).send({result: false, messages: TOO_MANY_MSG});
        }
    }

    requestStore.set(key, now);

    // Clean up the store after the timeout period
    setTimeout(() => {
        requestStore.delete(key);
    }, 5000);

    next();
};
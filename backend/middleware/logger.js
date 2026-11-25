
const logger = (req, res, next) => {
    console.log("Request received!");
    console.log("Method:", req.method);
    console.log("URL:", req.originalUrl);

    next();
};

export default logger;

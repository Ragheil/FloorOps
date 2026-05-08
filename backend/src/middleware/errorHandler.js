export const errorHandler = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || "Something went wrong.";

  res.status(statusCode).json({
    message,
    details: error.details || null,
  });
};

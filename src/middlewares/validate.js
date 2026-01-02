/**
 * Joi validation middleware wrapper
 * @param {Joi.Schema} schema - Joi schema to validate against
 * @param {string} property - Request property to validate (body, query, params)
 */
const validateBody = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/"/g, '')
      }));

      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        details
      });
    }

    // Replace request property with validated and sanitized value
    req[property] = value;
    next();
  };
};

/**
 * Validate request query parameters
 */
const validateQuery = (schema) => validateBody(schema, 'query');

/**
 * Validate request URL parameters
 */
const validateParams = (schema) => validateBody(schema, 'params');

export { validateBody, validateQuery, validateParams };

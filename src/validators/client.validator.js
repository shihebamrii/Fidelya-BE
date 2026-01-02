import Joi from 'joi';

const createClientSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name cannot exceed 100 characters',
      'any.required': 'Name is required'
    }),
  phone: Joi.string()
    .trim()
    .pattern(/^[+]?[\d\s-]{8,20}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Please provide a valid phone number'
    }),
  email: Joi.string()
    .email()
    .optional()
    .messages({
      'string.email': 'Please provide a valid email address'
    }),
  initialPoints: Joi.number()
    .integer()
    .min(0)
    .default(0)
    .messages({
      'number.min': 'Initial points cannot be negative'
    }),
  metadata: Joi.object()
    .optional()
});

const pointsOperationSchema = Joi.object({
  itemId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid item ID format',
      'any.required': 'Item ID is required'
    }),
  note: Joi.string()
    .trim()
    .max(500)
    .optional()
});

const manualPointsSchema = Joi.object({
  pointsChange: Joi.number()
    .integer()
    .required()
    .messages({
      'any.required': 'Points change is required',
      'number.base': 'Points change must be a number'
    }),
  note: Joi.string()
    .trim()
    .max(500)
    .optional()
});

const searchClientSchema = Joi.object({
  q: Joi.string()
    .trim()
    .allow('')
    .max(100)
    .optional(),
  page: Joi.number()
    .integer()
    .min(1)
    .default(1),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
});

export {
  createClientSchema,
  pointsOperationSchema,
  manualPointsSchema,
  searchClientSchema
};

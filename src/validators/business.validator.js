import Joi from 'joi';

const createBusinessSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Business name must be at least 2 characters',
      'string.max': 'Business name cannot exceed 100 characters',
      'any.required': 'Business name is required'
    }),
  category: Joi.string()
    .trim()
    .max(50)
    .optional(),
  city: Joi.string()
    .trim()
    .max(50)
    .optional(),
  region: Joi.string()
    .trim()
    .max(50)
    .optional(),
  contactEmail: Joi.string()
    .email()
    .optional()
    .messages({
      'string.email': 'Please provide a valid contact email'
    }),
  logoUrl: Joi.string()
    .uri()
    .optional()
    .messages({
      'string.uri': 'Logo URL must be a valid URL'
    }),
  allowNegativePoints: Joi.boolean()
    .default(false)
});

const updateBusinessSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .optional(),
  category: Joi.string()
    .trim()
    .max(50)
    .optional(),
  city: Joi.string()
    .trim()
    .max(50)
    .optional(),
  region: Joi.string()
    .trim()
    .max(50)
    .optional(),
  contactEmail: Joi.string()
    .email()
    .optional(),
  logoUrl: Joi.string()
    .uri()
    .optional()
    .allow('', null),
  allowNegativePoints: Joi.boolean()
    .optional()
}).min(1).messages({
  'object.min': 'At least one field is required to update'
});

const searchBusinessSchema = Joi.object({
  q: Joi.string()
    .trim()
    .max(100)
    .allow('')
    .optional(),
  city: Joi.string()
    .trim()
    .max(50)
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

export { createBusinessSchema, updateBusinessSchema, searchBusinessSchema };

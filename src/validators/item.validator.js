import Joi from 'joi';

const createItemSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Item name must be at least 2 characters',
      'string.max': 'Item name cannot exceed 100 characters',
      'any.required': 'Item name is required'
    }),
  description: Joi.string()
    .trim()
    .max(500)
    .allow('')
    .optional(),
  points: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.min': 'Points must be at least 1',
      'any.required': 'Points value is required'
    }),
  type: Joi.string()
    .valid('earn', 'redeem')
    .required()
    .messages({
      'any.only': 'Type must be either earn or redeem',
      'any.required': 'Item type is required'
    }),
  visibleToClient: Joi.boolean()
    .default(true)
});

const updateItemSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .optional(),
  description: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('', null),
  points: Joi.number()
    .integer()
    .min(1)
    .optional(),
  type: Joi.string()
    .valid('earn', 'redeem')
    .optional(),
  visibleToClient: Joi.boolean()
    .optional()
}).min(1).messages({
  'object.min': 'At least one field is required to update'
});

export { createItemSchema, updateItemSchema };

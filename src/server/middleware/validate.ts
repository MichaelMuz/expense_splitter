/**
 * Validation middleware using Zod schemas
 */

import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { ZodError } from 'zod';

const zodValidatorFactory = <K extends keyof Request>(propName: K, mainErrorMessage: string) => (
  (schema: ZodSchema) => (
    (req: Request, res: Response, next: NextFunction): void => {
      try {
        const validated = schema.parse(req[propName]);
        req[propName] = validated;
        next();
      } catch (error) {
        if (error instanceof ZodError) {
          res.status(400).json({
            error: mainErrorMessage,
            details: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message,
            }))
          });
        } else {
          next(error);
        }
      }
    })
);

/**
 * Middleware factory to validate request body against a Zod schema
 * @param schema - Zod schema to validate against
 */
export const validateBody = zodValidatorFactory('body', 'Invalid request body');

/**
 * Middleware factory to validate request params against a Zod schema
 * @param schema - Zod schema to validate against
 */
export const validateParams = zodValidatorFactory('params', 'Invalid parameters');

/**
 * Middleware factory to validate request query against a Zod schema
 * @param schema - Zod schema to validate against
 */
export const validateQuery = zodValidatorFactory('query', 'Invalid query parameters');

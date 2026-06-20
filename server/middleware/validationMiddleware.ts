import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { BadRequestError } from "../utils/errors";

export function validate(schema: z.ZodTypeAny) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const zodError = error as z.ZodError<any>;
        // Collect formatted error messages
        const errorMessages = zodError.issues
          .map((err: z.ZodIssue) => {
            // Strip out "body." prefix for cleaner client responses
            const path = err.path.join(".");
            const cleanPath = path.startsWith("body.") ? path.substring(5) : path;
            return `${cleanPath}: ${err.message}`;
          })
          .join("; ");
        next(new BadRequestError(errorMessages));
      } else {
        next(error);
      }
    }
  };
}


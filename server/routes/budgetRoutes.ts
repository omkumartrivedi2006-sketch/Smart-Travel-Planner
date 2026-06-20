import { Router } from "express";
import { calculateBudget } from "../controllers/budgetController";
import { validate } from "../middleware/validationMiddleware";
import { calculateBudgetSchema } from "../validation/tripValidation";

const router = Router();

// Standalone budget calculator (available to all users)
router.post("/calculate", validate(calculateBudgetSchema), calculateBudget);

export default router;

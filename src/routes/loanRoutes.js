
import { Router } from "express";
import { LoanController } from "../controllers/loanController.js";

const router = Router();

router.get("/", LoanController.getAll);
router.get("/:id", LoanController.getById);
router.post("/", LoanController.create);
router.put("/:id", LoanController.update);
router.delete("/", LoanController.removeAll);
router.delete("/:id", LoanController.remove);
router.post("/:id/return", LoanController.returnBook);

export default router;

import express from "express";
import { addNewsletter, getNewsletter } from "../controllers/newsletterController.js";


const router = express.Router();

// POST /api/newsletter
router.post("/addnewsletter", addNewsletter);

// GET /api/newsletter
router.get("/emails", getNewsletter);

export default router;
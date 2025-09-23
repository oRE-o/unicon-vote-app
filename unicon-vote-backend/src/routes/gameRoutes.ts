// src/routes/gameRoutes.ts
import express, { Request, Response, Router } from "express";
import Game from "../models/gameModel";
import User from "../models/userModel";
import { authMiddleware } from "../middleware/authMiddleware"; // 1. 인증 미들웨어 import

const router: Router = express.Router();

// GET /api/games : 모든 게임 목록 조회 (인증 불필요)
router.get("/", async (req: Request, res: Response) => {
  try {
    const games = await Game.find({});
    res.status(200).json(games);
  } catch (error) {
    res.status(500).json({ message: "게임 목록 조회 중 오류 발생" });
  }
});

export default router;

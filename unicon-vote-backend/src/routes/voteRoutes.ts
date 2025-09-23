import express, { Request, Response, Router } from "express";
import Vote from "../models/voteModel";
import User from "../models/userModel"; // User 모델 import
import Game from "../models/gameModel"; // Game 모델 import
import { authMiddleware } from "../middleware/authMiddleware";

const router: Router = express.Router();
router.use(authMiddleware); // 모든 투표 API는 로그인이 필요

// GET /api/votes/my-votes : 현재 사용자의 모든 투표 내역 조회
router.get("/my-votes", async (req: Request, res: Response) => {
  try {
    const votes = await Vote.find({ user: req.user!._id });
    res.status(200).json(votes);
  } catch (error) {
    res.status(500).json({ message: "투표 내역 조회 중 오류 발생" });
  }
});

// POST /api/votes : 새 투표 생성 (메달 주기)
router.post("/", async (req: Request, res: Response) => {
  try {
    const { gameId, criterion, medal } = req.body;
    const userId = req.user!._id;

    const [user, game] = await Promise.all([
      User.findById(userId),
      Game.findById(gameId),
    ]);

    if (!user || !game) {
      return res
        .status(404)
        .json({ message: "사용자 또는 게임을 찾을 수 없습니다." });
    }

    // 사용자가 동아리에 소속되어 있고, 그 동아리가 게임을 만든 동아리와 같다면
    if (user.club && user.club === game.club) {
      return res.status(403).json({
        message: "자신이 소속된 동아리의 작품에는 투표할 수 없습니다.",
      });
    }

    // 이 Vote를 생성하면 규칙에 위배되는지 서버에서 한번 더 확인
    const newVote = new Vote({
      user: userId,
      game: gameId,
      criterion,
      medal,
    });

    await newVote.save(); // save() 시도 시, 모델에 설정한 index 규칙에 위배되면 자동으로 에러 발생
    res.status(201).json(newVote);
  } catch (error: any) {
    // unique index 제약 조건 위반 시 발생하는 에러 코드(11000)
    if (error.code === 11000) {
      return res.status(409).json({
        message:
          "규칙에 위배되는 투표입니다. (이미 사용한 메달이거나, 해당 게임에 이미 다른 메달을 줌)",
      });
    }
    res.status(500).json({ message: "투표 처리 중 오류 발생" });
  }
});

// DELETE /api/votes : 투표 취소
router.delete("/", async (req: Request, res: Response) => {
  try {
    const { gameId, criterion } = req.body;
    const userId = req.user!._id;

    await Vote.deleteOne({ user: userId, game: gameId, criterion });
    res.status(200).json({ message: "투표가 취소되었습니다." });
  } catch (error) {
    res.status(500).json({ message: "투표 취소 중 오류 발생" });
  }
});

export default router;

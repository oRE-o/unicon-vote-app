import express, { Request, Response, Router } from "express";
import { v4 as uuidv4 } from "uuid";
import User from "../models/userModel.js";
import Game from "../models/gameModel.js"; // Game 모델 import
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js"; // 관리자 미들웨어 import

const router: Router = express.Router();

// 이 라우터의 모든 경로에 두 개의 미들웨어를 순서대로 적용
router.use(authMiddleware, adminMiddleware);

// --- 사용자 관리 ---
// GET /api/admin/users : 모든 사용자 목록 조회
router.get("/users", async (req: Request, res: Response) => {
  const users = await User.find({}).select("-password"); // 비밀번호 제외하고 조회
  res.status(200).json(users);
});

// POST /api/admin/users : 새 사용자 생성 (기존 create-user API와 동일)
router.post("/users", async (req: Request, res: Response) => {
  // --- 👇 수정된 부분 ---
  const { name, role, club } = req.body;
  if (!name) {
    return res.status(400).json({ message: "사용자 이름이 필요합니다." });
  }

  const newUserPayload: any = {
    name,
    uuid: uuidv4(),
    role: role || "guest", // role이 없으면 guest로 기본값 설정
  };

  if (club) {
    newUserPayload.club = club;
  }

  const newUser = new User(newUserPayload);
  await newUser.save();
  res.status(201).json(newUser);
});

// --- 게임 관리 ---
// POST /api/admin/games : 새 게임 추가
router.post("/games", async (req: Request, res: Response) => {
  const { name, description, imageUrl } = req.body;
  const newGame = new Game({ name, description, imageUrl });
  await newGame.save();
  res.status(201).json(newGame);
});

// DELETE /api/admin/games/:id : 특정 게임 삭제
router.delete("/games/:id", async (req: Request, res: Response) => {
  await Game.findByIdAndDelete(req.params.id);
  res.status(200).json({ message: "게임이 성공적으로 삭제되었습니다." });
});

// PATCH /api/admin/users/:uuid/reset-password : 사용자 비밀번호 초기화
router.patch("/:uuid/reset-password", async (req: Request, res: Response) => {
  try {
    // $unset 연산자로 password 필드를 문서에서 완전히 제거
    const result = await User.updateOne(
      { uuid: req.params.uuid },
      { $unset: { password: "" } }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }
    res.status(200).json({ message: "사용자 비밀번호가 초기화되었습니다." });
  } catch (error) {
    res.status(500).json({ message: "비밀번호 초기화 중 오류 발생" });
  }
});

router.delete("/:uuid", async (req: Request, res: Response) => {
  try {
    const result = await User.findOneAndDelete({ uuid: req.params.uuid });
    if (!result) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }
    res.status(200).json({ message: "사용자가 삭제되었습니다." });
  } catch (error) {
    res.status(500).json({ message: "사용자 삭제 중 오류 발생" });
  }
});

export default router;

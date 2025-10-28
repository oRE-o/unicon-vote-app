import express, { Request, Response, Router } from "express";
import { v4 as uuidv4 } from "uuid";
import User from "../models/userModel.js";
import Game from "../models/gameModel.js"; // Game 모델 import
import Vote from "../models/voteModel.js"; // Game 모델 import
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
  const { name, description, imageUrl, category, developers } = req.body;
  if (!name || !developers || !category) {
    // 필수 필드에 category 추가
    return res
      .status(400)
      .json({ message: "게임 이름, 개발자 목록, 카테고리는 필수입니다." });
  }
  const developersArray = Array.isArray(developers)
    ? developers
    : developers
        .split(",")
        .map((dev: string) => dev.trim())
        .filter((dev: string) => dev);

  const newGame = new Game({
    name,
    description,
    imageUrl,
    developers: developersArray,
    category, // 모델에 전달
  });
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

router.get("/votes/results", async (req: Request, res: Response) => {
  try {
    // 1. 모든 게임 정보 가져오기 (이름, 카테고리 등)
    const games = (await Game.find({})) as any[];
    // 2. 모든 투표 정보 가져오기
    const votes = await Vote.find({});

    // 3. 게임별 점수 집계용 객체 초기화
    const results: Record<string, any> = {};
    games.forEach((game) => {
      results[game._id.toString()] = {
        gameName: game.name,
        category: game.category,
        impressive: { gold: 0, silver: 0, bronze: 0, score: 0 },
        fun: { gold: 0, silver: 0, bronze: 0, score: 0 },
        original: { gold: 0, silver: 0, bronze: 0, score: 0 },
        polished: { gold: 0, silver: 0, bronze: 0, score: 0 },
        totalScore: 0,
      };
    });

    // 4. 투표 데이터 순회하며 점수 계산 (금: 3점, 은: 2점, 동: 1점)
    votes.forEach((vote) => {
      const gameId = vote.game.toString();
      if (results[gameId] && results[gameId][vote.criterion]) {
        results[gameId][vote.criterion][vote.medal]++; // 메달 개수 증가
        let scoreToAdd = 0;
        if (vote.medal === "gold") scoreToAdd = 3;
        else if (vote.medal === "silver") scoreToAdd = 2;
        else if (vote.medal === "bronze") scoreToAdd = 1;

        results[gameId][vote.criterion].score += scoreToAdd; // 부문 점수 합산
        results[gameId].totalScore += scoreToAdd; // 총점 합산
      }
    });

    // 5. 집계 결과를 배열 형태로 변환하여 반환
    const finalResults = Object.values(results);
    res.status(200).json(finalResults);
  } catch (error) {
    console.error("투표 결과 집계 실패:", error);
    res.status(500).json({ message: "투표 결과 집계 중 오류 발생" });
  }
});
router.get("/votes/by-user", async (req: Request, res: Response) => {
  try {
    // 1. 모든 투표를 가져오면서, user와 game 정보를 함께 불러옵니다 (populate).
    const votes = await Vote.find({})
      .populate<{ user: typeof User.prototype }>("user", "name club") // user 컬렉션에서 name과 club만 가져옴
      .populate<{ game: typeof Game.prototype }>("game", "name"); // game 컬렉션에서 name만 가져옴

    // 2. 결과를 가공하여 필요한 정보만 추출
    const results = votes.map((vote) => {
      // populate된 user/game 정보가 없을 경우 대비 (데이터 정합성 문제)
      const userName = vote.user ? vote.user.name : "알 수 없는 사용자";
      const userClub = vote.user ? vote.user.club || "외부인" : "알 수 없음";
      const gameName = vote.game ? vote.game.name : "알 수 없는 게임";

      return {
        userName: userName,
        userClub: userClub,
        gameName: gameName,
        criterion: vote.criterion,
        medal: vote.medal,
      };
    });

    res.status(200).json(results);
  } catch (error) {
    console.error("사용자별 투표 내역 조회 실패:", error);
    res.status(500).json({ message: "사용자별 투표 내역 조회 중 오류 발생" });
  }
});
export default router;

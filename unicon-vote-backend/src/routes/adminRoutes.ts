import express, { Request, Response, Router } from "express";
import { v4 as uuidv4 } from "uuid";
import User, { IUser } from "../models/userModel.js";
import Game, { IGame } from "../models/gameModel.js"; // Game 모델 import
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
    // --- 👇 💖 2. 여기에 타입을 짠! 하고 명시해줘요! 💖 ---
    const games: IGame[] = await Game.find({});
    const votes = await Vote.find({});

    const results: Record<string, any> = {};
    games.forEach((game) => {
      // 💖 이제 game._id가 'unknown'이 아니에요!
      results[String(game._id)] = {
        gameName: game.name,
        category: game.category,
        impressive: { gold: 0, silver: 0, bronze: 0, score: 0 },
        fun: { gold: 0, silver: 0, bronze: 0, score: 0 },
        original: { gold: 0, silver: 0, bronze: 0, score: 0 },
        polished: { gold: 0, silver: 0, bronze: 0, score: 0 },
        totalScore: 0,
      };
    });

    // (점수 계산 로직은 동일)
    votes.forEach((vote) => {
      const gameId = vote.game.toString();
      if (results[gameId] && results[gameId][vote.criterion]) {
        results[gameId][vote.criterion][vote.medal]++;
        let scoreToAdd = 0;
        if (vote.medal === "gold") scoreToAdd = 3;
        else if (vote.medal === "silver") scoreToAdd = 2;
        else if (vote.medal === "bronze") scoreToAdd = 1;

        results[gameId][vote.criterion].score += scoreToAdd;
        results[gameId].totalScore += scoreToAdd;
      }
    });

    const finalResults = Object.values(results);
    res.status(200).json(finalResults);
  } catch (error) {
    console.error("투표 결과 집계 실패:", error);
    res.status(500).json({ message: "투표 결과 집계 중 오류 발생" });
  }
});

router.get("/votes/by-user", async (req: Request, res: Response) => {
  try {
    const votes = await Vote.find({});
    // --- 👇 💖 3. 여기도 타입을 짠! 하고 명시해줘요! 💖 ---
    const users: IUser[] = await User.find({});
    const games: IGame[] = await Game.find({});

    // 💖 이제 u._id 와 g._id 가 'unknown'이 아니에요!
    const userMap = new Map(
      users.map((u: IUser & { _id: any }) => [u._id.toString(), { name: u.name, club: u.club }])
    );
    const gameMap = new Map(
      games.map((g) => [
        (g._id as string).toString(),
        { name: g.name, developers: g.developers },
      ])
    );

    // (데이터 조합 로직은 동일)
    const finalResults = votes
      .map((vote) => {
        const user = userMap.get(vote.user.toString());
        const game = gameMap.get(vote.game.toString());

        if (!user || !game) {
          return null;
        }

        let isOwnClubVote = false;
        if (user.club) {
          const gameClubs = game.developers.map((dev) => dev.split("_")[0]);

          if (gameClubs.includes(user.club)) {
            isOwnClubVote = true;
          }
        }

        return {
          userName: user.name,
          userClub: user.club || "N/A",
          gameName: game.name,
          criterion: vote.criterion,
          medal: vote.medal,
          isOwnClubVote: isOwnClubVote,
        };
      })
      .filter(Boolean);

    res.status(200).json(finalResults);
  } catch (error) {
    console.error("사용자별 투표 내역 집계 실패:", error);
    res.status(500).json({ message: "사용자별 투표 내역 집계 중 오류 발생" });
  }
});

export default router;

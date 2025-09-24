// src/routes/authRoutes.ts
import express, { Request, Response, Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const router: Router = express.Router();

// --- 1. 사용자가 QR코드로 처음 접속했을 때 상태 확인 ---
// GET: /api/auth/status/:uuid
router.get("/status/:uuid", async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;
    const user = await User.findOne({ uuid });

    if (!user) {
      return res.status(404).json({ message: "존재하지 않는 사용자입니다." });
    }

    // 비밀번호 존재 여부로 첫 접속인지 판별
    const isFirstAccess = !user.password;

    res.status(200).json({
      uuid: user.uuid,
      name: user.name,
      club: user.club,
      role: user.role,
      isFirstAccess, // 프론트엔드는 이 값으로 회원가입/로그인 페이지를 결정
    });
  } catch (error) {
    res.status(500).json({ message: "서버 오류", error });
  }
});

// --- 2. 첫 접속 시 비밀번호 설정 (회원가입) ---
// POST: /api/auth/register
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { uuid, name, password } = req.body;
    const user = await User.findOne({ uuid });

    if (!user) {
      return res.status(404).json({ message: "존재하지 않는 사용자입니다." });
    }

    // 역할이 'guest'이고, 요청에 새로운 이름이 포함되어 있으면 이름을 변경
    if (user.role === "guest" && name) {
      user.name = name.trim();
    }

    if (user.password) {
      return res
        .status(400)
        .json({ message: "이미 비밀번호가 설정된 계정입니다." });
    }

    // 비밀번호 암호화
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;
    await user.save();

    res.status(201).json({
      message: "비밀번호가 성공적으로 설정되었습니다. 다시 로그인해주세요.",
    });
  } catch (error) {
    res.status(500).json({ message: "서버 오류", error });
  }
});

// --- 3. 이후 접속 시 로그인 처리 ---
// POST: /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { uuid, password } = req.body;
    const user = await User.findOne({ uuid });

    if (!user || !user.password) {
      return res.status(401).json({
        message: "계정이 존재하지 않거나 비밀번호가 설정되지 않았습니다.",
      });
    }

    // 암호화된 비밀번호 비교
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });
    }

    // 로그인 성공: JWT 생성
    const payload = {
      _id: user._id,
      uuid: user.uuid,
      name: user.name,
      role: user.role,
      club: user.club,
    };
    const secret = process.env.JWT_SECRET || "fallback-secret-key";
    const token = jwt.sign(payload, secret, { expiresIn: "1h" }); // 1시간 유효 토큰

    // 생성된 토큰을 쿠키나 응답 본문에 담아 전달
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
    res.status(200).json({ message: "로그인 성공", token });
  } catch (error) {
    res.status(500).json({ message: "서버 오류", error });
  }
});

export default router;

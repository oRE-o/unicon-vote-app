// src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Express의 Request 타입에 user 속성을 추가하기 위한 트릭
declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: string;
        uuid: string;
        name: string;
      };
    }
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Authorization 헤더에서 'Bearer 토큰' 추출
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "인증 토큰이 필요합니다." });
  }

  const token = authHeader.split(" ")[1];
  const secret = process.env.JWT_SECRET || "fallback-secret-key";

  try {
    // 토큰 검증 및 디코딩
    const decoded = jwt.verify(token, secret);
    req.user = decoded as { _id: string; uuid: string; name: string }; // 요청 객체에 사용자 정보 주입
    next(); // 다음 미들웨어 또는 라우터 핸들러로 제어 전달
  } catch (error) {
    return res.status(401).json({ message: "유효하지 않은 토큰입니다." });
  }
};

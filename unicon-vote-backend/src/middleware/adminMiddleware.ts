import { Request, Response, NextFunction } from "express";
import User from "../models/userModel.js";

export const adminMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // authMiddleware를 통과하며 req.user에 담긴 uuid 사용
    const user = await User.findOne({ uuid: req.user!.uuid });

    if (user && user.role === "admin") {
      next(); // 관리자가 맞으면 다음 단계로 진행
    } else {
      // 관리자가 아니면 403 Forbidden 에러 반환
      res
        .status(403)
        .json({ message: "접근 권한이 없습니다. 관리자만 접근 가능합니다." });
    }
  } catch (error) {
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

import express, { Express } from "express";
import mongoose from "mongoose";
import cors, { CorsOptions } from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";

import Game from "./models/gameModel.js";
import User from "./models/userModel.js";

import gameRoutes from "./routes/gameRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import voteRoutes from "./routes/voteRoutes.js";

dotenv.config();

const demoUsers = [
  {
    name: "김메이커",
    uuid: "11111111-aaaa-1111-aaaa-111111111111",
    role: "user" as const,
    club: "GameMakers",
  },
  {
    name: "이개발",
    uuid: "22222222-bbbb-2222-bbbb-222222222222",
    role: "user" as const,
    club: "DevSisters",
  },
  {
    name: "박기획",
    uuid: "33333333-cccc-3333-cccc-333333333333",
    role: "user" as const,
    club: "Project.P",
  },
  {
    name: "최아트",
    uuid: "44444444-dddd-4444-dddd-444444444444",
    role: "user" as const,
    club: "ArtStation",
  },
  {
    name: "무기명-01",
    uuid: "55555555-eeee-5555-eeee-555555555555",
    role: "guest" as const,
  },
  {
    name: "무기명-02",
    uuid: "66666666-ffff-6666-ffff-666666666666",
    role: "guest" as const,
  },
  {
    name: "무기명-03",
    uuid: "77777777-7777-7777-7777-777777777777",
    role: "guest" as const,
  },
  {
    name: "방문객-테스트",
    uuid: "88888888-8888-8888-8888-888888888888",
    role: "guest" as const,
  },
];

const demoGames = [
  {
    name: "사이버펑크 2077",
    description: "미래 도시 나이트 시티를 탐험하는 오픈월드 액션 RPG 데모입니다.",
    imageUrl: "https://placehold.co/600x400/1f2937/ffffff?text=Cyberpunk+2077",
    developers: ["CDPR_홍길동"],
    category: "Challenger" as const,
  },
  {
    name: "엘든 링",
    description: "광활한 세계와 거대한 보스를 중심으로 한 판타지 액션 RPG 데모입니다.",
    imageUrl: "https://placehold.co/600x400/334155/ffffff?text=Elden+Ring",
    developers: ["FromSoftware_김소울"],
    category: "Challenger" as const,
  },
  {
    name: "루키 스타듀",
    description: "농장 경영과 마을 교류를 가볍게 체험할 수 있는 루키 부문 샘플입니다.",
    imageUrl: "https://placehold.co/600x400/166534/ffffff?text=Rookie+Farm",
    developers: ["GameMakers_김메이커"],
    category: "Rookie" as const,
  },
  {
    name: "하데스 챌린지",
    description: "빠른 전투와 반복 도전을 중심으로 만든 챌린저 부문 샘플입니다.",
    imageUrl: "https://placehold.co/600x400/7f1d1d/ffffff?text=Hades+Challenge",
    developers: ["DevSisters_이개발"],
    category: "Challenger" as const,
  },
  {
    name: "기획자의 미궁",
    description: "상황 판단과 분기 선택이 중요한 텍스트 어드벤처 샘플입니다.",
    imageUrl: "https://placehold.co/600x400/581c87/ffffff?text=Project+Maze",
    developers: ["Project.P_박기획"],
    category: "Rookie" as const,
  },
  {
    name: "아트 오디세이",
    description: "색감과 연출 중심으로 만든 액션 퍼즐 샘플입니다.",
    imageUrl: "https://placehold.co/600x400/9a3412/ffffff?text=Art+Odyssey",
    developers: ["ArtStation_최아트"],
    category: "Challenger" as const,
  },
];

const seedDatabase = async () => {
  try {
    const adminExists = await User.findOne({ uuid: process.env.ADMIN_UUID });
    const shouldSeedSampleData = process.env.SEED_SAMPLE_DATA === "true";

    if (adminExists) {
      console.log("🌱 관리자 계정이 이미 존재하여 시딩을 건너뜁니다.");
      return;
    }

    console.log("🌱 초기 관리자 계정을 생성합니다...");

    const adminPassword = process.env.ADMIN_PASSWORD || "admin1234";
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    await User.create({
      name: "관리자",
      uuid: process.env.ADMIN_UUID,
      password: hashedPassword,
      role: "admin",
      club: "UNICON_STAFF",
    });

    if (!shouldSeedSampleData) {
      console.log(
        "🌱 SEED_SAMPLE_DATA=false 이므로 관리자만 생성하고 샘플 데이터는 넣지 않습니다."
      );
      return;
    }

    console.log("🌱 로컬/데모용 샘플 사용자와 게임 데이터를 생성합니다...");

    await User.insertMany(demoUsers);
    await Game.insertMany(demoGames);

    console.log("🌱 데모 데이터 시딩이 성공적으로 완료되었습니다.");
  } catch (error) {
    console.error("❌ 데이터 시딩 중 오류가 발생했습니다:", error);
  }
};

const app: Express = express();
const whitelist = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  const isMongoConnected = mongoose.connection.readyState === 1;

  res.status(isMongoConnected ? 200 : 503).json({
    status: isMongoConnected ? "ok" : "degraded",
    mongo: isMongoConnected ? "connected" : "disconnected",
  });
});

const MONGO_URI: string = process.env.MONGO_URI || "";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB에 성공적으로 연결되었습니다.");
    void seedDatabase();
  })
  .catch((err) => console.error("❌ MongoDB 연결 실패:", err));

app.use("/api/games", gameRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/votes", voteRoutes);

const PORT: number = parseInt(process.env.PORT || "5001", 10);

app.listen(PORT, () => {
  console.log(`🚀 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});

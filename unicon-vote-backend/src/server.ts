import express, { Express } from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs"; // 비밀번호 해싱을 위해 import

// 모델 import
import Game from "./models/gameModel";
import User from "./models/userModel";

// 라우트 import
import gameRoutes from "./routes/gameRoutes";
import adminRoutes from "./routes/adminRoutes";
import authRoutes from "./routes/authRoutes";
import voteRoutes from "./routes/voteRoutes";

dotenv.config();

const seedDatabase = async () => {
  try {
    // .env 파일에 정의된 관리자 UUID로 이미 관리자가 존재하는지 확인
    const adminExists = await User.findOne({ uuid: process.env.ADMIN_UUID });

    // 관리자가 이미 존재하면, 시딩을 건너뜀 (서버 재시작 시 중복 생성 방지)
    if (adminExists) {
      console.log("🌱 기본 데이터가 이미 존재하여 시딩을 건너뜁니다.");
      return;
    }

    console.log("🌱 기본 데이터가 없습니다. 데이터 시딩을 시작합니다...");

    // 1. 관리자 계정 생성
    const adminPassword = process.env.ADMIN_PASSWORD || "admin1234";
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    await User.create({
      name: "관리자",
      uuid: process.env.ADMIN_UUID,
      password: hashedPassword,
      role: "admin",
      club: "UNICON_STAFF", // 관리자 그룹
    });

    // --- 2. 동아리 소속 사용자 및 Guest 사용자 계정 생성 ---
    await User.insertMany([
      {
        name: "김메이커",
        uuid: "11111111-aaaa-1111-aaaa-111111111111",
        role: "user",
        club: "GameMakers",
      },
      {
        name: "이개발",
        uuid: "22222222-bbbb-2222-bbbb-222222222222",
        role: "user",
        club: "DevSisters",
      },
      {
        name: "박기획",
        uuid: "33333333-cccc-3333-cccc-333333333333",
        role: "user",
        club: "Project.P",
      },
      {
        name: "최아트",
        uuid: "44444444-dddd-4444-dddd-444444444444",
        role: "user",
        club: "ArtStation",
      },
      {
        name: "나관람",
        uuid: "55555555-eeee-5555-eeee-555555555555",
        role: "guest",
      }, // club 없음
      {
        name: "방문객",
        uuid: "66666666-ffff-6666-ffff-666666666666",
        role: "guest",
      }, // club 없음
    ]);

    // --- 3. 게임 데이터에 제작 동아리(club) 정보 추가 ---
    await Game.insertMany([
      {
        name: "사이버펑크 2077",
        description: "미래 도시 나이트 시티에서의 모험",
        imageUrl: "url/to/image1.webp",
        club: "CDPR",
      },
      {
        name: "엘든 링",
        description: "광활한 세계를 탐험하는 판타지 액션 RPG",
        imageUrl: "url/to/image2.webp",
        club: "FromSoftware",
      },
      {
        name: "스타듀 밸리",
        description: "평화로운 농장 생활을 즐겨보세요",
        imageUrl: "url/to/image3.webp",
        club: "ConcernedApe",
      },
      {
        name: "젤다: 야생의 숨결",
        description: "끝없는 하이랄 왕국을 탐험하세요",
        imageUrl: "url/to/image4.webp",
        club: "Nintendo",
      },
      {
        name: "Red Dead Redemption 2",
        description: "서부 시대의 장대한 서사시와 무법자의 삶",
        imageUrl: "url/to/image5.webp",
        club: "Rockstar",
      },
      // '김메이커'와 동아리가 겹치는 게임
      {
        name: "The Witcher 3: Wild Hunt",
        description: "괴물 사냥꾼 게롤트의 마지막 여정",
        imageUrl: "url/to/image6.webp",
        club: "GameMakers",
      },
      {
        name: "God of War (2018)",
        description: "북유럽 신화 속에서 펼쳐지는 아버지와 아들의 이야기",
        imageUrl: "url/to/image7.webp",
        club: "SantaMonica",
      },
      // '이개발'과 동아리가 겹치는 게임
      {
        name: "Hades",
        description: "죽음을 반복하며 지옥을 탈출하는 로그라이크 액션",
        imageUrl: "url/to/image8.webp",
        club: "DevSisters",
      },
      {
        name: "Hollow Knight",
        description: "벌레들의 왕국을 탐험하는 아름다운 메트로배니아",
        imageUrl: "url/to/image9.webp",
        club: "TeamCherry",
      },
      {
        name: "Disco Elysium",
        description: "기억을 잃은 형사가 되어 사건을 해결하는 혁신적인 RPG",
        imageUrl: "url/to/image10.webp",
        club: "ZA/UM",
      },
      // '박기획'과 동아리가 겹치는 게임
      {
        name: "Persona 5 Royal",
        description: "낮에는 학생, 밤에는 마음의 괴도가 되는 스타일리시한 JRPG",
        imageUrl: "url/to/image11.webp",
        club: "Project.P",
      },
      {
        name: "The Last of Us Part I",
        description: "감염 사태로 파괴된 세상에서 살아남기 위한 처절한 생존기",
        imageUrl: "url/to/image12.webp",
        club: "NaughtyDog",
      },
      // '최아트'와 동아리가 겹치는 게임
      {
        name: "Super Mario Odyssey",
        description: "모자 '캐피'와 함께 세계를 여행하는 3D 마리오의 모험",
        imageUrl: "url/to/image13.webp",
        club: "ArtStation",
      },
      {
        name: "Celeste",
        description:
          "자아를 찾아 셀레스트 산을 오르는 소녀의 감동적인 플랫포머",
        imageUrl: "url/to/image14.webp",
        club: "MaddyMakesGames",
      },
      {
        name: "Civilization VI",
        description: "역사의 지도자가 되어 문명을 발전시키는 턴제 전략 게임",
        imageUrl: "url/to/image15.webp",
        club: "Firaxis",
      },
      {
        name: "Animal Crossing: New Horizons",
        description: "나만의 무인도를 꾸미며 즐기는 힐링 라이프 시뮬레이션",
        imageUrl: "url/to/image16.webp",
        club: "Nintendo",
      },
      {
        name: "DOOM Eternal",
        description: "지옥의 악마들을 상대로 펼치는 압도적인 하이퍼 FPS",
        imageUrl: "url/to/image17.webp",
        club: "idSoftware",
      },
      {
        name: "Street Fighter 6",
        description: "새로운 시대로 진화한 격투 게임의 전설",
        imageUrl: "url/to/image18.webp",
        club: "Capcom",
      },
    ]);

    console.log("🌱 데이터 시딩이 성공적으로 완료되었습니다.");
  } catch (error) {
    console.error("❌ 데이터 시딩 중 오류가 발생했습니다:", error);
  }
};

const app: Express = express();

const corsOptions = {
  origin: "http://localhost:5173", // 요청을 허용할 프론트엔드 주소만 명시
  credentials: true, // 쿠키 등 자격 증명을 포함한 요청을 허용하려면 true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

const MONGO_URI: string = process.env.MONGO_URI || "";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB에 성공적으로 연결되었습니다.");
    // --- 2. DB 연결 성공 후 시딩 함수 호출 ---
    seedDatabase();
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

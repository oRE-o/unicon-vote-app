import express, { Request, Response, Router } from "express";
import { randomUUID } from "crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import User, { IUser } from "../models/userModel.js";
import Game, { IGame } from "../models/gameModel.js";
import Vote from "../models/voteModel.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";

type GamePayload = {
  name?: string;
  description?: string;
  imageUrl?: string;
  category?: IGame["category"];
  developers?: string[] | string;
};

type AdminUserResponse = {
  _id: string;
  name: string;
  uuid: string;
  braceletNumber?: string;
  role: IUser["role"];
  club?: string;
  hasPassword: boolean;
  hasVotes: boolean;
};

const router: Router = express.Router();

router.use(authMiddleware, adminMiddleware);

const thumbnailUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const runThumbnailUploadMiddleware = (req: Request, res: Response) =>
  new Promise<void>((resolve, reject) => {
    thumbnailUpload.single("file")(req, res, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });

const normalizeGamePayload = (payload: GamePayload) => {
  const name = payload.name?.trim();
  const description = payload.description?.trim();
  const imageUrl = payload.imageUrl?.trim();
  const category = payload.category;
  const developersArray = Array.isArray(payload.developers)
    ? payload.developers
    : payload.developers
        ?.split(",")
        .map((developer) => developer.trim())
        .filter(Boolean);

  return {
    name,
    description,
    imageUrl,
    category,
    developers: developersArray,
  };
};

const validateGamePayload = (payload: ReturnType<typeof normalizeGamePayload>) => {
  if (!payload.name || !payload.description || !payload.imageUrl) {
    return "게임 이름, 설명, 썸네일 URL은 필수입니다.";
  }

  try {
    const parsedUrl = new URL(payload.imageUrl);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return "썸네일 URL은 http:// 또는 https:// 주소여야 합니다.";
    }
  } catch (_error) {
    return "유효한 썸네일 URL을 입력해주세요.";
  }

  if (
    payload.category !== "Challenger" &&
    payload.category !== "Rookie"
  ) {
    return "카테고리는 Challenger 또는 Rookie만 가능합니다.";
  }

  if (!payload.developers || payload.developers.length === 0) {
    return "개발자 목록은 최소 1명 이상 필요합니다.";
  }

  return null;
};

const getStorageConfig = () => {
  const region = process.env.S3_REGION?.trim();
  const bucket = process.env.S3_BUCKET?.trim();
  const accessKeyId = process.env.S3_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY?.trim();
  const endpoint = process.env.S3_ENDPOINT?.trim();
  const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL?.trim();
  const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === "true";

  return {
    region,
    bucket,
    accessKeyId,
    secretAccessKey,
    endpoint,
    publicBaseUrl,
    forcePathStyle,
  };
};

const isStorageConfigured = () => {
  const config = getStorageConfig();

  return Boolean(
    config.region &&
      config.bucket &&
      config.accessKeyId &&
      config.secretAccessKey
  );
};

const sanitizeFileName = (fileName: string) =>
  fileName.replace(/[^a-zA-Z0-9._-]/g, "_");

const buildPublicImageUrl = (key: string) => {
  const config = getStorageConfig();

  if (!config.bucket || !config.region) {
    throw new Error("스토리지 설정이 올바르지 않습니다.");
  }

  if (config.publicBaseUrl) {
    return `${config.publicBaseUrl.replace(/\/+$/, "")}/${key}`;
  }

  if (config.endpoint) {
    const trimmedEndpoint = config.endpoint.replace(/\/+$/, "");

    if (config.forcePathStyle) {
      return `${trimmedEndpoint}/${config.bucket}/${key}`;
    }

    const parsedEndpoint = new URL(trimmedEndpoint);
    return `${parsedEndpoint.protocol}//${config.bucket}.${parsedEndpoint.host}/${key}`;
  }

  return `https://${config.bucket}.s3.${config.region}.amazonaws.com/${key}`;
};

const serializeUser = (
  user: IUser & { _id: unknown },
  options?: { hasVotes?: boolean }
): AdminUserResponse => ({
  _id: String(user._id),
  name: user.name,
  uuid: user.uuid,
  braceletNumber: user.braceletNumber,
  role: user.role,
  club: user.club,
  hasPassword: Boolean(user.password),
  hasVotes: options?.hasVotes ?? false,
});

type BulkUserInput = {
  braceletNumber?: string;
  name?: string;
  role?: IUser["role"];
  club?: string;
};

const normalizeBulkUserInput = (row: BulkUserInput, index: number) => {
  const braceletNumber = row.braceletNumber?.trim();
  const role: IUser["role"] =
    row.role === "admin" || row.role === "user" || row.role === "guest"
      ? row.role
      : "guest";
  const club = row.club?.trim();
  const fallbackName = braceletNumber
    ? `무기명-${braceletNumber}`
    : `무기명-${index + 1}`;
  const name = row.name?.trim() || fallbackName;

  return {
    braceletNumber,
    name,
    role,
    club: club || undefined,
  };
};

// --- 사용자 관리 ---
router.get("/users", async (_req: Request, res: Response) => {
  try {
    const [users, votedUserIds] = await Promise.all([
      User.find({}).sort({ role: 1, name: 1 }),
      Vote.distinct("user"),
    ]);
    const votedUserIdSet = new Set(votedUserIds.map((userId) => String(userId)));

    res.status(200).json(
      users.map((user) =>
        serializeUser(user as IUser & { _id: unknown }, {
          hasVotes: votedUserIdSet.has(String(user._id)),
        })
      )
    );
  } catch (error) {
    res.status(500).json({ message: "사용자 목록 조회 중 오류 발생" });
  }
});

router.post("/users", async (req: Request, res: Response) => {
  try {
    const { name, role, club, braceletNumber } = req.body as {
      name?: string;
      role?: IUser["role"];
      club?: string;
      braceletNumber?: string;
    };

    const trimmedName = name?.trim();
    const trimmedClub = club?.trim();
    const trimmedBraceletNumber = braceletNumber?.trim();

    if (!trimmedName) {
      return res.status(400).json({ message: "사용자 이름이 필요합니다." });
    }

    const normalizedRole: IUser["role"] =
      role === "user" || role === "admin" || role === "guest"
        ? role
        : "guest";

    const newUserPayload: {
      name: string;
      uuid: string;
      role: IUser["role"];
      club?: string;
      braceletNumber?: string;
    } = {
      name: trimmedName,
      uuid: uuidv4(),
      role: normalizedRole,
    };

    if (trimmedClub) {
      newUserPayload.club = trimmedClub;
    }

    if (trimmedBraceletNumber) {
      newUserPayload.braceletNumber = trimmedBraceletNumber;
    }

    const newUser = new User(newUserPayload);
    await newUser.save();

    res.status(201).json(
      serializeUser(newUser as IUser & { _id: unknown }, {
        hasVotes: false,
      })
    );
  } catch (error) {
    res.status(500).json({ message: "사용자 생성 중 오류 발생" });
  }
});

router.patch("/users/:uuid", async (req: Request, res: Response) => {
  try {
    const { name, role, club, braceletNumber } = req.body as {
      name?: string;
      role?: IUser["role"];
      club?: string;
      braceletNumber?: string;
    };

    const trimmedName = name?.trim();
    const trimmedClub = club?.trim();
    const trimmedBraceletNumber = braceletNumber?.trim();

    if (!trimmedName) {
      return res.status(400).json({ message: "사용자 이름이 필요합니다." });
    }

    if (role !== "user" && role !== "admin" && role !== "guest") {
      return res.status(400).json({ message: "유효하지 않은 역할입니다." });
    }

    const user = await User.findOne({ uuid: req.params.uuid });

    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    user.name = trimmedName;
    user.role = role;

    if (trimmedClub) {
      user.club = trimmedClub;
    } else {
      user.club = undefined;
    }

    if (trimmedBraceletNumber) {
      user.braceletNumber = trimmedBraceletNumber;
    } else {
      user.braceletNumber = undefined;
    }

    await user.save();

    const hasVotes = Boolean(await Vote.exists({ user: user._id }));

    res.status(200).json({
      message: "사용자 정보가 수정되었습니다.",
      user: serializeUser(user as IUser & { _id: unknown }, { hasVotes }),
    });
  } catch (error) {
    res.status(500).json({ message: "사용자 수정 중 오류 발생" });
  }
});

router.post("/users/bulk", async (req: Request, res: Response) => {
  try {
    const { users } = req.body as { users?: BulkUserInput[] };

    if (!users || users.length === 0) {
      return res.status(400).json({ message: "업로드할 사용자 목록이 비어 있습니다." });
    }

    const normalizedUsers = users.map(normalizeBulkUserInput);

    if (normalizedUsers.some((user) => user.role === "admin")) {
      return res.status(400).json({ message: "admin 계정은 대량 업로드로 만들 수 없습니다." });
    }

    if (normalizedUsers.some((user) => !user.braceletNumber)) {
      return res.status(400).json({ message: "모든 행에는 팔찌 번호가 필요합니다." });
    }

    const braceletNumbers = normalizedUsers.map((user) => user.braceletNumber as string);
    if (new Set(braceletNumbers).size !== braceletNumbers.length) {
      return res.status(400).json({ message: "업로드 파일 안에 중복된 팔찌 번호가 있습니다." });
    }

    const existingUsers = await User.find({ braceletNumber: { $in: braceletNumbers } });
    if (existingUsers.length > 0) {
      return res.status(409).json({
        message: `이미 존재하는 팔찌 번호가 있습니다: ${existingUsers
          .map((user) => user.braceletNumber)
          .filter(Boolean)
          .join(", ")}`,
      });
    }

    const createdUsers = await User.insertMany(
      normalizedUsers.map((user) => ({
        name: user.name,
        uuid: uuidv4(),
        braceletNumber: user.braceletNumber,
        role: user.role,
        club: user.club,
      }))
    );

    res.status(201).json({
      message: `${createdUsers.length}개 계정을 등록했습니다.`,
      createdCount: createdUsers.length,
    });
  } catch (error) {
    res.status(500).json({ message: "대량 사용자 등록 중 오류 발생" });
  }
});

router.post("/users/generate-guests", async (req: Request, res: Response) => {
  try {
    const { count, startNumber } = req.body as {
      count?: number;
      startNumber?: number;
    };

    if (!count || count < 1) {
      return res.status(400).json({ message: "생성할 수량은 1개 이상이어야 합니다." });
    }

    const normalizedStartNumber = startNumber && startNumber > 0 ? startNumber : 1;
    const generatedRows = Array.from({ length: count }, (_, index) => {
      const braceletNumber = String(normalizedStartNumber + index);
      return {
        name: `무기명-${braceletNumber}`,
        uuid: uuidv4(),
        braceletNumber,
        role: "guest" as const,
      };
    });

    const existingUsers = await User.find({
      braceletNumber: { $in: generatedRows.map((row) => row.braceletNumber) },
    });

    if (existingUsers.length > 0) {
      return res.status(409).json({
        message: `이미 존재하는 팔찌 번호가 있습니다: ${existingUsers
          .map((user) => user.braceletNumber)
          .filter(Boolean)
          .join(", ")}`,
      });
    }

    const createdUsers = await User.insertMany(generatedRows);

    res.status(201).json({
      message: `무기명 팔찌 ${createdUsers.length}개를 생성했습니다.`,
      createdCount: createdUsers.length,
    });
  } catch (error) {
    res.status(500).json({ message: "무기명 팔찌 생성 중 오류 발생" });
  }
});

router.delete("/users/bulk", async (req: Request, res: Response) => {
  try {
    const { braceletNumbers } = req.body as { braceletNumbers?: string[] };

    if (!braceletNumbers || braceletNumbers.length === 0) {
      return res.status(400).json({ message: "삭제할 팔찌 번호 목록이 필요합니다." });
    }

    const normalizedBraceletNumbers = braceletNumbers
      .map((braceletNumber) => braceletNumber?.trim())
      .filter(Boolean) as string[];

    if (normalizedBraceletNumbers.length === 0) {
      return res.status(400).json({ message: "유효한 팔찌 번호가 없습니다." });
    }

    const targetUsers = await User.find({ braceletNumber: { $in: normalizedBraceletNumbers } });
    if (targetUsers.length === 0) {
      return res.status(404).json({ message: "삭제할 팔찌 계정을 찾지 못했습니다." });
    }

    const targetIds = targetUsers.map((user) => user._id);
    const votedUserIds = new Set((await Vote.distinct("user", { user: { $in: targetIds } })).map(String));
    const blockedUsers = targetUsers.filter(
      (user) =>
        user.role !== "guest" ||
        Boolean(user.password) ||
        votedUserIds.has(String(user._id))
    );

    if (blockedUsers.length > 0) {
      return res.status(409).json({
        message: `삭제할 수 없는 계정이 포함되어 있습니다: ${blockedUsers
          .map((user) => user.braceletNumber || user.uuid)
          .join(", ")}`,
      });
    }

    const deleted = await User.deleteMany({ _id: { $in: targetIds } });

    res.status(200).json({
      message: `${deleted.deletedCount || 0}개 팔찌 계정을 삭제했습니다.`,
      deletedCount: deleted.deletedCount || 0,
    });
  } catch (error) {
    res.status(500).json({ message: "대량 사용자 삭제 중 오류 발생" });
  }
});

router.patch("/users/:uuid/reset-password", async (req: Request, res: Response) => {
  try {
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

router.post("/users/replace-bracelet", async (req: Request, res: Response) => {
  try {
    const { targetUuid, spareUuid, resetPassword } = req.body as {
      targetUuid?: string;
      spareUuid?: string;
      resetPassword?: boolean;
    };

    if (!targetUuid || !spareUuid) {
      return res.status(400).json({
        message: "교체 대상 사용자와 여분 팔찌 UUID가 모두 필요합니다.",
      });
    }

    if (targetUuid === spareUuid) {
      return res.status(400).json({
        message: "같은 팔찌로는 교체할 수 없습니다.",
      });
    }

    const [targetUser, spareUser] = await Promise.all([
      User.findOne({ uuid: targetUuid }),
      User.findOne({ uuid: spareUuid }),
    ]);

    if (!targetUser || !spareUser) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    if (spareUser.role !== "guest") {
      return res.status(400).json({
        message: "여분 팔찌는 guest 역할 계정만 사용할 수 있습니다.",
      });
    }

    if (spareUser.password) {
      return res.status(400).json({
        message:
          "선택한 여분 팔찌는 이미 사용 중입니다. 비밀번호가 없는 guest 계정을 선택해주세요.",
      });
    }

    const spareVoteCount = await Vote.countDocuments({ user: spareUser._id });

    if (spareVoteCount > 0) {
      return res.status(400).json({
        message:
          "선택한 여분 팔찌는 이미 투표 이력이 있습니다. 다른 guest 계정을 선택해주세요.",
      });
    }

    const oldUuid = targetUser.uuid;
    const newUuid = spareUser.uuid;
    const updatePayload: {
      $set: { uuid: string };
      $unset?: { password: string };
    } = {
      $set: { uuid: newUuid },
    };

    if (resetPassword) {
      updatePayload.$unset = { password: "" };
    }

    await User.deleteOne({ _id: spareUser._id });
    await User.updateOne({ _id: targetUser._id }, updatePayload);

    const updatedTarget = await User.findById(targetUser._id);

    if (!updatedTarget) {
      return res
        .status(500)
        .json({ message: "팔찌 교체 후 사용자 정보를 불러오지 못했습니다." });
    }

    const hasVotes = Boolean(await Vote.exists({ user: updatedTarget._id }));

    res.status(200).json({
      message: resetPassword
        ? "여분 팔찌로 교체했고 비밀번호도 초기화했습니다."
        : "여분 팔찌로 교체했습니다.",
      oldUuid,
      newUuid,
      user: serializeUser(updatedTarget as IUser & { _id: unknown }, {
        hasVotes,
      }),
    });
  } catch (error) {
    res.status(500).json({ message: "팔찌 교체 중 오류 발생" });
  }
});

router.delete("/users/:uuid", async (req: Request, res: Response) => {
  try {
    const user = await User.findOne({ uuid: req.params.uuid });

    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    const hasVotes = await Vote.exists({ user: user._id });
    if (hasVotes) {
      return res.status(409).json({
        message:
          "이미 투표 이력이 있는 사용자는 삭제할 수 없습니다. 정보 수정이나 비밀번호 초기화를 사용해주세요.",
      });
    }

    if (user.role === "admin") {
      return res.status(409).json({
        message:
          "관리자 계정은 여기서 삭제할 수 없습니다. 역할을 다시 확인하고 별도 절차로 관리해주세요.",
      });
    }

    await User.deleteOne({ _id: user._id });

    res.status(200).json({ message: "사용자가 삭제되었습니다." });
  } catch (error) {
    res.status(500).json({ message: "사용자 삭제 중 오류 발생" });
  }
});

router.get("/users/stats", async (_req: Request, res: Response) => {
  try {
    const userWithPassword = await User.countDocuments({
      role: "user",
      password: { $exists: true },
    });

    const guestWithPassword = await User.countDocuments({
      role: "guest",
      password: { $exists: true },
    });

    const totalWithPassword = await User.countDocuments({
      password: { $exists: true },
    });

    res.status(200).json({
      userWithPassword,
      guestWithPassword,
      totalWithPassword,
    });
  } catch (error) {
    console.error("계정 통계 집계 실패:", error);
    res.status(500).json({ message: "계정 통계 집계 중 오류 발생" });
  }
});

// --- 게임 관리 ---
router.post("/uploads/game-thumbnail", async (req: Request, res: Response) => {
  try {
    if (!isStorageConfigured()) {
      return res.status(503).json({
        message:
          "썸네일 업로드 스토리지가 설정되지 않았습니다. S3 관련 환경변수를 먼저 설정해주세요.",
      });
    }

    await runThumbnailUploadMiddleware(req, res);

    if (!req.file) {
      return res.status(400).json({ message: "업로드할 이미지 파일이 필요합니다." });
    }

    if (!req.file.mimetype.startsWith("image/")) {
      return res.status(400).json({ message: "이미지 파일만 업로드할 수 있습니다." });
    }

    const config = getStorageConfig();

    if (
      !config.region ||
      !config.bucket ||
      !config.accessKeyId ||
      !config.secretAccessKey
    ) {
      return res.status(503).json({
        message:
          "썸네일 업로드 스토리지 설정이 불완전합니다. 필수 S3 환경변수를 확인해주세요.",
      });
    }

    const s3Client = new S3Client({
      region: config.region,
      endpoint: config.endpoint || undefined,
      forcePathStyle: config.forcePathStyle,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });

    const fileExtension =
      req.file.originalname.split(".").pop()?.toLowerCase() || "bin";
    const baseName = sanitizeFileName(
      req.file.originalname.replace(/\.[^.]+$/, "") || "thumbnail"
    );
    const objectKey = `game-thumbnails/${randomUUID()}-${baseName}.${fileExtension}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: objectKey,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );

    res.status(201).json({
      message: "썸네일 업로드가 완료되었습니다.",
      key: objectKey,
      imageUrl: buildPublicImageUrl(objectKey),
    });
  } catch (error) {
    if (error instanceof multer.MulterError) {
      const message =
        error.code === "LIMIT_FILE_SIZE"
          ? "이미지 파일은 10MB 이하만 업로드할 수 있습니다."
          : "이미지 업로드 중 오류가 발생했습니다.";

      return res.status(400).json({ message });
    }

    res.status(500).json({ message: "썸네일 업로드 중 오류 발생" });
  }
});

router.post("/games", async (req: Request, res: Response) => {
  try {
    const normalizedPayload = normalizeGamePayload(req.body as GamePayload);
    const validationMessage = validateGamePayload(normalizedPayload);

    if (validationMessage) {
      return res.status(400).json({ message: validationMessage });
    }

    const newGame = new Game({
      name: normalizedPayload.name,
      description: normalizedPayload.description,
      imageUrl: normalizedPayload.imageUrl,
      developers: normalizedPayload.developers,
      category: normalizedPayload.category,
    });

    await newGame.save();
    res.status(201).json(newGame);
  } catch (error) {
    res.status(500).json({ message: "게임 추가 중 오류 발생" });
  }
});

router.patch("/games/:id", async (req: Request, res: Response) => {
  try {
    const normalizedPayload = normalizeGamePayload(req.body as GamePayload);
    const validationMessage = validateGamePayload(normalizedPayload);

    if (validationMessage) {
      return res.status(400).json({ message: validationMessage });
    }

    const updatedGame = await Game.findByIdAndUpdate(
      req.params.id,
      {
        name: normalizedPayload.name,
        description: normalizedPayload.description,
        imageUrl: normalizedPayload.imageUrl,
        developers: normalizedPayload.developers,
        category: normalizedPayload.category,
      },
      { new: true, runValidators: true }
    );

    if (!updatedGame) {
      return res.status(404).json({ message: "게임을 찾을 수 없습니다." });
    }

    res.status(200).json({
      message: "게임 정보가 수정되었습니다.",
      game: updatedGame,
    });
  } catch (error) {
    res.status(500).json({ message: "게임 수정 중 오류 발생" });
  }
});

router.delete("/games/:id", async (req: Request, res: Response) => {
  try {
    const game = await Game.findById(req.params.id);

    if (!game) {
      return res.status(404).json({ message: "게임을 찾을 수 없습니다." });
    }

    const hasVotes = await Vote.exists({ game: game._id });
    if (hasVotes) {
      return res.status(409).json({
        message:
          "이미 투표 이력이 있는 게임은 삭제할 수 없습니다. 설명/썸네일 수정으로 대응해주세요.",
      });
    }

    await Game.deleteOne({ _id: game._id });
    res.status(200).json({ message: "게임이 성공적으로 삭제되었습니다." });
  } catch (error) {
    res.status(500).json({ message: "게임 삭제 중 오류 발생" });
  }
});

router.get("/votes/voter-count", async (_req: Request, res: Response) => {
  try {
    const distinctVoters = await Vote.distinct("user");
    res.status(200).json({ voterCount: distinctVoters.length });
  } catch (error) {
    console.error("투표자 수 집계 실패:", error);
    res.status(500).json({ message: "투표자 수 집계 중 오류 발생" });
  }
});

router.get("/votes/results", async (_req: Request, res: Response) => {
  try {
    const games: IGame[] = await Game.find({});
    const votes = await Vote.find({});

    const results: Record<string, any> = {};
    games.forEach((game) => {
      results[String(game._id)] = {
        gameId: String(game._id),
        gameName: game.name,
        category: game.category,
        impressive: { gold: 0, silver: 0, bronze: 0, score: 0 },
        fun: { gold: 0, silver: 0, bronze: 0, score: 0 },
        original: { gold: 0, silver: 0, bronze: 0, score: 0 },
        polished: { gold: 0, silver: 0, bronze: 0, score: 0 },
        totalScore: 0,
      };
    });

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

router.get("/votes/by-user", async (_req: Request, res: Response) => {
  try {
    const votes = await Vote.find({});
    const users: IUser[] = await User.find({});
    const games: IGame[] = await Game.find({});

    const userMap = new Map(
      users.map((user: IUser & { _id: unknown }) => [
        String(user._id),
        { name: user.name, club: user.club },
      ])
    );
    const gameMap = new Map(
      games.map((game) => [
        String(game._id),
        { name: game.name, developers: game.developers },
      ])
    );

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
          isOwnClubVote,
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

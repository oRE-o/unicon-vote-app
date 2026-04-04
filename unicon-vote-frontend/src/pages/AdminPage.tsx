import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import * as XLSX from "xlsx";
import api from "../api";
import Modal from "../components/Modal";
import type { Game } from "../types";

type AdminSection = "dashboard" | "bracelets" | "games" | "results";

interface User {
  _id: string;
  name: string;
  uuid: string;
  braceletNumber?: string;
  role: "guest" | "user" | "admin";
  club?: string;
  hasPassword: boolean;
  hasVotes: boolean;
}

interface VoteResult {
  gameId: string;
  gameName: string;
  category: string;
  impressive: { gold: number; silver: number; bronze: number; score: number };
  fun: { gold: number; silver: number; bronze: number; score: number };
  original: { gold: number; silver: number; bronze: number; score: number };
  polished: { gold: number; silver: number; bronze: number; score: number };
  totalScore: number;
}

interface UserVoteRecord {
  userName: string;
  userClub: string;
  gameName: string;
  criterion: string;
  medal: string;
  isOwnClubVote: boolean;
}

interface UserUpdateForm {
  uuid: string;
  name: string;
  braceletNumber: string;
  role: User["role"];
  originalRole: User["role"];
  club: string;
}

interface BulkBraceletImportRow {
  braceletNumber: string;
  name: string;
  role: User["role"];
  club: string;
}

interface BraceletTransferForm {
  targetUuid: string;
  spareUuid: string;
  resetPassword: boolean;
  acknowledgedImpact: boolean;
}

interface DangerActionState {
  title: string;
  description: string;
  impactLines: string[];
  confirmLabel: string;
  tone: "warning" | "error";
  confirmationKeyword?: string;
  checkboxLabel?: string;
  action: () => Promise<void>;
}

interface AdminFeedback {
  tone: "success" | "error" | "info";
  message: string;
}

interface GameFormState {
  name: string;
  description: string;
  imageUrl: string;
  developers: string;
  category: "Challenger" | "Rookie";
}

interface GameUpdateForm extends GameFormState {
  _id: string;
}

interface GameUploadResponse {
  message: string;
  imageUrl: string;
  key: string;
}

const roleOrder: Record<User["role"], number> = {
  admin: 0,
  user: 1,
  guest: 2,
};

const createEmptyGameForm = (): GameFormState => ({
  name: "",
  description: "",
  imageUrl: "",
  developers: "",
  category: "Challenger",
});

const createGameFormFromGame = (game: Game): GameUpdateForm => ({
  _id: game._id,
  name: game.name,
  description: game.description,
  imageUrl: game.imageUrl,
  developers: game.developers.join(", "),
  category: game.category,
});

const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || fallback;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
};

const getLoginUrl = (uuid: string) =>
  `${window.location.origin}/login?uuid=${uuid}`;

const getRoleBadgeClass = (role: User["role"]) => {
  if (role === "admin") return "badge-secondary";
  if (role === "user") return "badge-primary";
  return "badge-ghost";
};

const getAccountState = (user: User) => {
  if (user.role === "guest" && !user.hasPassword && !user.hasVotes) {
    return {
      label: "여분 팔찌 후보",
      badgeClass: "badge-warning",
      description: "아직 비밀번호가 없어 현장 교체용으로 쓰기 좋습니다.",
    };
  }

  if (user.role === "guest" && !user.hasPassword && user.hasVotes) {
    return {
      label: "재사용 불가 guest",
      badgeClass: "badge-error",
      description:
        "비밀번호는 없지만 이미 투표 이력이 있어 여분 팔찌로는 재사용할 수 없습니다.",
    };
  }

  if (!user.hasPassword) {
    return {
      label: "첫 접속 대기",
      badgeClass: "badge-accent",
      description: "QR 접속 시 바로 회원가입/비밀번호 설정 화면으로 이동합니다.",
    };
  }

  if (user.role === "guest") {
    return {
      label: "guest 이용 중",
      badgeClass: "badge-info",
      description: "이미 guest 계정으로 사용 중인 팔찌입니다.",
    };
  }

  return {
    label: "가입 완료",
    badgeClass: "badge-success",
    description: "비밀번호가 설정된 기명 계정입니다.",
  };
};

function AdminPage() {
  const location = useLocation();
  const [users, setUsers] = useState<User[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [voteResultsPreview, setVoteResultsPreview] = useState<VoteResult[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isUserListVisible, setIsUserListVisible] = useState(true);
  const [selectedUserUuid, setSelectedUserUuid] = useState<string | null>(null);
  const [qrModalUser, setQrModalUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<UserUpdateForm | null>(null);
  const [braceletTransferForm, setBraceletTransferForm] =
    useState<BraceletTransferForm | null>(null);
  const [editingGame, setEditingGame] = useState<GameUpdateForm | null>(null);
  const [dangerAction, setDangerAction] = useState<DangerActionState | null>(null);
  const [dangerConfirmText, setDangerConfirmText] = useState("");
  const [dangerConfirmed, setDangerConfirmed] = useState(false);
  const [isRunningDangerAction, setIsRunningDangerAction] = useState(false);
  const [feedback, setFeedback] = useState<AdminFeedback | null>(null);

  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingUserVotes, setIsDownloadingUserVotes] = useState(false);
  const [isDownloadingUserAccounts, setIsDownloadingUserAccounts] =
    useState(false);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [isReplacingBracelet, setIsReplacingBracelet] = useState(false);
  const [isSavingGame, setIsSavingGame] = useState(false);
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [isGeneratingGuests, setIsGeneratingGuests] = useState(false);
  const [isDeletingBulkUsers, setIsDeletingBulkUsers] = useState(false);
  const [isUploadingNewGameImage, setIsUploadingNewGameImage] = useState(false);
  const [isUploadingEditingGameImage, setIsUploadingEditingGameImage] =
    useState(false);

  const [voterCount, setVoterCount] = useState(0);
  const [userPasswordCount, setUserPasswordCount] = useState(0);
  const [guestPasswordCount, setGuestPasswordCount] = useState(0);
  const [totalPasswordCount, setTotalPasswordCount] = useState(0);
  const [gameVoteState, setGameVoteState] = useState<Record<string, boolean>>({});

  const [newUser, setNewUser] = useState({
    name: "",
    braceletNumber: "",
    role: "guest" as User["role"],
    club: "",
  });
  const [bulkImportRows, setBulkImportRows] = useState<BulkBraceletImportRow[]>([]);
  const [bulkImportFileName, setBulkImportFileName] = useState("");
  const [guestGenerationCount, setGuestGenerationCount] = useState(20);
  const [guestGenerationStartNumber, setGuestGenerationStartNumber] = useState(1);
  const [bulkDeleteBraceletNumbers, setBulkDeleteBraceletNumbers] = useState("");
  const [newGame, setNewGame] = useState<GameFormState>(createEmptyGameForm());
  const [newGameImageFile, setNewGameImageFile] = useState<File | null>(null);
  const [editingGameImageFile, setEditingGameImageFile] = useState<File | null>(
    null
  );

  const fetchUsers = async () => {
    const usersRes = await api.get<User[]>("/api/admin/users");
    setUsers(usersRes.data);
  };

  const fetchGames = async () => {
    const gamesRes = await api.get<Game[]>("/api/games");
    setGames(gamesRes.data);
  };

  const fetchVoterCount = async () => {
    try {
      const response = await api.get<{ voterCount: number }>(
        "/api/admin/votes/voter-count"
      );
      setVoterCount(response.data.voterCount);
    } catch (error) {
      console.error("실시간 투표자 수 로딩 실패:", error);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await api.get<{
        userWithPassword: number;
        guestWithPassword: number;
        totalWithPassword: number;
      }>("/api/admin/users/stats");

      setUserPasswordCount(response.data.userWithPassword);
      setGuestPasswordCount(response.data.guestWithPassword);
      setTotalPasswordCount(response.data.totalWithPassword);
    } catch (error) {
      console.error("실시간 계정 통계 로딩 실패:", error);
    }
  };

  const fetchVoteResultsPreview = async () => {
    try {
      const response = await api.get<VoteResult[]>('/api/admin/votes/results');
      setVoteResultsPreview(response.data);
      const nextState = response.data.reduce<Record<string, boolean>>((accumulator, result) => {
        const totalVoteCount =
          result.impressive.gold +
          result.impressive.silver +
          result.impressive.bronze +
          result.fun.gold +
          result.fun.silver +
          result.fun.bronze +
          result.original.gold +
          result.original.silver +
          result.original.bronze +
          result.polished.gold +
          result.polished.silver +
          result.polished.bronze;

        accumulator[result.gameId] = totalVoteCount > 0;
        return accumulator;
      }, {});

      setGameVoteState(nextState);
    } catch (error) {
      console.error('게임 투표 상태 로딩 실패:', error);
    }
  };

  useEffect(() => {
    void fetchUsers();
    void fetchGames();
    void fetchVoterCount();
    void fetchUserStats();
    void fetchVoteResultsPreview();

    const intervalId = window.setInterval(() => {
      void fetchUsers();
      void fetchVoterCount();
      void fetchUserStats();
      void fetchVoteResultsPreview();
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, []);

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      if (roleOrder[a.role] !== roleOrder[b.role]) {
        return roleOrder[a.role] - roleOrder[b.role];
      }

      return a.name.localeCompare(b.name, "ko");
    });
  }, [users]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return sortedUsers;
    }

    const matchedUsers = sortedUsers.filter((user) => {
      const searchableText = [user.name, user.uuid, user.role, user.club || ""]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });

    const getSearchPriority = (user: User) => {
      const normalizedName = user.name.toLowerCase();
      const normalizedUuid = user.uuid.toLowerCase();
      const normalizedClub = (user.club || "").toLowerCase();

      if (normalizedUuid === normalizedSearch) return 0;
      if (normalizedName === normalizedSearch) return 1;
      if (normalizedClub === normalizedSearch) return 2;
      if (normalizedUuid.startsWith(normalizedSearch)) return 3;
      if (normalizedName.startsWith(normalizedSearch)) return 4;
      if (normalizedClub.startsWith(normalizedSearch)) return 5;
      return 6;
    };

    return [...matchedUsers].sort((a, b) => {
      const priorityDiff = getSearchPriority(a) - getSearchPriority(b);
      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      if (roleOrder[a.role] !== roleOrder[b.role]) {
        return roleOrder[a.role] - roleOrder[b.role];
      }

      return a.name.localeCompare(b.name, "ko");
    });
  }, [searchTerm, sortedUsers]);

  const spotlightUsers = useMemo(() => filteredUsers.slice(0, 8), [filteredUsers]);

  const selectedUser = useMemo(() => {
    if (!selectedUserUuid) {
      return null;
    }

    return users.find((user) => user.uuid === selectedUserUuid) || null;
  }, [selectedUserUuid, users]);

  const availableSpareUsers = useMemo(() => {
    const targetUuid = braceletTransferForm?.targetUuid;

    return sortedUsers.filter((user) => {
      return (
        user.role === "guest" &&
        !user.hasPassword &&
        !user.hasVotes &&
        user.uuid !== targetUuid
      );
    });
  }, [braceletTransferForm?.targetUuid, sortedUsers]);

  const sparePreviewUsers = useMemo(() => {
    return sortedUsers
      .filter((user) => user.role === "guest" && !user.hasPassword && !user.hasVotes)
      .slice(0, 5);
  }, [sortedUsers]);

  const selectedSpareUser = useMemo(() => {
    if (!braceletTransferForm?.spareUuid) {
      return null;
    }

    return users.find((user) => user.uuid === braceletTransferForm.spareUuid) || null;
  }, [braceletTransferForm?.spareUuid, users]);

  const resetNewGameForm = () => {
    setNewGame(createEmptyGameForm());
    setNewGameImageFile(null);
  };

  const openEditModal = (user: User) => {
    setEditingUser({
      uuid: user.uuid,
      name: user.name,
      braceletNumber: user.braceletNumber || "",
      role: user.role,
      originalRole: user.role,
      club: user.club || "",
    });
  };

  const openBraceletTransferModal = (user: User) => {
    setSelectedUserUuid(user.uuid);
    setBraceletTransferForm({
      targetUuid: user.uuid,
      spareUuid: "",
      resetPassword: false,
      acknowledgedImpact: false,
    });
  };

  const openDangerAction = (nextAction: DangerActionState) => {
    setDangerAction(nextAction);
    setDangerConfirmText("");
    setDangerConfirmed(false);
  };

  const resetDangerAction = () => {
    setDangerAction(null);
    setDangerConfirmText("");
    setDangerConfirmed(false);
  };

  const closeDangerAction = () => {
    if (isRunningDangerAction) {
      return;
    }

    resetDangerAction();
  };

  const runDangerAction = async () => {
    if (!dangerAction) {
      return;
    }

    setIsRunningDangerAction(true);

    try {
      await dangerAction.action();
      resetDangerAction();
    } finally {
      setIsRunningDangerAction(false);
    }
  };

  const openEditGameModal = (game: Game) => {
    setEditingGame(createGameFormFromGame(game));
    setEditingGameImageFile(null);
  };

  const showFeedback = (tone: AdminFeedback["tone"], message: string) => {
    setFeedback({ tone, message });
  };

  const copyText = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showFeedback("success", successMessage);
    } catch (_error) {
      window.prompt("아래 내용을 복사해주세요.", text);
      showFeedback("info", "클립보드 접근이 막혀 수동 복사 창을 열었습니다.");
    }
  };

  const handleCopyLoginUrl = async (user: User) => {
    await copyText(
      getLoginUrl(user.uuid),
      `${user.name}님의 로그인 링크를 복사했습니다.`
    );
  };

  const handleDownloadBraceletTemplate = () => {
    const templateRows = [
      { braceletNumber: "1001", name: "홍길동", role: "user", club: "GameMakers" },
      { braceletNumber: "2001", name: "무기명-2001", role: "guest", club: "" },
    ];

    const guideRows = [
      {
        필드: "braceletNumber",
        설명: "팔찌에 인쇄되는 번호. 비워둘 수 없습니다.",
      },
      { 필드: "name", 설명: "기명은 실제 이름, 무기명은 원하는 표기 또는 비워두기" },
      { 필드: "role", 설명: "user / guest / admin 중 하나. bulk import는 admin 권장 안 함" },
      { 필드: "club", 설명: "동아리 이름. guest는 비워둘 수 있음" },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(templateRows), "template");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(guideRows), "guide");
    XLSX.writeFile(workbook, "unicon_bracelet_import_template.xlsx");
    showFeedback("success", "팔찌 DB 업로드용 XLSX 템플릿을 저장했습니다.");
  };

  const handleImportBraceletFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const firstSheet = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheet];
    const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(worksheet, {
      defval: "",
    });

    const parsedRows = rows
      .map((row) => ({
        braceletNumber: String(row.braceletNumber || row.팔찌번호 || "").trim(),
        name: String(row.name || row.이름 || "").trim(),
        role: String(row.role || row.역할 || "guest").trim() as User["role"],
        club: String(row.club || row.소속 || "").trim(),
      }))
      .filter((row) => row.braceletNumber);

    setBulkImportRows(parsedRows);
    setBulkImportFileName(file.name);
    event.target.value = "";
    showFeedback("success", `${parsedRows.length}개 행을 업로드 미리보기로 불러왔습니다.`);
  };

  const handleBulkImportUsers = async () => {
    if (bulkImportRows.length === 0) {
      showFeedback("info", "먼저 XLSX 파일을 업로드해주세요.");
      return;
    }

    setIsBulkImporting(true);
    try {
      const response = await api.post<{ message: string }>("/api/admin/users/bulk", {
        users: bulkImportRows,
      });
      setBulkImportRows([]);
      setBulkImportFileName("");
      await fetchUsers();
      await fetchUserStats();
      showFeedback("success", response.data.message);
    } catch (error) {
      showFeedback("error", getErrorMessage(error, "대량 사용자 등록에 실패했습니다."));
    } finally {
      setIsBulkImporting(false);
    }
  };

  const handleGenerateGuests = async () => {
    setIsGeneratingGuests(true);
    try {
      const response = await api.post<{ message: string }>("/api/admin/users/generate-guests", {
        count: guestGenerationCount,
        startNumber: guestGenerationStartNumber,
      });
      await fetchUsers();
      await fetchUserStats();
      showFeedback("success", response.data.message);
    } catch (error) {
      showFeedback("error", getErrorMessage(error, "무기명 팔찌 생성에 실패했습니다."));
    } finally {
      setIsGeneratingGuests(false);
    }
  };

  const handleBulkDeleteUsers = async () => {
    const braceletNumbers = bulkDeleteBraceletNumbers
      .split(/[,\n]/)
      .map((value) => value.trim())
      .filter(Boolean);

    if (braceletNumbers.length === 0) {
      showFeedback("info", "삭제할 팔찌 번호를 하나 이상 입력해주세요.");
      return;
    }

    openDangerAction({
      title: "팔찌 계정 일괄 삭제",
      description: "행사 전 정리용으로만 사용하세요. 삭제 전 계정 리스트 XLSX 저장을 권장합니다.",
      impactLines: [
        `삭제 대상 팔찌 번호 ${braceletNumbers.length}개`,
        "투표 이력 또는 admin 계정이 포함되면 전체 요청이 거부됩니다.",
        "삭제 후에는 이 화면에서 바로 복구할 수 없습니다.",
      ],
      confirmLabel: "일괄 삭제 실행",
      tone: "error",
      checkboxLabel: "삭제 전 계정 리스트를 확인했습니다.",
      action: async () => {
        try {
          setIsDeletingBulkUsers(true);
          const response = await api.delete<{ message: string }>("/api/admin/users/bulk", {
            data: { braceletNumbers },
          });
          setBulkDeleteBraceletNumbers("");
          await fetchUsers();
          await fetchUserStats();
          showFeedback("success", response.data.message);
        } catch (error) {
          showFeedback("error", getErrorMessage(error, "일괄 삭제에 실패했습니다."));
        } finally {
          setIsDeletingBulkUsers(false);
        }
      },
    });
  };

  const handleDownloadVendorBraceletSheet = () => {
    const rows = sortedUsers
      .filter((user) => user.braceletNumber)
      .map((user) => ({
        팔찌번호: user.braceletNumber,
        로그인링크: getLoginUrl(user.uuid),
      }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "업체전달용");
    XLSX.writeFile(workbook, "unicon_bracelet_vendor_links.xlsx");
    showFeedback("success", "업체 전달용 팔찌번호-접속링크 XLSX를 저장했습니다.");
  };

  const handleDownloadOperatorBraceletSheet = () => {
    const rows = sortedUsers
      .filter((user) => user.braceletNumber)
      .map((user) => ({
        팔찌번호: user.braceletNumber,
        이름: user.name,
        동아리: user.club || "",
        역할: user.role,
      }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "운영진배포용");
    XLSX.writeFile(workbook, "unicon_bracelet_operator_sheet.xlsx");
    showFeedback("success", "운영진 배포용 팔찌번호-이름-동아리 XLSX를 저장했습니다.");
  };

  const uploadGameThumbnail = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<GameUploadResponse>(
      "/api/admin/uploads/game-thumbnail",
      formData
    );

    return response.data.imageUrl;
  };

  const handleUploadNewGameImage = async () => {
    if (!newGameImageFile) {
      showFeedback("info", "먼저 업로드할 이미지 파일을 선택해주세요.");
      return;
    }

    setIsUploadingNewGameImage(true);

    try {
      const imageUrl = await uploadGameThumbnail(newGameImageFile);
      setNewGame((prev) => ({ ...prev, imageUrl }));
      showFeedback(
        "success",
        "썸네일 업로드가 완료되었습니다. 이미지 URL 입력칸에 자동 반영했습니다."
      );
    } catch (error) {
      showFeedback("error", getErrorMessage(error, "썸네일 업로드에 실패했습니다."));
    } finally {
      setIsUploadingNewGameImage(false);
    }
  };

  const handleUploadEditingGameImage = async () => {
    if (!editingGameImageFile || !editingGame) {
      showFeedback("info", "먼저 업로드할 이미지 파일을 선택해주세요.");
      return;
    }

    setIsUploadingEditingGameImage(true);

    try {
      const imageUrl = await uploadGameThumbnail(editingGameImageFile);
      setEditingGame((prev) => (prev ? { ...prev, imageUrl } : prev));
      showFeedback(
        "success",
        "썸네일 업로드가 완료되었습니다. 이미지 URL 입력칸에 자동 반영했습니다."
      );
    } catch (error) {
      showFeedback("error", getErrorMessage(error, "썸네일 업로드에 실패했습니다."));
    } finally {
      setIsUploadingEditingGameImage(false);
    }
  };

  const handleCreateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newUser.name.trim() || !newUser.braceletNumber.trim()) {
      showFeedback("info", "이름과 팔찌 번호를 모두 입력해주세요.");
      return;
    }

    try {
      const response = await api.post<User>("/api/admin/users", {
        name: newUser.name.trim(),
        braceletNumber: newUser.braceletNumber.trim(),
        role: newUser.role,
        club: newUser.club.trim() || undefined,
      });

      setNewUser({ name: "", braceletNumber: "", role: "guest", club: "" });
      setSelectedUserUuid(response.data.uuid);
      setQrModalUser(response.data);

      await fetchUsers();
      await fetchUserStats();
      showFeedback("success", `${response.data.name} 계정을 생성했습니다.`);
    } catch (error) {
      showFeedback("error", getErrorMessage(error, "사용자 생성에 실패했습니다."));
    }
  };

  const submitUserUpdate = async () => {
    if (!editingUser) {
      return;
    }

    setIsSavingUser(true);

    try {
      const response = await api.patch<{ message: string; user: User }>(
        `/api/admin/users/${editingUser.uuid}`,
        {
          name: editingUser.name.trim(),
          braceletNumber: editingUser.braceletNumber.trim() || undefined,
          role: editingUser.role,
          club: editingUser.club.trim() || undefined,
        }
      );

      setEditingUser(null);
      setSelectedUserUuid(response.data.user.uuid);

      await fetchUsers();
      await fetchUserStats();

      showFeedback("success", response.data.message);
    } catch (error) {
      showFeedback("error", getErrorMessage(error, "사용자 정보 수정에 실패했습니다."));
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleUpdateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingUser) {
      return;
    }

    if (!editingUser.name.trim() || !editingUser.braceletNumber.trim()) {
      showFeedback("info", "이름과 팔찌 번호를 모두 입력해주세요.");
      return;
    }

    if (editingUser.role === "admin" && editingUser.originalRole !== "admin") {
      openDangerAction({
        title: `${editingUser.name} 계정을 admin으로 변경`,
        description: "관리자 권한은 운영상 강한 영향이 있으므로 한 번 더 확인하세요.",
        impactLines: [
          `대상 사용자: ${editingUser.name}`,
          `팔찌 번호: ${editingUser.braceletNumber}`,
          "admin 권한을 주면 관리자 페이지 접근과 운영 작업이 가능해집니다.",
        ],
        confirmLabel: "admin 권한 부여",
        tone: "warning",
        checkboxLabel: "이 권한 변경의 영향을 이해했습니다.",
        action: submitUserUpdate,
      });
      return;
    }

    await submitUserUpdate();
  };

  const handleResetPassword = async (user: User) => {
    openDangerAction({
      title: `${user.name} 비밀번호 초기화`,
      description: "현장 본인 확인을 마친 뒤에만 실행하세요.",
      impactLines: [
        `대상 계정: ${user.name} (${user.uuid})`,
        "다음 QR 접속 시 비밀번호 설정 화면으로 이동합니다.",
        "이 작업은 이 화면에서 바로 되돌릴 수 없습니다.",
      ],
      confirmLabel: "비밀번호 초기화 실행",
      tone: "warning",
      checkboxLabel: "본인 확인을 마쳤습니다.",
      action: async () => {
        try {
          const response = await api.patch<{ message: string }>(
            `/api/admin/users/${user.uuid}/reset-password`
          );

          await fetchUsers();
          await fetchUserStats();

          showFeedback("success", response.data.message);
        } catch (error) {
          showFeedback("error", getErrorMessage(error, "비밀번호 초기화에 실패했습니다."));
        }
      },
    });
  };

  const handleDeleteUser = async (user: User) => {
    openDangerAction({
      title: `${user.name} 계정 삭제`,
      description: "정말 필요할 때만 실행하세요. 삭제 후에는 복구가 어렵습니다.",
      impactLines: [
        `대상 계정: ${user.name} / ${user.uuid}`,
        "이미 배포된 팔찌나 운영 기록과 연결돼 있다면 현장 혼선이 생길 수 있습니다.",
        "삭제 전 계정 리스트 XLSX를 먼저 저장하는 것을 권장합니다.",
      ],
      confirmLabel: "계정 삭제",
      tone: "error",
      confirmationKeyword: user.name,
      action: async () => {
        try {
          const response = await api.delete<{ message: string }>(
            `/api/admin/users/${user.uuid}`
          );

          if (selectedUserUuid === user.uuid) {
            setSelectedUserUuid(null);
          }

          await fetchUsers();
          await fetchUserStats();

          showFeedback("success", response.data.message);
        } catch (error) {
          showFeedback("error", getErrorMessage(error, "사용자 삭제에 실패했습니다."));
        }
      },
    });
  };

  const handleReplaceBracelet = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!braceletTransferForm?.spareUuid) {
      showFeedback("info", "여분 팔찌를 먼저 선택해주세요.");
      return;
    }

    setIsReplacingBracelet(true);

    try {
      const response = await api.post<{
        message: string;
        user: User;
        oldUuid: string;
        newUuid: string;
      }>("/api/admin/users/replace-bracelet", {
        targetUuid: braceletTransferForm.targetUuid,
        spareUuid: braceletTransferForm.spareUuid,
        resetPassword: braceletTransferForm.resetPassword,
      });

      setBraceletTransferForm(null);
      setSelectedUserUuid(response.data.user.uuid);
      setQrModalUser(response.data.user);

      await fetchUsers();
      await fetchUserStats();

      showFeedback(
        "success",
        `${response.data.message}\n기존 UUID: ${response.data.oldUuid}\n새 UUID: ${response.data.newUuid}`
      );
    } catch (error) {
      showFeedback("error", getErrorMessage(error, "여분 팔찌 교체에 실패했습니다."));
    } finally {
      setIsReplacingBracelet(false);
    }
  };

  const handleAddGame = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !newGame.name.trim() ||
      !newGame.description.trim() ||
      !newGame.imageUrl.trim() ||
      !newGame.developers.trim()
    ) {
      showFeedback("info", "게임 이름, 설명, 썸네일 URL, 개발자 목록을 모두 입력해주세요.");
      return;
    }

    try {
      const developersArray = newGame.developers
        .split(",")
        .map((developer) => developer.trim())
        .filter(Boolean);

      await api.post("/api/admin/games", {
        ...newGame,
        name: newGame.name.trim(),
        description: newGame.description.trim(),
        imageUrl: newGame.imageUrl.trim(),
        developers: developersArray,
      });

      resetNewGameForm();
      await fetchGames();
      await fetchVoteResultsPreview();
      showFeedback("success", "게임이 등록되었습니다.");
    } catch (error) {
      showFeedback("error", getErrorMessage(error, "게임 추가에 실패했습니다."));
    }
  };

  const handleUpdateGame = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingGame) {
      return;
    }

    if (
      !editingGame.name.trim() ||
      !editingGame.description.trim() ||
      !editingGame.imageUrl.trim() ||
      !editingGame.developers.trim()
    ) {
      showFeedback("info", "게임 이름, 설명, 썸네일 URL, 개발자 목록을 모두 입력해주세요.");
      return;
    }

    setIsSavingGame(true);

    try {
      const developersArray = editingGame.developers
        .split(",")
        .map((developer) => developer.trim())
        .filter(Boolean);

      const response = await api.patch<{ message: string; game: Game }>(
        `/api/admin/games/${editingGame._id}`,
        {
          name: editingGame.name.trim(),
          description: editingGame.description.trim(),
          imageUrl: editingGame.imageUrl.trim(),
          category: editingGame.category,
          developers: developersArray,
        }
      );

      setEditingGame(null);
      setEditingGameImageFile(null);
      await fetchGames();
      await fetchVoteResultsPreview();
      showFeedback("success", response.data.message);
    } catch (error) {
      showFeedback("error", getErrorMessage(error, "게임 수정에 실패했습니다."));
    } finally {
      setIsSavingGame(false);
    }
  };

  const handleDeleteGame = async (game: Game) => {
    openDangerAction({
      title: `${game.name} 게임 삭제`,
      description: "게임 목록에서 완전히 제거합니다. 결과 집계와 운영 기록을 다시 확인해주세요.",
      impactLines: [
        `대상 게임: ${game.name}`,
        `부문: ${game.category}`,
        "삭제 후에는 이 화면에서 바로 되돌릴 수 없습니다.",
      ],
      confirmLabel: "게임 삭제",
      tone: "error",
      confirmationKeyword: game.name,
      action: async () => {
        try {
          await api.delete(`/api/admin/games/${game._id}`);
          await fetchGames();
          await fetchVoteResultsPreview();
          showFeedback("success", "게임을 삭제했습니다.");
        } catch (error) {
          showFeedback("error", getErrorMessage(error, "게임 삭제에 실패했습니다."));
        }
      },
    });
  };

  const handleDownloadResults = async () => {
    setIsDownloading(true);

    try {
      const response = await api.get<VoteResult[]>("/api/admin/votes/results");
      const results = response.data;

      const sheetData = results.map((item) => ({
        "게임 이름": item.gameName,
        "참가 부문": item.category,
        "인상깊음 (점수)": item.impressive.score,
        "인상깊음 (금)": item.impressive.gold,
        "인상깊음 (은)": item.impressive.silver,
        "인상깊음 (동)": item.impressive.bronze,
        "재미 (점수)": item.fun.score,
        "재미 (금)": item.fun.gold,
        "재미 (은)": item.fun.silver,
        "재미 (동)": item.fun.bronze,
        "독창성 (점수)": item.original.score,
        "독창성 (금)": item.original.gold,
        "독창성 (은)": item.original.silver,
        "독창성 (동)": item.original.bronze,
        "완성도 (점수)": item.polished.score,
        "완성도 (금)": item.polished.gold,
        "완성도 (은)": item.polished.silver,
        "완성도 (동)": item.polished.bronze,
        총점: item.totalScore,
      }));

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(sheetData);
      XLSX.utils.book_append_sheet(workbook, worksheet, "투표 결과");
      XLSX.writeFile(workbook, "unicon_vote_results.xlsx");
      showFeedback("success", "투표 결과 XLSX를 저장했습니다.");
    } catch (error) {
      showFeedback("error", getErrorMessage(error, "투표 결과 다운로드에 실패했습니다."));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadUserVotes = async () => {
    setIsDownloadingUserVotes(true);

    try {
      const response = await api.get<UserVoteRecord[]>("/api/admin/votes/by-user");
      const results = response.data;

      const userSummary: Record<
        string,
        { totalVotes: number; ownClubVotes: number }
      > = {};

      results.forEach((vote) => {
        if (!userSummary[vote.userName]) {
          userSummary[vote.userName] = { totalVotes: 0, ownClubVotes: 0 };
        }

        userSummary[vote.userName].totalVotes += 1;

        if (vote.isOwnClubVote) {
          userSummary[vote.userName].ownClubVotes += 1;
        }
      });

      const summarySheetData = Object.keys(userSummary)
        .map((userName) => ({
          "사용자 이름": userName,
          "총 투표 수": userSummary[userName].totalVotes,
          "본인 동아리 투표 수": userSummary[userName].ownClubVotes,
        }))
        .sort((a, b) => b["총 투표 수"] - a["총 투표 수"]);

      const detailSheetData = results.map((item) => ({
        "사용자 이름": item.userName,
        "소속 동아리": item.userClub,
        "게임 이름": item.gameName,
        "평가 기준": item.criterion,
        메달: item.medal,
        "본인 동아리 투표": item.isOwnClubVote ? "O" : "X",
      }));

      const workbook = XLSX.utils.book_new();
      const wsSummary = XLSX.utils.json_to_sheet(summarySheetData);
      const wsDetail = XLSX.utils.json_to_sheet(detailSheetData);

      XLSX.utils.book_append_sheet(workbook, wsSummary, "사용자별 요약");
      XLSX.utils.book_append_sheet(workbook, wsDetail, "전체 투표 상세 내역");
      XLSX.writeFile(workbook, "unicon_user_vote_records.xlsx");
      showFeedback("success", "사용자별 투표 내역 XLSX를 저장했습니다.");
    } catch (error) {
      showFeedback("error", getErrorMessage(error, "사용자별 투표 내역 다운로드에 실패했습니다."));
    } finally {
      setIsDownloadingUserVotes(false);
    }
  };

  const handleDownloadUserAccounts = async () => {
    setIsDownloadingUserAccounts(true);

    try {
      const accountSheetRows = sortedUsers.map((user) => ({
        이름: user.name,
        팔찌번호: user.braceletNumber || "",
        역할: user.role,
        소속: user.club || "",
        UUID: user.uuid,
        "비밀번호 설정": user.hasPassword ? "예" : "아니오",
        "투표 이력": user.hasVotes ? "있음" : "없음",
        "여분 팔찌 후보": user.role === "guest" && !user.hasPassword && !user.hasVotes ? "예" : "아니오",
        "로그인 링크": getLoginUrl(user.uuid),
      }));

      const namedRows = accountSheetRows.filter(
        (row) => row.역할 === "user" || row.역할 === "admin"
      );
      const guestRows = accountSheetRows.filter((row) => row.역할 === "guest");

      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(accountSheetRows),
        "전체 계정"
      );
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(namedRows),
        "기명 계정"
      );
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(guestRows),
        "무기명 계정"
      );

      XLSX.writeFile(workbook, "unicon_user_accounts.xlsx");
      showFeedback("success", "계정 리스트 XLSX를 저장했습니다.");
    } catch (error) {
      showFeedback("error", getErrorMessage(error, "계정 리스트 다운로드에 실패했습니다."));
    } finally {
      setIsDownloadingUserAccounts(false);
    }
  };

  const selectedUserState = selectedUser ? getAccountState(selectedUser) : null;
  const spareBraceletCount = sortedUsers.filter(
    (user) => user.role === "guest" && !user.hasPassword && !user.hasVotes
  ).length;

  const gameCountLabel =
    games.length === 0 ? "아직 등록된 게임이 없습니다." : `${games.length}개 등록됨`;

  const currentSection: AdminSection = location.pathname.endsWith('/bracelets')
    ? 'bracelets'
    : location.pathname.endsWith('/games')
    ? 'games'
    : location.pathname.endsWith('/results')
    ? 'results'
    : 'dashboard';

  const sectionMeta: Record<AdminSection, { title: string; description: string }> = {
    dashboard: {
      title: '관리자 대시보드',
      description: '실시간 현황을 보고, 필요한 관리 앱으로 바로 이동합니다.',
    },
    bracelets: {
      title: '팔찌 관리',
      description: '기명/무기명 계정, QR, 비밀번호 초기화, 여분 팔찌 교체를 관리합니다.',
    },
    games: {
      title: '게임 관리',
      description: '게임 목록, 설명, 썸네일, 참가 부문을 행사 전후로 정리합니다.',
    },
    results: {
      title: '투표 결과 관리',
      description: '집계 현황을 보고 결과/내역 파일을 내려받습니다.',
    },
  };

  const adminApps = [
    {
      section: 'dashboard' as const,
      title: '대시보드',
      summary: '실시간 현황을 보고 각 관리 앱으로 이동합니다.',
      stat: `${voterCount}명 참여`,
    },
    {
      section: 'bracelets' as const,
      title: '팔찌 관리',
      summary: '계정 생성, QR 확인, 비밀번호 초기화, 팔찌 교체',
      stat: `${users.length}개 계정`,
    },
    {
      section: 'games' as const,
      title: '게임 관리',
      summary: '게임 등록, 설명/썸네일 수정, 삭제 제한 확인',
      stat: `${games.length}개 게임`,
    },
    {
      section: 'results' as const,
      title: '투표 결과 관리',
      summary: '종합 결과, 사용자별 내역, XLSX 다운로드',
      stat: `${voteResultsPreview.length}개 결과`,
    },
  ];

  const getUserDeleteBlockReason = (user: User) => {
    if (user.role === 'admin') {
      return '관리자 계정은 여기서 삭제할 수 없습니다.';
    }

    if (user.hasVotes) {
      return '이미 투표 이력이 있어 삭제할 수 없습니다.';
    }

    return null;
  };

  const getGameDeleteBlockReason = (game: Game) => {
    if (gameVoteState[game._id]) {
      return '이미 투표 이력이 있어 삭제할 수 없습니다.';
    }

    return null;
  };

  const canSubmitDangerAction =
    !!dangerAction &&
    (!dangerAction.checkboxLabel || dangerConfirmed) &&
    (!dangerAction.confirmationKeyword ||
      dangerConfirmText.trim() === dangerAction.confirmationKeyword);

  const dangerActionButtonClass =
    dangerAction?.tone === "error" ? "btn btn-error" : "btn btn-warning";

  const feedbackAlertClass =
    feedback?.tone === "success"
      ? "alert-success"
      : feedback?.tone === "error"
      ? "alert-error"
      : "alert-info";

  return (
    <div className="space-y-8 p-6 md:p-8">
      <header className="space-y-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-4xl font-bold">{sectionMeta[currentSection].title}</h1>
            <p className="mt-2 text-base-content/70">{sectionMeta[currentSection].description}</p>
          </div>
        </div>

        <div className="alert border border-base-300 bg-base-200">
          <div className="space-y-1 text-sm">
            <p className="font-semibold">접속 로직 요약</p>
            <p>
              모든 팔찌 QR은 <code>/login?uuid=&lt;UUID&gt;</code> 로 이동합니다.
              해당 UUID에 비밀번호가 있으면 로그인, 없으면 회원가입으로 자동
              이동합니다.
            </p>
            <p>
              따라서 현장 대응은 보통 <strong>검색</strong> →
              <strong> 정보 수정 또는 비밀번호 초기화</strong> →
              <strong> 필요하면 여분 팔찌로 교체</strong> 순서로 진행하면 됩니다.
            </p>
          </div>
        </div>

        {feedback && (
          <div className={`alert ${feedbackAlertClass} items-start`}>
            <div className="flex-1 whitespace-pre-line text-sm leading-6">
              {feedback.message}
            </div>
            <button
              className="btn btn-ghost btn-xs"
              onClick={() => setFeedback(null)}
            >
              닫기
            </button>
          </div>
        )}
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="stat rounded-2xl bg-primary text-primary-content shadow">
          <div className="stat-title text-primary-content/80">현재 투표 참여자 수</div>
          <div className="stat-value">{voterCount}명</div>
          <div className="stat-desc text-primary-content/70">15초마다 갱신</div>
        </div>
        <div className="stat rounded-2xl bg-base-200 shadow">
          <div className="stat-title">비밀번호 설정 완료</div>
          <div className="stat-value">{totalPasswordCount}명</div>
          <div className="stat-desc">
            user {userPasswordCount} / guest {guestPasswordCount}
          </div>
        </div>
        <div className="stat rounded-2xl bg-base-200 shadow">
          <div className="stat-title">여분 팔찌 후보</div>
          <div className="stat-value">{spareBraceletCount}개</div>
          <div className="stat-desc">guest + 비밀번호 미설정 계정</div>
        </div>
        <div className="stat rounded-2xl bg-base-200 shadow">
          <div className="stat-title">등록된 게임</div>
          <div className="stat-value">{games.length}개</div>
          <div className="stat-desc">행사 시작 전에 여기서 전체 게임 정보를 맞춥니다.</div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {adminApps.map((app) => {
          const isActive = currentSection === app.section;

          return (
            <Link
              key={app.section}
              to={app.section === 'dashboard' ? '/admin' : `/admin/${app.section}`}
              className={`rounded-[1.75rem] border p-5 transition ${
                isActive
                  ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                  : 'border-base-300 bg-base-200 hover:border-primary/40 hover:bg-base-100'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold">{app.title}</h2>
                <span className="badge badge-outline">{app.stat}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-base-content/70">{app.summary}</p>
              <div className="mt-4 text-sm font-semibold text-primary">
                {isActive ? '현재 보고 있는 앱' : '이 앱 열기'}
              </div>
            </Link>
          );
        })}
      </section>

      {currentSection === 'dashboard' && (
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-[1.75rem] border border-base-300 bg-base-200 p-5 lg:col-span-2">
            <h2 className="text-xl font-bold">실시간 운영 요약</h2>
            <p className="mt-2 text-sm leading-6 text-base-content/70">
              현재 투표 참여, 비밀번호 설정 완료, 여분 팔찌 수, 게임 등록 수를 위 카드에서 실시간으로 확인할 수 있습니다.
              현장 이슈 대응은 아래 앱으로 이동해 처리하세요.
            </p>
          </div>
          <div className="rounded-[1.75rem] border border-base-300 bg-base-200 p-5">
            <h2 className="text-xl font-bold">추천 동선</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-base-content/70">
              <li>• 행사 전: 팔찌 관리 → 게임 관리</li>
              <li>• 행사 중: 팔찌 관리 → 결과 관리</li>
              <li>• 행사 후: 결과 관리에서 파일 저장</li>
            </ul>
          </div>
        </section>
      )}

      {currentSection === 'bracelets' && (
      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body gap-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="card-title text-2xl">현장 대응 센터</h2>
                <p className="text-sm text-base-content/70">
                  이름, UUID, 동아리로 검색해서 바로 QR 확인, 링크 복사, 정보 수정,
                  비밀번호 초기화, 여분 팔찌 교체를 진행하세요.
                </p>
              </div>
              <input
                type="text"
                placeholder="이름, UUID, 동아리로 검색"
                className="input input-bordered w-full lg:max-w-sm"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="rounded-2xl border border-base-300 bg-base-100 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">검색 결과</h3>
                  <span className="text-xs text-base-content/60">
                    {searchTerm.trim()
                      ? `${filteredUsers.length}명 찾음`
                      : `최근 ${spotlightUsers.length}명 표시`}
                  </span>
                </div>

                <div className="mt-3 grid gap-2">
                  {spotlightUsers.length > 0 ? (
                    spotlightUsers.map((user) => {
                      const accountState = getAccountState(user);

                      return (
                        <button
                          key={user._id}
                          type="button"
                          className={`rounded-2xl border p-3 text-left transition ${
                            selectedUserUuid === user.uuid
                              ? "border-primary bg-primary/10"
                              : "border-base-300 bg-base-200 hover:border-primary/40"
                          }`}
                          onClick={() => setSelectedUserUuid(user.uuid)}
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold">{user.name}</span>
                            <span className={`badge ${getRoleBadgeClass(user.role)}`}>
                              {user.role}
                            </span>
                            <span className={`badge ${accountState.badgeClass}`}>
                              {accountState.label}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-base-content/70">
                            {user.braceletNumber || "팔찌번호 없음"} · {user.club || "소속 없음"}
                          </p>
                        </button>
                      );
                    })
                  ) : (
                    <div className="rounded-2xl border border-dashed border-base-300 p-6 text-center text-sm text-base-content/60">
                      검색 결과가 없습니다.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-base-300 bg-base-100 p-4">
                <h3 className="font-semibold">선택한 사용자</h3>

                {selectedUser && selectedUserState ? (
                  <div className="mt-3 space-y-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xl font-bold">{selectedUser.name}</span>
                        <span className={`badge ${getRoleBadgeClass(selectedUser.role)}`}>
                          {selectedUser.role}
                        </span>
                        <span className={`badge ${selectedUserState.badgeClass}`}>
                          {selectedUserState.label}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-base-content/70">
                        {selectedUserState.description}
                      </p>
                    </div>

                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="font-semibold">팔찌 번호</span>
                        <br />
                        {selectedUser.braceletNumber || "없음"}
                      </p>
                      <p>
                        <span className="font-semibold">UUID</span>
                        <br />
                        <code className="break-all">{selectedUser.uuid}</code>
                      </p>
                      <p>
                        <span className="font-semibold">소속</span>
                        <br />
                        {selectedUser.club || "없음"}
                      </p>
                      <p>
                        <span className="font-semibold">로그인 링크</span>
                        <br />
                        <code className="break-all text-xs">
                          {getLoginUrl(selectedUser.uuid)}
                        </code>
                      </p>
                    </div>

                    <div className="grid gap-2">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setQrModalUser(selectedUser)}
                      >
                        QR 보기
                      </button>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => void handleCopyLoginUrl(selectedUser)}
                      >
                        로그인 링크 복사
                      </button>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => openEditModal(selectedUser)}
                      >
                        사용자 정보 수정
                      </button>
                      <button
                        className="btn btn-warning btn-sm"
                        onClick={() => void handleResetPassword(selectedUser)}
                      >
                        비밀번호 초기화
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => openBraceletTransferModal(selectedUser)}
                      >
                        여분 팔찌로 교체
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 rounded-2xl border border-dashed border-base-300 p-6 text-sm text-base-content/60">
                    왼쪽에서 사용자를 선택하면 상세 정보와 현장 대응 액션이 표시됩니다.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-200 shadow-xl">
          <div className="card-body gap-4">
            <h2 className="card-title text-2xl">여분 팔찌 운영 팁</h2>
            <div className="rounded-2xl bg-base-100 p-4 text-sm leading-6">
              <p className="font-semibold">권장 규칙</p>
              <p>
                여분 팔찌는 <code>guest</code> 계정으로 미리 만들어 두고, 이름은
                <code>무기명-01</code>, <code>무기명-02</code>처럼 관리하면 찾기 쉽습니다.
              </p>
            </div>
            <div className="rounded-2xl bg-base-100 p-4 text-sm leading-6">
              <p className="font-semibold">교체 시 동작</p>
              <p>
                여분 팔찌로 교체하면 대상 사용자의 UUID가 새 팔찌 UUID로 바뀝니다.
                기존 QR은 더 이상 로그인에 쓸 수 없습니다.
              </p>
            </div>
            <div className="rounded-2xl bg-base-100 p-4 text-sm leading-6">
              <p className="font-semibold">현재 사용 가능한 여분 팔찌</p>
              <div className="mt-2 space-y-2">
                {sparePreviewUsers.length > 0 ? (
                  sparePreviewUsers.map((user) => (
                    <div key={user._id} className="rounded-xl bg-base-200 p-3">
                      <p className="font-medium">{user.name}</p>
                      <p className="break-all text-xs text-base-content/70">
                        {user.uuid}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-base-content/60">
                    현재 즉시 사용할 여분 guest 계정이 없습니다.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
      )}

      {currentSection === 'bracelets' && (
      <section className="grid gap-6 xl:grid-cols-2">
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl">사용자 생성</h2>
            <p className="text-sm text-base-content/70">
              현장에서 등록 누락이 발견되면 여기서 바로 계정을 만들고 QR을 보여줄 수
              있습니다.
            </p>
            <form onSubmit={handleCreateUser} className="grid gap-3">
              <input
                type="text"
                placeholder="팔찌 번호"
                className="input input-bordered"
                required
                value={newUser.braceletNumber}
                onChange={(event) =>
                  setNewUser({ ...newUser, braceletNumber: event.target.value })
                }
              />
              <input
                type="text"
                placeholder="사용자 이름"
                className="input input-bordered"
                required
                value={newUser.name}
                onChange={(event) =>
                  setNewUser({ ...newUser, name: event.target.value })
                }
              />
              <div className="grid gap-3 md:grid-cols-2">
                <select
                  className="select select-bordered"
                  value={newUser.role}
                  onChange={(event) =>
                    setNewUser({
                      ...newUser,
                      role: event.target.value as User["role"],
                    })
                  }
                >
                  <option value="guest">guest</option>
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
                <input
                  type="text"
                  placeholder="소속 동아리 (선택)"
                  className="input input-bordered"
                  value={newUser.club}
                  onChange={(event) =>
                    setNewUser({ ...newUser, club: event.target.value })
                  }
                />
              </div>
              <button type="submit" className="btn btn-primary">
                사용자 생성 후 QR 열기
              </button>
            </form>
          </div>
        </div>

        <div className="card bg-base-200 shadow-xl">
          <div className="card-body gap-4">
            <h2 className="card-title text-2xl">행사 준비 일괄 작업</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <button className="btn btn-outline" onClick={handleDownloadBraceletTemplate}>
                XLSX 템플릿 다운로드
              </button>
              <button className="btn btn-outline" onClick={handleDownloadVendorBraceletSheet}>
                업체용 링크 XLSX
              </button>
              <button className="btn btn-outline" onClick={handleDownloadOperatorBraceletSheet}>
                운영진 배포 XLSX
              </button>
              <button className="btn btn-outline" onClick={handleDownloadUserAccounts} disabled={isDownloadingUserAccounts}>
                {isDownloadingUserAccounts ? '생성 중...' : '전체 계정 XLSX'}
              </button>
            </div>

            <div className="rounded-2xl border border-base-300 bg-base-100 p-4">
              <p className="font-semibold">기명/무기명 팔찌 DB 업로드</p>
              <p className="mt-2 text-sm text-base-content/70">
                템플릿을 채운 뒤 업로드하면 UUID는 서버에서 생성됩니다. 기존 팔찌 번호와 겹치면 거부됩니다.
              </p>
              <input
                type="file"
                accept=".xlsx,.xls"
                className="file-input file-input-bordered mt-3 w-full"
                onChange={(event) => void handleImportBraceletFile(event)}
              />
              {bulkImportFileName && (
                <div className="mt-3 rounded-xl bg-base-200 p-3 text-sm">
                  <p className="font-semibold">업로드 파일</p>
                  <p>{bulkImportFileName}</p>
                  <p className="text-base-content/70">미리보기 {bulkImportRows.length}개 행</p>
                </div>
              )}
              <button className="btn btn-primary mt-4 w-full" onClick={() => void handleBulkImportUsers()} disabled={isBulkImporting || bulkImportRows.length === 0}>
                {isBulkImporting ? '등록 중...' : `미리보기 ${bulkImportRows.length}개 행 등록`}
              </button>
            </div>

            <div className="rounded-2xl border border-base-300 bg-base-100 p-4">
              <p className="font-semibold">무기명 팔찌 숫자 생성</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <input type="number" min={1} className="input input-bordered" value={guestGenerationStartNumber} onChange={(event) => setGuestGenerationStartNumber(Number(event.target.value) || 1)} placeholder="시작 번호" />
                <input type="number" min={1} className="input input-bordered" value={guestGenerationCount} onChange={(event) => setGuestGenerationCount(Number(event.target.value) || 1)} placeholder="생성 수량" />
              </div>
              <button className="btn btn-secondary mt-4 w-full" onClick={() => void handleGenerateGuests()} disabled={isGeneratingGuests}>
                {isGeneratingGuests ? '생성 중...' : '무기명 팔찌 일괄 생성'}
              </button>
            </div>

            <div className="rounded-2xl border border-error/40 bg-error/10 p-4">
              <p className="font-semibold text-error">행사 전 정리용 일괄 삭제</p>
              <p className="mt-2 text-sm text-base-content/70">
                팔찌 번호를 줄바꿈 또는 쉼표로 입력하세요. 비밀번호 없는 guest + 투표 이력 없는 계정만 일괄 삭제할 수 있습니다.
              </p>
              <textarea
                className="textarea textarea-bordered mt-3 min-h-28 w-full"
                placeholder="예: 1001, 1002 또는 줄바꿈 입력"
                value={bulkDeleteBraceletNumbers}
                onChange={(event) => setBulkDeleteBraceletNumbers(event.target.value)}
              />
              <button className="btn btn-error mt-4 w-full" onClick={() => void handleBulkDeleteUsers()} disabled={isDeletingBulkUsers}>
                {isDeletingBulkUsers ? '삭제 중...' : '팔찌 번호 기준 일괄 삭제'}
              </button>
            </div>
          </div>
        </div>
      </section>
      )}

      {currentSection === 'bracelets' && (
      <section className="card bg-base-200 shadow-xl">
        <div className="card-body gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="card-title text-2xl">전체 사용자 목록</h2>
              <p className="text-sm text-base-content/70">
                행사 전 사전 점검이나 일괄 확인이 필요할 때 사용하세요.
              </p>
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setIsUserListVisible((prev) => !prev)}
            >
              {isUserListVisible ? "목록 숨기기" : "목록 보기"}
            </button>
          </div>

          {isUserListVisible && (
            <div className="overflow-x-auto rounded-2xl border border-base-300 bg-base-100">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>이름</th>
                    <th>팔찌 번호</th>
                    <th>역할</th>
                    <th>상태</th>
                    <th>소속</th>
                    <th>UUID</th>
                    <th>액션</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const accountState = getAccountState(user);
                    const userDeleteBlockReason = getUserDeleteBlockReason(user);

                    return (
                      <tr key={user._id}>
                        <td className="font-medium">{user.name}</td>
                        <td>{user.braceletNumber || '-'}</td>
                        <td>
                          <span className={`badge ${getRoleBadgeClass(user.role)}`}>
                            {user.role}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${accountState.badgeClass}`}>
                            {accountState.label}
                          </span>
                        </td>
                        <td>{user.club || "-"}</td>
                        <td className="max-w-[220px] truncate text-xs">
                          <code>{user.uuid}</code>
                        </td>
                        <td>
                          <div className="flex flex-wrap gap-2">
                            <button
                              className="btn btn-xs btn-info"
                              onClick={() => setQrModalUser(user)}
                            >
                              QR
                            </button>
                            <button
                              className="btn btn-xs btn-outline"
                              onClick={() => openEditModal(user)}
                            >
                              수정
                            </button>
                            <button
                              className="btn btn-xs btn-warning"
                              onClick={() => void handleResetPassword(user)}
                            >
                              비밀번호 초기화
                            </button>
                            <button
                              className="btn btn-xs btn-secondary"
                              onClick={() => openBraceletTransferModal(user)}
                            >
                              팔찌 교체
                            </button>
                            <button
                              className="btn btn-xs btn-error"
                              onClick={() => void handleDeleteUser(user)}
                              disabled={!!userDeleteBlockReason}
                              title={userDeleteBlockReason || undefined}
                            >
                              {userDeleteBlockReason ? '삭제 제한' : '삭제'}
                            </button>
                          </div>
                          {userDeleteBlockReason && (
                            <p className="mt-2 text-xs text-error">{userDeleteBlockReason}</p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
      )}

      {currentSection === 'games' && (
      <section className="grid gap-6 xl:grid-cols-2">
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body gap-4">
            <div>
              <h2 className="card-title text-2xl">게임/썸네일 준비</h2>
              <p className="text-sm text-base-content/70">
                행사 시작 전에 여기서 게임 설명, 참가 부문, 개발자, 썸네일 URL을 정리합니다.
              </p>
            </div>

            <div className="rounded-2xl bg-base-100 p-4 text-sm leading-6">
              <p className="font-semibold">입력 규칙</p>
              <p>
                개발자 목록은 <code>동아리_이름</code> 형식으로 쉼표 구분 입력을 권장합니다.
              </p>
              <p>
                썸네일은 <strong>파일 업로드</strong> 또는 <strong>CDN URL 직접 입력</strong> 두 방식 모두 가능합니다.
              </p>
            </div>

            <form onSubmit={handleAddGame} className="grid gap-3">
              <input type="text" placeholder="게임 이름" className="input input-bordered" required value={newGame.name} onChange={(event) => setNewGame({ ...newGame, name: event.target.value })} />
              <textarea placeholder="게임 설명" className="textarea textarea-bordered min-h-28" required value={newGame.description} onChange={(event) => setNewGame({ ...newGame, description: event.target.value })} />
              <div className="grid gap-3 md:grid-cols-2">
                <select className="select select-bordered" value={newGame.category} onChange={(event) => setNewGame({ ...newGame, category: event.target.value as "Challenger" | "Rookie" })}>
                  <option value="Challenger">챌린저</option>
                  <option value="Rookie">루키</option>
                </select>
                <input type="text" placeholder="개발자 목록 (쉼표 구분, 예: Club_이름)" className="input input-bordered" required value={newGame.developers} onChange={(event) => setNewGame({ ...newGame, developers: event.target.value })} />
              </div>
              <div className="grid gap-3 rounded-2xl border border-base-300 bg-base-100 p-4">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                  <label className="form-control">
                    <span className="label-text mb-2">썸네일 파일 업로드</span>
                    <input type="file" accept="image/*" className="file-input file-input-bordered" onChange={(event: ChangeEvent<HTMLInputElement>) => setNewGameImageFile(event.target.files?.[0] || null)} />
                  </label>
                  <button type="button" className="btn btn-outline" onClick={() => void handleUploadNewGameImage()} disabled={isUploadingNewGameImage}>
                    {isUploadingNewGameImage ? "업로드 중..." : "썸네일 업로드"}
                  </button>
                </div>
                <input type="text" placeholder="또는 썸네일 CDN URL 직접 입력" className="input input-bordered" required value={newGame.imageUrl} onChange={(event) => setNewGame({ ...newGame, imageUrl: event.target.value })} />
                {newGame.imageUrl && (
                  <div className="rounded-2xl border border-base-300 bg-base-200 p-3">
                    <p className="mb-2 text-xs font-semibold text-base-content/70">썸네일 미리보기</p>
                    <img src={newGame.imageUrl} alt="새 게임 썸네일 미리보기" className="h-40 w-full rounded-xl object-cover" />
                  </div>
                )}
              </div>
              <button type="submit" className="btn btn-primary">게임 추가</button>
            </form>
          </div>
        </div>

        <section className="card bg-base-200 shadow-xl">
        <div className="card-body gap-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="card-title text-2xl">등록된 게임</h2>
              <p className="text-sm text-base-content/70">{gameCountLabel}</p>
            </div>
            <div className="rounded-full bg-base-100 px-4 py-2 text-sm text-base-content/70">
              썸네일이 없거나 설명이 어색하면 여기서 수정하세요.
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-base-300 bg-base-100">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>썸네일</th>
                  <th>게임 이름</th>
                  <th>부문</th>
                  <th>개발자</th>
                  <th>액션</th>
                </tr>
              </thead>
              <tbody>
                {games.map((game) => {
                  const gameDeleteBlockReason = getGameDeleteBlockReason(game);

                  return (
                  <tr key={game._id}>
                    <td>
                      <img
                        src={game.imageUrl}
                        alt={game.name}
                        className="h-16 w-24 rounded-lg object-cover"
                      />
                    </td>
                    <td>
                      <div className="font-medium">{game.name}</div>
                      <div className="max-w-md text-sm text-base-content/60">
                        {game.description}
                      </div>
                    </td>
                    <td>{game.category}</td>
                    <td>{game.developers.join(", ")}</td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => openEditGameModal(game)}
                        >
                          수정
                        </button>
                        <button
                          className="btn btn-sm btn-error"
                          onClick={() => void handleDeleteGame(game)}
                          disabled={!!gameDeleteBlockReason}
                          title={gameDeleteBlockReason || undefined}
                        >
                          {gameDeleteBlockReason ? '삭제 제한' : '삭제'}
                        </button>
                        {gameDeleteBlockReason && (
                          <p className="w-full text-xs text-error">{gameDeleteBlockReason}</p>
                        )}
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      </section>
      )}

      {currentSection === 'results' && (
        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body gap-4">
              <h2 className="card-title text-2xl">결과 파일 관리</h2>
              <p className="text-sm text-base-content/70">
                운영 종료 전후에 필요한 파일을 여기서 정리해서 내려받을 수 있습니다.
              </p>
              <div className="grid gap-3">
                <button className="btn btn-outline" onClick={handleDownloadUserAccounts} disabled={isDownloadingUserAccounts}>
                  {isDownloadingUserAccounts ? '생성 중...' : '🪪 계정 리스트 (XLSX)'}
                </button>
                <button className="btn btn-success" onClick={handleDownloadResults} disabled={isDownloading}>
                  {isDownloading ? '집계 중...' : '📊 종합 결과 (XLSX)'}
                </button>
                <button className="btn btn-info" onClick={handleDownloadUserVotes} disabled={isDownloadingUserVotes}>
                  {isDownloadingUserVotes ? '생성 중...' : '👤 사용자별 내역 (XLSX)'}
                </button>
              </div>
            </div>
          </div>

          <div className="card bg-base-200 shadow-xl">
            <div className="card-body gap-4">
              <div>
                <h2 className="card-title text-2xl">현재 집계 미리보기</h2>
                <p className="text-sm text-base-content/70">상위 게임과 총점을 빠르게 확인합니다.</p>
              </div>
              <div className="overflow-x-auto rounded-2xl border border-base-300 bg-base-100">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>순위</th>
                      <th>게임</th>
                      <th>부문</th>
                      <th>총점</th>
                    </tr>
                  </thead>
                  <tbody>
                    {voteResultsPreview
                      .slice()
                      .sort((a, b) => b.totalScore - a.totalScore)
                      .map((item, index) => (
                        <tr key={item.gameId}>
                          <td>{index + 1}</td>
                          <td>{item.gameName}</td>
                          <td>{item.category}</td>
                          <td>{item.totalScore}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      )}

      <Modal
        isOpen={!!dangerAction}
        onClose={closeDangerAction}
        title={dangerAction?.title || "위험 작업 확인"}
        className="max-w-2xl"
        footer={
          <div className="modal-action">
            <button className="btn btn-ghost" onClick={closeDangerAction}>
              취소
            </button>
            <button
              className={dangerActionButtonClass}
              onClick={() => void runDangerAction()}
              disabled={!canSubmitDangerAction || isRunningDangerAction}
            >
              {isRunningDangerAction
                ? "처리 중..."
                : dangerAction?.confirmLabel || "실행"}
            </button>
          </div>
        }
      >
        {dangerAction && (
          <div className="grid gap-4">
            <div className="alert alert-warning items-start text-sm leading-6">
              <span>{dangerAction.description}</span>
            </div>

            <div className="rounded-2xl border border-base-300 bg-base-200 p-4 text-sm leading-6">
              <p className="mb-2 font-semibold">실행 전 확인 사항</p>
              <ul className="space-y-2">
                {dangerAction.impactLines.map((line) => (
                  <li key={line}>• {line}</li>
                ))}
              </ul>
            </div>

            {dangerAction.checkboxLabel && (
              <label className="label cursor-pointer justify-start gap-3 rounded-2xl bg-base-200 p-4">
                <input
                  type="checkbox"
                  className="checkbox checkbox-warning"
                  checked={dangerConfirmed}
                  onChange={(event) => setDangerConfirmed(event.target.checked)}
                />
                <span className="label-text">{dangerAction.checkboxLabel}</span>
              </label>
            )}

            {dangerAction.confirmationKeyword && (
              <label className="form-control">
                <span className="label-text mb-2">
                  계속하려면 <code>{dangerAction.confirmationKeyword}</code> 를 정확히 입력하세요.
                </span>
                <input
                  type="text"
                  className="input input-bordered"
                  value={dangerConfirmText}
                  onChange={(event) => setDangerConfirmText(event.target.value)}
                  placeholder={dangerAction.confirmationKeyword}
                />
              </label>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!qrModalUser}
        onClose={() => setQrModalUser(null)}
        title={qrModalUser ? `${qrModalUser.name} 로그인 QR` : "사용자 로그인 QR"}
        className="max-w-xl"
        footer={
          <div className="modal-action">
            {qrModalUser && (
              <button
                className="btn btn-outline"
                onClick={() => void handleCopyLoginUrl(qrModalUser)}
              >
                로그인 링크 복사
              </button>
            )}
            <button className="btn" onClick={() => setQrModalUser(null)}>
              닫기
            </button>
          </div>
        }
      >
        {qrModalUser && (
          <div className="flex flex-col items-center gap-4">
            <QRCodeSVG value={getLoginUrl(qrModalUser.uuid)} size={240} />
            <div className="text-center text-sm text-base-content/70">
              <p>이 QR을 스캔하면 해당 UUID의 로그인 페이지로 바로 이동합니다.</p>
              <p className="mt-2 break-all">
                <code>{getLoginUrl(qrModalUser.uuid)}</code>
              </p>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="사용자 정보 수정"
        className="max-w-2xl"
        footer={
          <div className="modal-action">
            <button className="btn btn-ghost" onClick={() => setEditingUser(null)}>
              취소
            </button>
            <button
              className="btn btn-primary"
              form="edit-user-form"
              type="submit"
              disabled={isSavingUser}
            >
              {isSavingUser ? "저장 중..." : "저장"}
            </button>
          </div>
        }
      >
        {editingUser && (
          <form
            id="edit-user-form"
            onSubmit={handleUpdateUser}
            className="grid gap-4"
          >
            <div className="grid gap-4 md:grid-cols-3">
              <label className="form-control">
                <span className="label-text mb-2">이름</span>
                <input
                  type="text"
                  className="input input-bordered"
                  value={editingUser.name}
                  onChange={(event) =>
                    setEditingUser({ ...editingUser, name: event.target.value })
                  }
                  required
                />
              </label>
              <label className="form-control">
                <span className="label-text mb-2">팔찌 번호</span>
                <input
                  type="text"
                  className="input input-bordered"
                  value={editingUser.braceletNumber}
                  onChange={(event) =>
                    setEditingUser({ ...editingUser, braceletNumber: event.target.value })
                  }
                  required
                />
              </label>
              <label className="form-control">
                <span className="label-text mb-2">역할</span>
                <select
                  className="select select-bordered"
                  value={editingUser.role}
                  onChange={(event) =>
                    setEditingUser({
                      ...editingUser,
                      role: event.target.value as User["role"],
                    })
                  }
                >
                  <option value="guest">guest</option>
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </label>
            </div>
            {editingUser.role === "admin" && editingUser.originalRole !== "admin" && (
              <div className="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm leading-6">
                admin 권한을 주면 이 계정으로 관리자 페이지와 운영 기능 전체에 접근할 수 있습니다.
              </div>
            )}
            <label className="form-control">
              <span className="label-text mb-2">소속 동아리</span>
              <input
                type="text"
                className="input input-bordered"
                value={editingUser.club}
                onChange={(event) =>
                  setEditingUser({ ...editingUser, club: event.target.value })
                }
                placeholder="guest라면 비워둘 수 있습니다."
              />
            </label>
            <div className="rounded-2xl bg-base-200 p-4 text-sm text-base-content/70">
              이름이 잘못 등록되었거나, guest 이름을 현장에서 실제 이름으로 바꿔야
              할 때 여기서 수정하면 됩니다.
            </div>
          </form>
        )}
      </Modal>

      <Modal
        isOpen={!!braceletTransferForm}
        onClose={() => setBraceletTransferForm(null)}
        title="여분 팔찌로 교체"
        className="max-w-2xl"
        footer={
          <div className="modal-action">
            <button
              className="btn btn-ghost"
              onClick={() => setBraceletTransferForm(null)}
            >
              취소
            </button>
            <button
              className="btn btn-secondary"
              form="replace-bracelet-form"
              type="submit"
              disabled={
                isReplacingBracelet ||
                !braceletTransferForm?.spareUuid ||
                !braceletTransferForm.acknowledgedImpact
              }
            >
              {isReplacingBracelet ? "교체 중..." : "교체 실행"}
            </button>
          </div>
        }
      >
        {braceletTransferForm && selectedUser ? (
          <form
            id="replace-bracelet-form"
            onSubmit={handleReplaceBracelet}
            className="grid gap-4"
          >
            <div className="rounded-2xl bg-base-200 p-4 text-sm leading-6">
              <p className="font-semibold">{selectedUser.name} 계정을 새 팔찌로 옮깁니다.</p>
              <p>
                선택한 guest 여분 팔찌 UUID가 이 사용자의 새 로그인 QR이 됩니다.
                기존 QR은 더 이상 로그인에 사용할 수 없습니다.
              </p>
            </div>

            <label className="form-control">
              <span className="label-text mb-2">대상 사용자</span>
              <input
                type="text"
                className="input input-bordered"
                value={`${selectedUser.name} (${selectedUser.uuid})`}
                disabled
              />
            </label>

            <label className="form-control">
              <span className="label-text mb-2">여분 guest 팔찌 선택</span>
              <select
                className="select select-bordered"
                value={braceletTransferForm.spareUuid}
                onChange={(event) =>
                  setBraceletTransferForm({
                    ...braceletTransferForm,
                    spareUuid: event.target.value,
                  })
                }
              >
                <option value="">선택하세요</option>
                {availableSpareUsers.map((user) => (
                  <option key={user.uuid} value={user.uuid}>
                    {user.name} ({user.uuid})
                  </option>
                ))}
              </select>
            </label>

            {selectedSpareUser && (
              <div className="rounded-2xl border border-base-300 bg-base-100 p-4 text-sm leading-6">
                <p className="font-semibold">교체 미리보기</p>
                <p className="mt-2">현재 계정: {selectedUser.name}</p>
                <p className="text-base-content/70">기존 UUID: {selectedUser.uuid}</p>
                <p className="mt-3">새 팔찌 계정: {selectedSpareUser.name}</p>
                <p className="text-base-content/70">새 UUID: {selectedSpareUser.uuid}</p>
              </div>
            )}

            <label className="label cursor-pointer justify-start gap-3 rounded-2xl bg-base-200 p-4">
              <input
                type="checkbox"
                className="checkbox checkbox-warning"
                checked={braceletTransferForm.resetPassword}
                onChange={(event) =>
                  setBraceletTransferForm({
                    ...braceletTransferForm,
                    resetPassword: event.target.checked,
                  })
                }
              />
              <span className="label-text">
                비밀번호도 함께 초기화하기
                <br />
                <span className="text-xs text-base-content/60">
                  QR이 망가졌을 뿐 아니라 비밀번호도 잊어버린 경우 체크하세요.
                </span>
              </span>
            </label>

            <label className="label cursor-pointer justify-start gap-3 rounded-2xl bg-warning/10 p-4">
              <input
                type="checkbox"
                className="checkbox checkbox-warning"
                checked={braceletTransferForm.acknowledgedImpact}
                onChange={(event) =>
                  setBraceletTransferForm({
                    ...braceletTransferForm,
                    acknowledgedImpact: event.target.checked,
                  })
                }
              />
              <span className="label-text">
                선택한 새 UUID와 영향 범위를 확인했습니다.
                <br />
                <span className="text-xs text-base-content/60">
                  실행 후 기존 QR은 즉시 쓸 수 없게 됩니다.
                </span>
              </span>
            </label>

            <div className="rounded-2xl border border-dashed border-base-300 p-4 text-sm text-base-content/70">
              사용 가능한 여분 팔찌는 <code>guest</code> 역할이고 비밀번호나 투표
              이력이 없는 계정만 표시됩니다.
            </div>
          </form>
        ) : null}
      </Modal>

      <Modal
        isOpen={!!editingGame}
        onClose={() => {
          setEditingGame(null);
          setEditingGameImageFile(null);
        }}
        title="게임 정보 수정"
        className="max-w-3xl"
        footer={
          <div className="modal-action">
            <button
              className="btn btn-ghost"
              onClick={() => {
                setEditingGame(null);
                setEditingGameImageFile(null);
              }}
            >
              취소
            </button>
            <button
              className="btn btn-primary"
              form="edit-game-form"
              type="submit"
              disabled={isSavingGame}
            >
              {isSavingGame ? "저장 중..." : "게임 저장"}
            </button>
          </div>
        }
      >
        {editingGame && (
          <form
            id="edit-game-form"
            onSubmit={handleUpdateGame}
            className="grid gap-4"
          >
            <input
              type="text"
              className="input input-bordered"
              value={editingGame.name}
              onChange={(event) =>
                setEditingGame({ ...editingGame, name: event.target.value })
              }
              placeholder="게임 이름"
              required
            />
            <textarea
              className="textarea textarea-bordered min-h-28"
              value={editingGame.description}
              onChange={(event) =>
                setEditingGame({ ...editingGame, description: event.target.value })
              }
              placeholder="게임 설명"
              required
            />
            <div className="grid gap-3 md:grid-cols-2">
              <select
                className="select select-bordered"
                value={editingGame.category}
                onChange={(event) =>
                  setEditingGame({
                    ...editingGame,
                    category: event.target.value as "Challenger" | "Rookie",
                  })
                }
              >
                <option value="Challenger">챌린저</option>
                <option value="Rookie">루키</option>
              </select>
              <input
                type="text"
                className="input input-bordered"
                value={editingGame.developers}
                onChange={(event) =>
                  setEditingGame({ ...editingGame, developers: event.target.value })
                }
                placeholder="개발자 목록 (쉼표 구분)"
                required
              />
            </div>

            <div className="grid gap-3 rounded-2xl border border-base-300 bg-base-100 p-4">
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <label className="form-control">
                  <span className="label-text mb-2">새 썸네일 파일 업로드</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="file-input file-input-bordered"
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setEditingGameImageFile(event.target.files?.[0] || null)
                    }
                  />
                </label>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => void handleUploadEditingGameImage()}
                  disabled={isUploadingEditingGameImage}
                >
                  {isUploadingEditingGameImage ? "업로드 중..." : "썸네일 업로드"}
                </button>
              </div>

              <input
                type="text"
                className="input input-bordered"
                value={editingGame.imageUrl}
                onChange={(event) =>
                  setEditingGame({ ...editingGame, imageUrl: event.target.value })
                }
                placeholder="또는 썸네일 CDN URL 직접 입력"
                required
              />

              {editingGame.imageUrl && (
                <div className="rounded-2xl border border-base-300 bg-base-200 p-3">
                  <p className="mb-2 text-xs font-semibold text-base-content/70">
                    썸네일 미리보기
                  </p>
                  <img
                    src={editingGame.imageUrl}
                    alt={`${editingGame.name} 썸네일 미리보기`}
                    className="h-48 w-full rounded-xl object-cover"
                  />
                </div>
              )}
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default AdminPage;

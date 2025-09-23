import { useState, useEffect, useMemo } from "react";
import type { Game } from "../types";
import api from "../api";
import SplitText from "../components/reactbits/SplitText";
import GameCard from "../components/GameCard";
import GameList from "../components/GameList"; // 1. GameList 컴포넌트 import
import Modal from "../components/Modal";
import VoteModal from "../components/VoteModal";
import { jwtDecode } from "jwt-decode"; // 1. jwt-decode 임포트

interface DecodedToken {
  name: string;
  uuid: string;
  club?: string; // 2. club 정보 optional 추가
  role: "user" | "admin";
  iat: number;
  exp: number;
}

interface Vote {
  _id: string;
  user: string;
  game: string;
  criterion: "impressive" | "fun" | "original" | "polished";
  medal: "gold" | "silver" | "bronze";
}

function MainPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [userVotes, setUserVotes] = useState<Vote[]>([]);
  const [votingGame, setVotingGame] = useState<Game | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", message: "" });
  const [userName, setUserName] = useState("...");
  const [userClub, setUserClub] = useState<string | undefined>(undefined); // 1. userClub state 추가

  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array]; // 원본 배열을 수정하지 않기 위해 복사
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]]; // 요소 위치 교환
    }
    return newArray;
  };
  const fetchData = async () => {
    try {
      const [gamesRes, votesRes] = await Promise.all([
        api.get<Game[]>("/api/games"),
        api.get<Vote[]>("/api/votes/my-votes"),
      ]);
      setGames(gamesRes.data);
      setUserVotes(votesRes.data);
    } catch (error) {
      console.error("데이터 로딩 실패:", error);
    }
  };

  useEffect(() => {
    try {
      const token = localStorage.getItem("authToken");
      if (token) {
        const decodedToken: DecodedToken = jwtDecode(token);
        setUserName(decodedToken.name);
        setUserClub(decodedToken.club); // 2. 토큰에서 club 정보 추출
      }
    } catch (error) {
      console.error("Invalid token:", error);
    }
    fetchData();
  }, []);

  const handleVote = async (
    criterion: Vote["criterion"],
    medal: Vote["medal"]
  ) => {
    if (!votingGame) return;
    try {
      await api.post("/api/votes", {
        gameId: votingGame._id,
        criterion,
        medal,
      });
      await fetchData(); // 성공 시 데이터 새로고침
    } catch (error) {
      console.error("투표 실패:", error);
      alert(
        "투표에 실패했습니다. 이미 사용한 메달이거나, 해당 게임의 동일 기준에 이미 투표했습니다."
      );
    }
  };

  const handleCancelVote = async (criterion: Vote["criterion"]) => {
    if (!votingGame) return;
    try {
      await api.delete("/api/votes", {
        data: { gameId: votingGame._id, criterion },
      });
      await fetchData(); // 성공 시 데이터 새로고침
    } catch (error) {
      console.error("투표 취소 실패:", error);
    }
  };

  const { votesByGame, usedMedals, totalVotesByGame } = useMemo(() => {
    const votesByGame: Record<string, Record<string, string>> = {};
    const usedMedals: Record<string, { gameId: string }> = {};
    const totalVotesByGame: Record<string, number> = {};

    userVotes.forEach((vote) => {
      if (!votesByGame[vote.game]) votesByGame[vote.game] = {};
      votesByGame[vote.game][vote.criterion] = vote.medal;
      usedMedals[`${vote.criterion}-${vote.medal}`] = { gameId: vote.game };
      totalVotesByGame[vote.game] = (totalVotesByGame[vote.game] || 0) + 1;
    });
    return { votesByGame, usedMedals, totalVotesByGame };
  }, [userVotes]);

  const votedGames = useMemo(() => {
    // 전체 게임 목록에서, 내가 투표한 게임들만 필터링합니다.
    return games.filter((game) => (totalVotesByGame[game._id] || 0) > 0);
  }, [games, totalVotesByGame]); // games나 totalVotesByGame이 바뀔 때만 다시 계산

  return (
    <div className="p-6 md:p-10 bg-base-200 min-h-screen">
      <header className="text-center mb-10">
        <SplitText
          text={`안녕하세요, ${userName}님!`}
          className="text-4xl md:text-5xl font-bold pb-1 pt-10"
          splitType="chars"
          delay={70}
          duration={2}
          ease="elastic.out"
          from={{ opacity: 0, y: 20 }}
          to={{ opacity: 1, y: 0 }}
        />
        <p className="mt-4 text-lg text-base-content/80">
          UNICON의 게임들에 메달을 수여해주세요!
        </p>
        <p className="mt-4 text-lg text-base-content/80">
          4가지 기준에 맞춰 금, 은, 동메달을 수여할 수 있어요.
        </p>
        <p className="mt-4 text-lg text-base-content/80">
          다시 투표하기 버튼을 눌러 언제든지 투표를 수정할 수 있어요.
        </p>
      </header>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">🗳️ 내가 투표한 게임</h2>
        {votedGames.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {votedGames.map((game) => (
              <GameCard
                key={game._id}
                game={game}
                voteCount={totalVotesByGame[game._id] || 0}
                myVotes={votesByGame[game._id] || {}}
                onVoteClick={() => setVotingGame(game)}
              />
            ))}
          </div>
        ) : (
          <div className="card bg-base-100/50 p-8 text-center">
            <p className="text-base-content/60">아직 투표한 게임이 없어요.</p>
          </div>
        )}
      </section>

      <div className="divider my-8"></div>

      {/* --- GameList에는 전체 게임 목록을 그대로 전달 --- */}
      <GameList
        games={shuffleArray(games)}
        totalVotesByGame={totalVotesByGame}
        votesByGame={votesByGame}
        userClub={userClub}
        onVoteClick={(game) => setVotingGame(game)}
      />

      {/* --- votingGame state에 따라 VoteModal을 렌더링 --- */}
      {votingGame && (
        <VoteModal
          isOpen={!!votingGame}
          onClose={() => setVotingGame(null)}
          game={votingGame}
          onVote={handleVote}
          onCancelVote={handleCancelVote}
          usedMedals={usedMedals}
          votesForThisGame={votesByGame[votingGame._id] || {}}
        />
      )}
    </div>
  );
}

export default MainPage;

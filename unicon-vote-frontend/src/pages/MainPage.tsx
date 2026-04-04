import { useEffect, useMemo, useRef, useState } from "react";
import type { Game } from "../types";
import api from "../api";
import GameCard from "../components/GameCard";
import GameList from "../components/GameList";
import VoteModal from "../components/VoteModal";
import { getValidTokenPayload } from "../utils/authToken";

interface DecodedToken {
  uuid: string;
  _id: string;
  name: string;
  club?: string;
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

const CRITERIA_LABELS: Record<Vote["criterion"], string> = {
  impressive: "인상깊음",
  fun: "재미",
  original: "독창성",
  polished: "완성도",
};

function MainPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [userVotes, setUserVotes] = useState<Vote[]>([]);
  const [votingGame, setVotingGame] = useState<Game | null>(null);
  const [userName, setUserName] = useState("...");
  const [currentUserName, setCurrentUserName] = useState<string | undefined>(
    undefined
  );
  const [currentUserClub, setCurrentUserClub] = useState<string | undefined>(
    undefined
  );
  const [currentView, setCurrentView] = useState<"all" | "voted">("all");
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);
  const stableGameOrderRef = useRef<string[]>([]);

  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
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
    const token = localStorage.getItem("authToken");
    if (token) {
      const decodedToken = getValidTokenPayload(token) as DecodedToken | null;

      if (decodedToken) {
        setUserName(decodedToken.name);
        setCurrentUserName(decodedToken.name);
        setCurrentUserClub(decodedToken.club);
      }
    }

    void fetchData();
  }, []);

  const handleVote = async (
    criterion: Vote["criterion"],
    medal: Vote["medal"]
  ) => {
    if (!votingGame || isSubmittingVote) return;
    try {
      setIsSubmittingVote(true);
      await api.post("/api/votes", {
        gameId: votingGame._id,
        criterion,
        medal,
      });
      await fetchData();
    } catch (error) {
      console.error("투표 실패:", error);
      alert("투표에 실패했습니다.");
    } finally {
      setIsSubmittingVote(false);
    }
  };

  const handleCancelVote = async (criterion: Vote["criterion"]) => {
    if (!votingGame || isSubmittingVote) return;
    try {
      setIsSubmittingVote(true);
      await api.delete("/api/votes", {
        data: { gameId: votingGame._id, criterion },
      });
      await fetchData();
    } catch (error) {
      console.error("투표 취소 실패:", error);
    } finally {
      setIsSubmittingVote(false);
    }
  };

  const handleViewChange = (view: "all" | "voted") => {
    setCurrentView(view);
    window.scrollTo(0, 0);
  };

  const { votesByGame, usedMedals, totalVotesByGame } = useMemo(() => {
    const groupedVotes: Record<string, Record<string, string>> = {};
    const groupedUsedMedals: Record<string, { gameId: string }> = {};
    const groupedTotalVotes: Record<string, number> = {};

    userVotes.forEach((vote) => {
      if (!groupedVotes[vote.game]) groupedVotes[vote.game] = {};
      groupedVotes[vote.game][vote.criterion] = vote.medal;
      groupedUsedMedals[`${vote.criterion}-${vote.medal}`] = { gameId: vote.game };
      groupedTotalVotes[vote.game] = (groupedTotalVotes[vote.game] || 0) + 1;
    });

    return {
      votesByGame: groupedVotes,
      usedMedals: groupedUsedMedals,
      totalVotesByGame: groupedTotalVotes,
    };
  }, [userVotes]);

  const votedGames = useMemo(() => {
    return games.filter((game) => (totalVotesByGame[game._id] || 0) > 0);
  }, [games, totalVotesByGame]);

  const orderedGames = useMemo(() => {
    const currentOrder = stableGameOrderRef.current;
    const gameMap = new Map(games.map((game) => [game._id, game]));

    if (currentOrder.length === 0) {
      const shuffled = shuffleArray(games);
      stableGameOrderRef.current = shuffled.map((game) => game._id);
      return shuffled;
    }

    const nextKnownGames = currentOrder
      .map((gameId) => gameMap.get(gameId))
      .filter((game): game is Game => Boolean(game));
    const knownGameIds = new Set(nextKnownGames.map((game) => game._id));
    const newGames = games.filter((game) => !knownGameIds.has(game._id));
    const ordered = [...nextKnownGames, ...newGames];

    stableGameOrderRef.current = ordered.map((game) => game._id);
    return ordered;
  }, [games]);

  const criterionProgress = useMemo(() => {
    const counts: Record<Vote["criterion"], number> = {
      impressive: 0,
      fun: 0,
      original: 0,
      polished: 0,
    };

    userVotes.forEach((vote) => {
      counts[vote.criterion] += 1;
    });

    return counts;
  }, [userVotes]);

  const completedCriteriaCount = useMemo(() => {
    return Object.values(criterionProgress).filter((count) => count === 3).length;
  }, [criterionProgress]);

  const totalVoteCapacity = 12;
  const voteProgressPercent = Math.round((userVotes.length / totalVoteCapacity) * 100);
  const totalSystemMedals = useMemo(() => {
    return Object.values(totalVotesByGame).reduce((sum, count) => sum + count, 0);
  }, [totalVotesByGame]);

  return (
    <div className="min-h-screen bg-base-200 px-4 pb-28 pt-6 md:px-8 md:pb-10 md:pt-8">
      <header className="mx-auto mb-6 max-w-6xl">
        <div className="rounded-[2rem] border border-base-300 bg-base-100/75 p-5 shadow-2xl shadow-primary/5 md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="text-center lg:text-left">
              <div className="badge badge-secondary badge-lg mx-auto inline-flex w-fit max-w-full items-center px-4 leading-none lg:mx-0">
                UNICON 현장 투표
              </div>
              <h1 className="mx-auto mt-3 block max-w-3xl text-2xl font-bold leading-tight md:max-w-none md:text-4xl lg:mx-0">
                안녕하세요, {userName}님!
              </h1>
              <p className="mt-1 text-sm text-base-content/80 md:text-base">
                플레이가 끝난 게임들 중 가장 마음에 든 작품에 메달을 나눠주세요.
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-2 lg:justify-start">
                <div className="badge badge-outline h-auto px-4 py-3">내 메달 {userVotes.length}개</div>
                <div className="badge badge-outline h-auto px-4 py-3">시스템 총 메달 {totalSystemMedals}개</div>
              </div>
              <p className="mt-2 hidden text-sm leading-6 text-base-content/70 md:block">
                기존 투표 가능/불가능 규칙은 그대로 유지되며, 이미 준 메달은 다시 눌러 조정할 수 있어요.
              </p>
            </div>

            <div className="min-w-full rounded-[1.5rem] border border-base-300 bg-base-200/80 p-4 lg:min-w-[320px]">
              <div className="flex items-center justify-between text-sm text-base-content/70">
                <span>전체 진행률</span>
                <span>{userVotes.length} / 12</span>
              </div>
              <progress
                className="progress progress-primary mt-3 h-3 w-full"
                value={userVotes.length}
                max={totalVoteCapacity}
              />
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="font-semibold">{voteProgressPercent}% 진행됨</span>
                <span className="text-base-content/60">4개 항목 중 {completedCriteriaCount}개 완료</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto mb-8 hidden max-w-6xl gap-4 md:grid md:grid-cols-2 xl:grid-cols-5">
        <div className="stat rounded-[1.75rem] bg-primary text-primary-content shadow-lg shadow-primary/10">
          <div className="stat-title text-primary-content/80">현재 준 메달</div>
          <div className="stat-value text-4xl">{userVotes.length}</div>
          <div className="stat-desc text-primary-content/75">총 12개까지 줄 수 있어요</div>
        </div>
        {Object.entries(criterionProgress).map(([criterion, count]) => (
          <div key={criterion} className="stat rounded-[1.75rem] bg-base-100 shadow-lg shadow-black/5">
            <div className="stat-title">{CRITERIA_LABELS[criterion as Vote["criterion"]]}</div>
            <div className="stat-value text-3xl">{count}/3</div>
            <div className="stat-desc">
              {count === 3 ? "이 항목은 메달 배분 완료" : `${3 - count}개 더 줄 수 있어요`}
            </div>
          </div>
        ))}
      </section>

      <section className="mx-auto mb-8 hidden max-w-6xl rounded-[1.75rem] border border-base-300 bg-base-100/75 p-4 shadow-lg shadow-black/5 md:block md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold">빠른 안내</h2>
            <p className="mt-1 text-sm leading-6 text-base-content/70">
              메달 버튼을 누르면 바로 반영되고, 같은 메달을 다시 누르면 취소할 수 있어요.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <div className="badge badge-outline h-auto px-4 py-3">내가 투표한 게임 {votedGames.length}개</div>
            <div className="badge badge-outline h-auto px-4 py-3">전체 게임 {games.length}개</div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl">
        <div className="hidden md:block">
          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">🗳️ 내가 투표한 게임</h2>
            {votedGames.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {votedGames.map((game) => (
                  <GameCard
                    key={game._id}
                    game={game}
                    myVotes={votesByGame[game._id] || {}}
                    currentUserName={currentUserName}
                    currentUserClub={currentUserClub}
                    onVoteClick={() => setVotingGame(game)}
                    isVoteActionDisabled={isSubmittingVote}
                  />
                ))}
              </div>
            ) : (
              <div className="card card-border bg-base-100/60 p-8 text-center">
                <p className="text-lg font-semibold">아직 투표한 게임이 없어요.</p>
                <p className="mt-2 text-base-content/60">아래 목록에서 마음에 든 게임에 메달을 주세요.</p>
              </div>
            )}
          </section>

          <div className="divider my-8"></div>

          <GameList
            games={orderedGames}
            votesByGame={votesByGame}
            currentUserName={currentUserName}
            currentUserClub={currentUserClub}
            onVoteClick={(game) => setVotingGame(game)}
          />
        </div>

        <div className="block md:hidden">
          {currentView === "all" && (
            <GameList
              games={orderedGames}
              votesByGame={votesByGame}
              currentUserName={currentUserName}
              currentUserClub={currentUserClub}
              onVoteClick={(game) => setVotingGame(game)}
            />
          )}

          {currentView === "voted" && (
            <section>
              <h2 className="mb-4 text-2xl font-bold">🗳️ 내가 투표한 게임</h2>
              {votedGames.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                  {votedGames.map((game) => (
                    <GameCard
                      key={game._id}
                      game={game}
                      myVotes={votesByGame[game._id] || {}}
                      currentUserName={currentUserName}
                      currentUserClub={currentUserClub}
                      onVoteClick={() => setVotingGame(game)}
                      isVoteActionDisabled={isSubmittingVote}
                    />
                  ))}
                </div>
              ) : (
                <div className="card card-border bg-base-100/60 p-8 text-center">
                  <p className="text-lg font-semibold">아직 투표한 게임이 없어요.</p>
                  <p className="mt-2 text-base-content/60">“모든 게임” 탭에서 둘러보고 메달을 주세요.</p>
                </div>
              )}
            </section>
          )}
        </div>

        <footer className="footer footer-center mt-16 rounded-[1.75rem] bg-base-300 p-4 text-base-content">
          <aside>
            <p>
              Developed with{" "}
              <a
                href="https://youtu.be/mco3UX9SqDA?list=RDmco3UX9SqDA"
                target="_blank"
                rel="noopener noreferrer"
                className="link link-hover font-bold"
              >
                migu
              </a>{" "}
              by{" "}
              <a
                href="https://github.com/ore-o"
                target="_blank"
                rel="noopener noreferrer"
                className="link link-hover font-bold"
              >
                ore-o
              </a>
              <br />© 2025 UNICON Vote Project. All rights reserved.
            </p>
          </aside>
        </footer>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 md:hidden">
        <div className="w-full max-w-md rounded-[2rem] border border-base-300 bg-base-100/95 p-3 shadow-2xl shadow-black/20 backdrop-blur">
          <div className="mb-3 flex items-center justify-between px-2 text-sm text-base-content/70">
            <span>현재 진행률</span>
            <span>{userVotes.length} / 12</span>
          </div>
          <progress className="progress progress-primary h-2 w-full" value={userVotes.length} max={totalVoteCapacity} />
          <div className="join mt-3 flex w-full rounded-full bg-base-200 p-1">
            <button
              className={`join-item btn btn-primary flex-1 rounded-full ${
                currentView === "all" ? "" : "btn-outline"
              }`}
              onClick={() => handleViewChange("all")}
            >
              🎲 모든 게임
            </button>
            <button
              className={`join-item btn btn-primary flex-1 rounded-full ${
                currentView === "voted" ? "" : "btn-outline"
              }`}
              onClick={() => handleViewChange("voted")}
            >
              🗳️ 투표한 게임
            </button>
          </div>
        </div>
      </div>

      {votingGame && (
        <VoteModal
          isOpen={!!votingGame}
          onClose={() => setVotingGame(null)}
          game={votingGame}
          onVote={handleVote}
          onCancelVote={handleCancelVote}
          usedMedals={usedMedals}
          votesForThisGame={votesByGame[votingGame._id] || {}}
          isSubmitting={isSubmittingVote}
        />
      )}
    </div>
  );
}

export default MainPage;

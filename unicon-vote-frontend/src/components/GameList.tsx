import { useState, useMemo } from "react";
import type { Game } from "../types";
import GameCard from "./GameCard";

interface GameListProps {
  games: Game[];
  // MainPage에서 계산된 데이터들을 props로 받습니다.
  totalVotesByGame: Record<string, number>;
  votesByGame: Record<string, Record<string, string>>;
  currentUserName?: string;
  currentUserClub?: string;
  // --- 👆 Props 변경 끝 ---
  onVoteClick: (game: Game) => void;
}
type CategoryFilter = "All" | "Challenger" | "Rookie";

function GameList({
  games,
  totalVotesByGame,
  votesByGame,
  currentUserName, // Props 변경
  currentUserClub, // Props 변경
  onVoteClick,
}: GameListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("All");
  const [clubFilter, setClubFilter] = useState<string>("All");

  const uniqueClubs = useMemo(() => {
    const clubs = new Set<string>();
    games.forEach((game) => {
      game.developers.forEach((dev) => {
        const clubName = dev.split("_")[0];
        if (clubName && clubName !== "외부인") {
          clubs.add(clubName);
        }
      });
    });
    return ["All", ...Array.from(clubs).sort()]; // "All"을 맨 앞에 추가
  }, [games]);

  const filteredGames = useMemo(() => {
    return games
      .filter((game) =>
        // 1. 검색어 필터
        game.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter((game) =>
        // 2. 카테고리 필터
        categoryFilter === "All" ? true : game.category === categoryFilter
      )
      .filter((game) => {
        // 3. 동아리 필터
        if (clubFilter === "All") return true;
        // game.developers에서 동아리 이름만 추출
        const gameClubs = game.developers.map((dev) => dev.split("_")[0]);
        return gameClubs.includes(clubFilter);
      });
  }, [games, searchTerm, categoryFilter, clubFilter]);

  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">🎲 전체 게임 목록</h2>
      <div className="form-control mb-8">
        <input
          type="text"
          placeholder="게임 이름으로 검색..."
          className="input input-bordered w-full md:w-1/2"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="flex flex-col md:flex-row gap-4 mb-8 p-4 bg-base-200 rounded-lg">
        {/* 검색창 */}
        <input
          type="text"
          placeholder="게임 이름으로 검색..."
          className="input input-bordered w-full md:flex-grow"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* 카테고리 필터 (버튼 그룹) */}
        <div className="btn-group">
          <button
            className={`btn ${categoryFilter === "All" ? "btn-active" : ""}`}
            onClick={() => setCategoryFilter("All")}
          >
            전체
          </button>
          <button
            className={`btn ${
              categoryFilter === "Challenger" ? "btn-active" : ""
            }`}
            onClick={() => setCategoryFilter("Challenger")}
          >
            챌린저
          </button>
          <button
            className={`btn ${categoryFilter === "Rookie" ? "btn-active" : ""}`}
            onClick={() => setCategoryFilter("Rookie")}
          >
            루키
          </button>
        </div>

        {/* 동아리 필터 (Select 드롭다운) */}
        <select
          className="select select-bordered w-full md:w-auto"
          value={clubFilter}
          onChange={(e) => setClubFilter(e.target.value)}
        >
          {uniqueClubs.map((club) => (
            <option key={club} value={club}>
              {club === "All" ? "모든 동아리" : club}
            </option>
          ))}
        </select>
      </div>

      {filteredGames.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGames.map((game) => (
            <GameCard
              key={game._id}
              game={game}
              // --- 👇 GameCard에 이름과 동아리 props 전달 ---
              currentUserName={currentUserName}
              currentUserClub={currentUserClub}
              // GameCard에 필요한 데이터를 전달합니다.
              voteCount={totalVotesByGame[game._id] || 0}
              myVotes={votesByGame[game._id] || {}}
              onVoteClick={() => onVoteClick(game)}
            />
          ))}
        </div>
      ) : (
        <div className="card bg-base-100/50 p-8 text-center">
          <p className="text-base-content/60">
            검색 결과에 해당하는 게임이 없어요.
          </p>
        </div>
      )}
    </section>
  );
}

export default GameList;

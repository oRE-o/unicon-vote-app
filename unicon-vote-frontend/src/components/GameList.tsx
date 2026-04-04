import { useState, useMemo } from "react";
import type { Game } from "../types";
import GameCard from "./GameCard";

interface GameListProps {
  games: Game[];
  votesByGame: Record<string, Record<string, string>>;
  currentUserName?: string;
  currentUserClub?: string;
  // --- 👆 Props 변경 끝 ---
  onVoteClick: (game: Game) => void;
}
type CategoryFilter = "All" | "Challenger" | "Rookie";

function GameList({
  games,
  votesByGame,
  currentUserName, // Props 변경
  currentUserClub, // Props 변경
  onVoteClick,
}: GameListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("All");
  const [clubFilter, setClubFilter] = useState<string>("All");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const hasActiveFilters =
    searchTerm.trim().length > 0 || categoryFilter !== "All" || clubFilter !== "All";

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
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return games
      .filter((game) => {
        if (!normalizedSearch) {
          return true;
        }

        const clubNames = game.developers
          .map((developer) => developer.split("_")[0])
          .filter(Boolean)
          .join(" ");
        const developerNames = game.developers
          .map((developer) => developer.split("_")[1] || developer)
          .join(" ");
        const searchableText = [
          game.name,
          game.description,
          game.category,
          clubNames,
          developerNames,
          game.developers.join(" "),
        ]
          .join(" ")
          .toLowerCase();

        return searchableText.includes(normalizedSearch);
      })
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

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("All");
    setClubFilter("All");
  };

  return (
    <section>
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">🎲 전체 게임 목록</h2>
          <p className="mt-1 text-sm text-base-content/70">
            게임 이름이나 참여 동아리로 빠르게 찾고 메달을 주세요.
          </p>
        </div>
        <div className="rounded-full bg-base-200 px-4 py-2 text-sm text-base-content/70">
          전체 {games.length}개 · 현재 {filteredGames.length}개 표시 중
        </div>
      </div>

      <div className="mb-8 rounded-[1.75rem] border border-base-300 bg-base-200/80 p-4 shadow-lg shadow-black/5">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px] md:items-end">
          <label className="form-control">
            <span className="mb-2 text-sm font-semibold">게임 검색</span>
            <input
              type="text"
              placeholder="게임 이름, 참여 동아리 검색..."
              className="input input-bordered w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </label>

          <label className="form-control hidden md:block">
            <span className="mb-2 text-sm font-semibold">동아리 필터</span>
            <select
              className="select select-bordered w-full"
              value={clubFilter}
              onChange={(e) => setClubFilter(e.target.value)}
            >
              {uniqueClubs.map((club) => (
                <option key={club} value={club}>
                  {club === "All" ? "모든 동아리" : club}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 md:hidden">
          <button
            className="btn btn-outline btn-sm rounded-full"
            onClick={() => setIsMobileFilterOpen((prev) => !prev)}
          >
            {isMobileFilterOpen ? '필터 접기' : '필터 열기'}
          </button>
          <div className="text-sm text-base-content/70">{filteredGames.length}개 표시 중</div>
        </div>

        <div className={`${isMobileFilterOpen ? 'mt-4 flex' : 'hidden'} flex-wrap items-center gap-2 md:mt-4 md:flex`}>
          <span className="text-sm font-semibold text-base-content/70">부문</span>
          <button
            className={`btn btn-sm rounded-full ${
              categoryFilter === "All" ? "btn-primary" : "btn-outline"
            }`}
            onClick={() => setCategoryFilter("All")}
          >
            전체
          </button>
          <button
            className={`btn btn-sm rounded-full ${
              categoryFilter === "Challenger" ? "btn-error" : "btn-outline"
            }`}
            onClick={() => setCategoryFilter("Challenger")}
          >
            챌린저
          </button>
          <button
            className={`btn btn-sm rounded-full ${
              categoryFilter === "Rookie" ? "btn-success" : "btn-outline"
            }`}
            onClick={() => setCategoryFilter("Rookie")}
          >
            루키
          </button>
          {hasActiveFilters && (
            <button className="btn btn-ghost btn-sm rounded-full" onClick={clearFilters}>
              필터 초기화
            </button>
          )}
        </div>

        <div className={`${isMobileFilterOpen ? 'mt-4 block md:hidden' : 'hidden'}`}>
          <label className="form-control">
            <span className="mb-2 text-sm font-semibold">동아리 필터</span>
            <select
              className="select select-bordered w-full"
              value={clubFilter}
              onChange={(e) => setClubFilter(e.target.value)}
            >
              {uniqueClubs.map((club) => (
                <option key={club} value={club}>
                  {club === "All" ? "모든 동아리" : club}
                </option>
              ))}
            </select>
          </label>
        </div>

        {hasActiveFilters && (
          <div className="mt-4 flex flex-wrap gap-2">
            {searchTerm.trim() && <div className="badge badge-outline">검색어: {searchTerm.trim()}</div>}
            {categoryFilter !== "All" && <div className="badge badge-outline">부문: {categoryFilter}</div>}
            {clubFilter !== "All" && <div className="badge badge-outline">동아리: {clubFilter}</div>}
          </div>
        )}
      </div>

      <div className="sr-only">
        <input
          type="text"
            placeholder="게임 이름, 참여 동아리 검색..."
          className="input input-bordered w-full md:w-auto md:flex-grow"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
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
              myVotes={votesByGame[game._id] || {}}
              onVoteClick={() => onVoteClick(game)}
            />
          ))}
        </div>
      ) : (
        <div className="card card-border bg-base-100/60 p-8 text-center">
          <p className="text-lg font-semibold">조건에 맞는 게임을 찾지 못했어요.</p>
          <p className="mt-2 text-base-content/60">
            검색어를 줄이거나 필터를 초기화하고 다시 찾아보세요.
          </p>
        </div>
      )}
    </section>
  );
}

export default GameList;

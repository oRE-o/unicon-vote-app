import { useState } from "react";
import type { Game } from "../types";
import GameCard from "./GameCard";

interface GameListProps {
  games: Game[];
  // MainPage에서 계산된 데이터들을 props로 받습니다.
  totalVotesByGame: Record<string, number>;
  votesByGame: Record<string, Record<string, string>>;
  userClub?: string; // 1. userClub prop 추가
  onVoteClick: (game: Game) => void;
}

function GameList({
  games,
  totalVotesByGame,
  votesByGame,
  userClub,
  onVoteClick,
}: GameListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredGames = games.filter((game) =>
    game.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      {filteredGames.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGames.map((game) => (
            <GameCard
              key={game._id}
              game={game}
              userClub={userClub} // 2. userClub prop 전달
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

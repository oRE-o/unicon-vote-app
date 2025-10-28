import type { Game } from "../types";

// 메달 아이콘을 매핑하는 객체
const MEDAL_ICONS: Record<string, string> = {
  gold: "🥇",
  silver: "🥈",
  bronze: "🥉",
};

interface GameCardProps {
  game: Game;
  voteCount: number;
  myVotes: Record<string, string>;
  currentUserName?: string;
  currentUserClub?: string;
  onVoteClick: () => void;
}
function GameCard({
  game,
  voteCount,
  myVotes,
  currentUserName,
  currentUserClub, // Props 변경
  onVoteClick,
}: GameCardProps) {
  const uniqueClubs = Array.from(
    new Set(
      game.developers
        .map((dev) => dev.split("_")[0]) // "동아리_실명"에서 "동아리"만 추출
        .filter((club) => club)
    )
  );
  const userDeveloperKey =
    currentUserClub && currentUserName
      ? `${currentUserClub}_${currentUserName}`
      : null;

  const isMyClubGame: boolean =
    !!userDeveloperKey &&
    game.developers.some((dev) => dev === userDeveloperKey); // 정확히 일치하는지 비교

  return (
    <div className="card bg-base-100 shadow-xl transition-transform duration-300 hover:scale-105 flex flex-col">
      <figure>
        <img
          src={game.imageUrl}
          alt={game.name}
          className="h-56 w-full object-cover"
        />
      </figure>
      <div className="card-body flex-grow">
        <h2 className="card-title">{game.name}</h2>
        {/* --- 동아리 정보 표시 --- */}
        <div className="my-2 flex flex-wrap gap-1">
          {uniqueClubs.map((club) => (
            <div key={club} className="badge badge-secondary">
              {club}
            </div>
          ))}
        </div>
        {/* --- 게임 설명 --- */}
        <p className="flex-grow">{game.description}</p>

        {/* --- 내가 준 메달 표시 --- */}
        <div className="my-2 flex items-center gap-2">
          <span className="font-semibold">나의 투표:</span>
          {Object.keys(myVotes).length > 0 ? (
            Object.values(myVotes).map((medal) => (
              <span key={medal} className="text-2xl">
                {MEDAL_ICONS[medal]}
              </span>
            ))
          ) : (
            <span className="text-sm text-base-content/60">아직 없음</span>
          )}
        </div>

        <div className="card-actions justify-between items-center mt-2">
          {/* --- 총 투표 수 표시 --- */}
          <div className="font-bold">🏆 총 {voteCount}개 메달</div>
          {/* --- 투표하기 버튼 --- */}
          <button
            className="btn btn-primary"
            onClick={onVoteClick}
            disabled={isMyClubGame}
          >
            {isMyClubGame ? "참여작 투표 불가" : "투표하기"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default GameCard;

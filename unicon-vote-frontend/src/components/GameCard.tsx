import type { Game } from "../types";

// 메달 아이콘을 매핑하는 객체
const MEDAL_ICONS: Record<string, string> = {
  gold: "🥇",
  silver: "🥈",
  bronze: "🥉",
};

interface GameCardProps {
  game: Game;
  userClub?: string; // 1. userClub prop 추가
  voteCount: number; // 이 게임이 받은 총 투표(메달) 수
  myVotes: Record<string, string>; // 내가 이 게임에 준 메달들 { criterion: medal }
  onVoteClick: () => void; // '투표하기' 버튼 클릭 시 호출될 함수
}

function GameCard({
  game,
  userClub,
  voteCount,
  myVotes,
  onVoteClick,
}: GameCardProps) {
  const isMyClubGame = userClub && game.club && userClub === game.club;

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
        {game.club && (
          <div className="badge badge-secondary mb-2 self-start">
            {game.club}
          </div>
        )}
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
            disabled={!!isMyClubGame} // 2. disabled 속성 추가
          >
            {isMyClubGame ? "투표 불가" : "투표하기"}{" "}
            {/* 3. 버튼 텍스트 변경 */}
          </button>
        </div>
      </div>
    </div>
  );
}

export default GameCard;

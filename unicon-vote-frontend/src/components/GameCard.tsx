import type { Game } from "../types";

// 메달 아이콘을 매핑하는 객체
const MEDAL_ICONS: Record<string, string> = {
  gold: "🥇",
  silver: "🥈",
  bronze: "🥉",
};

const CATEGORY_META = {
  Challenger: {
    label: "챌린저",
    badgeClass: "badge-error",
  },
  Rookie: {
    label: "루키",
    badgeClass: "badge-success",
  },
} as const;

interface GameCardProps {
  game: Game;
  myVotes: Record<string, string>;
  currentUserName?: string;
  currentUserClub?: string;
  onVoteClick: () => void;
  isVoteActionDisabled?: boolean;
}

function GameCard({
  game,
  myVotes,
  currentUserName,
  currentUserClub, // Props 변경
  onVoteClick,
  isVoteActionDisabled = false,
}: GameCardProps) {
  const uniqueClubs = Array.from(
    new Set(
      game.developers
        .map((dev) => dev.split("_")[0]) // "동아리_실명"에서 "동아리"만 추출
        .filter((club) => club && club !== "외부인") // <-- "외부인" 제거 필터 추가! ✨
    )
  );
  const userDeveloperKey =
    currentUserClub && currentUserName
      ? `${currentUserClub}_${currentUserName}`
      : null;

  const isMyClubGame: boolean =
    !!userDeveloperKey &&
    game.developers.some((dev) => dev === userDeveloperKey); // 정확히 일치하는지 비교
  const medalEntries = Object.values(myVotes);
  const categoryMeta = CATEGORY_META[game.category];

  return (
    <article className="card card-border bg-base-100 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10">
      <figure className="aspect-video overflow-hidden rounded-t-3xl">
        <img
          src={game.imageUrl}
          alt={game.name}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </figure>
      <div className="card-body gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className={`badge ${categoryMeta.badgeClass} badge-lg text-white`}>
            {categoryMeta.label}
          </div>
          {isMyClubGame && <div className="badge badge-warning badge-lg">내 동아리 출품작</div>}
        </div>

        <div className="space-y-2">
          <h3 className="card-title text-2xl leading-snug">{game.name}</h3>
          <p className="hidden text-sm leading-6 text-base-content/75 md:block">{game.description}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex flex-wrap gap-2">
            {uniqueClubs.map((club) => (
              <div key={club} className="badge badge-secondary badge-outline h-auto px-3 py-3">
                {club}
              </div>
            ))}
          </div>
        </div>

        {medalEntries.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {medalEntries.map((medal, index) => (
              <span
                key={`${game._id}-${medal}-${index}`}
                className="inline-flex h-10 min-w-10 items-center justify-center rounded-2xl bg-base-200 px-3 text-2xl"
              >
                {MEDAL_ICONS[medal]}
              </span>
            ))}
          </div>
        )}

        <div className="card-actions mt-auto items-center justify-between gap-3">
          <button
            className="btn btn-primary w-full sm:w-auto"
            onClick={onVoteClick}
            disabled={isMyClubGame || isVoteActionDisabled}
          >
            {isMyClubGame
              ? "내 동아리 작품은 투표할 수 없어요"
              : isVoteActionDisabled
              ? "처리 중..."
              : "메달 주기"}
          </button>
        </div>

      </div>
    </article>
  );
}

export default GameCard;

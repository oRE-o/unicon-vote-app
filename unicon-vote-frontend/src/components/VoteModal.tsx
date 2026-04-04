import type { Game } from "../types";

// 백엔드와 타입을 맞춥니다.
type Criterion = "impressive" | "fun" | "original" | "polished";
type Medal = "gold" | "silver" | "bronze";

const MEDAL_LABELS: Record<Medal, string> = {
  gold: "금",
  silver: "은",
  bronze: "동",
};

interface VoteModalProps {
  game: Game;
  isOpen: boolean;
  onClose: () => void;
  onVote: (criterion: Criterion, medal: Medal) => void;
  onCancelVote: (criterion: Criterion) => void;
  usedMedals: Record<string, { gameId: string }>;
  votesForThisGame: Partial<Record<Criterion, Medal>>;
  isSubmitting?: boolean;
}

const CRITERIA: { key: Criterion; name: string }[] = [
  { key: "impressive", name: "인상깊음" },
  { key: "fun", name: "재미" },
  { key: "original", name: "독창성" },
  { key: "polished", name: "완성도" },
];
const MEDALS: Medal[] = ["gold", "silver", "bronze"];
const MEDAL_COLORS: Record<Medal, string> = {
  gold: "border-yellow-400 bg-yellow-400/20 text-yellow-100",
  silver: "border-slate-300 bg-slate-300/20 text-slate-100",
  bronze: "border-orange-400 bg-orange-400/20 text-orange-100",
};
const MEDAL_ICONS: Record<Medal, string> = {
  gold: "🥇",
  silver: "🥈",
  bronze: "🥉",
};

function VoteModal({
  game,
  isOpen,
  onClose,
  onVote,
  onCancelVote,
  usedMedals,
  votesForThisGame,
  isSubmitting = false,
}: VoteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal modal-open modal-bottom sm:modal-middle">
      <div className="modal-box max-w-3xl rounded-t-[2rem] border border-base-300 bg-base-100 px-4 pb-4 pt-5 sm:rounded-[2rem] sm:px-6">
        <button
          onClick={onClose}
          className="btn btn-sm btn-circle absolute right-2 top-2"
        >
          ✕
        </button>
        <div className="pr-10">
          <div className="badge badge-outline inline-flex w-fit max-w-full items-center px-4 leading-none">메달 선택</div>
          <h3 className="mt-3 text-2xl font-bold leading-snug">{game.name}에 메달 주기</h3>
        </div>

        <div className="mt-4 space-y-2.5">
          {CRITERIA.map(({ key, name }) => {
            const currentMedalForThisCriterion = votesForThisGame[key];
            const isImpressive = key === "impressive";

            return (
              <div
                key={key}
                className={`rounded-2xl border p-3 ${
                  isImpressive
                    ? "border-primary/40 bg-primary/10 shadow-lg shadow-primary/5"
                    : "border-base-300 bg-base-200/50"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className={`text-base font-semibold md:text-lg ${isImpressive ? "text-primary" : ""}`}>
                        {name}
                      </h4>
                      {isImpressive && (
                        <span className="badge badge-primary badge-outline">주요 평가 항목</span>
                      )}
                    </div>
                  </div>

                  <div className="badge badge-ghost h-auto px-3 py-2 text-xs">
                    {currentMedalForThisCriterion
                      ? `${MEDAL_LABELS[currentMedalForThisCriterion]}메달 선택됨`
                      : "아직 선택 안 함"}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  {MEDALS.map((medal) => {
                    const isMedalUsedOnAnotherGame =
                      usedMedals[`${key}-${medal}`] &&
                      usedMedals[`${key}-${medal}`].gameId !== game._id;

                    const isSelected = currentMedalForThisCriterion === medal;
                    const isDisabled =
                      isSubmitting ||
                      isMedalUsedOnAnotherGame ||
                      (!!currentMedalForThisCriterion && !isSelected);

                    const buttonClass = [
                      "btn h-auto min-h-0 rounded-2xl border-2 px-1 py-2 text-xs font-semibold transition-all duration-200 md:px-2 md:py-3 md:text-sm",
                      isSelected
                        ? MEDAL_COLORS[medal]
                        : "border-base-300 bg-base-100 text-base-content hover:border-primary/40 hover:bg-base-200",
                      isDisabled ? "btn-disabled opacity-50" : "",
                    ]
                      .join(" ")
                      .trim();

                    return (
                      <button
                        key={medal}
                        className={buttonClass}
                        disabled={isDisabled}
                        onClick={() =>
                          isSelected ? onCancelVote(key) : onVote(key, medal)
                        }
                      >
                        <span className="text-xl md:text-2xl">{MEDAL_ICONS[medal]}</span>
                        <span>{MEDAL_LABELS[medal]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="modal-action mt-3">
          <button className="btn" onClick={onClose}>
            완료
          </button>
        </div>
      </div>
    </div>
  );
}

export default VoteModal;

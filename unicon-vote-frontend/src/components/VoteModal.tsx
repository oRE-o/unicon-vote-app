import type { Game } from "../types";

// 백엔드와 타입을 맞춥니다.
type Criterion = "impressive" | "fun" | "original" | "polished";
type Medal = "gold" | "silver" | "bronze";

interface VoteModalProps {
  game: Game;
  isOpen: boolean;
  onClose: () => void;
  onVote: (criterion: Criterion, medal: Medal) => void;
  onCancelVote: (criterion: Criterion) => void;
  usedMedals: Record<string, { gameId: string }>;
  votesForThisGame: Record<string, string>;
}

const CRITERIA: { key: Criterion; name: string }[] = [
  { key: "impressive", name: "인상깊음" },
  { key: "fun", name: "재미" },
  { key: "original", name: "독창성" },
  { key: "polished", name: "완성도" },
];
const MEDALS: Medal[] = ["gold", "silver", "bronze"];
const MEDAL_COLORS: Record<string, string> = {
  gold: "btn-warning",
  silver: "btn-active", // btn-neutral 보다 활성화된 느낌을 위해 변경
  bronze: "btn-accent",
};
const MEDAL_ICONS: Record<string, string> = {
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
}: VoteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <button
          onClick={onClose}
          className="btn btn-sm btn-circle absolute right-2 top-2"
        >
          ✕
        </button>
        <h3 className="font-bold text-lg mb-4">{game.name}에 투표하기</h3>

        <div className="space-y-6">
          {" "}
          {/* 간격 살짝 늘림 */}
          {CRITERIA.map(({ key, name }) => {
            const currentMedalForThisCriterion = votesForThisGame[key];
            const isImpressive = key === "impressive"; // --- ✨ 1. '인상깊음' 항목인지 확인 ---

            return (
              // --- ✨ 2. '인상깊음' 항목에 배경 및 패딩 추가 ---
              <div
                key={key}
                className={`p-3 rounded-lg ${
                  isImpressive ? "bg-primary/10 border border-primary/30" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <h4
                    className={`font-semibold text-lg ${
                      isImpressive ? "text-primary" : ""
                    }`}
                  >
                    {name}
                  </h4>{" "}
                  {/* 강조 색상 */}
                  {currentMedalForThisCriterion && (
                    <span className="text-2xl">
                      {MEDAL_ICONS[currentMedalForThisCriterion]}
                    </span>
                  )}
                  {/* --- ✨ 3. '인상깊음' 옆에 별표 추가 --- */}
                  {isImpressive && (
                    <span className="text-primary font-bold">
                      * 주요 평가 항목
                    </span>
                  )}
                </div>

                <div className="flex gap-4 mt-2">
                  {MEDALS.map((medal) => {
                    const isMedalUsedOnAnotherGame =
                      usedMedals[`${key}-${medal}`] &&
                      usedMedals[`${key}-${medal}`].gameId !== game._id;

                    const tooltipText = isMedalUsedOnAnotherGame
                      ? "다른 게임에 사용"
                      : currentMedalForThisCriterion === medal
                      ? `${medal} (선택 취소)`
                      : medal;

                    return (
                      <div
                        key={medal}
                        className="tooltip"
                        data-tip={tooltipText}
                      >
                        <button
                          className={`btn btn-circle text-2xl ${
                            currentMedalForThisCriterion === medal
                              ? MEDAL_COLORS[medal]
                              : "btn-outline"
                          }`}
                          disabled={
                            isMedalUsedOnAnotherGame ||
                            (!!currentMedalForThisCriterion &&
                              currentMedalForThisCriterion !== medal)
                          }
                          onClick={() =>
                            currentMedalForThisCriterion === medal
                              ? onCancelVote(key)
                              : onVote(key, medal)
                          }
                        >
                          {MEDAL_ICONS[medal]}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* --- ✨ 4. '인상깊음' 항목 아래에 안내 문구 추가 --- */}
                {isImpressive && (
                  <p className="text-xs text-base-content/70 mt-2 pl-1">
                    🏆 "인상깊음" 항목은 주된 수상 순위 결정에 반영되며,
                    <br /> 특별상은 그 외 부문 점수를 참고하여 각 부문별 하나의
                    작품이 선정됩니다.
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="modal-action">
          <button className="btn" onClick={onClose}>
            완료
          </button>
        </div>
      </div>
    </div>
  );
}

export default VoteModal;

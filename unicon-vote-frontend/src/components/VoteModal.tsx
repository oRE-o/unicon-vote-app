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
  gold: "bg-yellow-400 border-yellow-500 hover:bg-yellow-500 text-white", // 텍스트 색상 명시
  silver: "bg-gray-300 border-gray-400 hover:bg-gray-400 text-gray-800", // ✨ 실버 색상 수정: 배경 살짝 어둡게, 텍스트는 어둡게
  bronze: "bg-orange-400 border-orange-500 hover:bg-orange-500 text-white", // 텍스트 색상 명시
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

        <div className="space-y-4">
          {CRITERIA.map(({ key, name }) => {
            const currentMedalForThisCriterion = votesForThisGame[key];
            const isImpressive = key === "impressive";

            return (
              <div
                key={key}
                className={`p-3 rounded-lg ${
                  isImpressive ? "bg-primary/10 border border-primary/30" : ""
                }`}
              >
                {/* --- 헤드라인 중앙 정렬 및 아이콘 삭제 (변경 없음) --- */}
                <div className="flex flex-col items-center gap-1 mb-2">
                  <h4
                    className={`font-semibold text-xl ${
                      isImpressive ? "text-primary" : ""
                    }`}
                  >
                    {name}
                  </h4>
                  {isImpressive && (
                    <span className="text-primary font-bold text-sm">
                      * 주요 평가 항목
                    </span>
                  )}
                  <div className="divider w-1/2 mx-auto my-0"></div>
                </div>

                {/* --- 버튼 UI 및 정렬 수정 --- */}
                <div className="flex justify-center gap-3 mt-3">
                  {" "}
                  {/* gap-3로 살짝 줄임 */}
                  {MEDALS.map((medal) => {
                    const isMedalUsedOnAnotherGame =
                      usedMedals[`${key}-${medal}`] &&
                      usedMedals[`${key}-${medal}`].gameId !== game._id;

                    const isSelected = currentMedalForThisCriterion === medal;

                    const tooltipText = isMedalUsedOnAnotherGame
                      ? "다른 게임에 사용"
                      : isSelected
                      ? `${medal} (선택 취소)`
                      : medal;

                    // --- 👇 버튼 크기 살짝 줄임 (w-14 h-14, text-2xl) ---
                    let buttonClass = `btn btn-circle text-2xl p-2 w-14 h-14`;

                    if (isSelected) {
                      buttonClass += ` ${MEDAL_COLORS[medal]} border-2`;
                      if (medal === "silver")
                        buttonClass = buttonClass.replace(
                          "text-white",
                          "text-gray-800"
                        );
                    } else {
                      buttonClass += ` btn-outline border-2`;
                    }

                    const isDisabled =
                      isMedalUsedOnAnotherGame ||
                      (!!currentMedalForThisCriterion && !isSelected);
                    if (isDisabled) {
                      buttonClass += ` btn-disabled opacity-50`;
                    }

                    return (
                      <div
                        key={medal}
                        className="tooltip"
                        data-tip={tooltipText}
                      >
                        <button
                          className={buttonClass}
                          disabled={isDisabled}
                          onClick={() =>
                            isSelected ? onCancelVote(key) : onVote(key, medal)
                          }
                        >
                          {MEDAL_ICONS[medal]}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {isImpressive && (
                  <p className="text-xs text-base-content/70 mt-2 text-center">
                    🏆 "인상깊음" 항목은 주된 수상 순위 결정에 반영되며,
                    <br /> 특별상은 그 외 부문 점수를 참고하여 각 부문당 한 팀이
                    선정됩니다!
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

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
            const isImpressive = key === "impressive";

            return (
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
                  </h4>
                  {currentMedalForThisCriterion && (
                    <span className="text-2xl">
                      {MEDAL_ICONS[currentMedalForThisCriterion]}
                    </span>
                  )}
                  {isImpressive && (
                    <span className="text-primary font-bold">
                      * 주요 평가 항목
                    </span>
                  )}
                </div>

                {/* --- 👇 버튼 UI 및 정렬 수정 --- */}
                <div className="flex justify-center gap-4 mt-3">
                  {" "}
                  {/* justify-center 추가, mt 살짝 증가 */}
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

                    // 기본 버튼 스타일 (크기 키움)
                    let buttonClass = `btn btn-circle text-3xl p-2 w-16 h-16`; // 기본 크기 및 텍스트 크기 증가, 패딩/너비/높이 조절

                    // 선택된 메달 스타일
                    if (isSelected) {
                      buttonClass += ` ${MEDAL_COLORS[medal]} text-white border-2`; // 배경색, 흰 글씨, 테두리
                    } else {
                      buttonClass += ` btn-outline border-2`; // 외곽선만
                    }

                    // 비활성화 시 스타일
                    const isDisabled =
                      isMedalUsedOnAnotherGame ||
                      (!!currentMedalForThisCriterion && !isSelected);
                    if (isDisabled) {
                      buttonClass += ` btn-disabled opacity-50`; // 비활성화 스타일
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
                {/* --- 👆 버튼 UI 및 정렬 수정 끝 --- */}

                {isImpressive && (
                  <p className="text-xs text-base-content/70 mt-2 pl-1">
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

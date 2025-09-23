import mongoose, { Schema, Document } from "mongoose";

// 기준과 메달에 허용될 값들을 미리 정의
export type Criterion = "impressive" | "fun" | "original" | "polished";
export type Medal = "gold" | "silver" | "bronze";

export interface IVote extends Document {
  user: mongoose.Types.ObjectId;
  game: mongoose.Types.ObjectId;
  criterion: Criterion;
  medal: Medal;
}

const voteSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    game: { type: Schema.Types.ObjectId, ref: "Game", required: true },
    criterion: {
      type: String,
      enum: ["impressive", "fun", "original", "polished"],
      required: true,
    },
    medal: {
      type: String,
      enum: ["gold", "silver", "bronze"],
      required: true,
    },
  },
  { timestamps: true }
);

// 한 사용자가 같은 기준에 같은 메달을 두 번 줄 수 없도록 복합 고유 인덱스 설정
voteSchema.index({ user: 1, criterion: 1, medal: 1 }, { unique: true });
// 한 사용자가 한 게임의 같은 기준에 두 개 이상의 메달을 줄 수 없도록 설정
voteSchema.index({ user: 1, game: 1, criterion: 1 }, { unique: true });

const Vote = mongoose.model<IVote>("Vote", voteSchema);
export default Vote;

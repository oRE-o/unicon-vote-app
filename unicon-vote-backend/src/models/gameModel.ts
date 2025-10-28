// src/models/gameModel.ts
import mongoose, { Schema, Document } from "mongoose";

// Game 문서의 타입을 정의하는 인터페이스
export interface IGame extends Document {
  name: string;
  description: string;
  imageUrl: string;
  developers: string[];
  category: "Challenger" | "Rookie";
}

const gameSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  developers: {
    type: [String], // 문자열 배열 타입
    required: true,
  },
  category: {
    type: String,
    enum: ["Challenger", "Rookie"], // 허용 값 제한
    required: true,
  },
});

// mongoose.model<IGame>으로 타입을 지정해줍니다.
const Game = mongoose.model<IGame>("Game", gameSchema);

export default Game;

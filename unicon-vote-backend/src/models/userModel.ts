// src/models/userModel.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  uuid: string;
  password?: string;
  // --- 👇 수정 및 추가 ---
  role: "user" | "admin" | "guest"; // 'guest' 역할 추가
  club?: string; // 소속 동아리 이름 (guest는 없을 수 있으므로 optional)
}

const userSchema: Schema = new Schema({
  name: { type: String, required: true },
  uuid: { type: String, required: true, unique: true },
  password: { type: String, required: false },
  // Game 모델의 ObjectId를 배열 형태로 저장합니다.
  role: {
    type: String,
    enum: ["user", "admin", "guest"], // enum에 'guest' 추가
    default: "user",
  },
  club: {
    type: String,
    required: false, // guest는 club이 없을 수 있으므로 필수 아님
  },
});

const User = mongoose.model<IUser>("User", userSchema);

export default User;

// src/types.ts
export interface Game {
  _id: string; // id: number -> _id: string
  name: string;
  clubs: string[]; // 동아리 정보 추가 (optional)
  description: string;
  imageUrl: string;
  isLiked?: boolean; // isLiked는 클라이언트에서 동적으로 추가할 것이므로 optional
}

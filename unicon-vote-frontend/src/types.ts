export interface Game {
  _id: string;
  name: string;
  description: string;
  imageUrl: string;
  developers: string[];
  category: "Challenger" | "Rookie"; // --- 👇 카테고리 추가 ---
  isLiked?: boolean;
}

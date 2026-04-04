import { jwtDecode } from "jwt-decode";

interface TokenPayload {
  exp?: number;
  role?: "user" | "admin";
}

export const getValidTokenPayload = (token: string) => {
  try {
    const decodedToken = jwtDecode<TokenPayload>(token);

    if (
      typeof decodedToken.exp === "number" &&
      decodedToken.exp * 1000 <= Date.now()
    ) {
      localStorage.removeItem("authToken");
      return null;
    }

    return decodedToken;
  } catch (_error) {
    localStorage.removeItem("authToken");
    return null;
  }
};

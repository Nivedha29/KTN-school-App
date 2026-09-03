import jwt from "jsonwebtoken";

export type AuthPayload = {
  userId: number;

  role:
    | "ADMIN"
    | "TEACHER"
    | "PARENT";
};

function getSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error(
      "JWT_SECRET is missing"
    );
  }

  return process.env.JWT_SECRET;
}

export function createToken(
  payload: AuthPayload
) {
  return jwt.sign(
    payload,
    getSecret(),
    {
      expiresIn: "8h",
    }
  );
}

export function verifyToken(
  token: string
): AuthPayload {
  return jwt.verify(
    token,
    getSecret()
  ) as AuthPayload;
}
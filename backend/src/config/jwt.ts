import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_EXPIRES_IN, JWT_SECRET } from "../utils/env/env";
import logger from "./logger";


export interface JWTPayload {
    userId: string,
    email: string,
}



export const generateToken = (payload: JWTPayload): string => {
    if (!JWT_SECRET) {
        logger.error("JWT_SECRET is not defined")
        throw new Error("JWT_SECRET is not defined")
    }
    logger.info("Generating token", payload)
    return jwt.sign(payload, JWT_SECRET as string, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions)
}


export const verifyToken = (token: string): JwtPayload => {
    if (!JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined")
    }
    return jwt.verify(token, JWT_SECRET as string) as JwtPayload
}

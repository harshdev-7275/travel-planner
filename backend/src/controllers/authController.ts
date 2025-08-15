import { Request, Response } from "express"
import { signInSchema, signUpSchema } from "../utils/zod/authSchema"
import { checkUserInDb } from "../utils/helper/userHelper";
import logger from "../config/logger";
import { comparePassword, hashedPassword } from "../utils/helper/bcrypt";
import prisma from "../config/prisma";
import { generateToken } from "../config/jwt";


const handleSignUp = async (req: Request, res: Response) => {
    try {
        const { email, password, name } = signUpSchema.parse(req.body);

        const userData = await checkUserInDb(email)
        if (userData.success) {
            res.status(200).json({
                success: false,
                message: "User already exists"
            })
            return;
        }

        const hashPassword = await hashedPassword(password)
        const user = await prisma.user.create({
            data: {
                email,
                password: hashPassword,
                name,
            }
        });
        logger.info("User created successfully", req.originalUrl, req.method, req.body)
        const token = generateToken({ userId: user.id, email: user.email });
        if (!token) {
            logger.error("Failed to generate token", req.originalUrl, req.method, req.body)
            res.status(400).json({
                success: false,
                message: "Failed to generate token"
            })
            return;
        }
        logger.info("Token generated successfully", req.originalUrl, req.method, req.body)
        res.status(201).json({
            success: true,
            message: "User created successfully",
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            }
        })
    } catch (error) {
        logger.error("Error in signUp", error)
        
        // Check if it's a Zod validation error
        if (error instanceof Error && error.name === 'ZodError') {
            res.status(400).json({
                success: false,
                message: "Invalid request data",
                errors: error.message
            });
            return;
        }
        
        res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }

}

const handleSignIn = async (req: Request, res: Response) => {

    try {
        const { email, password } = signInSchema.parse(req.body);
        if (!email || !password) {
            logger.error("Invalid credentials", req.originalUrl, req.method, req.body);
            res.status(400).json({
                success: false,
                message: "Invalid credentials",
            })
        }
        const userData = await checkUserInDb(email);
        if (!userData.success) {
            logger.error("User not found", req.originalUrl, req.method, req.body)
            res.status(400).json({
                success: false,
                message: "User not found",
            })
        }
        const isPasswordValid = await comparePassword(password, userData.data?.password as string)

        if (!isPasswordValid) {
            logger.error("Invalid credentials", req.originalUrl, req.method, req.body);
            res.status(400).json({
                success: false,
                message: "Invalid credentials",
            })
            return;
        }

        const token = generateToken({ userId: userData.data?.id as string, email: userData.data?.email as string })
        if (!token) {
            logger.error("Failed to generate token", req.originalUrl, req.method, req.body)
            res.status(400).json({
                success: false,
                message: "Failed to generate token"
            })
            return;
        }

        logger.info("User logged in successfully", req.originalUrl, req.method, req.body)
        res.status(200).json({
            success: true,
            message: "User logged in successfully",
            token,
            user: {
                ...userData.data,
                password: undefined,
                travelPreferences: undefined

            }
        })


    } catch (error) {
        logger.error("Error in sign in", error);
        
        // Check if it's a Zod validation error
        if (error instanceof Error && error.name === 'ZodError') {
            res.status(400).json({
                success: false,
                message: "Invalid request data",
                errors: error.message
            });
            return;
        }
        
        res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }


}



export { handleSignUp, handleSignIn }



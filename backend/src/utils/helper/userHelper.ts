
import logger from "../../config/logger"
import prisma from "../../config/prisma"


export const checkUserInDb = async (email: string) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                email
            }
        })
        logger.info("user", user)
        if (user) {
            return {
                success: true,
                data: user
            }
        }
        return {
            success: false,
            data: null
        }
    } catch (error) {
        logger.error("error in checkUserInDb", error)
        return {
            success: false,
            data: null
        }

    }
} 
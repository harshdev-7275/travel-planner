import { Request, Response } from "express"
import { signInSchema, signUpSchema } from "../utils/zod/authSchema"
import { checkUserInDb } from "../utils/helper/userHelper";
import logger from "../config/logger";


const handleSignUp = async (req:Request, res: Response)=>{
    try {
        const {email, password, name} = signUpSchema.parse(req.body);

        const userData  = await checkUserInDb(email)
        if(userData.success){
            res.status(200).json({
                success: false,
                message: "User already exists"
            })
            return;
        }

        const 



    } catch (error) {
        logger.error("Error in signUp", error)
        res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }

}

const handleSignIn = async (req:Request, res: Response)=>{

    try {
        const {email, password} = signInSchema.parse(req.body)
        
    } catch (error) {
        
    }


}



export {handleSignUp, handleSignIn}



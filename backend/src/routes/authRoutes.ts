import {Router} from "express"
import { handleSignIn, handleSignUp } from "../controllers/authController";


const router = Router();

router.post("/sign-up", handleSignUp)

router.post("/sign-in", handleSignIn)


export default router;
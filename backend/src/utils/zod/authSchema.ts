import * as z from "zod";


export const signUpSchema = z.object({
    email:z.email(),
    password:z.string().min(8,{message:"Password must be at least 8 character long"}),
    name: z.string().min(3,{message:"Name must be at least 3 character long"}),
})


export const signInSchema = z.object({
    email:z.email(),
    password:z.string().min(8,{message:"Password must be at least 8 character long"}),
})
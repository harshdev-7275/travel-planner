import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export const hashedPassword = async (plainPassword: string) : Promise<string> =>{
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    return bcrypt.hash(plainPassword, salt);
}


export const comparePassword = async (plainPassword: string, hashedPassword: string): Promise<boolean> => {
    return bcrypt.compare(plainPassword, hashedPassword);
};
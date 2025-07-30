import { jwtDecode } from "jwt-decode";

export const checkToken = (token:string) => {
    try {
        const decoded = jwtDecode<{ exp: number }>(token);
        const currentTime = Date.now() / 1000;
        return decoded.exp > currentTime;
    } catch (error) {
        return false;
    }
}
import logo from "@/assets/logo.png"
import { Button } from './ui/button'
import { useNavigate } from "react-router";

const Header = () => {
    const navigate = useNavigate();
    const handleSignUp = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        navigate("/signup")
    }
    const handleSignIn = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        navigate("/signin")
    }
    return (
        <div className='w-full flex items-center justify-between'>
            <div className='w-10 h-10 flex items-center gap-2'>
                <img src={logo} alt="logo" className='w-full h-full object-contain' />
                <p className='text-xl font-medium uppercase tracking-widest'>Nomado</p>
            </div>
            <div className='flex items-center gap-2 text-white'>
                <Button className='bg-black/5 hover:bg-black/10 text-white rounded-full font-light cursor-pointer' variant={"secondary"} onClick={handleSignUp}>
                    Sign up
                </Button>
                <Button className='bg-[#9F9FF8] text-white rounded-full font-light hover:bg-[#9F9FF8]/80 cursor-pointer'  variant={"secondary"} onClick={handleSignIn}>
                    Sign in
                </Button>
            </div>
        </div>
    )
}

export default Header
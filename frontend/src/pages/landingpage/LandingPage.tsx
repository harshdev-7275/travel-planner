import Header from '@/components/Header'
import logo from "@/assets/logo.png"
import ChatBotPlaceholder from './ChatBotPlaceholder'

const LandingPage = () => {
    return (
        <div className='h-screen w-full overflow-hidden'>
            <Header />
            <div className='container mx-auto h-full w-full flex flex-col items-center justify-center gap-6'>
                <div className='flex flex-col items-center justify-center gap-4'>
                    <img src={logo} alt="logo" />
                    <p>Travel With a Sixth Sense</p>
                </div>
                <ChatBotPlaceholder/>
            </div>
        </div>
    )
}

export default LandingPage
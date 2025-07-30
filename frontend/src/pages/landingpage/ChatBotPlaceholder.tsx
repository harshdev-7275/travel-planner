
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { PaperclipIcon, SendHorizonalIcon, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"


type PlaceHolderMessage = {
    id: number,
    message: string,
}

const placeHolderMessages: PlaceHolderMessage[] = [
    {
        id: 1,
        message: "Hi, I'm Nomado, your travel assistant. How can I help you today?"
    },
    {
        id: 2,
        message: "I'm here to help you plan your trip. What would you like to know?"
    },
    {
        id: 3,
        message: "I'm here to help you plan your trip. What would you like to know?"
    }
]

const ChatBotPlaceholder = () => {
    const [placeholderMessage, setPlaceholderMessage] = useState<PlaceHolderMessage>(placeHolderMessages[0])
    const [displayedText, setDisplayedText] = useState('')
    const [currentIndex, setCurrentIndex] = useState(0)

    function getRandom123() {
        const values = [1, 2, 3];
        const randomIndex = Math.floor(Math.random() * values.length);
        return values[randomIndex];
    }

    // Typewriter effect
    useEffect(() => {
        if (currentIndex < placeholderMessage.message.length) {
            const timeout = setTimeout(() => {
                setDisplayedText(placeholderMessage.message.slice(0, currentIndex + 1))
                setCurrentIndex(currentIndex + 1)
            }, 50) // Adjust speed here (lower = faster)

            return () => clearTimeout(timeout)
        }
    }, [currentIndex, placeholderMessage.message])

    useEffect(() => {
        const interval = setInterval(() => {
            const newMessage = placeHolderMessages[getRandom123() - 1] // Fix array index
            setPlaceholderMessage(newMessage)
            setDisplayedText('')
            setCurrentIndex(0)
        }, 5000) // Increased interval to allow typewriter effect to complete

        return () => clearInterval(interval)
    }, [])


    return (
        <div className='bg-[#222222] w-[600px] h-[142px] p-2 rounded-xl border border-gray-600/30'>
            <Textarea
                value={displayedText}
                className='border-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-white h-[calc(100%-90px)] resize-none'
                disabled
            />
            <div className='ml-2 flex flex-col gap-2'>
                <span className='text-white/20 text-sm'>0/500</span>
                <div className='flex items-center justify-between'>
                    <div>
                        <Tooltip>
                            <TooltipTrigger asChild className='cursor-pointer'>
                                <Button className='outline-none relative ' variant={"link"} color='white'>
                                    <Sparkles color='white' size={20} className='absolute top-0 left-0' />
                                </Button>
                            </ TooltipTrigger>
                            <TooltipContent side='bottom' sideOffset={-20} className='bg-black/30'>
                                <p className='text-[#eeee] text-xs'>
                                    Enhance query with AI
                                </p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild className='cursor-pointer'>
                                <Button className='outline-none relative ' variant={"link"} color='white'>
                                    <PaperclipIcon color='white' size={20} className='absolute top-0 left-0' />
                                </Button>
                            </ TooltipTrigger>
                            <TooltipContent side='bottom' sideOffset={-20} className='bg-black/30'>
                                <p className='text-[#eeee] text-xs'>
                                    Add a file
                                </p>
                            </TooltipContent>
                        </Tooltip>

                    </div>
                    <div>
                        <Tooltip>
                            <TooltipTrigger asChild className='cursor-pointer'>
                                <Button className='outline-none relative ' variant={"link"} color='white'>
                                    <SendHorizonalIcon color='white' size={20} className='absolute top-0 left-0' />
                                </Button>
                            </ TooltipTrigger>

                            <TooltipContent side='bottom' sideOffset={-20} className='bg-black/30'>
                                <p className='text-[#eeee] text-xs'>
                                    Send a message
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>

            </div>

        </div>
    )
}

export default ChatBotPlaceholder
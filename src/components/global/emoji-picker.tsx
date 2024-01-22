'use client'

import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import React from "react"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { useTheme } from "next-themes"
import { Theme } from "emoji-picker-react"

interface EmojiPickerProps {
    children: React.ReactNode,
    getValue?: (emoji: string) => void
}

const EmojiPicker = ({ children, getValue }: EmojiPickerProps) => {

   const router = useRouter()
   const Picker = dynamic(() => import('emoji-picker-react'))

   const { resolvedTheme } = useTheme()
   const currentTheme = (resolvedTheme || "light") as keyof typeof themeMap

   const onClick = (selectedEmoji: any) => {
     if (getValue) getValue(selectedEmoji.emoji)
   }

   const themeMap = {
    "dark": Theme.DARK,
    "light": Theme.LIGHT
   }

   const theme = themeMap[currentTheme]

  return (
    <div className="flex items-center">
       <Popover>
         <PopoverTrigger className="cursor-pointer">
           {children}
         </PopoverTrigger>
         <PopoverContent className="p-0 border-none">
            <Picker onEmojiClick={onClick} theme={theme}/>
         </PopoverContent>
       </Popover>
    </div>
  )
}

export default EmojiPicker
import { HomeIcon } from "lucide-react"
import Link from "next/link"
import { twMerge } from "tailwind-merge"
import CypressHomeIcon from "../icons/home-icon"
import CypressSettingsIcon from "../icons/settings-icon"
import CypressTrashIcon from "../icons/trash-icon"
import Settings from "../settings/settings"

interface NativeNavigationProps {
    myWorkspaceId: string
    className?: string
}

const NativeNavigation = ({ myWorkspaceId, className }: NativeNavigationProps) => {
  return (
    <nav className={twMerge('my-2', className)}>
        <ul className="flex flex-col gap-2">
            <li>
                <Link className="flex group/native text-Neutrals/neutrals-7 transition-all gap-2"
                href={`/dashboard/${myWorkspaceId}`}>
                    <CypressHomeIcon/>
                    <span>My Workspace</span>
                </Link>
            </li>

           <Settings>
             <li className="flex group/native text-Neutrals/neutrals-7 transition-all gap-2 cursor-pointer">
                  <CypressSettingsIcon/>
                  <span>Settings</span>
             </li>
           </Settings>

            <li>
                <Link className="flex group/native text-Neutrals/neutrals-7 transition-all gap-2"
                href={`/dashboard/${myWorkspaceId}`}>
                    <CypressTrashIcon/>
                    <span>Trash</span>
                </Link>
            </li>
        </ul>
    </nav>
  )
}

export default NativeNavigation
'use cl.ient'

import { workspace } from "@/lib/supabase/supabase.types"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { createClient } from "@supabase/supabase-js"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"

interface SelectedWorkspaceProps {
    workspace: workspace
    onClick?: (option: workspace) => void
}

const SelectedWorkspace = ({ workspace, onClick }: SelectedWorkspaceProps) => {

    const supabase = createClientComponentClient()

    const [workspaceLogo, setWorkspaceLogo] = useState<string>('/brainbg.png')

    useEffect(() => {
        if (workspace.logo) {
            const path = supabase.storage.from('workspace-logos').getPublicUrl(workspace.logo)?.data.publicUrl

            setWorkspaceLogo(path)
        }
    }, [workspace])

  return (
    <Link href={`/dashboard/${workspace.id}`}
     onClick={() => {
        if (onClick) onClick(workspace)
     }}
     className="flex px-6 rounded-md hover:bg-muted transition-all flex-row p-2 gap-4 justify-center cursor-pointer items-center my-2">
       <Image src={workspaceLogo} alt="workspace logo" width={26} height={26} objectFit="cover"/>
       <div className="flex flex-col">
          <p className=" w-[170px] overflow-hidden overflow-ellipsis whitespace-nowrap">
             {workspace.title}
          </p> {' '}
       </div>
    </Link>
  )
}

export default SelectedWorkspace
'use client'

import { useAppState } from "@/lib/providers/state-provider"
import { Folder } from "@/lib/supabase/supabase.types"
import { useEffect, useState } from "react"
import TooltipComponent from "../global/tooltip-component"
import { PlusIcon } from "lucide-react"
import { useSupabaseUser } from "@/lib/providers/supabase-user-provider"
import { v4 } from "uuid"

interface FoldersDropdownListProps {
    workspaceFolders: Folder[]
    workspaceId: string
}

const FoldersDropdownList = ({ workspaceFolders, workspaceId }: FoldersDropdownListProps) => {

  const { state, dispatch } = useAppState()
  const { subscription } = useSupabaseUser()
  const [folders, setFolders] = useState<Folder[]>(workspaceFolders)

  useEffect(() => {
    if (workspaceFolders.length > 0) {
        dispatch({type: "SET_FOLDERS", payload: {workspaceId, folders: workspaceFolders.map((folder) => ({...folder, files: state.workspaces.find((workspace) => workspace.id === workspaceId)?.folders.find((f) => f.id === folder.id)?.files || []}))}})
    }
  }, [workspaceFolders, workspaceId])

  useEffect(() => {
    setFolders(state.workspaces.find((workspace) => workspace.id === workspaceId)?.folders || [])
  }, [state, workspaceId])

  const addFolderHandler = async () => {
    //  if (folders.length >= 3  && !subscription) {
        
    //  }
    const newFolder: Folder = {
        data: null,
        id: v4(),
        createdAt: new Date().toISOString(),
        title: 'Untitled',
        iconId: '📄',
        inTrash: null,
        workspaceId,
        bannerUrl: ''
    }
    dispatch({})
  }

  return (
    <>
      <div className="flex sticky z-20 top-0 bg-background w-full h-10 group/title justify-between items-center pr-4 text-Neutrals/neutrals-8">
         <span className="text-Neutrals-8 font-bold text-xs">
             FOLDERS
         </span>
         <TooltipComponent message="Create Folder">
            <PlusIcon onClick={addFolderHandler}
             size={16} className="group-hover/title:inline-block hidden cursor-pointer hover:dark:text-white"/>
         </TooltipComponent>
      </div>
    </>
  )
}

export default FoldersDropdownList
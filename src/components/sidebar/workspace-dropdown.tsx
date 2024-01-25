'use client'

import { useAppState } from "@/lib/providers/state-provider"
import { workspace } from "@/lib/supabase/supabase.types"
import { useEffect, useState } from "react"
import SelectedWorkspace from "./selected-workspace"
import CustomDialogTrigger from "../global/custom-dialog-trigger"
import WorkspaceCreator from "../global/workspace-creator"
import { Plus } from "lucide-react"

interface WorkspaceDropdownProps {
    privateWorkspaces: workspace[] | []
    sharedWorkspaces: workspace[] | []
    collaboratingWorkspaces: workspace[] | []
    defaultValue: workspace | undefined
}

const WorkspaceDropdown = ({ privateWorkspaces, sharedWorkspaces, collaboratingWorkspaces, defaultValue }: WorkspaceDropdownProps) => {

   const {dispatch, state} = useAppState()

   const [selectedOption, setSelectedOption] = useState<workspace | undefined>(defaultValue)
   const [isOpen, setIsOpen] = useState<boolean>(false)

   useEffect(() => {
     if (!state.workspaces.length) {
        dispatch({type: "SET_WORKSPACES", payload: {workspaces: [...privateWorkspaces, ...sharedWorkspaces, ...collaboratingWorkspaces]
        .map((workspace) => ({...workspace, folders: []}))}})
     }
   }, [privateWorkspaces, sharedWorkspaces, collaboratingWorkspaces,])


   const handleSelect = (option: workspace) => {
     setSelectedOption(option)
     setIsOpen(false)
   }

   useEffect(() => {
    const findSelectedWorkspace = state.workspaces.find((workspace) => workspace.id === defaultValue?.id)

    if (findSelectedWorkspace) setSelectedOption(findSelectedWorkspace)
   }, [state, defaultValue])

  return (
    <div className="relative inline-block text-left">
      <div>
         <span onClick={() => {
            setIsOpen(!isOpen)
         }}>
           {selectedOption ? <SelectedWorkspace workspace={selectedOption}/> : "Select a workspace"}
         </span>
      </div>
      {isOpen && (
        <div className="origin-top-right absolute w-full rounded-md shadow-md z-50 h-[170px]
        bg-black/10 backdrop-blur-lg group overflow-auto border-[1px] border-muted">
          <div className="rounded-md flex flex-col">
            <div className="!p-2">
              {!!privateWorkspaces.length && (
                <>
                  <p className="text-muted-foreground ml-2">Private</p>
                  <hr className="my-2"/>
                  {privateWorkspaces.map((option) => (
                    <SelectedWorkspace key={option.id} workspace={option} onClick={handleSelect}/>
                  ))}
                </>
              )}
              {!!sharedWorkspaces.length && (
                <>
                  <p className="text-muted-foreground ml-2">Shared</p>
                  <hr className="my-2"/>
                  {sharedWorkspaces.map((option) => (
                    <SelectedWorkspace key={option.id} workspace={option} onClick={handleSelect}/>
                  ))}
                </>
              )}
              {!!collaboratingWorkspaces.length && (
                <>
                  <p className="text-muted-foreground ml-2">Collaborating</p>
                  <hr className="my-2"/>
                  {collaboratingWorkspaces.map((option) => (
                    <SelectedWorkspace key={option.id} workspace={option} onClick={handleSelect}/>
                  ))}
                </>
              )}
            </div>
            <CustomDialogTrigger description="Workspaces give you the power to collaborate with others. You can change your workspace privacy settings after creating the workspace too."
             header="Create A Workspace" content={<WorkspaceCreator/>}>
                <div className="flex transition-all hover:bg-muted text-sm justify-center items-center gap-2 p-2 w-full">
                    <article className="text-slate-500 rounded-full">
                       <Plus className="h-4 w-4"/>
                    </article>
                    Create workspace
                </div>
            </CustomDialogTrigger>
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkspaceDropdown
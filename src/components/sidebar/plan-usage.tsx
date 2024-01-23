'use client'

import { MAX_FOLDERS_FREE_PLAN } from "@/lib/constants"
import { useAppState } from "@/lib/providers/state-provider"
import { Subscription } from "@/lib/supabase/supabase.types"
import { useEffect, useState } from "react"
import { Progress } from "../ui/progress"
import CypressDiamondIcon from "../icons/diamond"

interface PlanUsageProps {
    foldersLength: number
    subscription: Subscription | null
}

const PlanUsage = ({ foldersLength, subscription }: PlanUsageProps) => {

   const { workspaceId, state } =  useAppState()

   const [usagePercentege, setUsagePercentege] = useState((foldersLength / MAX_FOLDERS_FREE_PLAN) * 100)

   useEffect(() => {
     const stateFoldersLength = state.workspaces.find((workspace) => workspace.id === workspaceId)?.folders.length

     if (stateFoldersLength === undefined) return

     setUsagePercentege((stateFoldersLength / MAX_FOLDERS_FREE_PLAN) * 100)
   }, [state, workspaceId])

  return (
    <article className="mb-4">
         {subscription?.status !== 'active' && (
            <div className="flex gap-2 text-muted-foreground mb-2 items-center">
              <div className="flex justify-between w-full items-center">
                <div className="h-4 w-4">
                    <CypressDiamondIcon/>
                </div>
                <div>
                  Free Plan
                </div>
                <small>{usagePercentege.toFixed(0)}% / 100%</small>
              </div>
            </div>
         )}
         {subscription?.status !== 'active' && (
            <Progress value={usagePercentege} className="h-1"/>
         )}
    </article>
  )
}

export default PlanUsage
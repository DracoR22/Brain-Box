import Sidebar from "@/components/sidebar/sidebar"
import React from "react"

interface LayoutProps {
    children: React.ReactNode,
    params: any
}

const WorkspaceIdLayout = ({ params, children }: LayoutProps) => {
  return (
    <main className="flex overflow-hidden h-screen w-screen">
        <Sidebar params={params}/>
       <div className="dark:border-Neutrals-12/70 border-l-[1px] w-full relative overflow-auto">
         {children}
       </div>
    </main>
  )
}

export default WorkspaceIdLayout
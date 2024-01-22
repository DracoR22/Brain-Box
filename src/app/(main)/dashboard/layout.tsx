import React from "react"

interface LayoutProps {
    children: React.ReactNode,
    params: any
}

const DashboardLayout = ({ params, children }: LayoutProps) => {
  return (
    <main className="flex overflow-hidden h-screen">
       {children}
    </main>
  )
}

export default DashboardLayout
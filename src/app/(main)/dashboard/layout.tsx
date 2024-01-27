import { SubscriptionModalProvider } from "@/lib/providers/subscription-modal-provider"
import React from "react"

interface LayoutProps {
    children: React.ReactNode,
    params: any
}

const DashboardLayout = ({ params, children }: LayoutProps) => {
  const products = null
  return (
    <main className="flex overflow-hidden h-screen">
       <SubscriptionModalProvider products={products}>
          {children}
       </SubscriptionModalProvider>
    </main>
  )
}

export default DashboardLayout
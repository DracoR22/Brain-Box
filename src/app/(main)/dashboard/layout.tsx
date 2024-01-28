import { SubscriptionModalProvider } from "@/lib/providers/subscription-modal-provider"
import { getActiveProductWithPrice } from "@/lib/supabase/queries"
import React from "react"

interface LayoutProps {
    children: React.ReactNode,
    params: any
}

const DashboardLayout = async ({ params, children }: LayoutProps) => {
  const { data: products, error } = await getActiveProductWithPrice()

  if (error) throw new Error()
  return (
    <main className="flex overflow-hidden h-screen">
       <SubscriptionModalProvider products={products}>
          {children}
       </SubscriptionModalProvider>
    </main>
  )
}

export default DashboardLayout
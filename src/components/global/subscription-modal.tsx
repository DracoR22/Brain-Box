import { useSubscriptionModal } from "@/lib/providers/subscription-modal-provider"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog"
import { useSupabaseUser } from "@/lib/providers/supabase-user-provider"
import React from "react"

interface SubscriptionModalProps {
    products: any
}

const SubscriptionModal = ({ products }: SubscriptionModalProps) => {

   const { open, setOpen } = useSubscriptionModal()
   const { subscription } = useSupabaseUser()

  return (
     <Dialog open={open} onOpenChange={setOpen}>
        {subscription?.status === 'active' ? (
            <DialogContent>
               Already on a paid plan!
            </DialogContent>
        ) : (
            <DialogContent>
               <DialogHeader>
                  <DialogTitle>
                     Upgrade to a Pro Plan
                  </DialogTitle>
               </DialogHeader>
               <DialogDescription>
                  {' '}
                  To access Pro features you need to have a paid plan.
               </DialogDescription>
               <div className="flex justify-center items-center">
                  <React.Fragment>
                     <b className="text-3xl text-foreground">

                     </b>
                  </React.Fragment>
               </div>
            </DialogContent>
        )}
     </Dialog>
  )
}

export default SubscriptionModal
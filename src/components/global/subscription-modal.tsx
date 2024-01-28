'use client'

import { useSubscriptionModal } from "@/lib/providers/subscription-modal-provider"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog"
import { useSupabaseUser } from "@/lib/providers/supabase-user-provider"
import React, { useState } from "react"
import { Button } from "../ui/button"
import Loader from "./loader"
import { Price, ProductWirhPrice } from "@/lib/supabase/supabase.types"
import { formatPrice, postData } from "@/lib/utils"
import { useToast } from "../ui/use-toast"
import { getStripe } from "@/lib/stripe/stripe-client"

interface SubscriptionModalProps {
    products: ProductWirhPrice[]
}

const SubscriptionModal = ({ products }: SubscriptionModalProps) => {

   const { open, setOpen } = useSubscriptionModal()
   const { subscription, user } = useSupabaseUser()
   const { toast } = useToast()

   const [isLoading, setIsLoading] = useState(false)

   const onClickContinue = async (price: Price) => {
      try {
         setIsLoading(true)
         if (!user) {
            toast({
               title: 'You must be logged in'
            })
            setIsLoading(false)
            return
         }
         if (subscription) {
            toast({
               title: 'Already on a paid plan!'
            })
            setIsLoading(false)
            return
         }
         const { sessionId } = await postData({ url: '/api/create-checkout-session', data: { price }})
         console.log('Getting checkout from stripe')
         const stripe = await getStripe()
         stripe?.redirectToCheckout({ sessionId })
      } catch (error) {
         toast({
            title: 'Oppse! Something went wrong.',
            variant: 'destructive'
         })
      } finally {
         setIsLoading(false)
      }
   }

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
                 {products.length ? products.map((product, i) => (
                  <div key={i} className="flex justify-between items-center">
                     {product.prices?.map((price, i) => (
                        <React.Fragment key={i}>
                          <b className="text-3xl text-foreground">
                             {formatPrice(price)} / <small>{price.interval}</small>
                          </b>
                          <Button disabled={isLoading} onClick={() => onClickContinue(price)}>
                            {isLoading ? <Loader/> : 'Upgrade ✨'}
                          </Button>
                      </React.Fragment>
                     ))}
                  </div>
              )) : ''}
            </DialogContent>
        )}
     </Dialog>
  )
}

export default SubscriptionModal
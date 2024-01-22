import db from "@/lib/supabase/db"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import DashboardSetup from "@/components/dashboard-setup/dashboard-setup"
import { getUserSubscriptionStatus } from "@/lib/supabase/queries"

const DashboardPage = async () => {

   const supabase = createServerComponentClient({ cookies })

  //  GET THE CURRENT USER WITH SUPABASE
   const { data: { user }} = await supabase.auth.getUser()

   if (!user) return

   // GET A USER WORKSPACE
   const workspace = await db.query.workspaces.findFirst({
    where: (workspace, { eq }) => eq(workspace.workspaceOwner, user.id)
   })

   // SEE IF THE USER IS SIBSCRIBED FROM OUR QUERY
   const { data: subscription, error: subscriptionError } = await getUserSubscriptionStatus(user.id)

   if (subscriptionError) return

   if (!workspace) {
    return (
      <div className="bg-background h-screen w-screen flex justify-center items-center">
         <DashboardSetup user={user} subscription={subscription}/>
      </div>
    )
   }

   // REDIRECT IF THE USER ALREADY HAS A WORKSPACE
   redirect(`/dashboard/${workspace.id}`)
}

export default DashboardPage
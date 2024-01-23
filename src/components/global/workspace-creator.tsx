'use client'

import { useSupabaseUser } from "@/lib/providers/supabase-user-provider"
import { User, workspace } from "@/lib/supabase/supabase.types"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Divide, Lock, Plus, Share } from "lucide-react"
import { Button, buttonVariants } from "../ui/button"
import { v4 } from "uuid"
import { addCollaborators, createWorkspace } from "@/lib/supabase/queries"
import { useAppState } from "@/lib/providers/state-provider"
import CollaboratorSearch from "./collaborator-search"
import { cn } from "@/lib/utils"
import { ScrollArea } from "../ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import Loader from "./loader"
import { useToast } from "../ui/use-toast"

const WorkspaceCreator = () => {
    
    const { user } = useSupabaseUser()
    const router = useRouter()
    const { toast } = useToast()

    const [permissions, setPermissions] = useState<string>('private')
    const [title, setTitle] = useState<string>('')
    const [collaborators, setCollaborators] = useState<User[]>([])
    const [isloading, setIsLoading] = useState<boolean>(false)

    const { dispatch } = useAppState(); 

    const addCollaborator = (user: User) => {
        setCollaborators([...collaborators, user])
    }

    const removeCollaborator = (user: User) => {
        setCollaborators(collaborators.filter(c => c.id !== user.id))
    }

    const createItem = async () => {
        setIsLoading(true)
        const uuid = v4()
        if (user?.id) {
            const newWorkspace: workspace = {
                data: null,
                createdAt: new Date().toISOString(),
                iconId: '🚀',
                id: uuid,
                inTrash: '',
                title,
                workspaceOwner: user.id,
                logo: null,
                bannerUrl: ''
            }

            if (permissions === 'private') {
                await createWorkspace(newWorkspace)
                toast({
                    title: 'Success',
                    description: 'Created the workspace'
                })
                router.refresh()
            }

            if (permissions === 'shared') {
                await createWorkspace(newWorkspace)
                await addCollaborators(collaborators, uuid)
                toast({
                    title: 'Success',
                    description: 'Created the workspace'
                })
                router.refresh()
            }
        }

        setIsLoading(false)
    }

  return (
    <div className="flex gap-4 flex-col">
       <div>
            {/* WORKSPACE NAME */}
          <Label htmlFor="name" className="text-sm text-muted-foreground">
            Name
          </Label>
          <div className="flex justify-center items-center gap-2">
             <Input name="name" value={title} placeholder="Workspace Name" onChange={(e) => setTitle(e.target.value)}/>
          </div>
       </div>
       <>
          {/* WORKSPACE PERMISSION */}
         <Label htmlFor="permissions" className="text-sm text-muted-foreground">
             Permission
         </Label>
         <Select onValueChange={(val) => {setPermissions(val)}} defaultValue={permissions}>
             <SelectTrigger className="w-full h-26 -mt-3">
                <SelectValue/>
             </SelectTrigger>
             <SelectContent>
                 <SelectGroup>
                    {/* PRIVATE */}
                    <SelectItem value="private">
                       <div className="p-2 flex gap-4 justify-center items-center">
                          <Lock/>
                          <article className="text-left flex flex-col">
                             <span>Private</span>
                             <p>
                                Your workspace is private to you. You can choose to share
                                it later.
                             </p>
                          </article>
                       </div>
                    </SelectItem>
                     {/* PUBLIC */}
                    <SelectItem value="shared">
                       <div className="p-2 flex gap-4 justify-center items-center">
                          <Share/>
                          <article className="text-left flex flex-col">
                             <span>Shared</span>
                             <p>
                                Your workspace is public. You can invite collaborators.
                             </p>
                          </article>
                       </div>
                    </SelectItem>
                 </SelectGroup>
             </SelectContent>
         </Select>
       </>
       {/* SEARCH FOR COLLABORATORS */}
       {permissions === "shared" && (
        <div>
           <CollaboratorSearch existingCollaborators={collaborators} getCollaborator={(user) => addCollaborator(user)}>
             <div className={cn(buttonVariants(), 'text-sm mt-4 gap-x-2 hover:bg-indigo-500')}>
                <Plus/>
                Add Collaborators
             </div>
           </CollaboratorSearch>
           <div className="mt-4">
             <span className="text-sm text-muted-foreground">
                Collaborators {collaborators.length || ''}
             </span>
             <ScrollArea className="h-[120px] overflow-y-auto w-full rounded-md border-muted-foreground/20">
                {collaborators.length ? collaborators.map((c) => (
                    <div className="p-4 flex justify-between items-center" key={c.id}>
                       <div className="flex gap-4 items-center">
                         <Avatar>
                            <AvatarImage src={c.avatarUrl || '/brainbg.png'}/>
                            <AvatarFallback>BB</AvatarFallback>
                         </Avatar>
                         <div className="text-sm gap-2 text-muted-foreground overflow-hidden overflow-ellipsis sm:w-[300px] w-[140px]">
                            {c.email}
                         </div>
                       </div>
                       <Button className="" variant='secondary' onClick={() => removeCollaborator(c)}>
                          Remove
                       </Button>
                    </div>
                )) : (
                    <div className="absolute right-0 left-0 top-0 bottom-0 flex justify-center items-center ">
                        <span className="text-muted-foreground text-sm">
                           You have no collaborators
                        </span>
                    </div>
                )}
             </ScrollArea>
           </div>
        </div>
       )}
       <Button variant={'secondary'} onClick={createItem}
        type="button" disabled={!title || (permissions === "shared" && collaborators.length === 0) || isloading}>
          {isloading ? <Loader/> : 'Create'}
       </Button>
    </div>
  )
}

export default WorkspaceCreator
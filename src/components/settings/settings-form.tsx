'use client'

import { useAppState } from "@/lib/providers/state-provider"
import { useToast } from "../ui/use-toast"
import React, { useEffect, useRef, useState } from "react"
import { User, workspace } from "@/lib/supabase/supabase.types"
import { useSupabaseUser } from "@/lib/providers/supabase-user-provider"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Briefcase, CreditCard, Lock, LogOut, Plus, Share, UserIcon } from "lucide-react"
import { Separator } from "../ui/separator"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { addCollaborators, deleteWorkspace, getCollaborators, removeCollaborators, updateWorkspace } from "@/lib/supabase/queries"
import { revalidatePath } from "next/cache"
import { v4 } from "uuid"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import CollaboratorSearch from "../global/collaborator-search"
import { Button } from "../ui/button"
import { ScrollArea } from "../ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Alert, AlertDescription } from "../ui/alert"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader } from "../ui/alert-dialog"
import CypressProfileIcon from "../icons/profile-icon"
import LogoutButton from "../global/logout-button"

const SettingsForm = () => {

  const { toast } = useToast()
  const { state, workspaceId, dispatch } = useAppState()
  const { user, subscription } = useSupabaseUser()

  const router = useRouter()

  const supabase = createClientComponentClient()

  const [permissions, setPermissions] = useState<string>("private")
  const [collaborators, setCollaborators] = useState<User[] | []>([])
  const [openAlertMessage, setOpenAlertMessage] = useState<boolean>(false)
  const [workspaceDetails, setWorkspaceDetails] = useState<workspace>()
  const [uploadingProfilePic, setUploadingProfilePic] = useState<boolean>(false)
  const [uploadingLogo, setUploadingLogo] = useState<boolean>(false)

  const titleTimerRef = useRef<ReturnType<typeof setTimeout>>()

  //PAYMENT PORTAL

  // ADD COLLABORATOR
  const addCollaborator = async (profile: User) => {
    if (!workspaceId) return;
    // if (subscription?.status !== 'active' && collaborators.length >= 2) {
    //   setOpen(true);
    //   return;
    // }
    await addCollaborators([profile], workspaceId);
    setCollaborators([...collaborators, profile]);
  };

  // REMOVE COLLABORATOR
  const removeCollaborator = async (user: User) => {
    if (!workspaceId) return;
    if (collaborators.length === 1) {
      setPermissions('private');
    }
    await removeCollaborators([user], workspaceId);
    setCollaborators(
      collaborators.filter((collaborator) => collaborator.id !== user.id)
    );
    router.refresh();
  };

  // ON CHANGES
  const workspaceNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     if (!workspaceId || !e.target.value) return

     dispatch({ type: 'UPDATE_WORKSPACE', payload: { workspace: { title: e.target.value }, workspaceId } })

     if (titleTimerRef.current) clearTimeout(titleTimerRef.current)
     titleTimerRef.current = setTimeout(async () => {
      await updateWorkspace({ title: e.target.value }, workspaceId)
      // revalidatePath(`/dashboard/${workspaceId}`)
    }, 500)
  }

  // UPDATE WORKSPACE LOGO
  const workspaceLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
     if (!workspaceId) return;
     const file = e.target.files?.[0];
     if (!file) return;
     const uuid = v4();
     setUploadingLogo(true);
    
     // Delete the previous image from the storage bucket
     if (workspaceDetails?.logo) {
        await supabase.storage.from('workspace-logos').remove([`${workspaceDetails.logo}`]);
     }

     const { data: data, error: error } = await supabase.storage
     .from('workspace-logos').upload(`workspaceLogo.${uuid}`, file, {
       cacheControl: '3600',
       upsert: true,
     });

    if (!error) {
      dispatch({
        type: 'UPDATE_WORKSPACE',
        payload: { workspace: { logo: data.path }, workspaceId },
      });
      await updateWorkspace({ logo: data.path }, workspaceId);
      setUploadingLogo(false);
    }
  }

  const onClickAlertConfirm = async () => {
     if (!workspaceId) return

     if (collaborators.length > 0) {
         await removeCollaborators(collaborators, workspaceId)
     }

     setPermissions('private')
     setOpenAlertMessage(false)
  }

  const onPermissionsChange = (val: string) => {
    if (val === 'private') {
      setOpenAlertMessage(true);
    } else setPermissions(val);
  };

  useEffect(() => {
    const showingWorkspace = state.workspaces.find((workspace) => workspace.id === workspaceId );
    if (showingWorkspace) setWorkspaceDetails(showingWorkspace);
  }, [workspaceId, state]);

  useEffect(() => {
    if (!workspaceId) return;
    const fetchCollaborators = async () => {
      const response = await getCollaborators(workspaceId);
      if (response.length) {
        setPermissions('shared');
        setCollaborators(response);
      }
    };
    fetchCollaborators();
  }, [workspaceId]);

  return (
    <div className="flex gap-4 flex-col">
      <p className="flex items-center gap-2 mt-6">
         <Briefcase size={20}/>
         Workspace
      </p>
      <Separator/>
      <div className="flex flex-col gap-2">
        <Label htmlFor="workspaceName" className="text-sm text-muted-foreground">
            Name
        </Label>
        <Input name="workspaceName" value={workspaceDetails ? workspaceDetails.title : ''}
        placeholder="Workspace Name" onChange={workspaceNameChange}/>

        <Label htmlFor="workspaceLogo" className="text-sm text-muted-foreground">
           Workspace Logo
        </Label>
        <Input name="workspaceLogo" type="file" accept="image/*"
        placeholder="Workspace Logo" onChange={workspaceLogoChange} disabled={uploadingLogo}/>
        {/* SUBSCRIPTION */}
      </div>
      <>
       <Label htmlFor="permissions">
         Permissions
       </Label>
       <Select onValueChange={onPermissionsChange} value={permissions}>
          <SelectTrigger className="w-full h-26 -mt-3">
            <SelectValue/>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="private">
                <div className="p-2 flex gap-4 justify-center items-center"
                >
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
              <SelectItem value="shared">
                <div className="p-2 flex gap-4 justify-center items-center">
                  <Share/>
                  <article className="text-left flex flex-col">
                    <span>Shared</span>
                    <span>You can invite collaborators.</span>
                  </article>
                </div>
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        {permissions === 'shared' && (
          <div>
            <CollaboratorSearch existingCollaborators={collaborators} getCollaborator={(user) => {
                addCollaborator(user);
              }}
            >
              <Button type="button" className="text-sm mt-4">
                <Plus/>
                Add Collaborators
              </Button>
            </CollaboratorSearch>
            <div className="mt-4">
              <span className="text-sm text-muted-foreground">
                Collaborators {collaborators.length || ''}
              </span>
              <ScrollArea className=" h-[120px] overflow-y-scroll w-full rounded-md border border-muted-foreground/20">
                {collaborators.length ? (
                  collaborators.map((c) => (
                    <div className="p-4 flex justify-between items-center" key={c.id}>
                      <div className="flex gap-4 items-center">
                        <Avatar>
                          <AvatarImage src={c.avatarUrl || '/brainbg.png'} />
                          <AvatarFallback>PJ</AvatarFallback>
                        </Avatar>
                        <div className="text-sm  gap-2 text-muted-foreground overflow-hidden overflow-ellipsis sm:w-[300px] w-[140px]">
                          {c.email}
                        </div>
                      </div>
                      <Button variant="secondary" onClick={() => removeCollaborator(c)}>
                        Remove
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="absolute right-0 left-0 top-0 bottom-0 flex justify-center items-center">
                    <span className="text-muted-foreground text-sm">
                      You have no collaborators
                    </span>
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        )}
          <Alert variant={'destructive'}>
          <AlertDescription>
            Warning! deleting you workspace will permanantly delete all data
            related to this workspace.
          </AlertDescription>
          <Button type="submit" size={'sm'} variant={'destructive'} className="mt-4  text-sm bg-destructive/40  border-2  border-destructive"
            onClick={async () => {
              if (!workspaceId) return;
              await deleteWorkspace(workspaceId);
              toast({ title: 'Successfully deleted your workspae' });
              dispatch({ type: 'DELETE_WORKSPACE', payload: workspaceId });
              router.replace('/dashboard');
            }}
          >
            Delete Workspace
          </Button>
        </Alert>
        <p className="flex items-center gap-2 mt-6">
           <UserIcon size={20}/> Profile
        </p>
        <Separator/>
        <div className="flex items-center">
           <Avatar>
             <AvatarImage src={''}/>
             <AvatarFallback>
               <CypressProfileIcon/>
             </AvatarFallback>
           </Avatar>
           <div className="flex flex-col ml-6">
             <small className="text-muted-foreground cursor-not-allowed">
               {user ? user.email : ''}
             </small>
             <Label htmlFor="profilePicture" className="text-sm text-muted-foreground">
                  Profile Picture
             </Label>
             <Input name="profilePicture" type="file" accept="image/*" placeholder="Profile Picture"
            //  onChange={onChangeProfilePicture} 
             disabled={uploadingProfilePic}/>
           </div>
        </div>
        <LogoutButton>
           <div className="flex items-center">
              <LogOut/>
           </div>
        </LogoutButton>
        <p className="flex items-center gap-2 mt-6">
           <CreditCard size={20}/> Billing & Plan
        </p>
        <Separator/>
        <p className="text-muted-foreground">
          You are currently on a {' '}
          {subscription?.status === 'active' ? 'Pro' : 'Free'} Plan
        </p>
      </>
      <AlertDialog open={openAlertMessage}>
          <AlertDialogContent> 
            <AlertDialogHeader>
               <AlertDialogContent>
                 Are you sure?
               </AlertDialogContent>
               <AlertDescription>
                 Changing a Shared workspace to a Private workspace will remove all collaborators permanently.
               </AlertDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
               <AlertDialogCancel onClick={() => setOpenAlertMessage(false)}>
                   Cancel
               </AlertDialogCancel>
               <AlertDialogAction onClick={onClickAlertConfirm}>
                   Continue
               </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default SettingsForm
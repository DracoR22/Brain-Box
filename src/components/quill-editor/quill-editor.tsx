'use client'

import { useAppState } from "@/lib/providers/state-provider"
import { File, Folder, workspace } from "@/lib/supabase/supabase.types"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import 'quill/dist/quill.snow.css'
import { files } from "@/lib/supabase/schema"
import { Button } from "../ui/button"
import { deleteFile, deleteFolder, findUser, getCollaborators, getFileDetails, getFolderDetails, getWorkspaceDetails, updateFile, updateFolder, updateWorkspace } from "@/lib/supabase/queries"
import { usePathname, useRouter } from "next/navigation"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Badge } from "../ui/badge"
import Image from "next/image"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import EmojiPicker from "../global/emoji-picker"
import BannerUpload from "../banner-upload/banner-upload"
import { Divide, XCircleIcon } from "lucide-react"
import { useSocket } from "@/lib/providers/socket-provider"
import { useSupabaseUser } from "@/lib/providers/supabase-user-provider"

interface QuillEditorProps {
    dirDetails: File | Folder | workspace
    fileId: string
    dirType: 'workspace' | 'folder' | 'file'
}

const QuillEditor = ({ dirDetails, fileId, dirType }: QuillEditorProps) => {

   const supabase = createClientComponentClient()
   const { state, workspaceId, folderId, dispatch } = useAppState()
   const { user } = useSupabaseUser()
   const router = useRouter()
   const pathname = usePathname()
   const saveTimerRef = useRef<ReturnType<typeof setTimeout>>()

   // USE THE SOCKET CONTEXT
   const { socket, isConnected } = useSocket()

   const [quill, setQuill] = useState<any>(null)
   const [collaborators, setCollaborators] = useState<{ id: string; email: string; avatarUrl: string }[]>([]);
   const [saving, setSaving] = useState<boolean>(false)
   const [deletingBanner, setDeletingBanner] = useState<boolean>(false)
   const [localCursors, setLocalCursors] = useState<any>([])

   // GET DETAILS OF THE FOLDER, FILE OR WORKSPACE. THIS GETS THE DETAILS IN REAL TIME USING THE STATE
   const details = useMemo(() => {
     let selectedDir 

     if (dirType === 'file') {
         selectedDir = state.workspaces.find((workspace) => workspace.id === workspaceId)
         ?.folders.find((folder) => folder.id === folderId)
         ?.files.find((file) => file.id === fileId)
     }

     if (dirType === 'folder') {
        selectedDir = state.workspaces.find((workspace) => workspace.id === workspaceId)
        ?.folders.find((folder) => folder.id === fileId)
     }

     if (dirType === 'workspace') {
        selectedDir = state.workspaces.find((workspace) => workspace.id === fileId)
     }

     if (selectedDir) {
        return selectedDir
     }

     return {
        title: dirDetails.title,
        iconId: dirDetails.iconId,
        createdAt: dirDetails.createdAt,
        data: dirDetails.data,
        inTrash: dirDetails.inTrash,
        bannerUrl: dirDetails.bannerUrl
     } as workspace | Folder | File
   }, [state, workspaceId, folderId])

   // EDITOR TOOLBAR STUFF
   var TOOLBAR_OPTIONS = [
    ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
    ['blockquote', 'code-block'],
  
    [{ 'header': 1 }, { 'header': 2 }],               // custom button values
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
    [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
    [{ 'direction': 'rtl' }],                         // text direction
  
    [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
  
    [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
    [{ 'font': [] }],
    [{ 'align': [] }],
  
    ['clean']                                         // remove formatting button
  ];

   // DYNAMICALLY MOUNT QUILL EDITOR
   const wrapperRef = useCallback(async (wrapper: any) => {
    if (typeof window !== 'undefined') {
        if (wrapper === null) return
        wrapper.innerHTML = ''

        const editor = document.createElement('div')
        wrapper.append(editor)

        const Quill = (await import('quill')).default

        // cursors
        const QuillCursors = (await import('quill-cursors')).default
        Quill.register('modules/cursors', QuillCursors)
        
        const q = new Quill(editor, {
            theme: 'snow',
            modules: {
                toolbar: TOOLBAR_OPTIONS,
                // cursors
                cursors: {
                  transformOnTextChange: true
                }
            }
        })

        setQuill(q)
    }
   }, [])

  // RESTORE FILE
  const restoreFileHandler = async () => {
    if (dirType === 'file') {
        if (!folderId || !workspaceId) return
        dispatch({ type: 'UPDATE_FILE', payload: { file: { inTrash: ''}, fileId, folderId, workspaceId }})
        await updateFile({ inTrash: '' }, fileId)
    }

    if (dirType === 'folder') {
        if (!workspaceId) return
        dispatch({ type: 'UPDATE_FOLDER', payload: { folder: { inTrash: ''}, folderId: fileId, workspaceId }})
        await updateFolder({ inTrash: '' }, fileId)
    }
  }

  // DELETE FILE
  const deleteFileHandler = async () => {
    if (dirType === 'file') {
        if (!folderId || !workspaceId) return
        dispatch({ type: 'DELETE_FILE', payload: { fileId, folderId, workspaceId }})
        await deleteFile(fileId)
        router.push(`/dashboard/${workspaceId}/${folderId}`)
    }

    if (dirType === 'folder') {
        if (!workspaceId) return
        dispatch({ type: 'DELETE_FOLDER', payload: { folderId: fileId, workspaceId}})
        await deleteFolder(fileId)
        router.push(`/dashboard/${workspaceId}`)
    }
  }

  // GET FOLDER, FILE OR WORKSPACE DIRECTORY
  const breadCrumbs = useMemo(() => {
    if (!pathname || !state.workspaces || !workspaceId) return

    const segments = pathname.split('/').filter((val) => val !== 'dashboard' && val)

    const workspaceDetails = state.workspaces.find((workspace) => workspace.id === workspaceId)
    const workspaceBreadCrumb = workspaceDetails ? `${workspaceDetails.iconId} ${workspaceDetails.title}` : ''
    if (segments.length === 1) {
        return workspaceBreadCrumb
    }

    const folderSegment = segments[1]
    const folderDetails = workspaceDetails?.folders.find((folder) => folder.id === folderSegment)
    const folderBreadCrumb = folderDetails ? `/ ${folderDetails.iconId} ${folderDetails.title}` : ''

    if (segments.length === 2) {
        return `${workspaceBreadCrumb} ${folderBreadCrumb}`
    }

    const fileSegment = segments[2]
    const fileDetails = folderDetails?.files.find((file) => file.id === fileSegment)
    const fileBreadCrumb = fileDetails ? `/ ${fileDetails.iconId} ${fileDetails.title}` : ''

    if (segments.length === 3) {
        return `${workspaceBreadCrumb} ${folderBreadCrumb} ${fileBreadCrumb}`
    }
  }, [state, pathname, workspaceId])

  // UPDATE ICON
  const iconOnChange = async (icon: string) => {
     if (!fileId) return

     if (dirType === 'workspace') {
      dispatch({ type: 'UPDATE_WORKSPACE', payload: { workspace: { iconId: icon }, workspaceId: fileId }})
      await updateWorkspace({ iconId: icon }, fileId)
     }
     if (dirType === 'folder') {
      if (!workspaceId) return
      dispatch({ type: 'UPDATE_FOLDER', payload: { folder: { iconId: icon }, folderId: fileId, workspaceId }})
      await updateFolder({ iconId: icon }, fileId)
     }
     if (dirType === 'file') {
      if (!workspaceId || !folderId) return
      dispatch({ type: 'UPDATE_FILE', payload: { file: { iconId: icon}, fileId, folderId, workspaceId }})
      await updateFile({ iconId: icon }, fileId)
     }
  }

  // DELETE BANNER
  const deleteBanner = async () => {
    if (!fileId) return;
    setDeletingBanner(true);
    if (dirType === 'file') {
      if (!folderId || !workspaceId) return;
      dispatch({
        type: 'UPDATE_FILE',
        payload: { file: { bannerUrl: '' }, fileId, folderId, workspaceId },
      });
      await supabase.storage.from('file-banners').remove([`banner-${fileId}`]);
      await updateFile({ bannerUrl: '' }, fileId);
    }
    if (dirType === 'folder') {
      if (!workspaceId) return;
      dispatch({
        type: 'UPDATE_FOLDER',
        payload: { folder: { bannerUrl: '' }, folderId: fileId, workspaceId },
      });
      await supabase.storage.from('file-banners').remove([`banner-${fileId}`]);
      await updateFolder({ bannerUrl: '' }, fileId);
    }
    if (dirType === 'workspace') {
      dispatch({
        type: 'UPDATE_WORKSPACE',
        payload: {
          workspace: { bannerUrl: '' },
          workspaceId: fileId,
        },
      });
      await supabase.storage.from('file-banners').remove([`banner-${fileId}`]);
      await updateWorkspace({ bannerUrl: '' }, fileId);
    }
    setDeletingBanner(false);
  };

  // FETCH LATEST INFO OF THE FILE DATA AND GET DATA CONTENT FROM THE DATABASE
  useEffect(()  => {
    if (!fileId) return
     let selectedDir

     const fetchInformation = async () => {
      if (dirType === 'file') {
        const { data: selectedDir, error } = await getFileDetails(fileId)

        if (error || !selectedDir) {
          return router.replace('/dashboard')
        }

        if (!selectedDir[0]) {
          if (!workspaceId) return
          return router.replace(`/dashboard/${workspaceId}`)
        }

        if (!workspaceId || quill === null) return
        if (!selectedDir[0].data) return

        quill.setContents(JSON.parse(selectedDir[0].data || ''))
        dispatch({ type: 'UPDATE_FILE', payload: { file: { data: selectedDir[0].data }, fileId, folderId: selectedDir[0].folderId, workspaceId}})
      }

      if (dirType === 'folder') {
        const { data: selectedDir, error } = await getFolderDetails(fileId)

        if (error || !selectedDir) {
          return router.replace('/dashboard')
        }

        if (!selectedDir[0]) {
          if (!workspaceId) return
          return router.replace(`/dashboard/${workspaceId}`)
        }

        if (!workspaceId || quill === null) return
        if (!selectedDir[0].data) return

        quill.setContents(JSON.parse(selectedDir[0].data || ''))
        dispatch({ type: 'UPDATE_FOLDER', payload: { folder: { data: selectedDir[0].data }, folderId: fileId, workspaceId }})
      }

      if (dirType === 'workspace') {
        const { data: selectedDir, error } = await getWorkspaceDetails(fileId);
        if (error || !selectedDir) {
          return router.replace('/dashboard');
        }
        if (!selectedDir[0] || quill === null) return;
        if (!selectedDir[0].data) return;
        quill.setContents(JSON.parse(selectedDir[0].data || ''));
        dispatch({
          type: 'UPDATE_WORKSPACE',
          payload: {
            workspace: { data: selectedDir[0].data },
            workspaceId: fileId,
          },
        });
      }
     }

     fetchInformation()
  }, [fileId, workspaceId, folderId, quill, dirType])

   // GET THE COLLABORATORS
   useEffect(() => {
     if (!fileId || quill === null) return

     const room = supabase.channel(fileId)
     const subscription = room.on('presence', { event: 'sync' }, () => {
       const newState = room.presenceState()
       const newCollaborators = Object.values(newState).flat() as any
       setCollaborators(newCollaborators)

       if (user) {
        const allCursors: any = []
        newCollaborators.forEach((collaborator: { id: string, email: string, avatar: string}) => {
          if (collaborator.id !== user.id) {
            const userCursor = quill.getModule('cursors')
            userCursor.createCursor(collaborator.id, collaborator.email.split('@')[0], `#${Math.random().toString(16).slice(2, 8)}`)
            allCursors.push(userCursor)
          }
        })
        setLocalCursors(allCursors)
       }
     }).subscribe(async (status) => {
      if (status !== 'SUBSCRIBED' || !user) return
      const response =  await findUser(user.id)
      if (!response) return

      room.track({
        id: user.id,
        email: user.email?.split('@')[0],
        avarUrl: response.avatarUrl ? supabase.storage.from('avatars').getPublicUrl(response.avatarUrl).data.publicUrl : ''
      })
     })

     return () => {
      supabase.removeChannel(room)
     }
  }, [fileId, quill, supabase, user]);

  // CREATE SOCKET ROOM AND SAVE THE DATA TO THE DATABASE
  useEffect(() => {
     if (socket === null || quill === null || !fileId) return

     socket.emit('create-room', fileId)
  }, [socket, quill, fileId])

  // SEND QUILL CHANGES TO ALL CLIENTS USING SOCKET
  useEffect(() => {
    if (socket === null || quill === null || !fileId || !user) return

       // Cursors updates 
       const selectionChangeHandler = (cursorId: string) => {
          return (range: any, oldRange: any, source: any) => {
            if (source === 'user' && cursorId) {
              // call the cursor socket
              socket.emit('send-cursor-move', range, fileId, cursorId)
            }
          }
       }

       // Save changes to the database
       const quillHandler = (delta: any, oldDelta: any, source: any) => {
        if (source !== 'user') return
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        setSaving(true)
        const contents = quill.getContents()
        const quillLength = quill.getLength()
        saveTimerRef.current = setTimeout(async () => {
          if (contents && quillLength !== 1 && fileId) {
            // Save changes for the workspace
            if (dirType === 'workspace') {
               dispatch({ type: 'UPDATE_WORKSPACE', payload: { workspace: { data: JSON.stringify(contents)}, workspaceId: fileId }})
              // DB call
               await updateWorkspace({ data: JSON.stringify(contents) }, fileId)
            }

            // Save changes for the folder
            if (dirType === 'folder') {
              if (!workspaceId) return
              dispatch({ type: 'UPDATE_FOLDER', payload: { folder: { data: JSON.stringify(contents)}, folderId: fileId, workspaceId}})
              // DB call
              await updateFolder({ data: JSON.stringify(contents) }, fileId)
            }

            // Save changes for the file
            if (dirType === 'file') {
              if (!workspaceId || !folderId) return
              dispatch({ type: 'UPDATE_FILE', payload: { file: { data: JSON.stringify(contents)}, fileId, folderId, workspaceId}})
              // DB call
              await updateFile({ data: JSON.stringify(contents) }, fileId)
            }
          }
          setSaving(false)
        }, 850)

        // Send changes to the socket
        socket.emit('send-changes', delta, fileId)
       }

       // Use our function to save to db
       quill.on('text-change', quillHandler)

       // Cursor selection handler
       quill.on('selection-change', selectionChangeHandler(user.id))

       return () => {
         quill.off('text-change', quillHandler)

         //Cursor
         quill.off('selection-change', selectionChangeHandler)

         if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
       }
  }, [socket, quill, fileId, user, details, folderId, workspaceId])

  // RECEIVE CURSOR CHANGES USING OUR SOCKET
  useEffect(() => {
    if (quill === null || socket === null || !fileId || !localCursors.length) return
    const socketHandler = (range: any, roomId: string, cursorId: string) => {
      if (roomId === fileId) {
        const cursorToMove = localCursors.find((c: any) => c.cursors()?.[0].id === cursorId)
        if (cursorToMove) {
          cursorToMove.moveCursor(cursorId, range)
        }
      }
    }
    socket.on('receive-cursor-move', socketHandler)
    return () => {
      socket.off('receive-cursor-move', socketHandler)
    }
  }, [quill, socket, fileId, localCursors])

  // RECEIVE CHANGES FOR ALL USERS USING OUR SOCKET
  useEffect(() => {
     if (quill === null || socket === null || !fileId) return
     const socketHandler = (deltas: any, id: string) => {
        if (id === fileId) {
          quill.updateContents(deltas)
        }
     }

     socket.on('receive-changes', socketHandler)

     return () => {
       socket.off('receive-changes', socketHandler)
     }
  }, [quill, socket, fileId])

  return (
    <>
    {/* FOR FOLDERS OR FILES IN THE TRASH */}
    <div className="relative">
      {details.inTrash && (
        <article className="py-2 z-40 bg-[#EB5757] flex md:flex-row flex-col justify-center
        items-center gap-4 flex-wrap">
            <div className="flex flex-col md:flex-row gap-2 justify-center items-center">
               <span className="text-white">
                   This {dirType} is in the trash.
               </span>
               <Button size='sm' variant='outline' className="bg-transparent border border-white
               text-white hover:bg-white hover:text-[#EB5757]" onClick={restoreFileHandler}>
                  Restore
               </Button>

               <Button size='sm' variant='outline' className="bg-transparent border border-white
               text-white hover:bg-white hover:text-[#EB5757]" onClick={deleteFileHandler}>
                  Delete
               </Button>
            </div>
            <span className="text-sm text-white">
               {details.inTrash}
            </span>
        </article>
      )}
      {/* SEE THE CURRENT FILE DIRECTORY */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center sm:p-2 p-8">
          <div>
            {breadCrumbs}
          </div>
          {/* COLLABORATORS ICONS */}
          <div className="flex items-center gap-4">
              <div className="flex items-center justify-center h-10">
                 {collaborators?.map((collaborator) => (
                  <TooltipProvider key={collaborator.id}>
                    <Tooltip>
                     <TooltipTrigger>
                       <Avatar className="-ml-3 bg-background border-2 flex items-center justify-center border-white h-8 w-8 rounded-full">
                         <AvatarImage src={collaborator.avatarUrl ? collaborator.avatarUrl : ''} className="rounded-full"/>
                         <AvatarFallback>
                             {collaborator.email?.substring(0, 2).toUpperCase()}
                         </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>{collaborator.email}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                 ))}
              </div>
              {/* IF ITS SAVING */}
              {saving ? (
                <Badge variant='secondary' className="bg-orange-600 top-4 text-white right-4 z-50">
                   Saving...
                </Badge>
              ) : (
                <Badge variant='secondary' className="bg-emerald-600 top-4 text-white right-4 z-50">
                  Saved
                </Badge>
              )}
          </div>
      </div>
    </div>
      {/* BANNER IMAGE */}
      {details.bannerUrl && (
        <div className="relative w-full h-[200px]">
           <Image
           src={supabase.storage.from('file-banners').getPublicUrl(details.bannerUrl).data.publicUrl}
            alt="Banner Image" fill className="w-full md:h-48 h-20 object-cover"/>
        </div>
      )}
      <div className="flex justify-center items-center flex-col mt-2 relative">
        {/* SHOW EMOJI */}
        <div className="w-full self-center max-w-[800px] flex flex-col px-7 lg:my-8">
           <div className="text-[80px]">
              <EmojiPicker getValue={iconOnChange}>
                 <div className="w-[100px] cursor-pointer transition-colors h-[100px] flex items-center justify-center hover:bg-muted rounded-xl">
                    {details.iconId}
                 </div>
              </EmojiPicker>
           </div>
           {/* UPLOAD A BANNER */}
           <div className="flex">
             <BannerUpload id={fileId} dirType={dirType} className="mt-2 text-sm text-muted-foreground p-2 hover:text-card-foreground transition-all rounded-md">
                 {details.bannerUrl ? "Update Banner" : "Add Banner"}
             </BannerUpload>
             {details.bannerUrl && (
              <Button disabled={deletingBanner} onClick={deleteBanner}
               variant='ghost' className="gap-2 hover:bg-background flex items-center justify-center mt-2 text-sm text-muted-foreground w-36 p-2 rounded-md">
                <XCircleIcon size={16}/>
                <span className="whitespace-nowrap font-normal">
                  Remove Banner
                </span>
              </Button>
             )}
           </div>
           {/* FILE TITLE */}
           <span className="text-muted-foreground text-3xl font-bold h-9">
             {details.title}
           </span> 
           {/* DIRECTORY TYPE */}
           <span className="text-muted-foreground text-sm mt-4">
               {dirType.toUpperCase()}
           </span>
        </div>
        {/* THIS IS THE QUILL EDITOR*/}
        <div id="container" ref={wrapperRef} className="max-w-[800px] min-h-[800px]">

        </div>
      </div>
    </>
  )
}

export default QuillEditor
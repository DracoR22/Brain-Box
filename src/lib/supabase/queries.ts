'use server'

import { validate } from "uuid"
import { collaborators, files, folders, users, workspaces } from "../../../migrations/schema"
import db from "./db"
import { File, Folder, Subscription, User, workspace } from "./supabase.types"
import { and, eq, ilike, notExists } from "drizzle-orm"

//---------------------------------------//CREATE WORKSPACE//-------------------------------------//
export const createWorkspace = async (workspace: workspace) => {
   try {
      const response = await db.insert(workspaces).values(workspace)
      return { data: null, error: null };
   } catch (error) {
      return { data: null, error: 'Error' };
   }
}

//-----------------------------------------//CREATE FOLDER//--------------------------------------//
export const createFolder = async (folder: Folder) => {
   try {
      const results = await db.insert(folders).values(folder)

      return { data: null, error: null}
   } catch (error) {
      console.log(error)
      return { data: null, error: 'Error'}
   }
}

//-------------------------------------------//CREATE FILE//--------------------------------------//
export const createFile = async (file: File) => {
   try {
      await db.insert(files).values(file)

      return { data: null, error: null }
   } catch (error) {
      return { data: null, error: 'Error' }
   }
}

//---------------------------------------//ADD COLLABORATOR//-------------------------------------//
export const addCollaborators = async (users: User[], workspaceId: string) => {
   //Check if the user is already a collaborator before adding it 
  const response = users.forEach(async (user: User) => {
   const userExists = await db.query.collaborators.findFirst({
      where: (u, { eq }) => and(eq(u.userId, user.id), eq(u.workspaceId, workspaceId))
    })

    if (!userExists) await db.insert(collaborators).values({workspaceId, userId: user.id})
  })
}

//-----------------------------------------//UPDATE FOLDER//--------------------------------------//
export const updateFolder = async (folder: Partial<Folder>, folderId: string) => {
  try {
   await db.update(folders).set(folder).where(eq(folders.id, folderId))

   return {data: null, error: null}
  } catch (error) {
   console.log(error)
   return {data: null, error: 'Error'}
  }
}

//-----------------------------------------//UPDATE WORKSPACE//-----------------------------------//
export const updateWorkspace = async (workspace: Partial<workspace>, workspaceId: string) => {
    if (!workspaceId) return

    try {
      await db.update(workspaces).set(workspace).where(eq(workspaces.id, workspaceId))

      return {data: null, error: null}
    } catch (error) {
      console.log(error)
      return {data: null, error: 'Error'}
    }
}

//-------------------------------------------//UPDATE FILE//--------------------------------------//
export const updateFile = async (file: Partial<File>, fileId: string) => {
   try {
      const response = await db.update(files).set(file).where(eq(files.id, fileId))

      return {data: null, error: null}
   } catch (error) {
      console.log(error)
      return {data: null, error: 'Error'}
   }
}

//-------------------------------------//GET PRIVATE WORKSPACES//---------------------------------//
export const getPrivateWorkspaces = async (userId: string) => {
   if (!userId) return []

   // Get the workspaces that dont have any collaborators
   const privateWorkspaces = await db.select({
      id: workspaces.id,
      createdAt: workspaces.createdAt,
      workspaceOwner: workspaces.workspaceOwner,
      title: workspaces.title,
      iconId: workspaces.iconId,
      data: workspaces.data,
      inTrash: workspaces.inTrash,
      logo: workspaces.logo,
      bannerUrl: workspaces.bannerUrl,
   }).from(workspaces).where(and(notExists(db.select().from(collaborators).where(eq(collaborators.workspaceId, workspaces.id))),
    eq(workspaces.workspaceOwner, userId))) as workspace []

    return privateWorkspaces
}

//--------------------------------//GET WORKSPACES WITH COLLABORATORS//---------------------------//
export const getCollaboratingWorkspaces = async (userId: string) => {
  if (!userId) return []

  // Get the workspaces that have collaborators
  const collaboratedWorkspaces = (await db
   .select({
     id: workspaces.id,
     createdAt: workspaces.createdAt,
     workspaceOwner: workspaces.workspaceOwner,
     title: workspaces.title,
     iconId: workspaces.iconId,
     data: workspaces.data,
     inTrash: workspaces.inTrash,
     logo: workspaces.logo,
     bannerUrl: workspaces.bannerUrl,
   })
   .from(users)
   .innerJoin(collaborators, eq(users.id, collaborators.userId))
   .innerJoin(workspaces, eq(collaborators.workspaceId, workspaces.id))
   .where(eq(users.id, userId))) as workspace[];
 return collaboratedWorkspaces;
}

//---------------------------------------//GET SHARED WORKSPACES//--------------------------------//
export const getSharedWorkspaces = async (userId: string) => {
   if (!userId) return []

   const sharedWorkspaces = await db.selectDistinct({
      id: workspaces.id,
      createdAt: workspaces.createdAt,
      workspaceOwner: workspaces.workspaceOwner,
      title: workspaces.title,
      iconId: workspaces.iconId,
      data: workspaces.data,
      inTrash: workspaces.inTrash,
      logo: workspaces.logo,
      bannerUrl: workspaces.bannerUrl,
     }).from(workspaces)
     .orderBy(workspaces.createdAt)
     .innerJoin(collaborators, eq(workspaces.id, collaborators.workspaceId))
     .where(eq(workspaces.workspaceOwner, userId)) as workspace[]
   
     return sharedWorkspaces
}

//-----------------------------------------//GET ALL FILES//--------------------------------------//
export const getFiles = async (folderId: string) => {
   const isValid = validate(folderId);
   if (!isValid) return { data: null, error: 'Error' };

   try {
     const results = (
      await db.select().from(files).orderBy(files.createdAt).where(eq(files.folderId, folderId))) as File[] | [];

      return { data: results, error: null };
   } catch (error) {
     console.log(error);
     return { data: null, error: 'Error' };
   }
 };

//------------------------------------//GET ALL WORKSPACE FOLDERS//--------------------------------//
export const getFolders = async (workspaceId: string) => {
   const isValid = validate(workspaceId)
   if (!isValid) return { data: null, error: 'Error' }

   try {
      const results: Folder[] | [] = await db.select().from(folders).orderBy(folders.createdAt).where(eq(folders.workspaceId, workspaceId))

      return { data: results, error: null };
   } catch (error) {
      console.log(error);
      return { data: null, error: 'Error' };
   }
}

//-----------------------------------//GET USERS TO COLLABORATE WITH//-----------------------------//
export const getUsersFromSearch = async (email: string) => {
      if (!email) return []
      
      const accounts = await db.select().from(users).where(ilike(users.email, `${email}%`))

      return accounts
}


//-------------------------------------//GET ALL COLLABORATORS//----------------------------------//
export const getCollaborators = async (workspaceId: string) => {
   if (!workspaceId) return []

   const results = await db.select().from(collaborators).where(eq(collaborators.workspaceId, workspaceId))

   if (!results.length) return []

   const userInformation: Promise<User | undefined>[] = results.map(
      async (user) => {
         const exists = await db.query.users.findFirst({ where: (u,{ eq }) => eq(u.id, user.userId)})

         return exists
      }
   )

   const resolvedUsers = await Promise.all(userInformation)
   return resolvedUsers.filter(Boolean) as User[]
}

//------------------------------------//GET WORKSPACE DETAILS//-----------------------------------//
export const getWorkspaceDetails = async (workspaceId: string) => {
   const isValid = validate(workspaceId)
   if (!isValid) {
      return {
      data: [],
      error: 'Error'
      }
   }

   try {
     const workspace = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1) as workspace[]

     return { data: workspace, error: null}
   } catch (error) {
      console.log(error)
      return { data: [], error: 'Error'}
   }
}

//--------------------------------------//GET FOLDER DETAILS//------------------------------------//
export const getFolderDetails = async (folderId: string ) => {
   const isValid = validate(folderId)
   if (!isValid) {
      return {
      data: [],
      error: 'Error'
      }
   }

   try {
      const folder = await db.select().from(folders).where(eq(folders.id, folderId)).limit(1) as Folder[]

      return { data: folder, error: null}
   } catch (error) {
      return { data: [], error: 'Error'}
   }
}

//----------------------------------------//GET FILE DETAILS//------------------------------------//
export const getFileDetails = async (fileId: string ) => {
   const isValid = validate(fileId)
   if (!isValid) {
      return {
      data: [],
      error: 'Error'
      }
   }

   try {
      const file = await db.select().from(files).where(eq(files.id, fileId)).limit(1) as File[]

      return { data: file, error: null}
   } catch (error) {
      return { data: [], error: 'Error'}
   }
}

//-----------------------------------------//GET USER BY ID-//------------------------------------//
export const findUser = async (userId: string) => {
   const response = await db.query.users.findFirst({where: (u, { eq }) => eq(u.id, userId)})

   return response
}

//------------------------------------//GET USER SUBSCRIPTION//-----------------------------------//
export const getUserSubscriptionStatus = async (userId: string) => {
   try {
      const data = await db.query.subscriptions.findFirst({
        where: (s, { eq }) => eq(s.userId, userId)
      })

      if (data) return { data: data as Subscription, error: null}
      else return { data: null, error: null }
   } catch (error) {
      console.log(error)
      return { data: null, error: `Error ${error}` }
   }
}

//--------------------------------------//DELETE WORKSPACE//--------------------------------------//
export const deleteWorkspace = async (workspaceId: string) => {
   if (!workspaceId) return

   await db.delete(workspaces).where(eq(workspaces.id, workspaceId))
}

//----------------------------------------//DELETE FILE//-----------------------------------------//
export const deleteFile = async (fileId: string) => {
   if (!fileId) return

   await db.delete(files).where(eq(files.id, fileId))
}

//----------------------------------------//DELETE FOLDER//-----------------------------------------//
export const deleteFolder = async (folderId: string) => {
   if (!folderId) return

   await db.delete(folders).where(eq(folders.id, folderId))
}

//-----------------------------------------//DELETE COLLABORATOR//---------------------------------//
export const removeCollaborators = async (users: User[], workspaceId: string) => {
   const response = users.forEach(async (user: User) => {
      const userExists = await db.query.collaborators.findFirst({
        where: (u, { eq }) =>
          and(eq(u.userId, user.id), eq(u.workspaceId, workspaceId)),
      });
      if (userExists)
        await db
          .delete(collaborators)
          .where(
            and(
              eq(collaborators.workspaceId, workspaceId),
              eq(collaborators.userId, user.id)
            )
          );
    });
}
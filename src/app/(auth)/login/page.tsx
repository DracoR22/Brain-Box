'use client'

import { useRouter } from "next/navigation"
import { useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { FormSchema } from "@/lib/types"
import { Form, FormControl, FormDescription, FormField, FormItem, FormMessage } from "@/components/ui/form"
import Link from "next/link"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Loader from "@/components/global/loader"
import { actionLoginUser } from "@/lib/server-actions/auth-action"

const LoginPage = () => {

  const router = useRouter()

  const [submitError, setSubmitError] = useState<string>('')

  const form = useForm<z.infer<typeof FormSchema>>({
    mode: 'onChange',
    resolver: zodResolver(FormSchema),
    defaultValues: {
        email: '',
        password: ''
    }
  })

  const isLoading = form.formState.isSubmitting

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (formData)  => {
      const { error } = await actionLoginUser(formData)

      if (error) {
        form.reset()
        setSubmitError(error.message)
      }

      router.replace('/dashboard')
  }

  return (
    <Form {...form}>
       <form onSubmit={form.handleSubmit(onSubmit)} className="w-full sm:justify-center sm:w-[400px] space-y-6 flex flex-col"
         onChange={() => {
          if (submitError) setSubmitError('')
       }}>
          <Link href='/' className="w-full flex justify-start items-center ">
             <Image src={'/brainbg.png'} alt="Logo" width={50} height={50}/>
             <span className="font-semibold dark:text-white text-2xl ml-2">
                BrainBox.
             </span>
          </Link>
          <FormDescription className="text-foreground/60">
              An all-In-One Collaboration and Productivity Platform
          </FormDescription>
          {/* EMAIL */}
          <FormField disabled={isLoading} control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormControl>
                  <Input type="email" placeholder="youremail@example.com" {...field} />
              </FormControl>
              <FormMessage/>
            </FormItem>
          )}/>
           {/* PASSWORD */}
           <FormField disabled={isLoading} control={form.control} name="password" render={({ field }) => (
            <FormItem>
              <FormControl>
                  <Input type="password" placeholder="Password" {...field} />
              </FormControl>
              <FormMessage/>
            </FormItem>
          )}/>
          {submitError && <FormMessage>{submitError}</FormMessage>}
          <Button type="submit" className="w-full p-6 hover:bg-indigo-500" size='lg' disabled={isLoading}>
             {!isLoading ? "Login" : <Loader/>}
          </Button>
           <span className="self-container">
               Dont have an account?{' '}
               <Link href='/signup' className="text-primary">
                  Sign Up
               </Link>
          </span>
       </form>
    </Form>
  )
}

export default LoginPage
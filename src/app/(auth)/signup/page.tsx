'use client'

import Loader from "@/components/global/loader"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { actionSignUpUser } from "@/lib/server-actions/auth-actions"
import { FormSchema, SignUpFormSchema } from "@/lib/types"
import { zodResolver } from "@hookform/resolvers/zod"
import clsx from "clsx"
import { MailCheck } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

const SignupPage = () => {

    const router = useRouter()
    const searchParams = useSearchParams()

    const [submitError, setSubmitError] = useState<string>('')
    const [confirmation, setConfirmation] = useState<boolean>(false)

    const codeExchangeError = useMemo(() => {
        if (!searchParams) return ''
        return searchParams.get('error_description')
    }, [searchParams])

    const confirmationAndErrorStyles = useMemo(() => clsx('bg-primary', {
            'bg-red-500/10': codeExchangeError,
            'border-red-500/50': codeExchangeError,
            'text-red-700': codeExchangeError,
          }),
        [codeExchangeError]
      );
    
    const form = useForm<z.infer<typeof SignUpFormSchema>>({
        mode: 'onChange',
        resolver: zodResolver(SignUpFormSchema),
        defaultValues: { email: '', password: '', confirmPassword: '' },
      });

    const isLoading = form.formState.isSubmitting

    const onSubmit = async ({ email, password }: z.infer<typeof FormSchema>) => {
        const { error } = await actionSignUpUser({ email, password })

        if (error) {
            setSubmitError(error.message)
            form.reset()
            return
        }

        setConfirmation(true)
    }

  return (
    <Form {...form}>
      <form onChange={() => {
          if (submitError) setSubmitError('');
        }} onSubmit={form.handleSubmit(onSubmit)} className="w-full sm:justify-center sm:w-[400px] space-y-6 flex flex-col">
        <Link href="/" className=" w-full flex justify-start items-center">
          <Image src={'/brainbg.png'} alt="cypress Logo" width={50} height={50}/>
          <span className="font-semibold dark:text-white text-2xl first-letter:ml-2">
            BrainBox
          </span>
        </Link>
        <FormDescription className="text-foreground/60">
          An all-In-One Collaboration and Productivity Platform
        </FormDescription>
        {!confirmation && !codeExchangeError && (
          <>
            <FormField disabled={isLoading} control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="email" placeholder="Email" {...field}/>
                  </FormControl>
                  <FormMessage/>
                </FormItem>
              )}
            />
            <FormField disabled={isLoading} control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="password" placeholder="Password" {...field}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField disabled={isLoading} control={form.control} name="confirmPassword" render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="password" placeholder="Confirm Password" {...field}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full p-6 hover:bg-indigo-500 transition" disabled={isLoading}>
              {!isLoading ? 'Create Account' : <Loader/>}
            </Button>
          </>
        )}

        {submitError && <FormMessage>{submitError}</FormMessage>}
        <span className="self-container">
          Already have an account?{' '}
          <Link href="/login" className="text-primary">
            Login
          </Link>
        </span>
        {(confirmation || codeExchangeError) && (
          <>
            <Alert className={confirmationAndErrorStyles}>
              {!codeExchangeError && <MailCheck className="h-4 w-4" />}
              <AlertTitle>
                {codeExchangeError ? 'Invalid Link' : 'Check your email.'}
              </AlertTitle>
              <AlertDescription>
                {codeExchangeError || 'An email confirmation has been sent.'}
              </AlertDescription>
            </Alert>
          </>
        )}
      </form>
    </Form>
  )
}

export default SignupPage
'use client'

import { useRouter, useSearchParams } from "next/navigation"
import { useMemo, useState } from "react"

const SignupPage = () => {

    const router = useRouter()
    const searchParams = useSearchParams()

    const [submitError, setSubmitError] = useState<string>('')
    const [confirmation, setConfirmation] = useState<boolean>(false)

    const constExchangeError = useMemo(() => {
        if (!searchParams) return ''
        return searchParams.get('error_description')
    }, [searchParams])

  return (
    <div>SignupPage</div>
  )
}

export default SignupPage
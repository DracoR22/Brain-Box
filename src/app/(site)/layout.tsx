import { PropsWithChildren } from "react"


const HomePageLayout = ({ children }: PropsWithChildren) => {
  return (
    <main>
        {children}
    </main>
  )
}

export default HomePageLayout
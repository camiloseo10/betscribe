import { cookies } from "next/headers"
import { redirect } from "next/navigation"
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const c = await cookies()
  const t = c.get("session_token")?.value
  if (!t) redirect(`/cuenta?next=${encodeURIComponent("/resenas")}`)
  return children
}

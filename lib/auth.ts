import { supabase } from '@/lib/supabase_client'

export type UserRole = 'admin' | 'supervisor' | 'worker'

export type AuthUser = {
  id:          string
  email:       string
  employee_id: string
  name:        string
  role:        UserRole
  username:    string
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data: { session }, error: sessionError } =
      await supabase.auth.getSession()

    if (sessionError || !session?.user) return null

    const { data: employee, error } = await supabase
      .from('employees')
      .select('id, name, role, username')
      .eq('user_id', session.user.id)
      .single()

    if (error || !employee) return null

    return {
      id:          session.user.id,
      email:       session.user.email ?? '',
      employee_id: employee.id,
      name:        employee.name,
      role:        employee.role as UserRole,
      username:    employee.username,
    }
  } catch {
    return null
  }
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw new Error(error.message)
  return data
}

export async function signOut() {
  await supabase.auth.signOut()
}

export function getRoleRedirect(role: UserRole): string {
  switch (role) {
    case 'admin':      return '/dashboard'
    case 'supervisor': return '/supervisor'
    case 'worker':     return '/worker'
    default:           return '/login'
  }
}
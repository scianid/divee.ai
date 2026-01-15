import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { Reveal } from '../components/Reveal'
import type { User } from '@supabase/supabase-js'

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/login')
      } else {
        setUser(session.user)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate('/login')
      } else {
        setUser(session?.user ?? null)
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (!user) return null

  return (
    <main className="section min-h-screen pt-24">
      <div className="container">
        <Reveal as="h1" className="sectionTitle text-left" delay={0}>
          Dashboard
        </Reveal>
        
        <Reveal className="card p-8 mt-8" delay={100}>
          <h2 className="text-xl font-bold mb-4">Account Overview</h2>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-500">Email</div>
              <div>{user.email}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">User ID</div>
              <div className="font-mono text-sm">{user.id}</div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <button 
              onClick={handleSignOut}
              className="btn btnSecondary"
            >
              Sign Out
            </button>
          </div>
        </Reveal>
      </div>
    </main>
  )
}

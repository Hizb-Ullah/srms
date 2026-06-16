'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import Cookies from 'js-cookie'
import { getMe } from '@/lib/api'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      const token = Cookies.get('token')
      if (token) {
        try {
          const res = await getMe()
          setUser(res.data.user)
        } catch (error) {
          Cookies.remove('token')
          setUser(null)
        }
      }
      setLoading(false)
    }
    loadUser()
  }, [])

  const login = (token, userData) => {
    Cookies.set('token', token, { expires: 1 })
    setUser(userData)
  }

  const logout = () => {
    Cookies.remove('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
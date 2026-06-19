'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import io from 'socket.io-client'

export default function NotificationBell() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!user) return

    const socket = io('http://localhost:5000')

    socket.on('connect', () => {
      socket.emit('join', user.id)
    })

    socket.on('fileStatusUpdate', (data) => {
      setNotifications((prev) => [
        { ...data, id: Date.now(), read: false, time: new Date() },
        ...prev
      ].slice(0, 20))
    })

    return () => socket.disconnect()
  }, [user])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen(!open)
          if (!open) markAllRead()
        }}
        className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 active:scale-95 transition"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-100 z-20 max-h-96 overflow-y-auto">
          <div className="p-3 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-800">Notifications</p>
          </div>
          {notifications.length === 0 ? (
            <p className="text-sm text-slate-400 p-6 text-center">No notifications yet</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {notifications.map((n) => (
                <div key={n.id} className="p-3 hover:bg-slate-50 transition">
                  <p className="text-sm text-slate-700">{n.message}</p>
                  <p className="text-xs text-slate-400 mt-1 font-mono">{n.plotNumber}</p>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {new Date(n.time).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
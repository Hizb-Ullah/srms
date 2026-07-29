'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import { getAllUsers, getAllComplaints } from '@/lib/api'
import toast from 'react-hot-toast'
import {
  Home, Hash, FolderOpen, ClipboardList,
  CheckCircle, Users, FileBarChart, LogOut, KeyRound, Search, FileText,
  MapPin, Inbox, ChevronDown, ChevronRight, MessageSquare
} from 'lucide-react'

const menuItems = {
  surveyor: [
    { label: 'Dashboard',      path: '/surveyor',              icon: Home },
    { label: 'Request Number', path: '/surveyor/request',      icon: Hash },
    { label: 'Submit File',    path: '/surveyor/submit',       icon: FolderOpen },
    { label: 'My Files',       path: '/surveyor/files',        icon: ClipboardList },
    { label: 'My Documents',   path: '/surveyor/documents',    icon: FileText },
    { label: 'Search',         path: '/search',                icon: Search },
  ],
  officer: [
    { label: 'Dashboard',      path: '/officer',               icon: Home },
    { label: 'File Queue',     path: '/officer/queue',         icon: ClipboardList },
    { label: 'Documents',      path: '/officer/documents',     icon: FileText },
    { label: 'Search',         path: '/search',                icon: Search },
  ],
  approver: [
    { label: 'Dashboard',      path: '/approver',              icon: Home },
    { label: 'Pending Approval', path: '/approver/queue',      icon: CheckCircle },
    { label: 'Documents',      path: '/approver/documents',    icon: FileText },
    { label: 'Search',         path: '/search',                icon: Search },
  ],
  admin: [
    { label: 'Dashboard',      path: '/admin',                    icon: Home },
    { label: 'Users',          path: null,                        icon: Users, children: [
      { label: 'DSM Employees',        path: '/admin/users/dsm',       group: 'DSM' },
      { label: 'Private Surveyors',    path: '/admin/users/private',   group: 'Private' },
      { label: 'Land Board Surveyors', path: '/admin/users/landboard', group: 'LandBoard' },
    ]},
    { label: 'Reset Requests', path: '/admin/reset-requests',     icon: KeyRound },
    { label: 'All Files',      path: '/admin/files',              icon: FolderOpen },
    { label: 'All Documents',  path: '/admin/documents',          icon: FileText },
    { label: 'Audit Logs',     path: '/admin/audit',              icon: FileBarChart },
    { label: 'Search',         path: '/search',                   icon: Search },
  ],
  // Group-based menus (Private / LandBoard surveyors)
  lotSurveyor: [
    { label: 'Dashboard', path: null, icon: Home, children: [
      { label: 'Submitted Files',          path: '/surveyor/dashboard?tab=submitted' },
      { label: 'Progress of Submitted',    path: '/surveyor/dashboard?tab=progress' },
      { label: 'Files On RTS',             path: '/surveyor/dashboard?tab=rts' },
      { label: 'Approved Files',           path: '/surveyor/dashboard?tab=approved' },
    ]},
    { label: 'Lot Requests', path: '/surveyor/lot-requests', icon: MapPin },
  ],
  // DSM group (Lot Allocator / Director / Files Controller)
  lotAllocator: [
    { label: 'Dashboard',      path: '/lot-allocator',         icon: Home },
    { label: 'Lot Requests',   path: '/lot-allocator',         icon: Inbox, complaintBadge: true },
  ],
  rmu: [
    { label: 'RMU Dashboard',       path: '/rmu',                       icon: Home },
    { label: 'Pending Collections', path: '/rmu?tab=pending',           icon: Inbox },
  ],
  director: [
    { label: 'Dashboard',      path: '/lot-allocator',         icon: Home },
    { label: 'Lot Requests',   path: '/lot-allocator',         icon: Inbox, complaintBadge: true },
    { label: 'DSM Employees',  path: '/admin/users/dsm',       icon: Users },
    { label: 'Private Surveyors', path: '/admin/users/private', icon: Users },
    { label: 'Land Board Surveyors', path: '/admin/users/landboard', icon: Users },
    { label: 'All Files',      path: '/admin/files',           icon: FolderOpen },
    { label: 'Audit Logs',     path: '/admin/audit',           icon: FileBarChart },
  ]
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [openGroup, setOpenGroup] = useState(null)
  const [pendingCounts, setPendingCounts] = useState({ DSM: 0, Private: 0, LandBoard: 0 })
  const [openComplaints, setOpenComplaints] = useState(0)

  useEffect(() => {
    if (user?.role === 'admin' || (user?.group === 'DSM' && user?.subRole === 'Director')) {
      getAllUsers().then(res => {
        const all = res.data.data
        setPendingCounts({
          DSM:       all.filter(u => u.group === 'DSM'       && (!u.isApproved || u.pendingDelete)).length,
          Private:   all.filter(u => u.group === 'Private'   && (!u.isApproved || u.pendingDelete)).length,
          LandBoard: all.filter(u => u.group === 'LandBoard' && (!u.isApproved || u.pendingDelete)).length,
        })
      }).catch(() => {})
    }
    if (user?.group === 'DSM') {
      getAllComplaints().then(res => {
        setOpenComplaints(res.data.data.filter(c => c.status === 'open').length)
      }).catch(() => {})
    }
  }, [user])

  // Auto-open Users group if on a users sub-page
  useEffect(() => {
    if (pathname.startsWith('/admin/users')) setOpenGroup('Users')
    if (pathname.startsWith('/surveyor/dashboard')) setOpenGroup('Dashboard')
  }, [pathname])

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    router.push('/login')
  }

  if (!user) return null

  const items = user.group === 'DSM' && user.subRole === 'Director'
    ? menuItems.director
    : user.group === 'DSM' && user.subRole === 'RMU'
    ? menuItems.rmu
    : user.group === 'DSM'
    ? menuItems.lotAllocator
    : (user.group === 'Private' || user.group === 'LandBoard')
      ? menuItems.lotSurveyor
      : menuItems[user.role] || []

  const displayRole = user.group
    ? `${user.group} — ${user.subRole}`
    : user.role

  return (
    <div className="w-64 min-h-screen bg-gradient-to-b from-indigo-950 to-slate-900 text-white flex flex-col">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-xl font-bold tracking-tight">SRMS</h1>
        <p className="text-indigo-300 text-xs mt-1">Survey Record Management</p>
      </div>

      <div className="p-4 border-b border-white/10">
        <p className="font-semibold text-sm">{user.name}</p>
        <p className="text-indigo-300 text-xs capitalize">{displayRole}</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {items.map((item) => {
          const Icon = item.icon

          // Item with children (collapsible group)
          if (item.children) {
            const isOpen = openGroup === item.label
            const anyChildActive = item.children.some(c => pathname === c.path || pathname.startsWith(c.path?.split('?')[0]))
            return (
              <div key={item.label}>
                <button
                  onClick={() => setOpenGroup(isOpen ? null : item.label)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm flex items-center gap-3 transition active:scale-[0.98]
                    ${anyChildActive ? 'bg-white/10 text-white font-semibold' : 'text-indigo-100 hover:bg-white/10'}`}
                >
                  <Icon size={18} />
                  <span className="flex-1">{item.label}</span>
                  {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                {isOpen && (
                  <div className="ml-7 mt-1 space-y-1">
                    {item.children.map(child => {
                        const cnt = child.group ? pendingCounts[child.group] || 0 : 0
                        return (
                          <button
                            key={child.path}
                            onClick={() => router.push(child.path)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs transition active:scale-[0.98] flex items-center justify-between
                              ${pathname + (typeof window !== 'undefined' ? window.location.search : '') === child.path ||
                                (pathname === child.path?.split('?')[0] && !child.path?.includes('?'))
                                ? 'bg-white text-indigo-950 font-semibold shadow-sm'
                                : 'text-indigo-200 hover:bg-white/10'}`}
                          >
                            <span>{child.label}</span>
                            {cnt > 0 && (
                              <span className="bg-rose-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{cnt}</span>
                            )}
                          </button>
                        )
                      })}
                  </div>
                )}
              </div>
            )
          }

          const active = pathname === item.path
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm flex items-center gap-3 transition active:scale-[0.98]
                ${active
                  ? 'bg-white text-indigo-950 font-semibold shadow-sm'
                  : 'text-indigo-100 hover:bg-white/10 hover:translate-x-0.5'
                }`}
            >
              <Icon size={18} />
              {item.label}
              {item.complaintBadge && openComplaints > 0 && (
                <span className="ml-auto bg-orange-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{openComplaints}</span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="p-3 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full text-left px-4 py-2.5 rounded-xl text-sm text-rose-300 hover:bg-white/10 transition flex items-center gap-3 active:scale-[0.98]"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import { getAllUsers, getAllComplaints } from '@/lib/api'
import toast from 'react-hot-toast'
import {
  Home, Hash, FolderOpen, ClipboardList,
  CheckCircle, Users, FileBarChart, LogOut, KeyRound, Search, FileText,
  MapPin, Inbox, ChevronDown, ChevronRight, MessageSquare, FileCheck, FileSearch, FileUp, Wallet
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
      { label: 'Authorised Files',         path: '/surveyor/dashboard?tab=approved' },
    ]},
    { label: 'Lot Requests', path: '/surveyor/lot-requests', icon: MapPin },
    { label: 'Request Shape File Scratch', path: '/surveyor/shape-scratch', icon: FileUp },
  ],
  // DSM group — Lot Allocator sub-role only does plot allocation; per client
  // ("lot allocator has got nothing to do with other services... they cant
  // check progress"), they do NOT get the Controller file-workflow section.
  lotAllocator: [
    { label: 'Dashboard',      path: '/lot-allocator',              icon: Home },
    { label: 'Lot Requests',   path: '/lot-allocator',              icon: Inbox, complaintBadge: true },
    { label: 'Statistics',     path: '/lot-allocator?tab=stats',    icon: FileBarChart },
  ],
  // Files Controller — runs the DSM file workflow only. Per client: "Controller
  // has got nothing to do with lot number request" — that's the Lot
  // Allocator's domain alone, so no Dashboard/Lot Requests link here.
  filesController: [
    { label: 'Dashboard',      path: '/controller',            icon: Home },
    { label: 'Shape File Scratch', path: '/controller?section=scratch', icon: FileUp },
    { label: 'Received from RMU',              path: '/controller?section=unassigned',   icon: Inbox },
    { label: 'File Registration & Reservation', path: '/controller?section=registration', icon: FolderOpen },
    { label: 'File Capturing',                  path: '/controller?section=capturing',    icon: FileCheck },
    { label: 'File Examination',                path: '/controller?section=examination',  icon: FileSearch },
    { label: 'Approval',                        path: '/controller?section=approval',     icon: CheckCircle },
    { label: 'Returned to RMU',                 path: '/controller?section=returned',     icon: ClipboardList },
  ],
  rmu: [
    { label: 'RMU Dashboard',           path: '/rmu',                    icon: Home },
    { label: 'New Arrival Files',       path: '/rmu?tab=arrivals',       icon: Inbox },
    { label: 'To Controller',           path: '/rmu?tab=controller',     icon: FolderOpen },
    { label: 'Returned from Controller', path: '/rmu?tab=returned',      icon: ClipboardList },
    { label: 'Track File',              path: '/rmu?tab=status',         icon: Search },
    { label: 'Send Surveyor (Summary)', path: '/rmu?tab=comments',       icon: MessageSquare },
    { label: 'Storage',                 path: '/rmu?tab=storage',        icon: FolderOpen },
    { label: 'Reports',                 path: '/rmu?tab=reports',        icon: FileBarChart },
  ],
  registration: [
    { label: 'Registration & Reservation', path: '/registration', icon: Home },
    { label: 'Search',                     path: '/search',       icon: Search },
  ],
  capturing: [
    { label: 'File Capturing', path: '/capturing', icon: Home },
    { label: 'Scratch Files',  path: '/capturing?tab=scratch', icon: FileUp },
    { label: 'Search',         path: '/search',    icon: Search },
  ],
  examination: [
    { label: 'File Examination', path: '/examination', icon: Home },
    { label: 'Search',           path: '/search',       icon: Search },
  ],
  approval: [
    { label: 'File Approval', path: '/approval', icon: Home },
    { label: 'Search',        path: '/search',   icon: Search },
  ],
  accounts: [
    { label: 'Accounts', path: '/accounts', icon: Wallet },
  ],
  storage: [
    { label: 'Storage', path: '/storage', icon: FolderOpen },
  ],
  director: [
    { label: 'Dashboard',      path: '/lot-allocator',         icon: Home },
    { label: 'Lot Requests',   path: '/lot-allocator',         icon: Inbox, complaintBadge: true },
    { label: 'Shape File Scratch', path: '/controller?section=scratch', icon: FileUp },
    { label: 'Received from RMU',              path: '/controller?section=unassigned',   icon: Inbox },
    { label: 'File Registration & Reservation', path: '/controller?section=registration', icon: FolderOpen },
    { label: 'File Capturing',                  path: '/controller?section=capturing',    icon: FileCheck },
    { label: 'File Examination',                path: '/controller?section=examination',  icon: FileSearch },
    { label: 'Approval',                        path: '/controller?section=approval',     icon: CheckCircle },
    { label: 'Returned to RMU',                 path: '/controller?section=returned',     icon: ClipboardList },
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

  const DSM_SUB_ROLE_MENUS = {
    RMU: menuItems.rmu,
    'File Registration and Reservation': menuItems.registration,
    'File Capturing': menuItems.capturing,
    'File Examination': menuItems.examination,
    'File Approval': menuItems.approval,
    Accounts: menuItems.accounts,
    Storage: menuItems.storage
  }

  const items = user.group === 'DSM' && user.subRole === 'Director'
    ? menuItems.director
    : user.group === 'DSM' && DSM_SUB_ROLE_MENUS[user.subRole]
    ? DSM_SUB_ROLE_MENUS[user.subRole]
    : user.group === 'DSM' && user.subRole === 'Files Controller'
    ? menuItems.filesController
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
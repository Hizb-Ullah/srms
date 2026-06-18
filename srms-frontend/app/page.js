'use client'

import { useRouter } from 'next/navigation'
import { Hash, ShieldCheck, ClipboardCheck } from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-sky-50">

      <nav className="px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-xl px-3 py-1.5 font-bold text-sm shadow-md shadow-indigo-200">
            SRMS
          </div>
          <span className="font-semibold text-slate-800 hidden sm:inline">
            Survey Record Management System
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/login')}
            className="text-slate-600 font-medium text-sm hover:text-slate-900 transition"
          >
            Sign In
          </button>
          <button
            onClick={() => router.push('/register')}
            className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-indigo-200 active:scale-95 transition"
          >
            Get Started
          </button>
        </div>
      </nav>

      <section className="max-w-4xl mx-auto text-center px-6 py-20">
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6 leading-tight">
          Digitize Your Survey & Plot Record Workflow
        </h1>
        <p className="text-lg text-slate-500 mb-8 max-w-2xl mx-auto">
          Replace paper-based survey processing with a structured, trackable,
          role-based system. From plot number issuance to final dispatch —
          every step is logged, verified, and auditable.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => router.push('/register')}
            className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-xl hover:shadow-indigo-200 hover:-translate-y-0.5 active:scale-95 transition"
          >
            Create Free Account
          </button>
          <button
            onClick={() => router.push('/login')}
            className="border border-slate-200 bg-white text-slate-700 px-6 py-3 rounded-xl font-semibold hover:bg-slate-50 hover:-translate-y-0.5 active:scale-95 transition"
          >
            Sign In
          </button>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-1 transition text-center">
          <div className="bg-indigo-50 text-indigo-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Hash size={22} />
          </div>
          <h3 className="font-semibold text-slate-800 mb-2">Request & Submit</h3>
          <p className="text-slate-500 text-sm">
            Surveyors request unique plot numbers and submit files online
            with document uploads.
          </p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-1 transition text-center">
          <div className="bg-violet-50 text-violet-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={22} />
          </div>
          <h3 className="font-semibold text-slate-800 mb-2">Quality Gates</h3>
          <p className="text-slate-500 text-sm">
            Files pass through Capturing, Examination, Approval, and Dispatch —
            with rework loops for corrections.
          </p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-1 transition text-center">
          <div className="bg-sky-50 text-sky-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
            <ClipboardCheck size={22} />
          </div>
          <h3 className="font-semibold text-slate-800 mb-2">Full Audit Trail</h3>
          <p className="text-slate-500 text-sm">
            Every action is logged with who, when, and why — for complete
            transparency and accountability.
          </p>
        </div>
      </section>

      <section className="bg-white/60 py-16 border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-slate-800 text-center mb-10">
            Built for Every Role
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {[
              { role: 'Surveyor', desc: 'Submit & track files' },
              { role: 'Officer', desc: 'Process quality gates' },
              { role: 'Approver', desc: 'Final approval' },
              { role: 'Admin', desc: 'Manage & oversee' },
            ].map((item) => (
              <div
                key={item.role}
                className="bg-white rounded-2xl p-6 text-center shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-1 transition"
              >
                <p className="font-semibold text-slate-800">{item.role}</p>
                <p className="text-slate-500 text-sm mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-8 text-center">
        <p className="text-slate-400 text-sm">
          Survey Record Management System — Secure Access Only
        </p>
      </footer>

    </div>
  )
}


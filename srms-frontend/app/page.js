'use client'

import { useRouter } from 'next/navigation'

export default function LandingPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-white">

      {/* Navbar */}
      <nav className="border-b px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="bg-blue-900 text-white rounded-lg px-3 py-1.5 font-bold text-sm">
            SRMS
          </div>
          <span className="font-semibold text-gray-800 hidden sm:inline">
            Survey Record Management System
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/login')}
            className="text-gray-600 font-medium text-sm hover:text-gray-900"
          >
            Sign In
          </button>
          <button
            onClick={() => router.push('/register')}
            className="bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto text-center px-6 py-20">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Digitize Your Survey & Plot Record Workflow
        </h1>
        <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
          Replace paper-based survey processing with a structured, trackable,
          role-based system. From plot number issuance to final dispatch —
          every step is logged, verified, and auditable.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => router.push('/register')}
            className="bg-blue-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 transition"
          >
            Create Free Account
          </button>
          <button
            onClick={() => router.push('/login')}
            className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
          >
            Sign In
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="text-center">
          <div className="bg-blue-50 text-blue-900 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 font-bold">
            1
          </div>
          <h3 className="font-semibold text-gray-800 mb-2">Request & Submit</h3>
          <p className="text-gray-500 text-sm">
            Surveyors request unique plot numbers and submit files online
            with document uploads.
          </p>
        </div>
        <div className="text-center">
          <div className="bg-blue-50 text-blue-900 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 font-bold">
            2
          </div>
          <h3 className="font-semibold text-gray-800 mb-2">Quality Gates</h3>
          <p className="text-gray-500 text-sm">
            Files pass through Capturing, Examination, Approval, and Dispatch —
            with rework loops for corrections.
          </p>
        </div>
        <div className="text-center">
          <div className="bg-blue-50 text-blue-900 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 font-bold">
            3
          </div>
          <h3 className="font-semibold text-gray-800 mb-2">Full Audit Trail</h3>
          <p className="text-gray-500 text-sm">
            Every action is logged with who, when, and why — for complete
            transparency and accountability.
          </p>
        </div>
      </section>

      {/* Roles */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-10">
            Built for Every Role
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <p className="font-semibold text-gray-800">Surveyor</p>
              <p className="text-gray-500 text-sm mt-1">Submit & track files</p>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <p className="font-semibold text-gray-800">Officer</p>
              <p className="text-gray-500 text-sm mt-1">Process quality gates</p>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <p className="font-semibold text-gray-800">Approver</p>
              <p className="text-gray-500 text-sm mt-1">Final approval</p>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <p className="font-semibold text-gray-800">Admin</p>
              <p className="text-gray-500 text-sm mt-1">Manage & oversee</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center">
        <p className="text-gray-400 text-sm">
          Survey Record Management System — Secure Access Only
        </p>
      </footer>

    </div>
  )
}
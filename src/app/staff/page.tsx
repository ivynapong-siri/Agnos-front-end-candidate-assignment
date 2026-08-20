import type { Metadata } from 'next'
import { StaffBoard } from '@/components/StaffBoard'

export const metadata: Metadata = {
  title: 'Front desk',
  description: 'Live view of every patient form currently being filled in.',
}

export default function StaffPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6">
      <StaffBoard />
    </main>
  )
}

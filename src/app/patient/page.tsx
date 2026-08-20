import type { Metadata } from 'next'
import { IntakeForm } from '@/components/IntakeForm'

export const metadata: Metadata = {
  title: 'Patient form',
  description: 'Tell us who you are before your appointment.',
}

export default function PatientPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-20 sm:px-6">
      <IntakeForm />
    </main>
  )
}

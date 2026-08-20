import type { Metadata } from 'next'
import { IntakeForm } from '@/components/IntakeForm'
import { DEFAULT_LOCALE, getDictionary, isLocale } from '@/i18n'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const dict = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE)
  return { title: dict.meta.patientTitle, description: dict.meta.patientDescription }
}

export default async function PatientPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-20 sm:px-6">
      <IntakeForm dict={getDictionary(locale)} locale={locale} />
    </main>
  )
}

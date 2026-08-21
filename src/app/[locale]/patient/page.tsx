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
    <main className="page-shell pb-20 pt-6 sm:pt-10">
      {/* Narrow for readability, left-aligned so it starts on the same line as
          the logo. Centring it moved the form 256px off the header. */}
      <div className="max-w-3xl">
        <IntakeForm dict={getDictionary(locale)} locale={locale} />
      </div>
    </main>
  )
}

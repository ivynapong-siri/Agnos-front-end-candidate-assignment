import type { Metadata } from 'next'
import { IntakeForm } from '@/components/IntakeForm'
import { SectionMedia } from '@/components/SectionMedia'
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
      {/* 60/40. The form column lands at 768px inside the shell, which is the
          reading width it had on its own, and its left edge still starts on the
          logo's line. */}
      <div className="lg:grid lg:grid-cols-[3fr_2fr] lg:items-start lg:gap-8">
        {/* Wrapped: IntakeForm renders its own heading alongside the form, and
            as two loose grid children they took a column each. min-w-0 so a long
            unbroken value cannot push the column past its track. */}
        <div className="min-w-0">
          <IntakeForm dict={getDictionary(locale)} locale={locale} />
        </div>
        <SectionMedia />
      </div>
    </main>
  )
}

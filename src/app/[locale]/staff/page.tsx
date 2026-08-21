import type { Metadata } from 'next'
import { RequireStaff } from '@/components/RequireStaff'
import { StaffBoard } from '@/components/StaffBoard'
import { DEFAULT_LOCALE, getDictionary, isLocale } from '@/i18n'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const dict = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE)
  return { title: dict.meta.staffTitle, description: dict.meta.staffDescription }
}

export default async function StaffPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE
  const dict = getDictionary(locale)

  return (
    <main className="mx-auto w-full max-w-4xl px-4 pb-20 pt-6 sm:px-6 sm:pt-10">
      <RequireStaff locale={locale} dict={dict}>
        <StaffBoard dict={dict} locale={locale} />
      </RequireStaff>
    </main>
  )
}

import type { Metadata } from 'next'
import { AuthShell } from '@/components/AuthShell'
import { ResetForm } from '@/components/ResetForm'
import { DEFAULT_LOCALE, getDictionary, isLocale } from '@/i18n'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const dict = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE)
  return { title: dict.meta.resetTitle, description: dict.meta.resetDescription }
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE
  const dict = getDictionary(locale)

  return (
    <AuthShell
      title={dict.auth.reset.title}
      description={dict.auth.reset.description}
      locale={locale}
      dict={dict}
    >
      <ResetForm dict={dict} locale={locale} />
    </AuthShell>
  )
}

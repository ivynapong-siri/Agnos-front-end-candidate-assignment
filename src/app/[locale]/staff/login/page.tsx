import type { Metadata } from 'next'
import { AuthShell } from '@/components/AuthShell'
import { LoginForm } from '@/components/LoginForm'
import { DEFAULT_LOCALE, getDictionary, isLocale } from '@/i18n'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const dict = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE)
  return { title: dict.meta.loginTitle, description: dict.meta.loginDescription }
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE
  const dict = getDictionary(locale)

  return (
    <AuthShell
      title={dict.auth.login.title}
      description={dict.auth.login.description}
      locale={locale}
      dict={dict}
    >
      <LoginForm dict={dict} locale={locale} />
    </AuthShell>
  )
}

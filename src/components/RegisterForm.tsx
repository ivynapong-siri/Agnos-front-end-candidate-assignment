'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthField } from './AuthField'
import { GlassButton } from './GlassButton'
import { SampleFill } from './SampleFill'
import { fill, type Dictionary, type Locale } from '@/i18n'
import {
  MIN_PASSWORD,
  SAMPLE_STAFF,
  makeRegisterSchema,
  writeStaffSession,
  type RegisterForm as Values,
} from '@/lib/auth'

/**
 * Registration, gated on an invite code — a desk view is not something you let
 * anybody create an account for, and the code is the smallest honest stand-in
 * for the approval step a real deployment would need.
 */
export function RegisterForm({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const router = useRouter()
  const [prefilled, setPrefilled] = useState(false)

  const schema = useMemo(
    () =>
      makeRegisterSchema({
        required: dict.validation.fieldRequired,
        emailInvalid: dict.validation.emailInvalid,
        passwordShort: dict.validation.passwordShort,
        passwordMismatch: dict.validation.passwordMismatch,
        inviteInvalid: dict.validation.inviteInvalid,
        wrongCredentials: dict.auth.wrongCredentials,
      }),
    [dict],
  )

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', invite: '', password: '', confirm: '' },
    mode: 'onTouched',
  })

  const applySample = (on: boolean) => {
    setPrefilled(on)
    const set = (field: keyof Values, value: string) =>
      setValue(field, value, { shouldValidate: on })
    set('name', on ? SAMPLE_STAFF.name : '')
    set('email', on ? SAMPLE_STAFF.email : '')
    set('invite', on ? SAMPLE_STAFF.invite : '')
    set('password', on ? SAMPLE_STAFF.password : '')
    set('confirm', on ? SAMPLE_STAFF.password : '')
  }

  const onSubmit = handleSubmit((values) => {
    writeStaffSession({ name: values.name.trim(), email: values.email.trim() })
    router.push(`/${locale}/staff${window.location.search}`)
  })

  return (
    <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
      <AuthField
        {...register('name')}
        label={dict.auth.name}
        autoComplete="name"
        error={errors.name?.message}
        dict={dict}
        delayMs={380}
      />

      <AuthField
        {...register('email')}
        label={dict.auth.email}
        type="email"
        autoComplete="username"
        error={errors.email?.message}
        dict={dict}
        delayMs={430}
      />

      <AuthField
        {...register('invite')}
        label={dict.auth.invite}
        error={errors.invite?.message}
        hint={fill(dict.auth.register.inviteHint, { code: SAMPLE_STAFF.invite })}
        dict={dict}
        delayMs={480}
      />

      <AuthField
        {...register('password')}
        label={dict.auth.password}
        type="password"
        autoComplete="new-password"
        error={errors.password?.message}
        hint={fill(dict.validation.passwordShort, { min: MIN_PASSWORD })}
        dict={dict}
        delayMs={530}
      />

      <AuthField
        {...register('confirm')}
        label={dict.auth.confirm}
        type="password"
        autoComplete="new-password"
        error={errors.confirm?.message}
        dict={dict}
        delayMs={580}
      />

      <SampleFill checked={prefilled} onChange={applySample} dict={dict} delayMs={630} />

      <div className="enter" style={{ ['--enter-delay' as string]: '690ms' }}>
        <GlassButton type="submit" disabled={isSubmitting} className="w-full">
          {dict.auth.register.submit}
        </GlassButton>
      </div>

      <p
        className="enter text-center text-sm text-muted"
        style={{ ['--enter-delay' as string]: '740ms' }}
      >
        {dict.auth.register.haveAccount}{' '}
        <Link
          href={`/${locale}/staff/login`}
          className="rounded font-semibold text-brand underline underline-offset-4 hover:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {dict.auth.register.signIn}
        </Link>
      </p>
    </form>
  )
}

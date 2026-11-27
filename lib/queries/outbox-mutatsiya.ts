'use client'

import {
  useMutation,
  onlineManager,
  type UseMutationOptions,
  type UseMutationResult,
} from '@tanstack/react-query'
import { ilovaNativemi } from '@/lib/platform'
import { offlineOynasiniOch } from '@/lib/offline-oynasi'

/**
 * `useMutation`ning o'rnini bosadi — faqat BIR farqi bilan: veb'da
 * internet yo'q paytda haqiqiy so'rov UMUMAN yuborilmaydi (va
 * navbatga ham qo'yilmaydi), o'rniga do'stona "Internet yo'q" oynasi
 * ochiladi.
 *
 * Nega shu yerda, har bir sahifada emas: vazifa/papka/bo'lim/profil
 * mutatsiyalarining HAMMASI shu hook orqali o'tadi (10+ joy), shuning
 * uchun "veb + offline" qoidasi faqat SHU bitta funksiyada yashaydi —
 * `lib/platform.ts` dagi `ilovaNativemi()` orqali.
 *
 * Appda farq yo'q: `ilovaNativemi()` true bo'lgani uchun har doim
 * haqiqiy `useMutation` xatti-harakati ishlaydi — to'xtab qolgan
 * yozuv odatdagidek navbatga (outbox) tushadi va aloqa tiklanganda
 * o'zi yuboriladi.
 */
export function useOutboxMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>
): UseMutationResult<TData, TError, TVariables, TContext> {
  const mutatsiya = useMutation(options)

  function bloklanganmi() {
    return !ilovaNativemi() && !onlineManager.isOnline()
  }

  type MutateArgs = Parameters<
    UseMutationResult<TData, TError, TVariables, TContext>['mutate']
  >
  type MutateAsyncArgs = Parameters<
    UseMutationResult<TData, TError, TVariables, TContext>['mutateAsync']
  >

  const mutate: UseMutationResult<TData, TError, TVariables, TContext>['mutate'] = (
    ...args: MutateArgs
  ) => {
    if (bloklanganmi()) {
      offlineOynasiniOch()
      return
    }
    mutatsiya.mutate(...args)
  }

  const mutateAsync: UseMutationResult<
    TData,
    TError,
    TVariables,
    TContext
  >['mutateAsync'] = (...args: MutateAsyncArgs) => {
    if (bloklanganmi()) {
      offlineOynasiniOch()
      return Promise.reject(new Error('OFFLINE_BLOKLANDI'))
    }
    return mutatsiya.mutateAsync(...args)
  }

  return { ...mutatsiya, mutate, mutateAsync }
}

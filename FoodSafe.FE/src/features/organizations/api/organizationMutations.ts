import { useMutation, useQueryClient } from '@tanstack/react-query'
import { organizationApi } from './organizationApi'
import { organizationKeys } from './organizationQueries'

export function useCreateOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: organizationApi.create,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: organizationKeys.all })
    },
  })
}

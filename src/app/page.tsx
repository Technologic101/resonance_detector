import { ProtectedRoute } from '@/components/auth/protected-route'
import { MainLayout } from '@/components/layout/main-layout'

export default function Page() {
  return (
    <ProtectedRoute>
      <MainLayout />
    </ProtectedRoute>
  )
}
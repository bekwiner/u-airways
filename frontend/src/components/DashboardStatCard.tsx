import { ReactNode } from 'react'

interface DashboardStatCardProps {
  title: string
  value: string | number
  change?: string
  icon?: ReactNode
}

const DashboardStatCard = ({ title, value, change, icon }: DashboardStatCardProps) => (
  <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
        {change && (
          <p className="mt-2 text-sm font-medium text-emerald-600">{change}</p>
        )}
      </div>
      {icon && <div className="rounded-full bg-primary-50 p-3 text-primary-600">{icon}</div>}
    </div>
  </div>
)

export default DashboardStatCard

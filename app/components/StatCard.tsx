import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: LucideIcon;
  trend: 'up' | 'down';
}

export function StatCard({ title, value, change, icon: Icon, trend }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-500 text-sm">{title}</p>
          <h3 className="text-gray-900 mt-2">{value}</h3>
          <div className="flex items-center gap-1 mt-2">
            <span
              className={`text-sm ${
                trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {change}
            </span>
            <span className="text-gray-500 text-sm">vs last month</span>
          </div>
        </div>
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

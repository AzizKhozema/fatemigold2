'use client';

import { useState } from 'react';
import { Search, Eye, Users } from 'lucide-react';

const customers = [
  {
    id: 1,
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    phone: '+1 (555) 123-4567',
    orders: 12,
    totalSpent: '$8,450',
    joinDate: '2023-05-15',
    status: 'Active',
  },
  {
    id: 2,
    name: 'Michael Chen',
    email: 'michael.c@email.com',
    phone: '+1 (555) 234-5678',
    orders: 8,
    totalSpent: '$6,890',
    joinDate: '2023-07-22',
    status: 'Active',
  },
  {
    id: 3,
    name: 'Emma Davis',
    email: 'emma.d@email.com',
    phone: '+1 (555) 345-6789',
    orders: 15,
    totalSpent: '$12,340',
    joinDate: '2023-03-10',
    status: 'VIP',
  },
  {
    id: 4,
    name: 'James Wilson',
    email: 'james.w@email.com',
    phone: '+1 (555) 456-7890',
    orders: 5,
    totalSpent: '$3,200',
    joinDate: '2023-09-05',
    status: 'Active',
  },
  {
    id: 5,
    name: 'Olivia Martinez',
    email: 'olivia.m@email.com',
    phone: '+1 (555) 567-8901',
    orders: 18,
    totalSpent: '$15,670',
    joinDate: '2023-01-20',
    status: 'VIP',
  },
  {
    id: 6,
    name: 'William Brown',
    email: 'william.b@email.com',
    phone: '+1 (555) 678-9012',
    orders: 3,
    totalSpent: '$1,450',
    joinDate: '2023-11-12',
    status: 'Active',
  },
  {
    id: 7,
    name: 'Sophia Taylor',
    email: 'sophia.t@email.com',
    phone: '+1 (555) 789-0123',
    orders: 10,
    totalSpent: '$7,890',
    joinDate: '2023-06-18',
    status: 'Active',
  },
  {
    id: 8,
    name: 'Liam Anderson',
    email: 'liam.a@email.com',
    phone: '+1 (555) 890-1234',
    orders: 2,
    totalSpent: '$980',
    joinDate: '2023-12-01',
    status: 'New',
  },
];

export function CustomersView() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VIP':
        return 'bg-purple-100 text-purple-800';
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'New':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-gray-900">Customers</h2>
        <p className="text-gray-500 mt-1">Manage your customer relationships</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
            <option>All Customers</option>
            <option>VIP</option>
            <option>Active</option>
            <option>New</option>
          </select>
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
            <option>Sort by: Recent</option>
            <option>Total Spent</option>
            <option>Most Orders</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Total Spent
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Join Date
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm">
                          {customer.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </span>
                      </div>
                      <div className="text-sm text-gray-900">{customer.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{customer.email}</div>
                    <div className="text-sm text-gray-500">{customer.phone}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{customer.orders}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{customer.totalSpent}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{customer.joinDate}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs rounded-full ${getStatusColor(
                        customer.status
                      )}`}
                    >
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-purple-600 hover:text-purple-700 text-sm flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Customers</p>
              <p className="text-gray-900">892</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">VIP Customers</p>
              <p className="text-gray-900">124</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">New (30 days)</p>
              <p className="text-gray-900">48</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Avg. Order Value</p>
              <p className="text-gray-900">$368</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
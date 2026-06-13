import { useEffect, useState } from 'react'
import axios from 'axios'
import API from '../config'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${API}/customers`).then(res => {
      setCustomers(res.data)
      setLoading(false)
    })
  }, [])

  const filtered = customers.filter(c => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase())

    const matchFilter =
      filter === 'all' ? true :
      filter === 'high' ? parseFloat(c.total_spent) >= 5000 :
      filter === 'mid' ? parseFloat(c.total_spent) >= 1000 && parseFloat(c.total_spent) < 5000 :
      parseFloat(c.total_spent) < 1000

    return matchSearch && matchFilter
  })

  const totalSpend = customers.reduce((acc, c) => acc + parseFloat(c.total_spent || 0), 0)
  const avgSpend = customers.length ? (totalSpend / customers.length).toFixed(0) : 0
  const highValue = customers.filter(c => parseFloat(c.total_spent) >= 5000).length

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
        <p className="text-gray-500 mt-1">{customers.length} shoppers in your database</p>
      </div>

      {/* Mini Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-400 mb-1">Total Customers</p>
          <p className="text-2xl font-bold text-gray-800">{customers.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-400 mb-1">Avg. Spend</p>
          <p className="text-2xl font-bold text-violet-600">₹{parseInt(avgSpend).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-400 mb-1">High Value (₹5000+)</p>
          <p className="text-2xl font-bold text-green-600">{highValue}</p>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="text"
          placeholder="🔍 Search by name, email or city..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white shadow-sm"
        />
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'All' },
            { key: 'high', label: '💎 High Value' },
            { key: 'mid', label: '⭐ Mid Value' },
            { key: 'low', label: '🌱 New' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-2 rounded-xl text-xs font-medium border transition ${
                filter === f.key
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-medium text-gray-600">Showing {Math.min(filtered.length, 50)} of {filtered.length} customers</p>
        </div>
        {loading ? (
          <div className="text-center py-16 text-gray-300">Loading customers...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Customer</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">City</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Total Spent</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Last Order</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Value Tier</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 50).map((c, i) => {
                const spent = parseFloat(c.total_spent)
                const tier = spent >= 5000 ? { label: '💎 High', color: 'bg-purple-100 text-purple-700' } :
                             spent >= 1000 ? { label: '⭐ Mid', color: 'bg-blue-100 text-blue-700' } :
                             { label: '🌱 New', color: 'bg-green-100 text-green-700' }
                return (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-violet-50 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-violet-400 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {c.name[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{c.name}</p>
                          <p className="text-xs text-gray-400">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">📍 {c.city}</td>
                    <td className="px-5 py-3.5 font-semibold text-green-600">₹{spent.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-gray-500">
                      {c.last_order_at ? new Date(c.last_order_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${tier.color}`}>{tier.label}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        {filtered.length === 0 && !loading && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-3xl mb-2">🔍</p>
            <p>No customers found</p>
          </div>
        )}
      </div>
    </div>
  )
}
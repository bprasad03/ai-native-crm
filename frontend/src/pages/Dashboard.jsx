import { useEffect, useState } from 'react'
import axios from 'axios'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import API from '../config'

const COLORS = ['#7c3aed', '#6d28d9', '#a78bfa', '#c4b5fd']

export default function Dashboard() {
  const [stats, setStats] = useState({ customers: 0, segments: 0, campaigns: 0, delivered: 0, opened: 0, clicked: 0 })
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const [customers, segments, campaignsRes] = await Promise.all([
          axios.get(`${API}/customers`),
          axios.get(`${API}/segments`),
          axios.get(`${API}/campaigns`),
        ])

        const totalDelivered = campaignsRes.data.reduce((acc, c) => acc + (c.stats?.delivered || 0), 0)
        const totalOpened = campaignsRes.data.reduce((acc, c) => acc + (c.stats?.opened || 0), 0)
        const totalClicked = campaignsRes.data.reduce((acc, c) => acc + (c.stats?.clicked || 0), 0)

        setStats({
          customers: customers.data.length,
          segments: segments.data.length,
          campaigns: campaignsRes.data.length,
          delivered: totalDelivered,
          opened: totalOpened,
          clicked: totalClicked,
        })
        setCampaigns(campaignsRes.data.slice(0, 5))
      } catch (err) {
        console.error(err)
      }
      setLoading(false)
    }

    fetchStats()
  }, [])

  const barData = campaigns.map(c => ({
    name: c.name.length > 12 ? c.name.slice(0, 12) + '...' : c.name,
    Sent: c.stats?.sent || 0,
    Delivered: c.stats?.delivered || 0,
    Opened: c.stats?.opened || 0,
  }))

  const pieData = [
    { name: 'Delivered', value: stats.delivered },
    { name: 'Opened', value: stats.opened },
    { name: 'Clicked', value: stats.clicked },
    { name: 'Failed', value: Math.max(0, stats.delivered - stats.opened) },
  ]

  const statCards = [
    { label: 'Total Customers', value: stats.customers, icon: '👥', bg: 'from-violet-500 to-violet-700', sub: 'In your database' },
    { label: 'Segments', value: stats.segments, icon: '🎯', bg: 'from-blue-500 to-blue-700', sub: 'Audience groups' },
    { label: 'Campaigns', value: stats.campaigns, icon: '📣', bg: 'from-orange-500 to-orange-600', sub: 'All time' },
    { label: 'Delivered', value: stats.delivered, icon: '✅', bg: 'from-green-500 to-green-700', sub: 'Messages delivered' },
  ]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back 👋</h1>
        <p className="text-gray-500 mt-2">Here's what's happening with your shoppers today.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
        {statCards.map((card, i) => (
          <div key={i} className={`rounded-3xl p-5 text-white shadow-lg bg-gradient-to-br ${card.bg}`}>
            <div className="flex items-center justify-between gap-4">
              <div className="text-3xl">{card.icon}</div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.18em] opacity-90">{card.sub}</p>
              </div>
            </div>
            <div className="mt-7 text-3xl font-semibold">{loading ? '...' : card.value.toLocaleString()}</div>
            <p className="mt-3 text-sm opacity-90">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 mb-10 lg:grid-cols-2">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
          <div className="mb-5">
            <p className="text-sm text-gray-500">Campaign Performance</p>
            <h2 className="text-xl font-semibold text-gray-900">Sent vs Delivered vs Opened</h2>
          </div>
          {barData.length === 0 ? (
            <div className="text-center py-16 text-gray-400">No campaigns yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={barData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="Sent" fill="#7c3aed" />
                <Bar dataKey="Delivered" fill="#6d28d9" />
                <Bar dataKey="Opened" fill="#a78bfa" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
          <div className="mb-5">
            <p className="text-sm text-gray-500">Engagement Breakdown</p>
            <h2 className="text-xl font-semibold text-gray-900">Overall message outcomes</h2>
          </div>
          {stats.delivered === 0 ? (
            <div className="text-center py-16 text-gray-400">No data yet</div>
          ) : (
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="w-full lg:w-1/2 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2}>
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full lg:w-1/2 space-y-3">
                {pieData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center justify-between rounded-3xl bg-gray-50 p-4">
                    <div className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-sm text-gray-600">{entry.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{entry.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Campaigns */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-5 gap-4">
          <div>
            <p className="text-sm text-gray-500">Recent Campaigns</p>
            <h2 className="text-xl font-semibold text-gray-900">Latest campaign activity</h2>
          </div>
          <a href="/campaigns" className="text-sm font-semibold text-violet-600 hover:text-violet-700">View all →</a>
        </div>

        {campaigns.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white py-16 text-center text-gray-400">No campaigns yet</div>
        ) : (
          <div className="space-y-4">
            {campaigns.map(c => (
              <div key={c.id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-200 sm:flex sm:items-center sm:justify-between sm:gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-xl">
                    {c.channel === 'whatsapp' ? '💬' : c.channel === 'sms' ? '📱' : '📧'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{c.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">{c.channel} • {new Date(c.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-2 sm:mt-0 sm:flex-row sm:items-center">
                  <div className="rounded-3xl bg-gray-50 px-4 py-3 text-sm text-gray-600">{c.stats?.sent || 0} sent</div>
                  <div className="rounded-3xl bg-gray-50 px-4 py-3 text-sm text-gray-600">{c.stats?.delivered || 0} delivered</div>
                </div>
                <span className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${c.status === 'running' ? 'bg-blue-100 text-blue-700' : c.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{c.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Banner */}
      <div className="rounded-3xl border border-violet-100 bg-violet-50 p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-violet-700 mb-2">✨ AI Co-pilot Active</p>
            <h2 className="text-xl font-semibold text-gray-900">Ready to reach your shoppers?</h2>
            <p className="mt-2 text-gray-600">Use AI to suggest segments, draft messages, and launch campaigns in minutes.</p>
          </div>
          <div className="text-6xl">🤖</div>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a href="/segments" className="rounded-2xl bg-white px-4 py-2 text-center text-sm font-semibold text-violet-700 shadow-sm hover:bg-violet-50">🎯 Create Segment</a>
          <a href="/campaigns" className="rounded-2xl bg-violet-700 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-violet-600">📣 Launch Campaign</a>
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import axios from 'axios'

const API = 'http://localhost:3000/api'

const statusColors = {
  draft: 'bg-gray-100 text-gray-600',
  running: 'bg-blue-100 text-blue-600',
  completed: 'bg-green-100 text-green-600',
}

const channelIcon = { whatsapp: '💬', sms: '📱', email: '📧' }

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([])
  const [segments, setSegments] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState('')
  const [segmentId, setSegmentId] = useState('')
  const [channel, setChannel] = useState('whatsapp')
  const [message, setMessage] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [launching, setLaunching] = useState(null)
  const [insights, setInsights] = useState({})
  const [insightLoading, setInsightLoading] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAll() }, [])

  function fetchAll() {
    Promise.all([
      axios.get(`${API}/campaigns`),
      axios.get(`${API}/segments`)
    ]).then(([c, s]) => {
      setCampaigns(c.data)
      setSegments(s.data)
      setLoading(false)
    })
  }

  async function handleAIDraft() {
    if (!segmentId || !channel) return alert('Pick a segment and channel first')
    const seg = segments.find(s => s.id === segmentId)
    setAiLoading(true)
    try {
      const res = await axios.post(`${API}/campaigns/ai-draft`, {
        segmentName: seg?.name,
        channel,
        goal: name || 'promote our latest collection',
      })
      setMessage(res.data.message)
    } catch (err) {
      alert('AI draft failed')
    }
    setAiLoading(false)
  }

  async function handleSave() {
    if (!name || !segmentId || !message) return
    setSaving(true)
    try {
      await axios.post(`${API}/campaigns`, { name, segment_id: segmentId, channel, message })
      setShowModal(false)
      resetForm()
      fetchAll()
    } catch (err) {
      alert('Failed to save campaign')
    }
    setSaving(false)
  }

  async function handleLaunch(id) {
    setLaunching(id)
    try {
      await axios.post(`${API}/campaigns/${id}/launch`)
      setTimeout(() => { fetchAll(); setLaunching(null) }, 2000)
    } catch (err) {
      alert('Launch failed')
      setLaunching(null)
    }
  }

  async function fetchInsight(id) {
    setInsightLoading(id)
    try {
      const res = await axios.get(`${API}/campaigns/${id}/insight`)
      setInsights(prev => ({ ...prev, [id]: res.data.insight }))
    } catch (err) {
      alert('Failed to fetch insight')
    }
    setInsightLoading(null)
  }

  function resetForm() {
    setName(''); setSegmentId(''); setChannel('whatsapp'); setMessage('')
  }

  const totalSent = campaigns.reduce((acc, c) => acc + (c.stats?.sent || 0), 0)
  const totalDelivered = campaigns.reduce((acc, c) => acc + (c.stats?.delivered || 0), 0)
  const deliveryRate = totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(1) : 0

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-gray-500 mt-1">Create and launch personalised campaigns</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-violet-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-700 transition shadow-md shadow-violet-200"
        >
          + New Campaign
        </button>
      </div>

      {/* Mini Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-400 mb-1">Total Campaigns</p>
          <p className="text-2xl font-bold text-gray-800">{campaigns.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-400 mb-1">Total Sent</p>
          <p className="text-2xl font-bold text-violet-600">{totalSent.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-400 mb-1">Avg. Delivery Rate</p>
          <p className="text-2xl font-bold text-green-600">{deliveryRate}%</p>
        </div>
      </div>

      {/* Campaigns List */}
      {loading ? (
        <div className="text-center py-20 text-gray-300">Loading campaigns...</div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">📣</p>
          <p className="font-semibold text-gray-600 text-lg">No campaigns yet</p>
          <p className="text-sm text-gray-400 mt-1 mb-5">Create your first campaign to reach your shoppers</p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-violet-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-700 transition"
          >
            + Create First Campaign
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map(c => {
            const sent = c.stats?.sent || 0
            const delivered = c.stats?.delivered || 0
            const opened = c.stats?.opened || 0
            const clicked = c.stats?.clicked || 0
            const failed = c.stats?.failed || 0
            const delivRate = sent > 0 ? ((delivered / sent) * 100).toFixed(0) : 0
            const openRate = sent > 0 ? ((opened / sent) * 100).toFixed(0) : 0

            return (
              <div key={c.id} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition">
                {/* Top Row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center text-2xl">
                      {channelIcon[c.channel] || '📣'}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-base">{c.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5 capitalize">
                        {c.channel} • {new Date(c.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-3 py-1.5 rounded-full font-semibold capitalize ${statusColors[c.status] || statusColors.draft}`}>
                      {c.status}
                    </span>
                    {c.status === 'draft' && (
                      <button
                        onClick={() => handleLaunch(c.id)}
                        disabled={launching === c.id}
                        className="bg-violet-600 text-white px-4 py-1.5 rounded-xl text-xs font-bold hover:bg-violet-700 transition disabled:opacity-50 flex items-center gap-1"
                      >
                        {launching === c.id ? <><span className="animate-spin">⚙️</span> Launching...</> : '🚀 Launch'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Message Preview */}
                <div className="bg-gray-50 rounded-xl px-4 py-3 mb-4 border border-gray-100">
                  <p className="text-sm text-gray-600 line-clamp-2">{c.message}</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-5 gap-3 mb-4">
                  {[
                    { label: 'Sent', value: sent, color: 'text-gray-800' },
                    { label: 'Delivered', value: delivered, color: 'text-green-600' },
                    { label: 'Failed', value: failed, color: 'text-red-500' },
                    { label: 'Opened', value: opened, color: 'text-blue-600' },
                    { label: 'Clicked', value: clicked, color: 'text-violet-600' },
                  ].map(stat => (
                    <div key={stat.label} className="text-center bg-gray-50 rounded-xl py-3 border border-gray-100">
                      <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Progress Bars */}
                {sent > 0 && (
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-20">Delivery</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${delivRate}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-green-600">{delivRate}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-20">Open Rate</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${openRate}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-blue-600">{openRate}%</span>
                    </div>
                  </div>
                )}

                {/* AI Insight */}
                {(c.status === 'completed' || c.status === 'running') && (
                  <div className="mt-2">
                    {insights[c.id] ? (
                      <div className="bg-violet-50 border border-violet-200 rounded-xl px-4 py-3">
                        <p className="text-xs font-bold text-violet-700 mb-1">✨ AI Insight</p>
                        <p className="text-sm text-violet-800">{insights[c.id]}</p>
                      </div>
                    ) : (
                      <button
                        onClick={() => fetchInsight(c.id)}
                        disabled={insightLoading === c.id}
                        className="text-xs bg-violet-100 text-violet-700 px-4 py-2 rounded-xl font-semibold hover:bg-violet-200 transition disabled:opacity-50 flex items-center gap-1"
                      >
                        {insightLoading === c.id ? <><span className="animate-spin">⚙️</span> Analyzing...</> : '✨ Get AI Insight'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">New Campaign</h2>
                <p className="text-sm text-gray-400 mt-0.5">Reach your shoppers with a personalised message</p>
              </div>
              <button onClick={() => { setShowModal(false); resetForm() }} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition">✕</button>
            </div>

            {/* Name */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Campaign Name</label>
              <input
                type="text"
                placeholder="e.g. Summer Sale Blast"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
            </div>

            {/* Segment */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Target Segment</label>
              <select
                value={segmentId}
                onChange={e => setSegmentId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              >
                <option value="">Select a segment...</option>
                {segments.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.customer_count} customers)</option>
                ))}
              </select>
            </div>

            {/* Channel */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Channel</label>
              <div className="flex gap-3">
                {['whatsapp', 'sms', 'email'].map(ch => (
                  <button
                    key={ch}
                    onClick={() => setChannel(ch)}
                    className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition capitalize ${
                      channel === ch
                        ? 'bg-violet-600 text-white border-violet-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'
                    }`}
                  >
                    {channelIcon[ch]} {ch}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Draft */}
            <div className="mb-4 bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <span>✨</span>
                <p className="text-sm font-bold text-violet-700">AI Message Writer</p>
              </div>
              <p className="text-xs text-violet-500 mb-3">Select segment + channel, then let AI write the perfect message</p>
              <button
                onClick={handleAIDraft}
                disabled={aiLoading || !segmentId}
                className="w-full bg-violet-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-violet-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {aiLoading ? <><span className="animate-spin">⚙️</span> Writing...</> : '✨ Draft Message with AI'}
              </button>
            </div>

            {/* Message */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
              <textarea
                rows={4}
                placeholder="AI will write it for you, or type your own..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
              />
              {message && (
                <p className="text-xs text-gray-400 mt-1">{message.length} characters</p>
              )}
            </div>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={!name || !segmentId || !message || saving}
              className="w-full bg-violet-600 text-white py-3 rounded-xl font-bold hover:bg-violet-700 transition disabled:opacity-40 text-sm"
            >
              {saving ? 'Saving...' : '💾 Save Campaign'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
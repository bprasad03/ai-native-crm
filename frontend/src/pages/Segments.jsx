import { useEffect, useState } from 'react'
import axios from 'axios'
import API from '../config'

export default function Segments() {
  const [segments, setSegments] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState('')
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [rules, setRules] = useState(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchSegments() }, [])

  function fetchSegments() {
    axios.get(`${API}/segments`).then(res => {
      setSegments(res.data)
      setLoading(false)
    })
  }

  async function handleAISuggest() {
    if (!aiPrompt.trim()) return
    setAiLoading(true)
    setRules(null)
    try {
      const res = await axios.post(`${API}/segments/ai-suggest`, { prompt: aiPrompt })
      setRules(res.data.rules)
    } catch (err) {
      alert('AI suggestion failed')
    }
    setAiLoading(false)
  }

  async function handleSave() {
    if (!name.trim() || !rules) return
    setSaving(true)
    try {
      await axios.post(`${API}/segments`, { name, rules })
      setShowModal(false)
      setName('')
      setAiPrompt('')
      setRules(null)
      fetchSegments()
    } catch (err) {
      alert('Failed to save segment')
    }
    setSaving(false)
  }

  function getRulesSummary(rules) {
    const parts = []
    if (rules.min_spent) parts.push(`Spent ≥ ₹${rules.min_spent}`)
    if (rules.max_spent) parts.push(`Spent ≤ ₹${rules.max_spent}`)
    if (rules.inactive_days) parts.push(`Inactive ${rules.inactive_days}+ days`)
    if (rules.city) parts.push(`City: ${rules.city}`)
    return parts.length ? parts : ['All customers']
  }

  const totalCustomers = segments.reduce((acc, s) => acc + (s.customer_count || 0), 0)

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Segments</h1>
          <p className="text-gray-500 mt-1">Group your shoppers into targeted audiences</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-violet-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-700 transition shadow-md shadow-violet-200"
        >
          + New Segment
        </button>
      </div>

      {/* Mini Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-400 mb-1">Total Segments</p>
          <p className="text-2xl font-bold text-gray-800">{segments.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-400 mb-1">Total Audience</p>
          <p className="text-2xl font-bold text-violet-600">{totalCustomers.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-violet-500 to-purple-700 rounded-xl p-4 shadow-sm text-white">
          <p className="text-xs opacity-80 mb-1">✨ AI Powered</p>
          <p className="text-sm font-semibold">Describe audience in plain English → AI builds the rules</p>
        </div>
      </div>

      {/* Segments Grid */}
      {loading ? (
        <div className="text-center py-20 text-gray-300">Loading segments...</div>
      ) : segments.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🎯</p>
          <p className="font-semibold text-gray-600 text-lg">No segments yet</p>
          <p className="text-sm text-gray-400 mt-1 mb-5">Create your first segment to start targeting shoppers</p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-violet-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-700 transition"
          >
            + Create First Segment
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {segments.map(seg => (
            <div key={seg.id} className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-lg transition group">
              {/* Card Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center text-violet-600 text-xl group-hover:bg-violet-600 group-hover:text-white transition">
                  🎯
                </div>
                <span className="text-sm font-bold text-violet-600 bg-violet-50 px-3 py-1 rounded-full">
                  {seg.customer_count?.toLocaleString() || 0} customers
                </span>
              </div>

              {/* Name */}
              <h3 className="font-bold text-gray-800 text-base mb-3">{seg.name}</h3>

              {/* Rules Pills */}
              <div className="flex flex-wrap gap-2 mb-4">
                {getRulesSummary(seg.rules).map((rule, i) => (
                  <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg font-medium">
                    {rule}
                  </span>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  Created {new Date(seg.created_at).toLocaleDateString()}
                </p>
                <a href="/campaigns" className="text-xs text-violet-600 font-semibold hover:underline">
                  Use in campaign →
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Create Segment</h2>
                <p className="text-sm text-gray-400 mt-0.5">Define your target audience</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition">✕</button>
            </div>

            {/* Segment Name */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Segment Name</label>
              <input
                type="text"
                placeholder="e.g. High Value Customers"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
            </div>

            {/* AI Suggest */}
            <div className="mb-5 bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">✨</span>
                <p className="text-sm font-bold text-violet-700">AI Segment Builder</p>
              </div>
              <p className="text-xs text-violet-500 mb-3">Describe your audience in plain English and AI will build the rules</p>
              <textarea
                rows={3}
                placeholder="e.g. Customers who spent more than ₹3000 and haven't ordered in 30 days..."
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                className="w-full border border-violet-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white resize-none"
              />
              <button
                onClick={handleAISuggest}
                disabled={aiLoading || !aiPrompt.trim()}
                className="mt-3 w-full bg-violet-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {aiLoading ? (
                  <><span className="animate-spin">⚙️</span> Thinking...</>
                ) : (
                  <>✨ Generate Rules with AI</>
                )}
              </button>
            </div>

            {/* AI Result */}
            {rules && (
              <div className="mb-5 bg-green-50 border border-green-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span>✅</span>
                  <p className="text-sm font-bold text-green-700">AI Generated Rules</p>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {Object.entries(rules).map(([key, val]) => (
                    <span key={key} className="text-xs bg-white border border-green-200 text-green-700 px-3 py-1.5 rounded-lg font-medium">
                      {key === 'min_spent' ? `Min Spent: ₹${val}` :
                       key === 'max_spent' ? `Max Spent: ₹${val}` :
                       key === 'inactive_days' ? `Inactive: ${val} days` :
                       key === 'city' ? `City: ${val}` : `${key}: ${val}`}
                    </span>
                  ))}
                </div>
                <pre className="text-xs text-gray-500 bg-white rounded-lg p-2 overflow-auto">{JSON.stringify(rules, null, 2)}</pre>
              </div>
            )}

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={!name || !rules || saving}
              className="w-full bg-violet-600 text-white py-3 rounded-xl font-bold hover:bg-violet-700 transition disabled:opacity-40 text-sm"
            >
              {saving ? 'Saving...' : '💾 Save Segment'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
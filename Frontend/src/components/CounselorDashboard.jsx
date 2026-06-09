// src/components/CounselorDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Search, Eye, Calendar, RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export default function CounselorDashboard() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole');
    
    if (!token || role !== 'Counselor') {
      console.warn("Unauthorized credential route attempt blocked.");
      navigate('/login');
      return;
    }

    // Concurrent pipeline synchronization
    Promise.all([fetchCounselorCases(token), fetchCalendarSchedule(token)])
      .finally(() => setLoading(false));
  }, [navigate]);

  const fetchCounselorCases = async (token) => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/cases/counselor/cases/', {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        setCases(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to stream tactical case file matrix:", err);
    }
  };

  const fetchCalendarSchedule = async (token) => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/cases/counselor/calendar/', {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        setMeetings(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to sync calendar matrix:", err);
    }
  };

  const handleStatusChange = async (caseId, newStatus) => {
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/cases/counselor/cases/${caseId}/`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        setCases(cases.map(c => c.case_id === caseId ? { ...c, status: newStatus } : c));
      }
    } catch (err) {
      alert("Failed to synchronize pipeline tracking state changes.");
    }
  };

  // Helper utility to flag risk parameters dynamically based on tracking layers
  const getRiskBadge = (score) => {
    const numScore = Number(score || 0);
    if (numScore >= 4) return <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 border border-rose-100 text-rose-700 uppercase">Critical Priority</span>;
    if (numScore >= 2) return <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 border border-amber-100 text-amber-700 uppercase">Elevated Risk</span>;
    return <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 border border-emerald-100 text-emerald-700 uppercase">Stable</span>;
  };

  const filteredCases = cases.filter(c => {
    const anonId = c?.anonymous_id ? String(c.anonymous_id).toLowerCase() : '';
    const regionName = c?.region ? String(c.region).toLowerCase() : '';
    const query = searchTerm.toLowerCase();
    
    const matchesSearch = anonId.includes(query) || regionName.includes(query);
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 font-sans text-stone-500">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-indigo-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold uppercase tracking-wider">Synchronizing Clinical Desk Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfcfa] font-sans text-stone-900 px-6 py-8 md:px-12">
      
      {/* Upper Control Bar Layout */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-8 border-b border-stone-200/60 space-y-4 md:space-y-0">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-purple-600 bg-purple-50 px-2.5 py-1 rounded-md">Counselor Core Station</span>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 mt-2">Case Discovery Tracker</h1>
        </div>
        <div className="flex items-center space-x-2 self-start md:self-auto bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl">
          <Shield className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-emerald-800">Workspace Authorized: <span className="text-emerald-600 uppercase">Active</span></span>
        </div>
      </div>

      {/* Main Two-Column Workflow Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-8">
        
        {/* Left Side (3 Columns): Cases Discovery Master Listing View */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Dynamic Action Filter Bar Ribbon */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white border border-stone-200/60 p-4 rounded-xl shadow-xs">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 transform -translate-y-1/2 text-stone-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Query anonymous tracking code or deployment zone..."
                className="w-full text-xs pl-9 pr-3.5 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:border-purple-600 bg-stone-50/20 font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Pipeline State:</span>
              <select
                className="text-xs border border-stone-200 rounded-lg px-3 py-2 bg-white font-medium focus:outline-none focus:border-purple-600"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Core Tracks</option>
                <option value="ASSESSED">Assessed / New</option>
                <option value="UNDER_REVIEW">Under Active Review</option>
                <option value="ACTION_PLAN">Action Plan Formulated</option>
                <option value="RESOLVED">Resolved Nodes</option>
              </select>
            </div>
          </div>

          {/* Cases Master Data Table Frame Container */}
          <div className="bg-white border border-stone-200/70 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50/70 text-[10px] font-bold text-stone-400 uppercase tracking-wider border-b border-stone-200/60">
                    <th className="py-4 px-6">Anonymized Identifier</th>
                    <th className="py-4 px-5">Geographic Zone</th>
                    <th className="py-4 px-5">Vulnerability Flag</th>
                    <th className="py-4 px-5">Operational Tracking State</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs font-medium text-stone-700">
                  {filteredCases.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-stone-400 bg-stone-50/5 font-semibold">
                        No telemetry case records matched your current parameters.
                      </td>
                    </tr>
                  ) : (
                    filteredCases.map((c) => (
                      <tr key={c.case_id || c.id} className="hover:bg-stone-50/20 transition duration-100">
                        <td className="py-4 px-6 font-mono font-bold text-slate-900 text-[13px]">{c.anonymous_id || "N/A"}</td>
                        <td className="py-4 px-5 text-stone-600 font-semibold">{c.region || "Unknown Region"}</td>
                        <td className="py-4 px-5">{getRiskBadge(c.metrics?.isolation_score)}</td>
                        <td className="py-4 px-5">
                          <select
                            className={`text-[11px] font-bold tracking-wide uppercase px-2 py-1 rounded border outline-none bg-white transition duration-150 ${
                              c.status === 'RESOLVED' ? 'border-emerald-200 text-emerald-700 bg-emerald-50/30' :
                              c.status === 'ACTION_PLAN' ? 'border-blue-200 text-blue-700 bg-blue-50/30' :
                              c.status === 'UNDER_REVIEW' ? 'border-purple-200 text-purple-700 bg-purple-50/30' :
                              'border-amber-200 text-amber-700 bg-amber-50/30'
                            }`}
                            value={c.status || "ASSESSED"}
                            onChange={(e) => handleStatusChange(c.case_id, e.target.value)}
                          >
                            <option value="ASSESSED">Assessed</option>
                            <option value="UNDER_REVIEW">Under Review</option>
                            <option value="ACTION_PLAN">Action Plan</option>
                            <option value="RESOLVED">Resolved</option>
                          </select>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            type="button"
                            onClick={() => navigate(`/counselor/cases/${c.case_id}`)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-900 hover:bg-purple-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Analyze Case</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side (1 Column): Counselor Calendar Agenda Stream Widget */}
        <div className="bg-white border border-stone-200/70 p-6 rounded-2xl shadow-sm flex flex-col space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <h2 className="text-sm font-black text-slate-900 flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              <span>Intervention Agenda</span>
            </h2>
            <RefreshCw 
              className="w-3.5 h-3.5 text-stone-400 cursor-pointer hover:text-purple-600 transition"
              onClick={() => { setLoading(true); fetchCalendarSchedule(localStorage.getItem('authToken')).finally(() => setLoading(false)); }}
            />
          </div>

          <p className="text-[11px] text-stone-400 leading-relaxed font-semibold">
            Chronological log of pending diagnostic sessions set up across your active case files.
          </p>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-[360px] pr-1">
            {meetings.length === 0 ? (
              <div className="text-center py-12 text-stone-400 font-medium space-y-2">
                <Clock className="w-5 h-5 mx-auto stroke-1 text-stone-300" />
                <p className="text-[10px]">No pending sessions scheduled.</p>
              </div>
            ) : (
              meetings.map((m) => {
                const startTimeStr = m.start_time || m.start;
                const startHour = startTimeStr 
                  ? new Date(startTimeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                  : '--:--';
                return (
                  <div key={m.id} className="p-3 bg-stone-50 border border-stone-200/60 rounded-xl space-y-1 hover:border-purple-200/70 transition">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold tracking-wider font-mono text-purple-700">{startHour}</span>
                      <span className="text-[9px] font-bold text-stone-400 uppercase tracking-tight">Session node</span>
                    </div>
                    <h3 className="text-xs font-bold text-slate-800 truncate">{m.title || "Untitled Meeting"}</h3>
                    <p className="text-[10px] font-mono font-semibold text-stone-500 truncate">
                      Target: {m.anonymous_id || m.case_id || "N/A"}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
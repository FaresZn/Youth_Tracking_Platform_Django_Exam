// AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, UserPlus, Globe, Shield, MapPin, CheckCircle, AlertCircle, Trash2, Search, UserCheck } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  
  const [metrics, setMetrics] = useState({
    active_cases: 0,
    total_beneficiaries: 0,
    intake_operators: 0,
    clinical_reviewers: 0
  });
  
  const [geoData, setGeoData] = useState([]);
  const [staffList, setStaffList] = useState([]); // 👈 Added: Holds user node entries
  const [searchTerm, setSearchTerm] = useState(''); // 👈 Added: Filter query string tracking
  const [loading, setLoading] = useState(true);
  
  // User creation form state
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    email: '',
    role: 'Operator',
    zone: ''
  });
  
  const [formStatus, setFormStatus] = useState({ success: null, message: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token || token === "undefined") {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      navigate('/login');
      return;
    }
    // Perform initial cluster synchronizations concurrently
    Promise.all([fetchMetrics(token), fetchStaff(token)]).finally(() => setLoading(false));
  }, [navigate]);

  const fetchMetrics = async (token) => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/cases/admin-metrics/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.summary) setMetrics(data.summary);
        if (data.geo_distribution) setGeoData(data.geo_distribution);
      }
    } catch (err) {
      console.error("Metrics pipeline exception:", err);
    }
  };

  // 📂 Fetch System Personnel List
  const fetchStaff = async (token) => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/cases/admin-staff/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStaffList(data);
      }
    } catch (err) {
      console.error("Staff engine directory sync failure:", err);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormStatus({ success: null, message: '' });
    const token = localStorage.getItem('authToken');

    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/provision-user/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      });

      const data = await response.json();

      if (response.ok) {
        setFormStatus({ success: true, message: `Account for ${newUser.username} successfully provisioned inside the database cluster.` });
        setNewUser({ username: '', password: '', email: '', role: 'Operator', zone: '' });
        // Refresh directory layout tables and counter summary frames synchronously
        fetchMetrics(token);
        fetchStaff(token);
      } else {
        setFormStatus({ success: false, message: data.error || data.detail || 'Failed to initialize account node.' });
      }
    } catch (err) {
      setFormStatus({ success: false, message: 'Network connectivity fault with credentials cluster.' });
    } finally {
      setSubmitting(false);
    }
  };

  // 🚨 Handle Drop Account Record Execution Sequence
  const handleDeleteUser = async (userId, targetName) => {
    if (!window.confirm(`Are you absolutely sure you want to completely purge user account "${targetName}" from the ecosystem records? This action cannot be reversed.`)) {
      return;
    }
    
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/cases/admin-staff/${userId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        // Splice view states dynamically, then re-calculate data boundaries
        setStaffList(staffList.filter(user => user.id !== userId));
        fetchMetrics(token);
      } else {
        const errData = await response.json();
        alert(errData.error || "Failed to drop specified user profile registry entity.");
      }
    } catch (err) {
      console.error("Network collision dropping user records:", err);
    }
  };

  // Filter staff rows based on live search criteria bounds matching usernames or email addresses
  const filteredStaff = staffList.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 font-sans text-stone-500">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-[#1e1b4b] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold uppercase tracking-wider">Synchronizing Security Clusters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfcfa] font-sans text-stone-900 px-6 py-8 md:px-12">
      
      {/* Upper Header Title Matrix Area */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-8 border-b border-stone-200/60 space-y-4 md:space-y-0">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">Root Administrative Node</span>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 mt-2">Ecosystem Monitor</h1>
        </div>
        <div className="flex items-center space-x-2 self-start md:self-auto bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl">
          <Shield className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-emerald-800">System Integrity: <span className="text-emerald-600 uppercase">Secure</span></span>
        </div>
      </div>

      {/* Numerical Metrics Count Ribbon Array Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-8">
        <div className="bg-white border border-stone-200/70 p-6 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Active Cases</span>
            <div className="text-3xl font-black text-slate-900">{metrics.active_cases}</div>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><FileText className="w-5 h-5" /></div>
        </div>

        <div className="bg-white border border-stone-200/70 p-6 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Total Beneficiaries</span>
            <div className="text-3xl font-black text-slate-900">{metrics.total_beneficiaries}</div>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><Users className="w-5 h-5" /></div>
        </div>

        <div className="bg-white border border-stone-200/70 p-6 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Intake Operators</span>
            <div className="text-3xl font-black text-slate-900">{metrics.intake_operators}</div>
          </div>
          <div className="w-12 h-12 bg-stone-50 text-stone-600 rounded-xl flex items-center justify-center"><Shield className="w-5 h-5" /></div>
        </div>

        <div className="bg-white border border-stone-200/70 p-6 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Clinical Reviewers</span>
            <div className="text-3xl font-black text-slate-900">{metrics.clinical_reviewers}</div>
          </div>
          <div className="w-12 h-12 bg-stone-50 text-stone-600 rounded-xl flex items-center justify-center"><Users className="w-5 h-5" /></div>
        </div>
      </div>

      {/* Lower Row Configuration: Account Provisioning Form & Geographic Coordinates Matrix List */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mt-8">
        
        {/* Account Creation Form Panel Area */}
        <div className="lg:col-span-2 bg-white border border-stone-200/70 p-8 rounded-2xl shadow-sm space-y-6">
          <div className="flex items-center space-x-3 pb-2 border-b border-stone-100">
            <UserPlus className="w-5 h-5 text-slate-800" />
            <h2 className="text-base font-black text-slate-900">Provision Internal Account</h2>
          </div>

          {formStatus.message && (
            <div className={`flex items-start space-x-2.5 p-3.5 rounded-xl border text-xs font-medium ${
              formStatus.success ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
            }`}>
              {formStatus.success ? <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
              <span>{formStatus.message}</span>
            </div>
          )}

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold tracking-wider text-stone-400 uppercase">Username</label>
              <input 
                type="text" required 
                className="w-full text-xs px-3.5 py-3 border border-stone-200 rounded-xl focus:outline-none focus:border-blue-600 transition bg-stone-50/30"
                value={newUser.username}
                onChange={(e) => setNewUser({...newUser, username: e.target.value})}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold tracking-wider text-stone-400 uppercase">Account Password</label>
              <input 
                type="password" required 
                className="w-full text-xs px-3.5 py-3 border border-stone-200 rounded-xl focus:outline-none focus:border-blue-600 transition bg-stone-50/30"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold tracking-wider text-stone-400 uppercase">Email Address</label>
              <input 
                type="email" required 
                className="w-full text-xs px-3.5 py-3 border border-stone-200 rounded-xl focus:outline-none focus:border-blue-600 transition bg-stone-50/30"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold tracking-wider text-stone-400 uppercase">Institutional Role</label>
                <select 
                  className="w-full text-xs px-3 py-3 border border-stone-200 rounded-xl bg-white focus:outline-none focus:border-blue-600 transition"
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                >
                  <option value="Operator">Operator</option>
                  <option value="Counselor">Counselor</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold tracking-wider text-stone-400 uppercase">Zone / Jurisdiction</label>
                <input 
                  type="text" required placeholder="e.g., Tunis, Sfax"
                  className="w-full text-xs px-3.5 py-3 border border-stone-200 rounded-xl focus:outline-none focus:border-blue-600 transition bg-stone-50/30"
                  value={newUser.zone}
                  onChange={(e) => setNewUser({...newUser, zone: e.target.value})}
                />
              </div>
            </div>

            <button 
              type="submit" disabled={submitting}
              className="w-full bg-[#1e1b4b] hover:bg-slate-900 text-white font-bold text-[10px] tracking-wider uppercase py-4 rounded-xl transition duration-150 disabled:opacity-50 mt-2"
            >
              {submitting ? 'Creating Internal Profile Record...' : 'Authorize Operational Account'}
            </button>
          </form>
        </div>

        {/* Geographic Density Matrix Module */}
        <div className="lg:col-span-3 bg-white border border-stone-200/70 p-8 rounded-2xl shadow-sm flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div className="flex items-center space-x-3">
              <Globe className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-black text-slate-900">Geographic Intake Density Matrix</h2>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md">
              ⚠️ Zero-PII Map Mode
            </span>
          </div>

          <p className="text-xs leading-relaxed text-stone-500 font-medium">
            Real-time tracking of registration requests submitted across active server deployment hubs. Patient records and identification hashes remain completely masked.
          </p>

          <div className="flex-1 overflow-y-auto max-h-[300px] border border-stone-100 rounded-xl p-4 bg-stone-50/30 space-y-3.5">
            {geoData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-stone-400 py-12 space-y-2">
                <MapPin className="w-5 h-5 stroke-1" />
                <span className="text-xs font-semibold">Anonymized Map Coordinate Tracking Engine Active</span>
              </div>
            ) : (
              geoData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 bg-white border border-stone-200/60 rounded-xl shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-500 font-mono text-xs font-bold">
                      #{idx + 1}
                    </div>
                    <span className="text-xs font-bold text-slate-800">{item.zone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-black text-slate-900 px-3 py-1 bg-stone-100/80 rounded-md">
                      {item.count} Records
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 📋 NEW: Full Personnel Security Directory Table Frame Block */}
      <div className="bg-white border border-stone-200/70 p-8 rounded-2xl shadow-sm mt-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-stone-100 gap-4">
          <div className="flex items-center space-x-3">
            <UserCheck className="w-5 h-5 text-[#1e1b4b]" />
            <div>
              <h2 className="text-base font-black text-slate-900">Internal Directory Registry</h2>
              <p className="text-[11px] text-stone-400 font-medium">Audit and manage systemic clearance handles assigned to active workforce endpoints.</p>
            </div>
          </div>
          
          {/* Live Search Bar Filter Handle */}
          <div className="relative max-w-xs w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-stone-400">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              placeholder="Filter by name, email, role..."
              className="w-full text-xs pl-9 pr-3.5 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-blue-600 bg-stone-50/40 text-stone-800 font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-stone-200/60">
          <table className="w-full text-left border-collapse bg-white">
            <thead>
              <tr className="bg-stone-50/70 text-[10px] font-bold text-stone-400 uppercase tracking-wider border-b border-stone-200/60">
                <th className="py-4 px-5">System Identity Node</th>
                <th className="py-4 px-5">Email Address Handle</th>
                <th className="py-4 px-5">Operational Group Assignment</th>
                <th className="py-4 px-5">Clearance Timestamp</th>
                <th className="py-4 px-5 text-right">Directory Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center font-medium text-stone-400 bg-stone-50/10">
                    No matching personnel account records verified in this security sector.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((person) => (
                  <tr key={person.id} className="hover:bg-stone-50/30 transition duration-100">
                    <td className="py-4 px-5 font-bold text-slate-900">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span>{person.username}</span>
                      </div>
                    </td>
                    <td className="py-4 px-5 font-mono text-stone-500 text-[11px]">{person.email}</td>
                    <td className="py-4 px-5">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase ${
                        person.role === 'Counselor' 
                          ? 'bg-purple-50 text-purple-700 border border-purple-100' 
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {person.role}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-stone-400 font-medium">{person.date_joined}</td>
                    <td className="py-4 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(person.id, person.username)}
                        className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition duration-150 inline-flex items-center justify-center"
                        title="Purge profile node record"
                      >
                        <Trash2 className="w-4 h-4" />
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
  );
}
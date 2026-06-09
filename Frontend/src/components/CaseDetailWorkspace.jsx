import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Brain, Calendar, Info, BarChart3, Clock, CheckCircle2, Sparkles } from 'lucide-react';

export default function CaseDetailWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Local form state for scheduling calendar interventions
  const [meetingTitle, setMeetingTitle] = useState('Diagnostic Review Session');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [meetingNotes, setMeetingNotes] = useState('');
  const [scheduling, setScheduling] = useState(false);

  useEffect(() => {
    fetchComprehensiveCaseMetrics();
  }, [id]);

  const fetchComprehensiveCaseMetrics = async () => {
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/cases/counselor/cases/detail/${id}/`, {
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        }
      });
      if (response.ok) {
        const data = await response.json();
        console.log("--- DEBUG PAYLOAD RECEIVER ---", data);
        setCaseData(data);
      } else {
        setError('Failed to extract target diagnostic profile metrics from active core nodes.');
      }
    } catch (err) {
      setError('Network synchronization failure during telemetry pull operations.');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!meetingDate || !meetingTime) {
      alert("Please specify valid scheduling calendar timeline targets.");
      return;
    }

    setScheduling(true);
    const token = localStorage.getItem('authToken');
    
    // Combine date and time variables safely into an ISO string sequence
    const combinedStart = `${meetingDate}T${meetingTime}:00`;
    
    // Set typical clinical session windows to run for 1 hour
    const [hours, minutes] = meetingTime.split(':');
    const endHour = String(parseInt(hours, 10) + 1).padStart(2, '0');
    const combinedEnd = `${meetingDate}T${endHour}:${minutes}:00`;

    try {
      // Sending POST directly to the now-supported detail route configuration mapping
      const response = await fetch(`http://127.0.0.1:8000/api/cases/counselor/cases/detail/${id}/`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          title: meetingTitle,
          start_time: combinedStart,
          end_time: combinedEnd,
          notes: meetingNotes
        })
      });

      if (response.status === 201 || response.ok) {
        alert("Session indexed cleanly into workspace calendar arrays.");
        setMeetingDate('');
        setMeetingTime('');
        setMeetingNotes('');
        // Re-run the GET pull operation to instantly show the new row down inside history arrays
        fetchComprehensiveCaseMetrics(); 
      } else {
        alert("Transaction aborted by backend scheduling validation filters.");
      }
    } catch (err) {
      console.error("Scheduling transaction network failure: ", err);
      alert("Network communication crash during submission run queues.");
    } finally {
      setScheduling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 font-sans text-stone-500">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-purple-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold uppercase tracking-wider">Mapping Analytical Metrics Profile...</p>
        </div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="min-h-screen p-12 bg-stone-50 text-stone-700 font-sans">
        <div className="max-w-md mx-auto bg-white border p-8 rounded-xl space-y-4 text-center">
          <p className="text-xs font-bold text-rose-600 uppercase">System Error Mapping Target</p>
          <p className="text-sm font-medium">{error || "Record could not be retrieved safely."}</p>
          <button 
            onClick={() => navigate('/counselor/dashboard')} 
            className="text-xs font-bold px-4 py-2 bg-slate-900 text-white rounded-lg transition hover:bg-slate-800"
          >
            Return to Controller
          </button>
        </div>
      </div>
    );
  }

  const monthlyAbsences = caseData.metrics?.absences ?? 0;
  const socialIsolation = caseData.metrics?.isolation_score ?? 0;
  const gradeVariance = caseData.metrics?.grade_delta ?? 0;
  const missedTasks = caseData.metrics?.missed_appointments ?? 0;
  
  const meetingsList = caseData.scheduled_meetings || caseData.appointments || [];

  return (
    <div className="min-h-screen bg-[#fbfcfa] font-sans text-stone-900 px-6 py-8 md:px-12">
      
      {/* Return Path Navigation Command Bar header */}
      <button 
        onClick={() => navigate('/counselor/dashboard')}
        className="inline-flex items-center space-x-2 text-xs font-bold text-stone-500 hover:text-purple-700 transition mb-6 bg-white border border-stone-200/60 px-3 py-2 rounded-xl shadow-xs"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Dashboard Fleet</span>
      </button>

      {/* Case Header Banner */}
      <div className="pb-6 border-b border-stone-200/60 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-3xl font-black tracking-tight text-slate-990">Case: {caseData.anonymous_id || `ID-${id}`}</h1>
            <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-[10px] font-bold uppercase rounded-md tracking-wider border border-purple-100/60">Anonymized Telemetry</span>
          </div>
          <p className="text-xs font-semibold text-stone-400 mt-1">
            Geographic Origin: <span className="text-stone-600">{caseData.region || "Unknown Region"}</span> • Age: {caseData.age ?? "N/A"} years old
          </p>
        </div>
        <div className="bg-slate-900 text-white font-mono text-[11px] font-bold px-4 py-2 rounded-xl self-start sm:self-auto uppercase tracking-wider">
          Pipeline Context: {caseData.status || "UNASSESSED"}
        </div>
      </div>

      {/* Workspace Matrix Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        
        {/* Left Column Span (2 Blocks) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Dynamic Visual Indicator Tracking Dashboard Canvas Bar Panel */}
          <div className="bg-white border border-stone-200/70 p-6 rounded-2xl shadow-sm space-y-6">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center space-x-2 pb-2 border-b border-stone-100">
              <BarChart3 className="w-4 h-4 text-purple-600" />
              <span>Behavioral Telemetry Monitor Dashboard</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Absences Index Progress Indicator Block */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-stone-500">Monthly Absences Tracking</span>
                  <span className="text-slate-900 font-mono">{monthlyAbsences} Days</span>
                </div>
                <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min((monthlyAbsences / 20) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-stone-400 font-medium">Scale normalized against critical threshold level limits of 20 session skips.</p>
              </div>

              {/* Isolation Score Progress Indicator Block */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-stone-500">Social Isolation Index Indicator</span>
                  <span className="text-rose-600 font-mono">{socialIsolation} / 5</span>
                </div>
                <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-rose-600 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${(socialIsolation / 5) * 100}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-stone-400 font-medium">Computed indicator reflecting predictive risk matrix attributes.</p>
              </div>

              {/* Grade Delta Variance Tracker Block */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-stone-500">Performance Academic Drop</span>
                  <span className="text-red-500 font-mono">{gradeVariance} Points</span>
                </div>
                <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-red-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min((Math.abs(gradeVariance) / 5) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-stone-400 font-medium">Tracks the negative drop in cumulative grade point averages.</p>
              </div>

              {/* Assignment Completion Skips Block */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-stone-500">Missed Assignments / Tasks</span>
                  <span className="text-slate-700 font-mono">{missedTasks} Delays</span>
                </div>
                <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-slate-700 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min((missedTasks / 6) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-stone-400 font-medium">Unsubmitted homework records indexed by data clerks.</p>
              </div>

            </div>
          </div>

          {/* Local Deterministic LLM Predictive Core Analytics Canvas Area */}
          <div className="bg-slate-900 text-stone-100 p-6 rounded-2xl shadow-md border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 opacity-5 pointer-events-none">
              <Brain className="w-48 h-48 text-white" />
            </div>
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-widest text-purple-400 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                <span>AI Clinical Analysis Execution Segment</span>
              </h3>
              <span className="text-[9px] font-bold text-slate-400 uppercase border border-slate-800 px-2 py-0.5 rounded-md bg-slate-950">Deterministic Mode</span>
            </div>

            <p className="text-xs leading-relaxed text-slate-300 font-medium whitespace-pre-line bg-slate-950/40 p-4 rounded-xl border border-slate-800/60 font-sans mt-4">
              {caseData.ai_analysis || caseData.raw_intake_notes || "No algorithmic diagnostic evaluations generated for this record profile node."}
            </p>
          </div>

          {/* Raw Historical Intake Notes Narrative Log Layer */}
          <div className="bg-white border border-stone-200/70 p-6 rounded-2xl shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center space-x-2">
              <Info className="w-3.5 h-3.5 text-stone-400" />
              <span>Original Operational Operator Intake Narrative Log</span>
            </h3>
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/60 text-xs font-medium text-stone-600 leading-relaxed italic">
              "{caseData.raw_intake_notes || "No historical descriptive text metrics accompanied this registration node entry."}"
            </div>
          </div>

        </div>

        {/* Right Column Span (1 Block) */}
        <div className="space-y-6">
          
          {/* Calendar Event Submission Card */}
          <div className="bg-white border border-stone-200/70 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2 pb-2 border-b border-stone-100">
              <Calendar className="w-4 h-4 text-purple-600" />
              <span>Schedule Strategic Outreach</span>
            </h3>
            
            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Session Description Label</label>
                <input 
                  type="text" 
                  className="w-full text-xs px-3 py-2 border rounded-lg focus:outline-none focus:border-purple-600 bg-stone-50/40 font-medium"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Calendar Date</label>
                  <input 
                    type="date" 
                    className="w-full text-xs px-3 py-2 border rounded-lg focus:outline-none focus:border-purple-600 bg-stone-50/40 font-medium"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Target Time</label>
                  <input 
                    type="time" 
                    className="w-full text-xs px-3 py-2 border rounded-lg focus:outline-none focus:border-purple-600 bg-stone-50/40 font-medium"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Clinical Focus Context Brief</label>
                <textarea 
                  rows="2"
                  placeholder="Note strategies, targeted items, or tracking focus protocols..."
                  className="w-full text-xs px-3 py-2 border rounded-lg focus:outline-none focus:border-purple-600 bg-stone-50/40 font-medium resize-none"
                  value={meetingNotes}
                  onChange={(e) => setMeetingNotes(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={scheduling}
                className="w-full bg-slate-900 hover:bg-purple-900 text-white text-[11px] font-bold uppercase tracking-wider py-3 rounded-xl transition duration-150 disabled:opacity-50 cursor-pointer text-center"
              >
                {scheduling ? "Registering Session Node..." : "Commit Meeting to Calendar"}
              </button>
            </form>
          </div>

          {/* List of Existing Logged Sessions */}
          <div className="bg-white border border-stone-200/70 p-5 rounded-2xl shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              <span>Target Intervention History</span>
            </h4>
            
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {meetingsList.length === 0 ? (
                <p className="text-[10px] text-stone-400 italic py-2 font-medium">No previous intervention tracks registered to this specific metadata profile.</p>
              ) : (
                meetingsList.map((m, idx) => {
                  const rawTargetStart = m.start_time || m.start;
                  const mDate = rawTargetStart ? new Date(rawTargetStart).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'N/A';
                  const mTime = rawTargetStart ? new Date(rawTargetStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A';
                  return (
                    <div key={idx} className="p-2.5 bg-stone-50 rounded-lg border border-stone-200/50 flex items-start space-x-2 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                      <div className="truncate">
                        <p className="font-bold text-slate-800 truncate">{m.title || "Review Session"}</p>
                        <p className="text-[9px] text-stone-400 font-mono">{mDate} at {mTime}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
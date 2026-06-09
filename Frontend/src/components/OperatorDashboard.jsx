// OperatorDashboard.jsx
import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

export default function OperatorDashboard() {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Status structures can return: 'idle', 'success', 'error_schema', 'error_data'
  const [report, setReport] = useState({ status: 'idle', message: '', details: [] });

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    const extension = selectedFile.name.split('.').pop().toLowerCase();
    if (['csv', 'xls', 'xlsx'].includes(extension)) {
      setFile(selectedFile);
      setReport({ status: 'idle', message: '', details: [] }); // Reset reporting console
    } else {
      setReport({
        status: 'error_schema',
        message: 'Invalid file format rejected.',
        details: ['System explicitly demands data format standardizations bound within structured .csv or .xlsx spreadsheets.']
      });
    }
  };

  const clearFileSelection = () => {
    setFile(null);
    setReport({ status: 'idle', message: '', details: [] });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

const handleUploadSubmit = async (e) => {
  e.preventDefault();
  if (!file) return;

  setUploading(true);
  setReport({ status: 'idle', message: '', details: [] });

  const formData = new FormData();
  formData.append('file', file);

  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch('http://127.0.0.1:8000/api/cases/bulk-upload/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Note: Do NOT add 'Content-Type': 'application/json' here. 
        // Leaving it empty allows the browser to set the multipart/form-data boundary automatically.
      },
      body: formData
    });

    // 🛑 ALWAYS extract the JSON payload first, regardless of the status code!
    const data = await response.json();

    if (response.status === 201) {
      setReport({
        status: 'success',
        message: data.message || 'File parsed and pushed to cluster safely.'
      });
      setFile(null);
    } 
    else if (response.status === 422) {
      // Direct the parsed server messages straight to the UI console state
      if (data.status === 'schema_mismatch') {
        setReport({
          status: 'error_schema',
          message: data.message,
          details: data.missing_columns 
            ? [`Missing fields: ${data.missing_columns.join(', ')}`] 
            : ['Check your spreadsheet column header layouts.']
        });
      } else {
        setReport({
          status: 'error_data',
          message: data.message || 'Validation data checks failed.',
          details: data.errors || ['Invalid cell type format detected inside row variables.']
        });
      }
    } 
    else {
      setReport({
        status: 'error_schema',
        message: data.error || `Server returned error code: ${response.status}`,
        details: []
      });
    }
  } catch (err) {
    // This block now strictly runs only during a true hardware or connection crash
    setReport({
      status: 'error_schema',
      message: 'Network pipeline disconnect during dataset injection.',
      details: ['Could not establish connection with backend server ports.']
    });
  } finally {
    setUploading(false);
  }
};

  return (
    <div className="min-h-screen bg-[#fbfcfa] font-sans text-stone-900 px-6 py-8 md:px-12">
      
      {/* Header Grid Profile */}
      <div className="pb-6 border-b border-stone-200/60">
        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
          Internal Intake Interface
        </span>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 mt-2">Beneficiary Intake Console</h1>
        <p className="text-xs text-stone-400 font-medium mt-1">Upload cluster database records asynchronously while enforcing system schema rulesets.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mt-8">
        
        {/* Left Hand: Upload File Processing Zone Box */}
        <div className="lg:col-span-3 bg-white border border-stone-200/70 p-8 rounded-2xl shadow-sm space-y-6">
          <h2 className="text-base font-black text-slate-900 flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
            <span>Document Pipeline Entry Point</span>
          </h2>

          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current.click()}
              className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3 ${
                dragActive ? 'border-blue-600 bg-blue-50/20' : 'border-stone-200 hover:border-stone-300 bg-stone-50/20'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept=".csv, .xls, .xlsx"
                onChange={handleFileChange}
              />
              <div className="p-3 bg-white shadow-sm border border-stone-100 rounded-xl text-stone-400">
                <UploadCloud className="w-6 h-6 text-indigo-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Drag & drop document matrix here, or browse local volumes</p>
                <p className="text-[11px] text-stone-400 font-medium mt-0.5">Supports standalone system payloads (.csv, .xls, .xlsx)</p>
              </div>
            </div>

            {/* Display Selected Target Handle Profile */}
            {file && (
              <div className="flex items-center justify-between p-3.5 bg-indigo-50/40 border border-indigo-100/70 rounded-xl">
                <div className="flex items-center space-x-3 truncate">
                  <FileSpreadsheet className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-900 truncate">{file.name}</span>
                  <span className="text-[10px] text-indigo-700 font-mono bg-indigo-100 px-1.5 py-0.5 rounded">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
                <button 
                  type="button" 
                  onClick={clearFileSelection}
                  className="text-stone-400 hover:text-stone-600 text-xs font-bold px-2 py-1"
                >
                  Clear
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={!file || uploading}
              className="w-full bg-[#1e1b4b] hover:bg-slate-900 text-white font-bold text-[10px] tracking-wider uppercase py-4 rounded-xl transition duration-150 disabled:opacity-40"
            >
              {uploading ? 'Analyzing Structure Constraints...' : 'Stream and Verify Beneficiary Records'}
            </button>
          </form>
        </div>

        {/* Right Hand: Interactive Real-Time Validation Reporting Terminal Console */}
        <div className="lg:col-span-2 bg-white border border-stone-200/70 p-8 rounded-2xl shadow-sm flex flex-col space-y-5">
          <h2 className="text-base font-black text-slate-900 flex items-center space-x-2 pb-2 border-b border-stone-100">
            <Info className="w-4 h-4 text-stone-400" />
            <span>Validation Logs Console</span>
          </h2>

          {report.status === 'idle' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-stone-400 space-y-2">
              <FileSpreadsheet className="w-8 h-8 stroke-1 text-stone-300" />
              <p className="text-xs font-medium">Awaiting dataset pipeline streaming initialization.</p>
            </div>
          )}

          {/* Validation Pass State Indicator */}
          {report.status === 'success' && (
            <div className="flex-1 p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-3">
              <div className="flex items-center space-x-2 text-emerald-800">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Verification Complete</h3>
              </div>
              <p className="text-xs text-emerald-900/80 leading-relaxed font-medium">{report.message}</p>
            </div>
          )}

          {/* Column/Schema Mismatch Error Block */}
          {report.status === 'error_schema' && (
            <div className="flex-1 p-5 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-3">
              <div className="flex items-center space-x-2 text-rose-800">
                <XCircle className="w-5 h-5 text-rose-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Schema Architecture Rejected</h3>
              </div>
              <p className="text-xs text-rose-900/80 leading-relaxed font-medium">{report.message}</p>
              {report.details.length > 0 && (
                <div className="pt-2 border-t border-rose-100 space-y-1.5 text-[11px] font-mono text-rose-700">
                  {report.details.map((detail, index) => (
                    <div key={index}>• {detail}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Cell Core Type Mismatch Error Listing Block */}
          {report.status === 'error_data' && (
            <div className="flex-1 p-5 rounded-2xl bg-amber-50/60 border border-amber-200/70 space-y-3 flex flex-col">
              <div className="flex items-center space-x-2 text-amber-800">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Cell Content Mismatches</h3>
              </div>
              <p className="text-xs text-amber-900/80 font-medium">{report.message}</p>
              
              <div className="flex-1 overflow-y-auto max-h-[180px] bg-white border border-amber-200 rounded-xl p-3 font-mono text-[10px] text-amber-800 space-y-1.5">
                {report.details.map((err, index) => (
                  <div key={index} className="pb-1 border-b border-stone-50 last:border-0">
                    ⚠️ {err}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Helper Documentation Block: Blueprint Specification */}
      <div className="mt-8 bg-stone-50 border border-stone-200/60 p-6 rounded-2xl">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Required Template Column Matrix Definition</h3>
        <p className="text-xs text-stone-500 leading-relaxed font-medium mb-3">
          To maintain transactional system uniformity, all batch sheets must provide these lowercase key headers exactly:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {['first_name', 'last_name', 'email', 'age', 'zone', 'phone'].map((field) => (
            <div key={field} className="bg-white px-3 py-1.5 border border-stone-200 rounded-lg text-center shadow-2xs">
              <code className="text-[10px] font-bold text-indigo-700 font-mono">{field}</code>
              <div className="text-[9px] text-stone-400 mt-0.5 uppercase tracking-tight">
                {field === 'age' ? 'Integer' : 'String / Text'}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

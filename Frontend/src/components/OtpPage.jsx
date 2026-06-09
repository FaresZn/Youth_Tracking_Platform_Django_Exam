import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { KeyRound } from 'lucide-react';

export default function OtpPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract contextual login data from React Router location state
  const username = location.state?.username || '';
  const assignedRole = location.state?.role || 'Authorized Member';
  
  const [otpCode, setOtpCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    setVerifying(true);
    setErrorMessage('');

    try {
      // 💻 FIXED: Updated URL path to match your Django configuration exactly
      const response = await fetch('http://127.0.0.1:8000/api/auth/login/verify-otp/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          otp_code: otpCode,
        }),
      });

      // Intercept non-JSON routing errors gracefully (e.g. 404/500 custom HTML pages)
      if (!response.ok && !response.headers.get('content-type')?.includes('application/json')) {
        throw new Error(`Server returned a non-JSON response code: ${response.status}`);
      }

      const data = await response.json();

      if (response.ok) {
        // 🔒 FIXED: Fallback tracking strategy to cleanly extract 'access' or 'token' keys
        const tokenToStore = data.access || data.token;
        
        // 🛡️ CRITICAL FIX: Extract the certified permission role straight from Django API response data, 
        // fallback to localized Router state variables only if the backend doesn't explicitly serve it.
        const actualRole = data.role || assignedRole;

        if (tokenToStore) {
          localStorage.setItem('authToken', tokenToStore);
          localStorage.setItem('userRole', actualRole); // 👈 Safely cached for downstream Dashboard route gates!
          
          // Normalize string representations to handle mixed casing or descriptive helper extensions safely
          const cleanRole = String(actualRole).trim().toUpperCase();

          // Dynamically guide users based on their target access controls
          if (cleanRole.includes('OPERATOR')) {
            navigate('/operator/dashboard');
          } else if (cleanRole.includes('COUNSELOR')) {
            navigate('/counselor/dashboard');
          } else if (cleanRole.includes('ADMIN')) {
            navigate('/admin/dashboard');
          } else {
            setErrorMessage(`Access Route Undefined: No interface map matches role tracking context '${actualRole}'.`);
          }
        } else {
          setErrorMessage('Authentication structure mismatch: Missing token keys in payload.');
          console.error('Payload key miss:', data);
        }
      } else {
        setErrorMessage(data.error || data.detail || 'The authentication passcode matches no active sessions.');
      }
    } catch (error) {
      setErrorMessage('Communications failure with core authentication servers.');
      console.error('OTP confirmation error:', error);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-crvs-canvas font-sans text-crvs-navy">
      <div className="w-full max-w-sm bg-white border border-stone-200/80 p-10 rounded-2xl shadow-xl text-center space-y-6 animate-fade-in">
        
        <div className="space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-crvs-coral/10 flex items-center justify-center text-crvs-coral mx-auto">
            <KeyRound className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-black tracking-tight text-crvs-navy">Verification Code</h2>
          <p className="text-xs text-stone-500 font-medium leading-relaxed max-w-[240px] mx-auto">
            Enter the 6-digit confirmation key issued to establish session security context for: <span className="text-crvs-blue font-bold">{assignedRole}</span>.
          </p>
        </div>

        {errorMessage && (
          <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold p-3 rounded-xl animate-fade-in">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-5">
          <input 
            type="text" 
            maxLength="6"
            placeholder="000000"
            required
            className="w-full text-center text-3xl tracking-[0.4em] font-mono p-3.5 border border-stone-200 rounded-xl bg-stone-50/50 focus:outline-none focus:border-crvs-blue focus:ring-1 focus:ring-crvs-blue focus:bg-white transition"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
          />

          <button 
            type="submit"
            disabled={verifying || otpCode.length !== 6}
            className="w-full bg-crvs-blue text-white font-bold text-xs tracking-wider uppercase py-4 rounded-xl hover:bg-crvs-blue-hover transition duration-200 shadow-sm cursor-pointer disabled:opacity-50"
          >
            {verifying ? "Validating Session Tokens..." : "Confirm Passcode"}
          </button>
        </form>
      </div>
    </div>
  );
}
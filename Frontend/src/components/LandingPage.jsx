import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Globe } from 'lucide-react';
import heroImage from '../assets/home-hero-image.png'; 

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white font-sans text-crvs-navy selection:bg-crvs-coral/20 flex flex-col">
      {/* Premium Header Layout */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3 group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-crvs-blue flex items-center justify-center text-white font-bold text-lg shadow-sm">
              𓅪
            </div>
            <div>
              <span className="text-lg font-black tracking-tight uppercase text-crvs-navy block">Portal</span>
              <span className="text-[10px] tracking-widest uppercase font-bold text-stone-400 block -mt-1">Réseau Jeunesse Vigilance</span>
            </div>
          </div>
          
          <button 
            onClick={() => navigate('/login')}
            className="inline-flex items-center space-x-2 bg-crvs-blue text-white text-xs font-bold tracking-wider uppercase px-6 py-3 rounded-full hover:bg-crvs-blue-hover transition duration-200 group shadow-sm cursor-pointer"
          >
            <span>Staff Gateway</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </header>

      {/* Hero Presentation Section */}
      <section className="bg-crvs-canvas relative overflow-hidden py-16 lg:py-28 px-6 sm:px-12 flex-grow flex items-center">
        {/* Asymmetric Image Graphic Container */}
        <div className="absolute right-0 bottom-0 top-0 w-1/2 hidden lg:flex items-center justify-center">
          <div className="relative w-[500px] h-[500px] bg-crvs-coral rounded-full opacity-90 translate-x-12 translate-y-6 flex items-center justify-center overflow-hidden shadow-md">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.05))]"></div>
            
            {/* Swapped out the icon for the human-centric image specified in image_5a9463.jpg */}
            <img 
              src={heroImage} 
              alt="Civil Registration Representative" 
              className="absolute w-[85%] h-[85%] object-contain bottom-0 z-10 filter drop-shadow-lg mix-blend-normal rounded-b-full"
            />
          </div>
        </div>

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 relative z-10">
          <div className="max-w-xl space-y-8 animate-fade-in">
            <div className="inline-flex items-center space-x-2 bg-white/80 border border-stone-200/60 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase text-stone-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Active Sovereign Infrastructure</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-crvs-navy tracking-tight leading-[1.05]">
              Case management <br />
              <span className="text-crvs-blue">for everyone.</span>
            </h1>
            
            <p className="text-md sm:text-lg text-stone-600 font-normal leading-relaxed">
              Our vision is that every vulnerable individual is identified, monitored, and protected via dynamic, decoupled risk analysis framework layers.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <button 
                onClick={() => navigate('/login')}
                className="bg-crvs-blue text-white text-sm font-bold px-8 py-4 rounded-full hover:bg-crvs-blue-hover transition duration-150 text-center shadow-sm cursor-pointer"
              >
                Access Platform Node
              </button>
              <button className="border border-stone-300 text-crvs-navy text-sm font-bold px-8 py-4 rounded-full hover:bg-white transition duration-150 text-center cursor-pointer">
                Read Impact Reports
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Corporate Funding / Partner Banner */}
      <footer className="bg-crvs-navy text-stone-400 py-10 px-6 sm:px-12 border-t border-stone-900">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between space-y-6 md:space-y-0 text-xs tracking-wider font-semibold uppercase">
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-stone-500" />
            <span>Supported Institutional Frameworks</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-60">
            <span>🕊️ UN Alliance</span>
            <span>🛡️ Norad Trust</span>
            <span>💎 Gates Foundation</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
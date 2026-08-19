import React from 'react';
import { Shield, Zap, FileText, Smartphone, Cloud, ArrowRight, CheckCircle, Clock } from 'lucide-react';
import logo from '../logo.png';

export default function Features({ navigate }) {
  
  const featuresList = [
    {
      icon: <Zap className="text-yellow-400" size={32} />,
      title: "Fast POS Billing",
      desc: "Barcode scanner support ke sath 1 second mein GST bill banayein aur print karein."
    },
    {
      icon: <Clock className="text-red-400" size={32} />,
      title: "Smart Expiry Alerts",
      desc: "Dawai expire hone se 3 mahine pehle hi alert, taaki aapka ek rupaye ka bhi nuksan na ho."
    },
    {
      icon: <FileText className="text-blue-400" size={32} />,
      title: "CA-Ready GST Reports",
      desc: "GSTR-1, GSTR-3B aur poore mahine ki sale report ek click mein Excel/PDF format mein."
    },
    {
      icon: <CheckCircle className="text-teal-400" size={32} />,
      title: "Real-time Inventory",
      desc: "Har bill banne par stock automatic kam hoga. Low stock par auto-alert."
    },
    {
      icon: <Cloud className="text-indigo-400" size={32} />,
      title: "100% Cloud Secure",
      desc: "Aapka data hamesha surakshit. Computer kharab ho jaye tab bhi data safe rahega."
    },
    {
      icon: <Smartphone className="text-emerald-400" size={32} />,
      title: "Mobile & PC Ready",
      desc: "Dukan par PC se aur ghar par Mobile se, poora business control karein."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-teal-500/30">
     
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto text-center pt-20 pb-16 px-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 text-sm font-semibold mb-6">
          <Shield size={16} /> Trusted by Medical Stores & Wholesalers
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
          Smart Billing & ERP for <br className="hidden md:block"/> 
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">
            Modern Pharmacies
          </span>
        </h1>
        <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Puraana software chhodiye! Mediveu ERP se billing karein fast, inventory track karein smart, aur business ko le jayein cloud par. 
        </p>
        
        {/* 🔥 Start Trial Button - Linked Automatically 🔥 */}
        <button 
          onClick={() => navigate ? navigate('login') : console.log('Start Trial')}
          className="bg-teal-500 hover:bg-teal-600 text-white text-lg font-bold px-8 py-4 rounded-full flex items-center gap-2 mx-auto transition-all shadow-[0_0_20px_rgba(20,184,166,0.4)] hover:shadow-[0_0_30px_rgba(20,184,166,0.6)] cursor-pointer"
        >
          Start 7-Days Free Trial <ArrowRight size={20} />
        </button>
        <p className="text-xs text-slate-500 mt-4">*No credit card required. Setup in 2 minutes.</p>
      </div>

      {/* Features Grid Section */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Why Choose Mediveu ERP?</h2>
          <div className="w-24 h-1 bg-teal-500 mx-auto rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuresList.map((feature, index) => (
            <div key={index} className="bg-slate-900 border border-slate-800 p-8 rounded-2xl hover:bg-slate-800/80 transition-all hover:border-slate-700 hover:-translate-y-1 shadow-lg group">
              <div className="bg-slate-950 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-slate-800 group-hover:border-slate-600 transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-12 py-8 text-center bg-slate-950">
        <p className="text-slate-500 text-sm">
          © 2026 CCU Studios MEDIVEU ERP. All rights reserved. <br/>
          Built for Pharmacies, Clinics & Wholesale Distributors.
        </p>
      </footer>

    </div>
  );
}


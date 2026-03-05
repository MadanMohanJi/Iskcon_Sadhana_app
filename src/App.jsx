import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  addDoc, 
  doc, 
  setDoc,
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  BookOpen, Sunrise, Moon, Heart, CheckCircle, Users, 
  User, Settings, LogOut, Send, AlertCircle, Calendar, 
  Video, FileText, MailPlus, Trophy, PlayCircle, BarChart,
  Sparkles, ShieldCheck, Flame, Phone, MapPin, Image as ImageIcon, Search, MessageCircle
} from 'lucide-react';

// --- Firebase Initialization ---
const firebaseConfig = {
  apiKey: "AIzaSyCAA-N2AN7buELcz1jOLq4LCCwWF7osa7c",
  authDomain: "sadhana-49558.firebaseapp.com",
  projectId: "sadhana-49558",
  storageBucket: "sadhana-49558.firebasestorage.app",
  messagingSenderId: "871884934655",
  appId: "1:871884934655:web:75473386b9d44679bcebca",
  measurementId: "G-3GG8DF21T9"
};

// --- Helper Functions ---
const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate();
const todayStr = () => new Date().toISOString().split('T')[0];

const calculateDailyScore = (report, rules) => {
  let s = 0;
  s += (Math.min(report.rounds, rules.roundsTarget) / rules.roundsTarget) * rules.roundsPoints;
  
  if (report.wakeTime <= rules.wakeEarlyTarget) s += rules.wakeEarlyPoints;
  else if (report.wakeTime <= rules.wakeMidTarget) s += rules.wakeMidPoints;
  
  if (report.readingMins >= rules.readTarget) s += rules.readPoints;
  else if (report.readingMins >= (rules.readTarget / 2)) s += (rules.readPoints / 2);

  const hearMins = report.personalHearingMins || report.hearingMins || 0;
  if (hearMins >= rules.hearingTarget) s += rules.hearingPoints;
  else if (hearMins >= (rules.hearingTarget / 2)) s += (rules.hearingPoints / 2);

  if (report.mangalaArati) s += rules.mangalaAratiPoints;
  if (report.guruPuja) s += rules.guruPujaPoints;
  if (report.morningClass) s += rules.morningClassPoints;
  
  return Math.round(s);
};

// Smart Image URL Parser (Tries to convert Drive viewer links to direct image links)
const parseImageUrl = (url) => {
  if (!url) return null;
  if (url.includes('drive.google.com/file/d/')) {
    const match = url.match(/\/d\/(.*?)\//);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
  }
  return url;
};

export default function App() {
  const [sessionEmail, setSessionEmail] = useState(localStorage.getItem('pbsc_session_email'));
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);

  // 1. Initialize Firebase Auth
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth error:", error);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) setAuthInitialized(true);
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch Profile based on Custom Session
  useEffect(() => {
    if (!authInitialized) return;
    if (!sessionEmail) {
      setUserProfile(null);
      setLoading(false);
      return;
    }

    const profilesRef = collection(db, 'artifacts', appId, 'public', 'data', 'users');
    const unsubscribe = onSnapshot(profilesRef, (snapshot) => {
      const allProfiles = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      const myProfile = allProfiles.find(p => p.email === sessionEmail);
      
      setUserProfile(myProfile || null);
      setLoading(false);
    }, (err) => {
      console.error("Profile fetch error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [sessionEmail, authInitialized]);

  const handleLoginSuccess = (email) => {
    localStorage.setItem('pbsc_session_email', email);
    setSessionEmail(email);
  };

  const handleLogout = () => {
    localStorage.removeItem('pbsc_session_email');
    setSessionEmail(null);
    setUserProfile(null);
  };

  if (loading || !authInitialized) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#FCFAF8] text-orange-600 animate-in fade-in duration-1000">
        <div className="relative group mb-6">
          <div className="absolute -inset-4 bg-gradient-to-r from-orange-500 to-yellow-400 rounded-full blur-xl opacity-40 animate-pulse"></div>
          <div className="relative flex items-center justify-center text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 tracking-[0.15em] drop-shadow-lg">
            <Flame className="w-10 h-10 sm:w-14 sm:h-14 text-orange-500 mr-2 animate-pulse" />
            ISKCON UJJAIN
          </div>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-widest text-gray-800 drop-shadow-sm">Sri Guru's Compass</h2>
        <p className="text-xs sm:text-sm text-orange-600 font-bold tracking-[0.25em] mt-3 uppercase opacity-80">Awakening Devotion</p>
      </div>
    );
  }

  if (!sessionEmail || !userProfile) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  const profileImgUrl = parseImageUrl(userProfile.photoUrl);

  return (
    <div className="min-h-screen bg-[#FCFAF8] font-sans text-slate-800 selection:bg-orange-200 selection:text-orange-900">
      {/* Glassmorphism Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-orange-100 shadow-sm animate-in slide-in-from-top-4 duration-700">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:flex items-center bg-gradient-to-r from-orange-600 via-red-500 to-orange-500 px-4 py-2 rounded-xl shadow-[0_0_15px_rgba(249,115,22,0.3)] font-black text-white tracking-[0.15em] text-xs border border-orange-400/50 hover:scale-105 hover:shadow-[0_0_20px_rgba(249,115,22,0.5)] transition-all duration-500 cursor-default">
              <Sparkles className="w-3 h-3 mr-1.5 text-yellow-200 animate-pulse" />
              ISKCON UJJAIN
            </div>
            <div className="sm:hidden flex items-center bg-gradient-to-r from-orange-600 via-red-500 to-orange-500 px-3 py-2 rounded-lg shadow-md font-black text-white tracking-widest text-xs border border-orange-400/50 hover:scale-105 transition-all">
              <Flame className="w-3 h-3 mr-1 text-yellow-200" />
              IU
            </div>
            <div className="ml-1 sm:ml-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-700 to-red-600 tracking-tight leading-none drop-shadow-sm">
                Sri Guru's Compass
              </h1>
              <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-orange-500 font-bold mt-0.5">Sadhana Portal</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-5">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-sm font-bold text-gray-800">{userProfile.name}</span>
              <span className="text-[10px] text-orange-600 font-bold bg-orange-100 px-2 py-0.5 rounded-full inline-block mt-0.5 uppercase tracking-wider w-fit ml-auto">
                {userProfile.category || userProfile.role}
              </span>
            </div>
            {profileImgUrl ? (
              <img src={profileImgUrl} alt="Profile" className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-orange-200 object-cover shadow-sm" />
            ) : (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center border-2 border-orange-200">
                <User className="w-5 h-5" />
              </div>
            )}
            <button 
              onClick={handleLogout} 
              className="flex items-center gap-2 p-2 sm:px-3 sm:py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-semibold transition-all shadow-sm border border-rose-100"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline text-sm">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 pb-24">
        {userProfile.role === 'host' ? (
          <HostDashboard profile={userProfile} />
        ) : (
          <DevoteeDashboard profile={userProfile} />
        )}
      </main>
    </div>
  );
}

// ==========================================
// 1. AUTHENTICATION & ONBOARDING
// ==========================================
function AuthScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  
  const [isHostReg, setIsHostReg] = useState(false);
  const [secretKey, setSecretKey] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formattedEmail = email.toLowerCase().trim();

      if (isHostReg && secretKey !== 'HAREKRISHNA108') {
        throw new Error("Invalid Host Secret Key. You cannot register as a Host.");
      }

      const usersRef = collection(db, 'artifacts', appId, 'public', 'data', 'users');
      const snapshot = await new Promise((resolve, reject) => {
        const unsub = onSnapshot(usersRef, (snap) => { resolve(snap); unsub(); }, (err) => { reject(err); unsub(); });
      });
      const allUsers = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      const existingUser = allUsers.find(u => u.email === formattedEmail);

      if (existingUser) {
        onLoginSuccess(formattedEmail);
        return;
      }

      if (!name.trim()) {
        throw new Error("Full Name is required for first-time registration.");
      }

      let assignedHostId = 'self'; 
      let assignedCategory = 'New';

      if (!isHostReg) {
        const invitesRef = collection(db, 'artifacts', appId, 'public', 'data', 'invites');
        const invSnapshot = await new Promise((resolve, reject) => {
          const unsub = onSnapshot(invitesRef, (snap) => { resolve(snap); unsub(); }, (err) => { reject(err); unsub(); });
        });
        const allInvites = invSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        const myInvite = allInvites.find(i => i.email.toLowerCase() === formattedEmail);
        
        if (!myInvite) {
          throw new Error("Your email has not been invited by any Host. Please contact your Counselor.");
        }
        assignedHostId = myInvite.hostId;
        assignedCategory = myInvite.category || 'New';
      }

      const newUserRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'users'));
      await setDoc(newUserRef, {
        email: formattedEmail,
        name: name,
        role: isHostReg ? 'host' : 'devotee',
        hostId: isHostReg ? newUserRef.id : assignedHostId,
        category: isHostReg ? null : assignedCategory,
        createdAt: serverTimestamp()
      });

      onLoginSuccess(formattedEmail);

    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFAF8] flex items-center justify-center p-4 relative overflow-hidden animate-in fade-in duration-1000">
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-orange-400/10 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-red-400/10 blur-3xl pointer-events-none"></div>

      <div className="bg-white/80 backdrop-blur-xl p-8 sm:p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] max-w-md w-full border border-white relative z-10 animate-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-10">
          <div className="mx-auto bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 rounded-2xl flex items-center justify-center mb-8 text-white shadow-[0_0_25px_rgba(249,115,22,0.4)] border-2 border-orange-200/50 px-8 py-5 transform hover:scale-105 hover:-translate-y-1 transition-all duration-500 relative overflow-hidden group">
            <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <span className="font-black text-2xl tracking-[0.2em] flex items-center gap-3 drop-shadow-md">
              <Flame className="w-6 h-6 text-yellow-300 animate-pulse"/>
              ISKCON UJJAIN
            </span>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">Hare Krishna!</h2>
          <p className="text-sm text-gray-500 mt-2 font-medium">Enter your details to access the portal</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 text-rose-700 text-sm rounded-2xl border border-rose-100 flex items-start gap-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Email Address</label>
            <input 
              type="email" 
              required 
              className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all font-medium text-gray-800 placeholder-gray-400" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="devotee@example.com" 
            />
          </div>

          <div className="relative">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1 flex items-center gap-2">
              Full Name <span className="text-orange-400 lowercase normal-case text-[10px]">(Only if new user)</span>
            </label>
            <input 
              type="text" 
              className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all font-medium text-gray-800 placeholder-gray-400" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="Your spiritual or legal name" 
            />
          </div>

          {isHostReg && (
            <div className="p-5 bg-gradient-to-br from-slate-50 to-gray-100 border border-gray-200 rounded-2xl animate-in zoom-in-95 duration-300">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-orange-500"/> Admin Secret Key
              </label>
              <input 
                type="password" 
                required 
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-500 outline-none font-medium transition-shadow" 
                value={secretKey} 
                onChange={e => setSecretKey(e.target.value)} 
                placeholder="Enter host passcode..." 
              />
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full mt-8 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-extrabold text-lg py-4 px-4 rounded-2xl shadow-lg hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 flex justify-center items-center gap-2"
          >
            {loading ? 'Authenticating...' : 'Enter Portal'}
            {!loading && <Sparkles className="w-5 h-5 group-hover:animate-pulse" />}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <button 
            onClick={() => setIsHostReg(!isHostReg)} 
            className="text-[10px] font-bold text-gray-400 hover:text-orange-500 transition-colors uppercase tracking-widest"
          >
            {isHostReg ? "← Back to Devotee Login" : "Register as Host (Admin)"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. HOST DASHBOARD
// ==========================================
function HostDashboard({ profile }) {
  const [tab, setTab] = useState('overview');
  const [reports, setReports] = useState([]);
  const [devotees, setDevotees] = useState([]);
  const [invites, setInvites] = useState([]);
  const [classes, setClasses] = useState([]);
  const [hostSettings, setHostSettings] = useState(null);

  useEffect(() => {
    const usersRef = collection(db, 'artifacts', appId, 'public', 'data', 'users');
    const unsubUsers = onSnapshot(usersRef, (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setDevotees(all.filter(u => u.hostId === profile.id && u.role === 'devotee'));
    });

    const reportsRef = collection(db, 'artifacts', appId, 'public', 'data', 'reports');
    const unsubReports = onSnapshot(reportsRef, (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setReports(all.filter(r => r.hostId === profile.id));
    });

    const invitesRef = collection(db, 'artifacts', appId, 'public', 'data', 'invites');
    const unsubInvites = onSnapshot(invitesRef, (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setInvites(all.filter(i => i.hostId === profile.id));
    });

    const classesRef = collection(db, 'artifacts', appId, 'public', 'data', 'classes');
    const unsubClasses = onSnapshot(classesRef, (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setClasses(all.filter(c => c.hostId === profile.id).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
    });

    const settingsRef = collection(db, 'artifacts', appId, 'public', 'data', 'host_settings');
    const unsubSettings = onSnapshot(settingsRef, (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const mySettings = all.find(s => s.hostId === profile.id);
      setHostSettings(mySettings || null);
    });

    return () => { unsubUsers(); unsubReports(); unsubInvites(); unsubClasses(); unsubSettings(); };
  }, [profile.id]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-8">
      {/* Sleek Segmented Control */}
      <div className="bg-white p-2 rounded-2xl flex flex-wrap gap-2 shadow-sm border border-gray-200 sticky top-[80px] z-40">
        {[
          { id: 'overview', icon: Users, label: 'Sangha Overview' },
          { id: 'invites', icon: MailPlus, label: 'Whitelist' },
          { id: 'classes', icon: Video, label: 'Resources' },
          { id: 'settings', icon: Settings, label: 'Scoring Rules' }
        ].map(t => (
          <button 
            key={t.id} 
            onClick={() => setTab(t.id)} 
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex-1 sm:flex-none justify-center ${tab === t.id ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md shadow-orange-500/20' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      <div className="transition-all duration-500">
        {tab === 'overview' && <HostOverview reports={reports} devotees={devotees} settings={hostSettings} profile={profile} />}
        {tab === 'invites' && <HostInvites invites={invites} profile={profile} />}
        {tab === 'classes' && <HostClasses classes={classes} profile={profile} />}
        {tab === 'settings' && <HostSettings settings={hostSettings} profile={profile} />}
      </div>
    </div>
  );
}

function HostOverview({ reports, devotees, settings, profile }) {
  const [selectedDevoteeId, setSelectedDevoteeId] = useState(null);
  const [filterCat, setFilterCat] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [hostMessage, setHostMessage] = useState('');
  const [messageStatus, setMessageStatus] = useState('');

  const updateCategory = async (devoteeId, newCat) => {
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', devoteeId), { category: newCat }, { merge: true });
    } catch(err) { console.error(err); }
  };

  const getStatus = (report) => {
    if (!report) return 'bg-gray-100 border-gray-200'; 
    if (report.rounds >= 16 && report.wakeTime <= '06:00') return 'bg-green-400 border-green-500 shadow-green-500/20 shadow-sm';
    if (report.rounds < 8) return 'bg-red-400 border-red-500 shadow-red-500/20 shadow-sm';
    return 'bg-yellow-400 border-yellow-500 shadow-yellow-500/20 shadow-sm';
  };

  const renderCalendar = (devoteeId) => {
    const devReports = reports.filter(r => r.devoteeId === devoteeId);
    const days = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const report = devReports.find(r => r.date === dateStr);
      
      days.push(
        <div 
          key={dateStr} 
          className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg ${getStatus(report)} border flex-shrink-0 cursor-help transition-all duration-200 hover:scale-125 hover:z-10`} 
          title={`${dateStr}: ${report ? report.rounds + ' rounds, Woke: ' + report.wakeTime : 'No Data'}`}
        ></div>
      );
    }
    return <div className="flex flex-wrap gap-1.5 mt-3">{days}</div>;
  };

  const filteredDevotees = devotees.filter(d => {
    const matchCat = filterCat === 'All' || (d.category || 'New') === filterCat;
    const matchSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) || (d.email && d.email.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });
  const selectedDevotee = devotees.find(d => d.id === selectedDevoteeId);

  const handleSendMessage = async () => {
    if (!hostMessage.trim()) return;
    setMessageStatus('sending');
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), {
        hostId: profile.id,
        devoteeId: selectedDevotee.id,
        message: hostMessage,
        createdAt: serverTimestamp()
      });
      setHostMessage('');
      setMessageStatus('sent');
      setTimeout(() => setMessageStatus(''), 3000);
    } catch(e) { setMessageStatus('error'); }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      <div className="xl:col-span-2 space-y-6">
        <div className="bg-white rounded-[2rem] shadow-xl shadow-orange-900/5 border border-orange-50 p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 border-b border-gray-100 pb-6">
            <h2 className="text-2xl font-extrabold text-gray-800 flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-orange-100 to-red-100 text-orange-600 rounded-2xl"><Users className="w-6 h-6" /></div>
              Sangha Roster
            </h2>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search devotees..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full sm:w-48 pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm font-medium transition-all"
                />
              </div>
              <select 
                value={filterCat}
                onChange={(e) => setFilterCat(e.target.value)}
                className="bg-white border border-gray-200 text-gray-600 font-bold text-xs rounded-xl px-4 py-2 outline-none shadow-sm focus:ring-2 focus:ring-orange-500"
              >
                <option value="All">All Categories</option>
                <option value="New">New</option>
                <option value="Preparing for Initiation">Prep. Initiation</option>
                <option value="Initiated">Initiated</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-4">
            {filteredDevotees.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No devotees found matching your criteria.</p>
              </div>
            ) : null}
            
            {filteredDevotees.map(dev => {
              const profileImg = parseImageUrl(dev.photoUrl);
              return (
                <div 
                  key={dev.id} 
                  className={`border p-5 rounded-2xl transition-all cursor-pointer ${selectedDevoteeId === dev.id ? 'bg-orange-50/50 border-orange-300 ring-4 ring-orange-500/10 scale-[1.01]' : 'bg-white border-gray-100 hover:border-orange-200 hover:shadow-md'}`} 
                  onClick={() => setSelectedDevoteeId(dev.id)}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-3">
                      {profileImg ? (
                        <img src={profileImg} alt={dev.name} className="w-10 h-10 rounded-full object-cover border-2 border-orange-100" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">
                          {dev.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-gray-800 text-lg leading-tight">{dev.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <select 
                            value={dev.category || 'New'} 
                            onChange={(e) => { e.stopPropagation(); updateCategory(dev.id, e.target.value); }}
                            className="text-[10px] uppercase tracking-wider font-bold bg-gray-100 border-none rounded-md px-2 py-1 text-orange-700 outline-none hover:bg-orange-100 transition-colors cursor-pointer"
                          >
                            <option value="New">New</option>
                            <option value="Preparing for Initiation">Prep. Initiation</option>
                            <option value="Initiated">Initiated</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                  {renderCalendar(dev.id)}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="xl:col-span-1">
        {selectedDevotee ? (
          <div className="bg-white rounded-[2rem] shadow-xl shadow-orange-900/5 border border-orange-50 p-6 sm:p-8 sticky top-[150px] animate-in slide-in-from-right-8 duration-500">
            
            {/* Devotee Profile Summary Header */}
            <div className="flex flex-col items-center text-center pb-6 border-b border-gray-100 mb-6">
               {parseImageUrl(selectedDevotee.photoUrl) ? (
                 <img src={parseImageUrl(selectedDevotee.photoUrl)} className="w-24 h-24 rounded-full object-cover border-4 border-orange-100 shadow-md mb-4" alt="Devotee" />
               ) : (
                 <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-100 to-red-100 text-orange-600 flex items-center justify-center mb-4 border-4 border-white shadow-md">
                   <User className="w-10 h-10" />
                 </div>
               )}
               <h3 className="text-xl font-extrabold text-gray-800">{selectedDevotee.name}</h3>
               <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mt-1">{selectedDevotee.category || 'New'}</span>
               
               <div className="mt-4 flex flex-col gap-2 w-full">
                 <div className="flex items-center justify-center gap-2 text-sm text-gray-600 bg-gray-50 py-2 rounded-xl border border-gray-100">
                   <MailPlus className="w-4 h-4 text-orange-400" /> {selectedDevotee.email}
                 </div>
                 {selectedDevotee.mobile && (
                   <div className="flex items-center justify-center gap-2 text-sm text-gray-600 bg-gray-50 py-2 rounded-xl border border-gray-100">
                     <Phone className="w-4 h-4 text-orange-400" /> {selectedDevotee.mobile}
                   </div>
                 )}
                 {selectedDevotee.address && (
                   <div className="flex items-center justify-center gap-2 text-sm text-gray-600 bg-gray-50 py-2 rounded-xl border border-gray-100">
                     <MapPin className="w-4 h-4 text-orange-400" /> {selectedDevotee.address}
                   </div>
                 )}
               </div>
            </div>

             <h2 className="text-lg font-extrabold mb-4 flex items-center gap-3 text-gray-800">
               <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg"><Calendar className="w-4 h-4"/></div>
               Latest Submission
             </h2>
             {(() => {
                const reps = reports.filter(r => r.devoteeId === selectedDevotee.id).sort((a,b) => new Date(b.date) - new Date(a.date));
                const latest = reps[0];
                if (!latest) return <p className="text-sm text-gray-500 italic bg-gray-50 p-4 rounded-xl text-center">No reports submitted yet.</p>;
                return (
                  <div className="space-y-4 text-sm font-medium">
                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <span className="text-gray-500 uppercase tracking-wider text-[10px] font-bold">Date</span> 
                      <strong className="text-gray-800 text-base">{latest.date}</strong>
                    </div>
                    
                    {/* Japa Details */}
                    <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-orange-800 uppercase tracking-wider text-[10px] font-bold">Japa Rounds</span> 
                        <strong className="text-orange-600 text-xl font-black">{latest.rounds}<span className="text-sm text-orange-400 font-medium">/16</span></strong>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-orange-700/70 font-bold">Before 8 AM: <span className="text-orange-800">{latest.roundsBefore8AM || 0}</span></span>
                        <span className="text-orange-700/70 font-bold">Quality: <span className="text-orange-800">{latest.japaQuality || 'N/A'}</span></span>
                      </div>
                    </div>

                    {/* Routine Details */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                        <span className="text-blue-600 uppercase tracking-wider text-[10px] font-bold block mb-1">Wake Up / Sleep</span> 
                        <strong className="text-blue-900 text-base">{latest.wakeTime} <span className="text-[10px] text-blue-600/70 font-normal">| {latest.sleepTime}</span></strong>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 flex flex-col justify-center gap-1">
                        <span className="text-[10px] font-bold text-blue-800 flex justify-between items-center">Mangala Arati: <strong className={latest.mangalaArati ? "text-green-600 bg-white px-1 rounded shadow-sm" : "text-red-500 bg-white px-1 rounded shadow-sm"}>{latest.mangalaArati ? 'Yes' : 'No'}</strong></span>
                        <span className="text-[10px] font-bold text-blue-800 flex justify-between items-center">Guru Puja: <strong className={latest.guruPuja ? "text-green-600 bg-white px-1 rounded shadow-sm" : "text-red-500 bg-white px-1 rounded shadow-sm"}>{latest.guruPuja ? 'Yes' : 'No'}</strong></span>
                      </div>
                    </div>

                    {/* Sravanam Details */}
                    <div className="space-y-2 bg-green-50 p-3 rounded-xl border border-green-100">
                      <div className="flex justify-between items-center">
                        <span className="text-green-800 uppercase tracking-wider text-[10px] font-bold">Reading</span> 
                        <strong className="text-green-700 text-sm">{latest.readingMins} min</strong>
                      </div>
                      {latest.bookName && <div className="text-[10px] text-green-700/70 font-bold truncate">Book: <span className="text-green-900">{latest.bookName}</span></div>}
                      
                      <div className="flex justify-between items-center pt-2 border-t border-green-200/50 mt-1">
                        <span className="text-green-800 uppercase tracking-wider text-[10px] font-bold">Hearing</span> 
                        <strong className="text-green-700 text-sm">{latest.personalHearingMins || latest.hearingMins || 0} min</strong>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-bold text-green-700/70">
                        <span>Morning Class: <strong className={latest.morningClass ? "text-green-600" : "text-red-500"}>{latest.morningClass ? 'Attended' : 'Missed'}</strong></span>
                      </div>
                    </div>

                    {/* Principles */}
                    <div className="flex justify-between items-center bg-purple-50 p-3 rounded-xl border border-purple-100 text-purple-900">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Principles & Prasadam</span>
                      <div className="flex gap-2">
                        <strong className={`px-2 py-0.5 rounded shadow-sm text-[10px] ${latest.regulativePrinciples ? 'bg-white text-green-600' : 'bg-red-100 text-red-600'}`}>4 Regs</strong>
                        <strong className={`px-2 py-0.5 rounded shadow-sm text-[10px] ${latest.prasadamOnly ? 'bg-white text-green-600' : 'bg-red-100 text-red-600'}`}>Prasadam</strong>
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="mt-6 pt-4 border-t border-gray-100">
                      <span className="text-gray-400 uppercase tracking-wider text-[10px] font-bold flex items-center gap-2 mb-2">
                        <FileText className="w-3 h-3" /> Reflections & Notes
                      </span>
                      <p className="text-gray-700 italic bg-amber-50/50 p-4 rounded-xl border border-amber-100/50 leading-relaxed max-h-48 overflow-y-auto text-xs">
                        {latest.notes || "No notes provided for this day."}
                      </p>
                    </div>
                  </div>
                );
             })()}

             {(() => {
               const today = new Date();
               const currentMonth = today.getMonth();
               const currentYear = today.getFullYear();
               const daysInMonth = getDaysInMonth(currentYear, currentMonth + 1);

               const devReports = reports.filter(r => r.devoteeId === selectedDevotee.id);
               const thisMonthReports = devReports.filter(r => {
                 const d = new Date(r.date);
                 return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
               });

               const rules = settings || {
                 roundsTarget: 16, roundsPoints: 40,
                 wakeEarlyTarget: '05:00', wakeEarlyPoints: 15,
                 wakeMidTarget: '06:30', wakeMidPoints: 5,
                 readTarget: 30, readPoints: 15,
                 hearingTarget: 15, hearingPoints: 10,
                 mangalaAratiPoints: 10,
                 guruPujaPoints: 5,
                 morningClassPoints: 5
               };

               const maxDailyScore = rules.roundsPoints + rules.wakeEarlyPoints + rules.readPoints + rules.hearingPoints + rules.mangalaAratiPoints + rules.guruPujaPoints + rules.morningClassPoints;
               const totalPossible = daysInMonth * maxDailyScore;
               const currentScore = thisMonthReports.reduce((acc, curr) => acc + calculateDailyScore(curr, rules), 0);
               const percentage = totalPossible > 0 ? Math.round((currentScore / totalPossible) * 100) : 0;
               const avgRounds = thisMonthReports.length ? Math.round(thisMonthReports.reduce((acc, curr) => acc + curr.rounds, 0) / thisMonthReports.length) : 0;

               return (
                 <div className="mt-8 pt-8 border-t border-gray-100">
                   <h2 className="text-lg font-extrabold mb-4 flex items-center gap-3 text-gray-800">
                     <div className="p-1.5 bg-yellow-100 text-yellow-600 rounded-lg"><Trophy className="w-4 h-4"/></div>
                     Monthly Analysis
                   </h2>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="bg-gradient-to-b from-orange-50 to-white border border-orange-100 p-4 rounded-2xl flex flex-col items-center justify-center shadow-sm">
                       <span className="text-3xl font-black text-orange-600">{percentage}%</span>
                       <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-1">Health Score</span>
                     </div>
                     <div className="flex flex-col gap-3">
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex justify-between items-center shadow-sm">
                           <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Days Logged</span>
                           <strong className="text-gray-800 text-sm">{thisMonthReports.length}/{daysInMonth}</strong>
                        </div>
                        <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 flex justify-between items-center shadow-sm">
                           <span className="text-[10px] font-bold uppercase tracking-widest text-orange-800/70">Avg Rounds</span>
                           <strong className="text-orange-600 text-sm">{avgRounds}</strong>
                        </div>
                     </div>
                   </div>

                   {/* Send Personal Message */}
                   <div className="mt-8 bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                     <h3 className="text-sm font-extrabold text-indigo-900 flex items-center gap-2 mb-3">
                       <MessageCircle className="w-4 h-4" /> Send Personal Message
                     </h3>
                     <textarea
                       value={hostMessage}
                       onChange={(e) => setHostMessage(e.target.value)}
                       rows="3"
                       placeholder={`Send a message of encouragement to ${selectedDevotee.name}...`}
                       className="w-full p-3 bg-white border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none mb-3 font-medium text-gray-800"
                     ></textarea>
                     <div className="flex items-center justify-between">
                       <span className="text-xs font-bold text-indigo-600">
                         {messageStatus === 'sent' ? 'Message sent securely!' : messageStatus === 'error' ? 'Error sending' : ''}
                       </span>
                       <button
                         onClick={handleSendMessage}
                         disabled={messageStatus === 'sending'}
                         className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                       >
                         {messageStatus === 'sending' ? 'Sending...' : 'Send Message'}
                       </button>
                     </div>
                   </div>
                 </div>
               );
             })()}

          </div>
        ) : (
          <div className="bg-white/50 backdrop-blur-sm border-2 border-dashed border-gray-200 rounded-[2rem] p-8 text-center flex flex-col items-center justify-center h-[500px] sticky top-[150px]">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <User className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-600">Select a Devotee</h3>
            <p className="text-sm text-gray-400 mt-2 max-w-[200px] leading-relaxed">Click on any member in the roster to view their profile and daily offering details.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function HostInvites({ invites, profile }) {
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('New');

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'invites'), {
        email: email.toLowerCase().trim(),
        hostId: profile.id,
        category: category,
        createdAt: serverTimestamp()
      });
      setEmail('');
      setCategory('New');
    } catch (err) {
      console.error(err);
    }
  };

  const removeInvite = async (id) => {
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'invites', id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-orange-900/5 border border-orange-50 p-6 sm:p-10 max-w-4xl mx-auto">
      <div className="flex items-start gap-4 mb-8">
        <div className="p-4 bg-indigo-100 text-indigo-600 rounded-2xl shadow-inner">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-gray-800">Access Whitelist</h2>
          <p className="text-gray-500 font-medium mt-1 text-sm">Strict security: Only authorized emails can register.</p>
        </div>
      </div>

      <form onSubmit={handleInvite} className="flex flex-col md:flex-row gap-4 mb-10 bg-gray-50 p-4 rounded-2xl border border-gray-200 shadow-sm">
        <input 
          type="email" 
          placeholder="devotee@example.com" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          required 
          className="flex-1 px-5 py-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium shadow-sm" 
        />
        <select 
          value={category} 
          onChange={e => setCategory(e.target.value)}
          className="px-5 py-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium shadow-sm text-gray-700 md:w-64"
        >
          <option value="New">New</option>
          <option value="Preparing for Initiation">Preparing for Initiation</option>
          <option value="Initiated">Initiated</option>
        </select>
        <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-md shadow-indigo-500/30 whitespace-nowrap">
          Authorize Email
        </button>
      </form>

      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 border-b pb-2">Active Authorized Emails</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {invites.length === 0 && <p className="text-gray-400 text-sm italic col-span-2">No emails authorized yet.</p>}
          {invites.map(inv => (
            <div key={inv.id} className="flex justify-between items-center bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all group">
              <span className="font-semibold text-gray-700 text-sm truncate pr-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                {inv.email}
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest bg-gray-100 px-2 py-1 rounded ml-2 hidden sm:inline-block border">{inv.category || 'New'}</span>
              </span>
              <button 
                onClick={() => removeInvite(inv.id)} 
                className="text-red-400 hover:text-white hover:bg-red-500 text-xs font-bold px-4 py-2 rounded-lg transition-all opacity-0 group-hover:opacity-100"
              >
                Revoke
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HostClasses({ classes, profile }) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!title) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'classes'), {
        title,
        url,
        hostId: profile.id,
        createdAt: new Date().toISOString()
      });
      setTitle(''); setUrl('');
    } catch (err) {
      console.error(err);
    }
  };

  const deleteClass = async (id) => {
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'classes', id));
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-orange-900/5 border border-orange-50 p-6 sm:p-10 max-w-4xl mx-auto">
      <div className="flex items-start gap-4 mb-8">
        <div className="p-4 bg-red-100 text-red-600 rounded-2xl shadow-inner">
          <Video className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-gray-800">Sravanam Resources</h2>
          <p className="text-gray-500 font-medium mt-1 text-sm">Share lectures, videos, and study materials for your group to take notes on.</p>
        </div>
      </div>

      <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-10 bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-3xl border border-red-100 shadow-inner">
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-red-800 uppercase tracking-wide mb-2">Class Title / Topic</label>
          <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-4 border-none shadow-sm rounded-xl focus:ring-2 focus:ring-red-400 outline-none font-medium text-gray-800" placeholder="e.g. SB 1.2.6 Analysis" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-red-800 uppercase tracking-wide mb-2">Video Link / URL</label>
          <input type="url" required value={url} onChange={e => setUrl(e.target.value)} className="w-full px-4 py-4 border-none shadow-sm rounded-xl focus:ring-2 focus:ring-red-400 outline-none font-medium text-gray-800" placeholder="https://youtube.com/..." />
        </div>
        <div className="md:col-span-1 flex items-end">
          <button type="submit" className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold py-4 rounded-xl hover:from-red-700 hover:to-orange-700 transition-all shadow-md shadow-red-600/30">Publish</button>
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {classes.length === 0 && <p className="text-gray-400 text-sm col-span-2 text-center py-8">No resources shared yet.</p>}
        {classes.map(c => (
          <div key={c.id} className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col hover:shadow-xl hover:border-red-300 transition-all group">
             <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-3">
                  <PlayCircle className="text-red-500 w-6 h-6 flex-shrink-0 drop-shadow-sm"/> 
                  <span className="line-clamp-2">{c.title}</span>
                </h3>
             </div>
             <a href={c.url} target="_blank" rel="noreferrer" className="bg-gray-50 text-blue-600 font-medium hover:text-blue-800 hover:bg-blue-50 px-4 py-3 rounded-xl text-sm truncate mb-4 transition-colors border border-gray-100 hover:border-blue-200 block">
               {c.url}
             </a>
             
             <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Added: {new Date(c.createdAt).toLocaleDateString()}</span>
                <button onClick={() => deleteClass(c.id)} className="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors opacity-0 group-hover:opacity-100">Remove</button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HostSettings({ settings, profile }) {
  const [formData, setFormData] = useState(settings || {
    roundsTarget: 16, roundsPoints: 40,
    wakeEarlyTarget: '05:00', wakeEarlyPoints: 15,
    wakeMidTarget: '06:30', wakeMidPoints: 5,
    readTarget: 30, readPoints: 15,
    hearingTarget: 15, hearingPoints: 10,
    mangalaAratiPoints: 10,
    guruPujaPoints: 5,
    morningClassPoints: 5
  });
  const [status, setStatus] = useState('');

  useEffect(() => { if (settings) setFormData(settings); }, [settings]);

  const handleSave = async (e) => {
    e.preventDefault();
    setStatus('saving');
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'host_settings', profile.id);
      await setDoc(docRef, { hostId: profile.id, ...formData, updatedAt: serverTimestamp() });
      setStatus('Saved Successfully!');
      setTimeout(() => setStatus(''), 3000);
    } catch(err) {
      console.error(err);
      setStatus('Error Saving');
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-orange-900/5 border border-orange-50 p-6 sm:p-10 max-w-3xl mx-auto">
      <div className="flex items-start gap-4 mb-8">
        <div className="p-4 bg-slate-100 text-slate-600 rounded-2xl shadow-inner">
          <Settings className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-gray-800">Scoring Rules</h2>
          <p className="text-gray-500 font-medium mt-1 text-sm">Define the spiritual health score calculations for your Sangha. Total points should ideally sum to 100 per day.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 grid grid-cols-2 gap-5 shadow-sm">
          <h3 className="col-span-2 font-black text-orange-900 border-b border-orange-200 pb-2 uppercase tracking-widest text-sm">Japa Rules</h3>
          <div>
            <label className="block text-[10px] font-bold text-orange-800 uppercase tracking-widest mb-2">Target Rounds</label>
            <input type="number" value={formData.roundsTarget} onChange={e=>setFormData({...formData, roundsTarget: Number(e.target.value)})} className="w-full p-4 bg-white border border-orange-200 rounded-xl outline-none font-bold text-orange-900" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-orange-800 uppercase tracking-widest mb-2">Max Points (Rounds)</label>
            <input type="number" value={formData.roundsPoints} onChange={e=>setFormData({...formData, roundsPoints: Number(e.target.value)})} className="w-full p-4 bg-white border border-orange-200 rounded-xl outline-none font-bold text-orange-900" />
          </div>
        </div>

        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 grid grid-cols-2 gap-5 shadow-sm">
          <h3 className="col-span-2 font-black text-blue-900 border-b border-blue-200 pb-2 uppercase tracking-widest text-sm">Morning Program</h3>
          <div>
            <label className="block text-[10px] font-bold text-blue-800 uppercase tracking-widest mb-2">Early Wake Target</label>
            <input type="time" value={formData.wakeEarlyTarget} onChange={e=>setFormData({...formData, wakeEarlyTarget: e.target.value})} className="w-full p-4 bg-white border border-blue-200 rounded-xl outline-none font-bold text-blue-900" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-blue-800 uppercase tracking-widest mb-2">Early Points</label>
            <input type="number" value={formData.wakeEarlyPoints} onChange={e=>setFormData({...formData, wakeEarlyPoints: Number(e.target.value)})} className="w-full p-4 bg-white border border-blue-200 rounded-xl outline-none font-bold text-blue-900" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-blue-800 uppercase tracking-widest mb-2">Acceptable Wake Target</label>
            <input type="time" value={formData.wakeMidTarget} onChange={e=>setFormData({...formData, wakeMidTarget: e.target.value})} className="w-full p-4 bg-white border border-blue-200 rounded-xl outline-none font-bold text-blue-900" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-blue-800 uppercase tracking-widest mb-2">Acceptable Points</label>
            <input type="number" value={formData.wakeMidPoints} onChange={e=>setFormData({...formData, wakeMidPoints: Number(e.target.value)})} className="w-full p-4 bg-white border border-blue-200 rounded-xl outline-none font-bold text-blue-900" />
          </div>
          <div className="col-span-2 grid grid-cols-3 gap-4 pt-4 border-t border-blue-200/50 mt-2">
            <div>
              <label className="block text-[10px] font-bold text-blue-800 uppercase tracking-widest mb-2">Mangala Arati Pts</label>
              <input type="number" value={formData.mangalaAratiPoints} onChange={e=>setFormData({...formData, mangalaAratiPoints: Number(e.target.value)})} className="w-full p-4 bg-white border border-blue-200 rounded-xl outline-none font-bold text-blue-900" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-blue-800 uppercase tracking-widest mb-2">Guru Puja Pts</label>
              <input type="number" value={formData.guruPujaPoints} onChange={e=>setFormData({...formData, guruPujaPoints: Number(e.target.value)})} className="w-full p-4 bg-white border border-blue-200 rounded-xl outline-none font-bold text-blue-900" />
            </div>
             <div>
              <label className="block text-[10px] font-bold text-blue-800 uppercase tracking-widest mb-2">SB Class Pts</label>
              <input type="number" value={formData.morningClassPoints} onChange={e=>setFormData({...formData, morningClassPoints: Number(e.target.value)})} className="w-full p-4 bg-white border border-blue-200 rounded-xl outline-none font-bold text-blue-900" />
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-2xl border border-green-100 grid grid-cols-2 gap-5 shadow-sm">
          <h3 className="col-span-2 font-black text-green-900 border-b border-green-200 pb-2 uppercase tracking-widest text-sm">Sravanam Rules</h3>
          <div>
            <label className="block text-[10px] font-bold text-green-800 uppercase tracking-widest mb-2">Target Reading Mins</label>
            <input type="number" value={formData.readTarget} onChange={e=>setFormData({...formData, readTarget: Number(e.target.value)})} className="w-full p-4 bg-white border border-green-200 rounded-xl outline-none font-bold text-green-900" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-green-800 uppercase tracking-widest mb-2">Max Points (Reading)</label>
            <input type="number" value={formData.readPoints} onChange={e=>setFormData({...formData, readPoints: Number(e.target.value)})} className="w-full p-4 bg-white border border-green-200 rounded-xl outline-none font-bold text-green-900" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-green-800 uppercase tracking-widest mb-2">Target Personal Hearing</label>
            <input type="number" value={formData.hearingTarget} onChange={e=>setFormData({...formData, hearingTarget: Number(e.target.value)})} className="w-full p-4 bg-white border border-green-200 rounded-xl outline-none font-bold text-green-900" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-green-800 uppercase tracking-widest mb-2">Max Points (Hearing)</label>
            <input type="number" value={formData.hearingPoints} onChange={e=>setFormData({...formData, hearingPoints: Number(e.target.value)})} className="w-full p-4 bg-white border border-green-200 rounded-xl outline-none font-bold text-green-900" />
          </div>
        </div>

        <div className="flex items-center gap-4 pt-6">
          <button type="submit" className="bg-slate-800 hover:bg-slate-900 text-white px-10 py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
            Save Scoring Rules
          </button>
          {status && <span className="font-bold text-orange-600 animate-pulse bg-orange-50 px-4 py-2 rounded-xl">{status}</span>}
        </div>
      </form>
    </div>
  );
}

// ==========================================
// 3. DEVOTEE DASHBOARD
// ==========================================
function DevoteeDashboard({ profile }) {
  const [tab, setTab] = useState('daily');
  const [reports, setReports] = useState([]);
  const [classes, setClasses] = useState([]);
  const [notes, setNotes] = useState([]);
  const [messages, setMessages] = useState([]);
  const [hostSettings, setHostSettings] = useState(null);

  useEffect(() => {
    // Fetch My Reports
    const reportsRef = collection(db, 'artifacts', appId, 'public', 'data', 'reports');
    const unsubReports = onSnapshot(reportsRef, (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setReports(all.filter(r => r.devoteeId === profile.id));
    });

    if (profile.hostId) {
      const classesRef = collection(db, 'artifacts', appId, 'public', 'data', 'classes');
      const unsubClasses = onSnapshot(classesRef, (snap) => {
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setClasses(all.filter(c => c.hostId === profile.hostId));
      });
      
      const notesRef = collection(db, 'artifacts', appId, 'public', 'data', 'class_notes');
      const unsubNotes = onSnapshot(notesRef, (snap) => {
          const all = snap.docs.map(d => ({id: d.id, ...d.data()}));
          setNotes(all.filter(n => n.devoteeId === profile.id));
      });

      const settingsRef = collection(db, 'artifacts', appId, 'public', 'data', 'host_settings');
      const unsubSettings = onSnapshot(settingsRef, (snap) => {
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const mySettings = all.find(s => s.hostId === profile.hostId);
        setHostSettings(mySettings || null);
      });

      const messagesRef = collection(db, 'artifacts', appId, 'public', 'data', 'messages');
      const unsubMessages = onSnapshot(messagesRef, (snap) => {
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setMessages(all.filter(m => m.devoteeId === profile.id).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
      });

      return () => { unsubReports(); unsubClasses(); unsubNotes(); unsubSettings(); unsubMessages(); };
    }
    return () => unsubReports();
  }, [profile.id, profile.hostId]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Devotee Navigation */}
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-200 flex flex-wrap gap-2 sticky top-[72px] sm:top-[80px] z-40">
        {[
          { id: 'daily', icon: BookOpen, label: 'Log Sadhana' },
          { id: 'dashboard', icon: Trophy, label: 'My Progress' },
          { id: 'classes', icon: Video, label: 'Study Circle' },
          { id: 'profile', icon: User, label: 'My Profile' }
        ].map(t => (
          <button 
            key={t.id} 
            onClick={() => setTab(t.id)} 
            className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${tab === t.id ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md shadow-orange-500/20' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      <div className="transition-all duration-500">
        {tab === 'daily' && <DevoteeForm profile={profile} reports={reports} />}
        {tab === 'dashboard' && <DevoteeScore reports={reports} settings={hostSettings} messages={messages} />}
        {tab === 'classes' && <DevoteeClasses classes={classes} notes={notes} profile={profile} />}
        {tab === 'profile' && <DevoteeProfile profile={profile} />}
      </div>
    </div>
  );
}

function DevoteeProfile({ profile }) {
  const [formData, setFormData] = useState({
    name: profile.name || '',
    mobile: profile.mobile || '',
    address: profile.address || '',
    photoUrl: profile.photoUrl || ''
  });
  const [status, setStatus] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setStatus('saving');
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', profile.id);
      await setDoc(docRef, { ...formData, updatedAt: serverTimestamp() }, { merge: true });
      setStatus('Profile Updated!');
      setTimeout(() => setStatus(''), 3000);
    } catch(err) {
      console.error(err);
      setStatus('Error Saving');
    }
  };

  const currentPhoto = parseImageUrl(formData.photoUrl);

  return (
    <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-xl shadow-orange-900/5 border border-orange-50 max-w-2xl mx-auto animate-in zoom-in-95">
      <div className="text-center mb-10">
        <div className="mx-auto w-24 h-24 mb-4 relative">
          {currentPhoto ? (
            <img src={currentPhoto} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-orange-100 shadow-lg" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-100 to-red-100 text-orange-600 flex items-center justify-center border-4 border-white shadow-lg">
              <User className="w-10 h-10" />
            </div>
          )}
          <div className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full shadow-md border border-gray-100 text-orange-500">
             <ImageIcon className="w-4 h-4" />
          </div>
        </div>
        <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">My Profile</h2>
        <p className="text-gray-500 font-medium mt-2 text-sm">Update your information for your counselor.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Spiritual / Legal Name</label>
          <input 
            type="text" 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-bold text-gray-800" 
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1 flex items-center gap-2"><Phone className="w-3 h-3"/> Mobile Number</label>
            <input 
              type="tel" 
              value={formData.mobile} 
              onChange={e => setFormData({...formData, mobile: e.target.value})} 
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-medium text-gray-800" 
              placeholder="+91..."
            />
          </div>
           <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1 flex items-center gap-2"><MapPin className="w-3 h-3"/> City / Address</label>
            <input 
              type="text" 
              value={formData.address} 
              onChange={e => setFormData({...formData, address: e.target.value})} 
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-medium text-gray-800" 
              placeholder="Ujjain, MP"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Photo Link (Google Drive / URL)</label>
          <input 
            type="url" 
            value={formData.photoUrl} 
            onChange={e => setFormData({...formData, photoUrl: e.target.value})} 
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-medium text-blue-600 placeholder-gray-400" 
            placeholder="Paste Google Drive link here..."
          />
          <p className="text-[10px] text-gray-400 font-bold mt-2 ml-2">Ensure the Drive link is set to "Anyone with the link can view".</p>
        </div>

        <div className="pt-6">
          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-gray-800 to-gray-900 hover:from-black hover:to-gray-800 text-white font-extrabold text-lg py-4 rounded-2xl shadow-xl transition-all active:scale-[0.98] flex justify-center items-center gap-2"
          >
            Save Profile
          </button>
          {status && <p className="text-green-600 text-center font-bold mt-4 animate-bounce bg-green-50 py-2 rounded-lg">{status}</p>}
        </div>
      </form>
    </div>
  );
}

function DevoteeForm({ profile, reports }) {
  const [formData, setFormData] = useState({
    date: todayStr(),
    roundsBefore8AM: 0,
    rounds: 16,
    japaQuality: 'Attentive',
    wakeTime: '05:00',
    sleepTime: '22:00',
    mangalaArati: false,
    guruPuja: false,
    morningClass: false,
    readingMins: 30,
    bookName: '',
    personalHearingMins: 15,
    speaker: '',
    regulativePrinciples: true,
    prasadamOnly: true,
    notes: ''
  });
  const [status, setStatus] = useState('');

  const hasLoggedToday = reports.some(r => r.date === formData.date);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'reports'), {
        devoteeId: profile.id,
        hostId: profile.hostId,
        timestamp: serverTimestamp(),
        ...formData
      });
      setStatus('success');
      setTimeout(() => setStatus(''), 3000);
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-xl shadow-orange-900/5 border border-orange-50 max-w-3xl mx-auto animate-in slide-in-from-bottom-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">Daily Offering</h2>
        <p className="text-gray-500 font-medium mt-2">Record your sadhana details below.</p>
      </div>
      
      {hasLoggedToday ? (
        <div className="bg-gradient-to-b from-green-50 to-white text-green-900 p-10 rounded-3xl border border-green-200 shadow-inner flex flex-col items-center text-center animate-in zoom-in-95">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-sm border-4 border-white">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h3 className="text-3xl font-black tracking-tight mb-3">Haribol!</h3>
          <p className="font-medium text-green-700/80 text-lg">Your offering for <strong className="text-green-800 bg-green-100 px-2 py-0.5 rounded">{formData.date}</strong> has been received by your counselor.</p>
          <button 
            onClick={() => setFormData({...formData, date: ''})} 
            className="mt-8 px-8 py-3 bg-white text-green-700 font-bold rounded-xl shadow-sm border border-green-100 hover:bg-green-50 transition-colors"
          >
            Log a different date
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 shadow-sm">
             <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 ml-1">Reporting Date</label>
             <input 
               type="date" 
               required 
               value={formData.date} 
               onChange={e => setFormData({...formData, date: e.target.value})} 
               className="w-full sm:w-1/2 p-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-bold text-gray-800 shadow-sm" 
               max={todayStr()} 
             />
          </div>

          {/* Japa Section */}
          <div className="bg-orange-50 p-6 sm:p-8 rounded-3xl border border-orange-100 space-y-6 shadow-sm">
            <h3 className="text-xl font-black text-orange-900 border-b border-orange-200 pb-3 flex items-center gap-2"><Flame className="w-6 h-6 text-orange-600"/> Chanting (Japa)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
               <div>
                <label className="block text-[10px] font-bold text-orange-800 uppercase tracking-widest mb-2 ml-1">Total Rounds</label>
                <input type="number" required value={formData.rounds} onChange={e => setFormData({...formData, rounds: Number(e.target.value)})} className="w-full p-4 bg-white border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-black text-xl text-orange-700 shadow-sm" min="0" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-orange-800 uppercase tracking-widest mb-2 ml-1">Before 8 AM</label>
                <input type="number" required value={formData.roundsBefore8AM} onChange={e => setFormData({...formData, roundsBefore8AM: Number(e.target.value)})} className="w-full p-4 bg-white border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-black text-xl text-orange-700 shadow-sm" min="0" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-orange-800 uppercase tracking-widest mb-2 ml-1">Japa Quality</label>
                <select value={formData.japaQuality} onChange={e => setFormData({...formData, japaQuality: e.target.value})} className="w-full p-4 bg-white border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-bold text-gray-800 shadow-sm">
                  <option value="Attentive">Attentive</option>
                  <option value="Distracted">Distracted</option>
                  <option value="Sleepy">Sleepy</option>
                </select>
              </div>
            </div>
          </div>

          {/* Morning Program */}
          <div className="bg-blue-50 p-6 sm:p-8 rounded-3xl border border-blue-100 space-y-6 shadow-sm">
            <h3 className="text-xl font-black text-blue-900 border-b border-blue-200 pb-3 flex items-center gap-2"><Sunrise className="w-6 h-6 text-blue-600"/> Morning Routine & Sleep</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold text-blue-800 uppercase tracking-widest mb-2 ml-1">Wake Up Time</label>
                <input type="time" required value={formData.wakeTime} onChange={e => setFormData({...formData, wakeTime: e.target.value})} className="w-full p-4 bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-800 shadow-sm" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-blue-800 uppercase tracking-widest mb-2 ml-1">Sleep Time (Prev Night)</label>
                <input type="time" required value={formData.sleepTime} onChange={e => setFormData({...formData, sleepTime: e.target.value})} className="w-full p-4 bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-800 shadow-sm" />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <label className="flex items-center gap-3 cursor-pointer text-blue-900 font-bold bg-white px-5 py-4 rounded-xl border border-blue-200 shadow-sm flex-1 hover:bg-blue-100 transition-colors">
                <input type="checkbox" checked={formData.mangalaArati} onChange={e => setFormData({...formData, mangalaArati: e.target.checked})} className="w-6 h-6 rounded text-blue-600 focus:ring-blue-500" />
                Mangala Arati
              </label>
              <label className="flex items-center gap-3 cursor-pointer text-blue-900 font-bold bg-white px-5 py-4 rounded-xl border border-blue-200 shadow-sm flex-1 hover:bg-blue-100 transition-colors">
                <input type="checkbox" checked={formData.guruPuja} onChange={e => setFormData({...formData, guruPuja: e.target.checked})} className="w-6 h-6 rounded text-blue-600 focus:ring-blue-500" />
                Guru / Tulasi Puja
              </label>
              <label className="flex items-center gap-3 cursor-pointer text-blue-900 font-bold bg-white px-5 py-4 rounded-xl border border-blue-200 shadow-sm flex-1 hover:bg-blue-100 transition-colors">
                <input type="checkbox" checked={formData.morningClass} onChange={e => setFormData({...formData, morningClass: e.target.checked})} className="w-6 h-6 rounded text-blue-600 focus:ring-blue-500" />
                SB Class
              </label>
            </div>
          </div>

          {/* Sravanam */}
          <div className="bg-green-50 p-6 sm:p-8 rounded-3xl border border-green-100 space-y-6 shadow-sm">
            <h3 className="text-xl font-black text-green-900 border-b border-green-200 pb-3 flex items-center gap-2"><BookOpen className="w-6 h-6 text-green-600"/> Sravanam Kirtanam</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
               <div>
                <label className="block text-[10px] font-bold text-green-800 uppercase tracking-widest mb-2 ml-1">Reading (Mins)</label>
                <input type="number" required value={formData.readingMins} onChange={e => setFormData({...formData, readingMins: Number(e.target.value)})} className="w-full p-4 bg-white border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-bold text-gray-800 shadow-sm" min="0" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-green-800 uppercase tracking-widest mb-2 ml-1">Book Name</label>
                <input type="text" value={formData.bookName} onChange={e => setFormData({...formData, bookName: e.target.value})} className="w-full p-4 bg-white border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-bold text-gray-800 shadow-sm" placeholder="e.g. Bhagavad Gita" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-green-800 uppercase tracking-widest mb-2 ml-1">Personal Hearing (Mins)</label>
                <input type="number" required value={formData.personalHearingMins} onChange={e => setFormData({...formData, personalHearingMins: Number(e.target.value)})} className="w-full p-4 bg-white border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-bold text-gray-800 shadow-sm" min="0" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-green-800 uppercase tracking-widest mb-2 ml-1">Speaker / Topic</label>
                <input type="text" value={formData.speaker} onChange={e => setFormData({...formData, speaker: e.target.value})} className="w-full p-4 bg-white border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-bold text-gray-800 shadow-sm" placeholder="e.g. Srila Prabhupada" />
              </div>
            </div>
          </div>

          {/* Principles */}
          <div className="bg-purple-50 p-6 sm:p-8 rounded-3xl border border-purple-100 shadow-sm">
            <h3 className="text-xl font-black text-purple-900 border-b border-purple-200 pb-3 mb-6 flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-purple-600"/> Regulative Principles</h3>
            <div className="flex flex-col gap-4">
              <label className="flex items-center gap-4 cursor-pointer text-purple-900 font-extrabold bg-white p-5 rounded-2xl shadow-sm border border-purple-100 hover:bg-purple-100 transition-colors">
                <input type="checkbox" checked={formData.regulativePrinciples} onChange={e => setFormData({...formData, regulativePrinciples: e.target.checked})} className="w-7 h-7 rounded text-purple-600 focus:ring-purple-500" />
                Strictly Following 4 Regulative Principles
              </label>
              <label className="flex items-center gap-4 cursor-pointer text-purple-900 font-extrabold bg-white p-5 rounded-2xl shadow-sm border border-purple-100 hover:bg-purple-100 transition-colors">
                <input type="checkbox" checked={formData.prasadamOnly} onChange={e => setFormData({...formData, prasadamOnly: e.target.checked})} className="w-7 h-7 rounded text-purple-600 focus:ring-purple-500" />
                Honoring Krishna Prasadam Only
              </label>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 ml-2">Reflections / Services Log</label>
            <textarea 
              value={formData.notes} 
              onChange={e => setFormData({...formData, notes: e.target.value})} 
              rows="4" 
              className="w-full p-5 bg-gray-50 border border-gray-200 rounded-3xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none resize-none font-medium text-gray-700 shadow-inner placeholder-gray-400" 
              placeholder="Record services rendered, realizations, or questions for your counselor..."
            ></textarea>
          </div>

          <div className="pt-6">
            <button 
              type="submit" 
              disabled={status === 'submitting'} 
              className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-extrabold text-xl py-5 rounded-2xl shadow-xl shadow-orange-500/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 flex justify-center items-center gap-3"
            >
              {status === 'submitting' ? 'Offering...' : 'Submit Sadhana'} <Send className="w-6 h-6"/>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function DevoteeScore({ reports, settings, messages }) {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const daysInMonth = getDaysInMonth(currentYear, currentMonth + 1);
  
  const thisMonthReports = reports.filter(r => {
    const d = new Date(r.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const rules = settings || {
    roundsTarget: 16, roundsPoints: 40, 
    wakeEarlyTarget: '05:00', wakeEarlyPoints: 15, 
    wakeMidTarget: '06:30', wakeMidPoints: 5,
    readTarget: 30, readPoints: 15,
    hearingTarget: 15, hearingPoints: 10,
    mangalaAratiPoints: 10,
    guruPujaPoints: 5,
    morningClassPoints: 5
  };

  const maxDailyScore = rules.roundsPoints + rules.wakeEarlyPoints + rules.readPoints + rules.hearingPoints + rules.mangalaAratiPoints + rules.guruPujaPoints + rules.morningClassPoints;
  const totalPossible = daysInMonth * maxDailyScore;
  const currentScore = thisMonthReports.reduce((acc, curr) => acc + calculateDailyScore(curr, rules), 0);
  const percentage = totalPossible > 0 ? Math.round((currentScore / totalPossible) * 100) : 0;

  // Transcendental Feedback Logic
  let feedback = { title: "", message: "", color: "" };
  if (percentage >= 90) {
    feedback = { title: "Outstanding Sadhana!", message: "You are a great inspiration to the Sangha. Keep chanting with deep love and devotion.", color: "text-green-600 bg-green-50 border-green-200" };
  } else if (percentage >= 70) {
    feedback = { title: "Very Good Effort!", message: "You are progressing beautifully. Try to maintain consistency in your morning program.", color: "text-blue-600 bg-blue-50 border-blue-200" };
  } else if (percentage >= 40) {
    feedback = { title: "Steady Practice", message: "Pray to Sri Guru and Gauranga for more taste in the holy name. You can do this!", color: "text-yellow-600 bg-yellow-50 border-yellow-200" };
  } else if (thisMonthReports.length > 0) {
    feedback = { title: "Need Spiritual Strength", message: "Please reach out to your counselor. Krishna is always waiting for you. Every single round counts.", color: "text-red-600 bg-red-50 border-red-200" };
  } else {
    feedback = { title: "Start Your Journey", message: "Begin logging your daily offering to track your spiritual growth.", color: "text-gray-600 bg-gray-50 border-gray-200" };
  }

  return (
    <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-xl shadow-orange-900/5 border border-orange-50 max-w-5xl mx-auto animate-in zoom-in-95">
      <h2 className="text-2xl sm:text-3xl font-extrabold mb-8 flex items-center gap-3 text-gray-800 tracking-tight">
        <div className="p-3 bg-gradient-to-br from-yellow-100 to-orange-100 text-yellow-600 rounded-2xl shadow-sm"><Trophy className="w-8 h-8" /></div>
        Monthly Spiritual Health
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 flex flex-col items-center justify-center p-8 bg-gradient-to-b from-orange-50 to-white rounded-[2rem] border border-orange-100 shadow-inner relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none"><Sparkles className="w-32 h-32" /></div>
          
          <div className="relative w-48 h-48 flex items-center justify-center rounded-full border-[14px] border-orange-50 mb-6 shadow-sm">
             <svg className="absolute top-[-14px] left-[-14px] w-[calc(100%+28px)] h-[calc(100%+28px)] transform -rotate-90">
                <circle 
                  cx="50%" cy="50%" r="calc(50% - 7px)" 
                  fill="transparent" 
                  stroke="url(#scoreGradient)" 
                  strokeWidth="14" 
                  strokeLinecap="round"
                  strokeDasharray="500" 
                  strokeDashoffset={500 - (500 * percentage) / 100} 
                  className="transition-all duration-1000 ease-out" 
                />
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>
             </svg>
             <div className="text-center flex flex-col items-center z-10 bg-white w-32 h-32 rounded-full justify-center shadow-sm">
                <span className="text-5xl font-black text-gray-800 tracking-tighter">{percentage}%</span>
                <span className="text-[10px] uppercase font-extrabold text-orange-500 tracking-widest mt-1">Health Score</span>
             </div>
          </div>
          <p className="text-sm font-black text-gray-500 mt-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">{currentScore} / {totalPossible} pts</p>
        </div>

        <div className="lg:col-span-2 space-y-6">
          
          {/* Transcendental Feedback Card */}
          <div className={`p-6 rounded-3xl border shadow-sm ${feedback.color} transition-all`}>
            <h3 className="font-extrabold text-lg mb-1">{feedback.title}</h3>
            <p className="font-medium text-sm leading-relaxed opacity-90">{feedback.message}</p>
          </div>

          {messages && messages.length > 0 && (
            <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 shadow-sm">
              <span className="text-indigo-800 text-[10px] font-black uppercase tracking-widest block mb-4 flex items-center gap-2"><MessageCircle className="w-4 h-4"/> Messages from Counselor</span>
              <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                {messages.map(msg => (
                  <div key={msg.id} className="bg-white p-4 rounded-2xl shadow-sm border border-indigo-50">
                    <p className="text-sm font-medium text-gray-800 mb-2 whitespace-pre-wrap">{msg.message}</p>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{msg.createdAt ? new Date(msg.createdAt.toDate ? msg.createdAt.toDate() : msg.createdAt).toLocaleDateString() : 'Recent'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-5">
            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex flex-col shadow-sm">
              <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Consistency</span>
              <div className="mt-auto flex items-end gap-2">
                <span className="text-5xl font-black text-gray-800 leading-none">{thisMonthReports.length}</span>
                <span className="text-sm font-bold text-gray-400 pb-1">/ {daysInMonth} days</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-3xl border border-orange-100 flex flex-col shadow-sm">
              <span className="text-orange-800/60 text-[10px] font-black uppercase tracking-widest mb-2">Avg Rounds</span>
              <div className="mt-auto flex items-end gap-2">
                <span className="text-5xl font-black text-orange-600 leading-none drop-shadow-sm">
                  {thisMonthReports.length ? Math.round(thisMonthReports.reduce((acc, curr) => acc + curr.rounds, 0) / thisMonthReports.length) : 0}
                </span>
                <span className="text-sm font-bold text-orange-400 pb-1">/ {rules.roundsTarget}</span>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 shadow-sm">
            <span className="text-indigo-800 text-[10px] font-black uppercase tracking-widest block mb-4 flex items-center gap-2"><ShieldCheck className="w-4 h-4"/> Active Scoring Key</span>
            <div className="flex flex-wrap gap-2 text-[10px] font-extrabold tracking-wider">
              <span className="bg-white text-indigo-700 px-3 py-2 rounded-xl shadow-sm border border-indigo-100/50">Target {rules.roundsTarget} Rounds = {rules.roundsPoints}pt</span>
              <span className="bg-white text-indigo-700 px-3 py-2 rounded-xl shadow-sm border border-indigo-100/50">Wake &le; {rules.wakeEarlyTarget} = {rules.wakeEarlyPoints}pt</span>
              <span className="bg-white text-indigo-700 px-3 py-2 rounded-xl shadow-sm border border-indigo-100/50">Wake &le; {rules.wakeMidTarget} = {rules.wakeMidPoints}pt</span>
              <span className="bg-white text-indigo-700 px-3 py-2 rounded-xl shadow-sm border border-indigo-100/50">Mangala Arati = {rules.mangalaAratiPoints}pt</span>
              <span className="bg-white text-indigo-700 px-3 py-2 rounded-xl shadow-sm border border-indigo-100/50">Guru Puja = {rules.guruPujaPoints}pt</span>
              <span className="bg-white text-indigo-700 px-3 py-2 rounded-xl shadow-sm border border-indigo-100/50">SB Class = {rules.morningClassPoints}pt</span>
              <span className="bg-white text-indigo-700 px-3 py-2 rounded-xl shadow-sm border border-indigo-100/50">Read &ge; {rules.readTarget}m = {rules.readPoints}pt</span>
              <span className="bg-white text-indigo-700 px-3 py-2 rounded-xl shadow-sm border border-indigo-100/50">Hear &ge; {rules.hearingTarget}m = {rules.hearingPoints}pt</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DevoteeClasses({ classes, notes, profile }) {
  const [activeClass, setActiveClass] = useState(null);
  const [noteText, setNoteText] = useState('');

  const handleSaveNote = async () => {
    if (!noteText.trim()) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'class_notes'), {
        devoteeId: profile.id,
        classId: activeClass.id,
        notes: noteText,
        createdAt: serverTimestamp()
      });
      setNoteText('');
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 space-y-4">
        <h2 className="text-2xl font-extrabold text-gray-800 flex items-center gap-3 mb-6">
          <div className="p-3 bg-red-100 text-red-600 rounded-2xl shadow-sm"><Video className="w-6 h-6" /></div>
          Study Circle
        </h2>
        <div className="space-y-4">
          {classes.length === 0 && (
            <div className="bg-gray-50 p-8 rounded-3xl border border-dashed border-gray-200 text-center shadow-sm">
              <p className="text-gray-400 text-sm font-bold">No classes assigned by counselor.</p>
            </div>
          )}
          {classes.map(c => (
            <button 
              key={c.id} 
              onClick={() => setActiveClass(c)} 
              className={`w-full text-left p-5 rounded-3xl transition-all shadow-sm ${activeClass?.id === c.id ? 'bg-gradient-to-r from-red-50 to-orange-50 border-orange-300 ring-4 ring-orange-500/10 scale-[1.02]' : 'bg-white border-gray-100 hover:border-orange-200 hover:shadow-md'}`}
            >
              <h3 className={`font-bold line-clamp-2 text-lg leading-tight ${activeClass?.id === c.id ? 'text-orange-900' : 'text-gray-800'}`}>{c.title}</h3>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mt-3">Shared {new Date(c.createdAt).toLocaleDateString()}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="lg:col-span-2">
        {activeClass ? (
          <div className="bg-white rounded-3xl shadow-xl shadow-orange-900/5 border border-orange-50 p-6 sm:p-10 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-3xl font-black text-gray-800 mb-8">{activeClass.title}</h2>
            
            <a href={activeClass.url} target="_blank" rel="noreferrer" className="group block mb-10">
              <div className="bg-gray-50 p-5 rounded-3xl border border-gray-200 flex items-center justify-between group-hover:bg-red-50 group-hover:border-red-200 transition-colors shadow-sm">
                 <div className="flex items-center gap-4 text-red-600 font-black text-lg">
                   <PlayCircle className="w-10 h-10 group-hover:scale-110 transition-transform" /> 
                   <span>Watch Full Lecture</span>
                 </div>
                 <span className="text-gray-400 text-xs truncate max-w-[200px] hidden sm:block font-medium bg-white px-3 py-1 rounded-lg border">{activeClass.url}</span>
              </div>
            </a>

            <div className="border-t border-gray-100 pt-8">
              <h3 className="text-xl font-extrabold text-gray-800 mb-6 flex items-center gap-3"><FileText className="w-6 h-6 text-orange-500" /> My Realizations</h3>
              
              <div className="space-y-4 mb-8">
                {notes.filter(n => n.classId === activeClass.id).length === 0 && (
                  <p className="text-sm text-gray-400 italic bg-gray-50 p-4 rounded-xl">No notes added yet.</p>
                )}
                {notes.filter(n => n.classId === activeClass.id).map(n => (
                  <div key={n.id} className="bg-amber-50/50 p-6 rounded-3xl border border-amber-100 text-gray-800 whitespace-pre-wrap text-sm font-medium leading-relaxed shadow-sm relative overflow-hidden">
                    <div className="absolute top-2 left-3 text-amber-200 text-6xl font-serif leading-none select-none opacity-50">"</div>
                    <div className="relative z-10 pl-6">{n.notes}</div>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 p-2 rounded-3xl border border-gray-200 focus-within:ring-2 focus-within:ring-orange-500/50 transition-all shadow-sm">
                <textarea 
                  value={noteText} 
                  onChange={e => setNoteText(e.target.value)} 
                  rows="4" 
                  className="w-full p-4 bg-transparent border-none outline-none resize-none font-medium text-gray-700 placeholder-gray-400" 
                  placeholder="Type your notes or key takeaways here..."
                ></textarea>
                <div className="flex justify-end p-2 border-t border-gray-200/50">
                  <button 
                    onClick={handleSaveNote} 
                    disabled={!noteText.trim()}
                    className="bg-gray-800 hover:bg-gray-900 text-white px-8 py-3 rounded-2xl font-bold transition-all disabled:opacity-50 disabled:active:scale-100 active:scale-95 shadow-lg shadow-gray-800/20"
                  >
                    Save Note
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
           <div className="bg-white/50 backdrop-blur-sm border-2 border-dashed border-gray-200 rounded-[2rem] p-8 text-center flex flex-col items-center justify-center h-full min-h-[500px]">
             <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <Video className="w-10 h-10 text-red-300" />
             </div>
             <h3 className="text-xl font-bold text-gray-600">Select a Class</h3>
             <p className="text-sm text-gray-400 mt-2 max-w-[250px] leading-relaxed">Choose a topic from the list to view resources and add notes.</p>
          </div>
        )}
      </div>
    </div>
  );
}
import { useEffect, useState } from 'react';
import {
  CalendarDays,
  Home as HomeIcon,
  Info,
  LockKeyhole,
  Newspaper,
  Send,
  Users,
  X,
  Inbox,
  Menu
} from 'lucide-react';

import Home from './components/Home';
import About from './components/About';
import Classes from './components/Classes';
import Teachers from './components/Teachers';
import News from './components/News';
import Apply from './components/Apply';
import Staff from './components/Staff';

import {
  ASSETS,
  SEED_NEWS,
  STAFF_PIN
} from './data/schoolData';

const nav = [
  ['home', 'Home', HomeIcon],
  ['about', 'About', Info],
  ['classes', 'Classes', CalendarDays],
  ['teachers', 'Teachers', Users],
  ['news', 'News', Newspaper],
  ['apply', 'Apply', Send]
];

const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};

export default function App() {
  const [tab, setTab] = useState('home');
  const [grade, setGrade] = useState('Grade 1');
  const [staff, setStaff] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [news, setNews] = useState(() =>
    read('ktn_news', SEED_NEWS)
  );

  const [apps, setApps] = useState(() =>
    read('ktn_apps', [])
  );

  useEffect(() => {
    localStorage.setItem(
      'ktn_news',
      JSON.stringify(news)
    );
  }, [news]);

  useEffect(() => {
    localStorage.setItem(
      'ktn_apps',
      JSON.stringify(apps)
    );
  }, [apps]);

  const go = target => {
    setTab(target);
    setMobileMenuOpen(false);

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const login = () => {
    if (pin === STAFF_PIN) {
      setStaff(true);
      setPinOpen(false);
      setPinError(false);
      setPin('');
      setTab('staff');
    } else {
      setPinError(true);
    }
  };

  let view;

  if (tab === 'home') {
    view = (
      <Home
        onNavigate={go}
        onOpenImage={setLightbox}
      />
    );
  } else if (tab === 'about') {
    view = <About />;
  } else if (tab === 'classes') {
    view = (
      <Classes
        grade={grade}
        setGrade={setGrade}
      />
    );
  } else if (tab === 'teachers') {
    view = <Teachers />;
  } else if (tab === 'news') {
    view = (
      <News
        news={news}
        setNews={setNews}
        staff={staff}
      />
    );
  } else if (tab === 'apply') {
    view = (
      <Apply
        onSubmit={application =>
          setApps(current => [
            application,
            ...current
          ])
        }
      />
    );
  } else {
    view = staff ? (
      <Staff
        apps={apps}
        onLogout={() => {
          setStaff(false);
          setTab('home');
        }}
        onClear={() => setApps([])}
      />
    ) : (
      <Home
        onNavigate={go}
        onOpenImage={setLightbox}
      />
    );
  }

  return (
    <div className="appShell">

      {/* HEADER */}
      <header className="topbar">

        <button
          className="brand brandButton"
          onClick={() => go('home')}
          aria-label="Go to homepage"
        >
          <img
            src={ASSETS.logo}
            alt="KTN Digital School"
          />

          <div>
            <strong>KTN Digital</strong>
            <small>
              ONLINE SCHOOL · Since 2019
            </small>
          </div>
        </button>

        {/* DESKTOP NAVIGATION */}
        <nav className="desktopNav">
          {nav.map(([id, label, Icon]) => (
            <button
              key={id}
              className={tab === id ? 'active' : ''}
              onClick={() => go(id)}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* HEADER ACTIONS */}
        <div className="headerActions">

          {staff ? (
            <button
              className="ghost staffCount"
              onClick={() => go('staff')}
            >
              <Inbox size={16} />
              <span>{apps.length}</span>
            </button>
          ) : (
            <button
              className="iconBtn"
              aria-label="Staff login"
              onClick={() => {
                setPinOpen(true);
                setPinError(false);
              }}
            >
              <LockKeyhole size={17} />
            </button>
          )}

          <button
            className="mobileMenuBtn"
            aria-label="Open navigation"
            onClick={() =>
              setMobileMenuOpen(current => !current)
            }
          >
            {mobileMenuOpen
              ? <X size={20} />
              : <Menu size={20} />
            }
          </button>

        </div>
      </header>

      {/* TABLET MENU */}
      {mobileMenuOpen && (
        <div className="mobileMenu">
          {nav.map(([id, label, Icon]) => (
            <button
              key={id}
              className={tab === id ? 'active' : ''}
              onClick={() => go(id)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      )}

      {/* PAGE */}
      <main className="content">
        {view}
      </main>

      {/* MOBILE BOTTOM NAV */}
      <nav className="bottomNav">
        {nav.map(([id, label, Icon]) => (
          <button
            key={id}
            className={tab === id ? 'active' : ''}
            onClick={() => go(id)}
          >
            <span>
              <Icon size={19} />
            </span>

            <small>{label}</small>
          </button>
        ))}
      </nav>

      {/* STAFF LOGIN */}
      {pinOpen && (
        <div
          className="modalBackdrop"
          onMouseDown={event =>
            event.target === event.currentTarget &&
            setPinOpen(false)
          }
        >
          <div className="modal">

            <div className="modalTitle">
              <div>
                <LockKeyhole size={18} />
                <strong>Staff sign in</strong>
              </div>

              <button
                className="iconBtn"
                onClick={() => setPinOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <input
              autoFocus
              type="password"
              value={pin}
              onChange={event => {
                setPin(event.target.value);
                setPinError(false);
              }}
              onKeyDown={event => {
                if (event.key === 'Enter') {
                  login();
                }
              }}
              placeholder="Enter PIN"
              className="pinInput"
            />

            {pinError && (
              <div className="error">
                Incorrect PIN. Demo PIN is 1234.
              </div>
            )}

            <button
              className="primary full"
              onClick={login}
            >
              Sign in
            </button>

            <small className="demoPin">
              Teachers only · demo PIN: 1234
            </small>

          </div>
        </div>
      )}

      {/* IMAGE LIGHTBOX */}
      {lightbox !== null && (
        <div
          className="lightbox"
          onClick={() => setLightbox(null)}
        >
          <button
            aria-label="Close image"
          >
            <X />
          </button>

          <img
            src={ASSETS.gallery[lightbox].src}
            alt={ASSETS.gallery[lightbox].cap}
          />

          <span>
            {ASSETS.gallery[lightbox].cap}
          </span>
        </div>
      )}

    </div>
  );
}
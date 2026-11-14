// The app shell: sidebar on the left, top bar, and the current page in <Outlet />.
import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import Sidebar from './components/Sidebar.jsx';
import Topbar from './components/Topbar.jsx';
import { CoursesProvider } from './context/CoursesContext.jsx';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const mainRef = useRef(null);

  // On every page change: close the mobile menu and scroll back to the top.
  useEffect(() => {
    setSidebarOpen(false);
    mainRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <CoursesProvider>
      <div className="flex h-dvh overflow-hidden">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onMenu={() => setSidebarOpen(true)} />
          <main ref={mainRef} className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </CoursesProvider>
  );
}

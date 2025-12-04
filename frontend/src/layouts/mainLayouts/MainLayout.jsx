import Header from './Header.jsx';
import Footer from './Footer.jsx';
import './Layout.css';

export default function MainLayout({ children }) {
  return (
    <div className="app-shell">
      <Header />
      <main className="app-main">{children}</main>
      <Footer />
    </div>
  );
}



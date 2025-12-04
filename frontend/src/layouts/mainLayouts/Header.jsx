import { Link, useLocation } from 'react-router-dom';
import './Header.css';
import logo from '../../assets/logo.png';


export default function Header() {
  const location = useLocation();

  const navItems = [
    { name: 'Nhập dữ liệu', path: '/' },
    { name: 'Lý thuyết cơ bản', path: '/ly-thuyet' },
    { name: 'Hướng dẫn sử dụng', path: '/huong-dan-su-dung' },
  ];

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <a href="/">
            <img src={logo} alt="Logo" />
          </a>
        </div>
        <nav className="navigation">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}



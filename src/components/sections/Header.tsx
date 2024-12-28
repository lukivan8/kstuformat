interface HeaderProps {
  title: string;
  subtitle: string;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle }) => (
  <div className="text-center space-y-2">
    <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
    <p className="text-gray-600">{subtitle}</p>
  </div>
);

export default Header;

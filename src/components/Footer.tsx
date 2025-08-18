import Link from 'next/link';
import { FiInstagram, FiYoutube, FiFacebook } from 'react-icons/fi';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-neutral-50 mt-auto">
      <div className="container-custom py-4">
        <div className="text-center text-neutral-600">
          <p>&copy; {currentYear} Aleš Kalina. Všechna práva vyhrazena.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

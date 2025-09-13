'use client';

import { useState } from 'react';
import { FiMail, FiUser } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';

interface LoginFormProps {
  courseId?: string;
  slug?: string;
  price?: string;
  action?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ courseId, slug, price, action }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [magicLinkUrl, setMagicLinkUrl] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { login, loading, error } = useAuth();

  // Funkce pro přidání parametrů do magic linku
  const getMagicLinkWithParams = (url: string) => {
    const urlObj = new URL(url);
    if (courseId) urlObj.searchParams.set('courseId', courseId);
    if (slug) urlObj.searchParams.set('slug', slug);
    if (price) urlObj.searchParams.set('price', price);
    if (action) urlObj.searchParams.set('action', action);
    return urlObj.toString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    
    // Viditelná validace s chybovými hláškami
    if (!email || !email.includes('@') || !email.includes('.')) {
      setValidationError('Zadejte prosím platnou e-mailovou adresu');
      return;
    }
    
    if (!name || name.trim().length < 2) {
      setValidationError('Zadejte prosím vaše jméno (alespoň 2 znaky)');
      return;
    }
    
    try {
      const result = await login(email, name.trim());
      
      if (result.success) {
        setIsSubmitted(true);
        // Pouze pro testovací účely - v produkci by toto nemělo být potřeba
        if (result.url) {
          setMagicLinkUrl(result.url);
        }
      }
    } catch (err) {
      console.error('Chyba při přihlašování:', err);
      setValidationError('Došlo k chybě při odesílání. Zkuste to prosím znovu.');
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiMail className="text-green-600 text-2xl" />
        </div>
        <h3 className="text-xl font-medium mb-2">E-mail odeslán!</h3>
        <p className="text-neutral-600">
          Přihlašovací odkaz byl odeslán na adresu <strong>{email}</strong>. 
          Zkontrolujte svou e-mailovou schránku a klikněte na odkaz pro přihlášení.
        </p>
        <p className="text-sm text-neutral-500 mt-4">
          Odkaz je platný 24 hodin. Pokud e-mail nevidíte, zkontrolujte složku spam.
        </p>
        
        {/* Pouze pro testování - v produkci by toto nemělo být zobrazeno */}
        {magicLinkUrl && (
          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-700 mb-2 font-medium">Testovací odkaz (pouze pro vývojové účely):</p>
            <a 
              href={getMagicLinkWithParams(magicLinkUrl)} 
              className="text-blue-600 underline text-sm break-all"
              target="_blank"
              rel="noopener noreferrer"
            >
              {getMagicLinkWithParams(magicLinkUrl)}
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {(error || validationError) && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
          {validationError || error}
        </div>
      )}
      
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">
          Jméno
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiUser className="text-neutral-500" />
          </div>
          <input
            type="text"
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            placeholder="Vaše jméno"
            required
            disabled={loading}
            minLength={2}
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
          E-mailová adresa
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiMail className="text-neutral-500" />
          </div>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            placeholder="vas@email.cz"
            required
            disabled={loading}
          />
        </div>
      </div>
      
      <div>
        <button
          type="submit"
          className="w-full btn-primary flex justify-center items-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:scale-100"
          disabled={loading}
        >
          {loading && (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          )}
          {loading ? 'Odesílání...' : 'Přihlásit se'}
        </button>
      </div>
      
      {courseId && (
        <p className="text-sm text-neutral-500 text-center">
          Po přihlášení budete přesměrováni na stránku kurzu.
        </p>
      )}
    </form>
  );
};

export default LoginForm;

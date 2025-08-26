'use client';

import MainLayout from '@/app/MainLayout';
import { FiMail, FiInstagram, FiYoutube, FiFacebook, FiLinkedin, FiLoader } from 'react-icons/fi';
import { FaXTwitter, FaTiktok } from 'react-icons/fa6';
import { useState, useEffect } from 'react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    honeypot: '', // Honeypot pole pro roboty
    mathAnswer: '' // Odpověď na matematickou otázku
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [errors, setErrors] = useState<string[]>([]);
  const [formStartTime] = useState<number>(Date.now()); // Čas načtení formuláře
  const [mathChallenge, setMathChallenge] = useState<{
    num1: number;
    num2: number;
    operation: '+' | '-' | '×';
    question: string;
    answer: number;
  }>({ num1: 0, num2: 0, operation: '+', question: '', answer: 0 });

  // Generování matematické otázky
  const generateMathChallenge = () => {
    const operations: ('+' | '-' | '×')[] = ['+', '-', '×'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    
    let num1: number, num2: number, answer: number;
    
    switch (operation) {
      case '+':
        num1 = Math.floor(Math.random() * 50) + 1; // 1-50
        num2 = Math.floor(Math.random() * 50) + 1; // 1-50
        answer = num1 + num2;
        break;
      case '-':
        num1 = Math.floor(Math.random() * 50) + 20; // 20-69 (aby výsledek byl kladný)
        num2 = Math.floor(Math.random() * (num1 - 1)) + 1; // 1 až num1-1
        answer = num1 - num2;
        break;
      case '×':
        num1 = Math.floor(Math.random() * 12) + 1; // 1-12
        num2 = Math.floor(Math.random() * 10) + 1; // 1-10
        answer = num1 * num2;
        break;
      default:
        num1 = 1;
        num2 = 1;
        answer = 2;
    }
    
    const question = `${num1} ${operation} ${num2}`;
    
    setMathChallenge({ num1, num2, operation, question, answer });
  };

  // Generování otázky při načtení komponenty
  useEffect(() => {
    generateMathChallenge();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Vymazat chyby při psaní
    if (errors.length > 0) {
      setErrors([]);
      setSubmitStatus({ type: null, message: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors([]);
    setSubmitStatus({ type: null, message: '' });

    // Anti-spam kontroly na frontendu
    const timeDiff = Date.now() - formStartTime;
    
    // 1. Honeypot kontrola
    if (formData.honeypot) {
      console.log('🚫 Spam detected: Honeypot field filled');
      setSubmitStatus({
        type: 'error',
        message: 'Chyba při odesílání. Zkuste to prosím později.'
      });
      setIsSubmitting(false);
      return;
    }

    // 2. Minimální čas kontrola (3 sekundy)
    if (timeDiff < 3000) {
      console.log('🚫 Spam detected: Form submitted too quickly');
      setSubmitStatus({
        type: 'error',
        message: 'Formulář byl odeslán příliš rychle. Počkejte chvilku a zkuste to znovu.'
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          formStartTime, // Pošleme i čas pro backend kontrolu
          mathNum1: mathChallenge.num1,
          mathNum2: mathChallenge.num2,
          mathOperation: mathChallenge.operation,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSubmitStatus({
          type: 'success',
          message: result.message
        });
        // Vymazat formulář po úspěšném odeslání
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
          honeypot: '',
          mathAnswer: ''
        });
        // Generovat novou matematickou otázku
        generateMathChallenge();
      } else {
        setSubmitStatus({
          type: 'error',
          message: result.message
        });
        if (result.errors) {
          setErrors(result.errors);
        }
      }
    } catch (error) {
      console.error('Chyba při odesílání formuláře:', error);
      setSubmitStatus({
        type: 'error',
        message: 'Došlo k neočekávané chybě. Zkuste to prosím později.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      {/* Header */}
      <section className="bg-gradient-to-b from-neutral-50 to-white py-12">
        <div className="container-custom">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-center">Kontakt</h1>
          <p className="text-lg text-neutral-700 text-center max-w-2xl mx-auto mt-4">
            Máte dotaz nebo potřebujete pomoc? Neváhejte mě kontaktovat.
          </p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div>
              <h2 className="text-3xl font-serif font-bold mb-6">Kontaktní informace</h2>
              <p className="text-neutral-700 mb-8">
                Rád odpovím na vaše dotazy ohledně kurzů nebo spolupráce. Vyberte si způsob, který vám nejvíce vyhovuje.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <FiMail className="text-primary-600 text-xl" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-1">E-mail</h3>
                    <p className="text-neutral-700">
                      <a href="mailto:zeptejtese@aleskalina.cz" className="hover:text-primary-600">
                        zeptejtese@aleskalina.cz
                      </a>
                    </p>
                    <p className="text-sm text-neutral-500 mt-1">
                      Odpovídám do 48 hodin
                    </p>
                  </div>
                </div>

              </div>
              
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Sledujte mě</h3>
                <div className="flex flex-wrap gap-3">
                  <a 
                    href="https://www.instagram.com/aleskalina.cz/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center hover:bg-primary-100 transition-colors"
                    title="Instagram"
                  >
                    <FiInstagram className="text-neutral-700 hover:text-primary-600" />
                  </a>
                  <a 
                    href="https://www.youtube.com/AlesKalinaTV" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center hover:bg-primary-100 transition-colors"
                    title="YouTube"
                  >
                    <FiYoutube className="text-neutral-700 hover:text-primary-600" />
                  </a>
                  <a 
                    href="https://www.facebook.com/ales.kalina" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center hover:bg-primary-100 transition-colors"
                    title="Facebook"
                  >
                    <FiFacebook className="text-neutral-700 hover:text-primary-600" />
                  </a>
                  <a 
                    href="https://www.linkedin.com/in/aleskalina/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center hover:bg-primary-100 transition-colors"
                    title="LinkedIn"
                  >
                    <FiLinkedin className="text-neutral-700 hover:text-primary-600" />
                  </a>
                  <a 
                    href="https://x.com/AlesKalinaTV" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center hover:bg-primary-100 transition-colors"
                    title="X (Twitter)"
                  >
                    <FaXTwitter className="text-neutral-700 hover:text-primary-600" />
                  </a>
                  <a 
                    href="https://www.tiktok.com/@kalina.ales" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center hover:bg-primary-100 transition-colors"
                    title="TikTok"
                  >
                    <FaTiktok className="text-neutral-700 hover:text-primary-600" />
                  </a>
                </div>
              </div>
            </div>
            
                        {/* Contact Form */}
            <div>
              <h2 className="text-3xl font-serif font-bold mb-6">Napište mi</h2>
              
              {/* Status zprávy */}
              {submitStatus.type && (
                <div className={`mb-6 p-4 rounded-lg ${
                  submitStatus.type === 'success' 
                    ? 'bg-green-50 border border-green-200 text-green-800' 
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                  <p className="font-medium">{submitStatus.message}</p>
                </div>
              )}

              {/* Chyby validace */}
              {errors.length > 0 && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="text-red-800 font-medium mb-2">Prosím opravte následující chyby:</h4>
                  <ul className="text-red-700 text-sm space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Honeypot pole - skryté pro lidi, viditelné pro roboty */}
                <div style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }} aria-hidden="true">
                  <label htmlFor="website">
                    Nechte toto pole prázdné (anti-spam):
                  </label>
                  <input
                    type="text"
                    id="website"
                    name="honeypot"
                    value={formData.honeypot}
                    onChange={handleInputChange}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">
                      Jméno *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      className="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 disabled:bg-neutral-100 disabled:cursor-not-allowed"
                      required
                      placeholder="Vaše jméno"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
                      E-mail *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      className="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 disabled:bg-neutral-100 disabled:cursor-not-allowed"
                      required
                      placeholder="vas.email@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-neutral-700 mb-1">
                    Předmět *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    className="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 disabled:bg-neutral-100 disabled:cursor-not-allowed"
                    required
                    placeholder="O čem chcete napsat?"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-neutral-700 mb-1">
                    Zpráva *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    value={formData.message}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    className="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 disabled:bg-neutral-100 disabled:cursor-not-allowed"
                    required
                    placeholder="Napište mi svou zprávu..."
                  />
                </div>

                {/* Math CAPTCHA */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <label htmlFor="mathAnswer" className="block text-sm font-medium text-blue-800">
                      🧮 Bezpečnostní otázka *
                    </label>
                    <button
                      type="button"
                      onClick={generateMathChallenge}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                      disabled={isSubmitting}
                    >
                      Nová otázka
                    </button>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="bg-white px-3 py-2 rounded border border-blue-300 font-mono text-lg font-semibold text-blue-900 min-w-[120px] text-center">
                      {mathChallenge.question} = ?
                    </div>
                    <input
                      type="number"
                      id="mathAnswer"
                      name="mathAnswer"
                      value={formData.mathAnswer}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      className="block w-24 px-3 py-2 border border-blue-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-neutral-100 disabled:cursor-not-allowed text-center font-semibold"
                      required
                      placeholder="?"
                      min="0"
                      max="1000"
                    />
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    Pro odeslání formuláře vyřešte tento příklad
                  </p>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <>
                        <FiLoader className="animate-spin mr-2" />
                        Odesílám zprávu...
                      </>
                    ) : (
                      'Odeslat zprávu'
                    )}
                  </button>
                </div>

                <p className="text-sm text-neutral-500">
                  * Povinná pole. Odesláním formuláře souhlasíte se zpracováním osobních údajů v souladu s našimi zásadami ochrany soukromí.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>


    </MainLayout>
  );
}

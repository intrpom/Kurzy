import MainLayout from '@/app/MainLayout';
import { FiMail, FiInstagram, FiYoutube, FiFacebook, FiLinkedin } from 'react-icons/fi';
import { FaXTwitter, FaTiktok } from 'react-icons/fa6';

export default function ContactPage() {
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
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">
                      Jméno
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      className="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
                      E-mail
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-neutral-700 mb-1">
                    Předmět
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    className="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-neutral-700 mb-1">
                    Zpráva
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    className="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    required
                  ></textarea>
                </div>
                
                <div>
                  <button
                    type="submit"
                    className="btn-primary w-full"
                  >
                    Odeslat zprávu
                  </button>
                </div>
                
                <p className="text-sm text-neutral-500">
                  Odesláním formuláře souhlasíte se zpracováním osobních údajů v souladu s našimi zásadami ochrany soukromí.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>


    </MainLayout>
  );
}

import Link from 'next/link';
import MainLayout from '@/app/MainLayout';
import { FiArrowRight } from 'react-icons/fi';

export default function AboutPage() {
  return (
    <MainLayout>
      {/* Header */}
      <section className="bg-gradient-to-b from-neutral-50 to-white py-12">
        <div className="container-custom">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-center">O mně</h1>
          <p className="text-lg text-neutral-700 text-center max-w-2xl mx-auto mt-4">
            Poznejte mou cestu, zkušenosti a přístup k osobnímu rozvoji a psychologii.
          </p>
        </div>
      </section>

      {/* About Content */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative h-96 rounded-lg overflow-hidden shadow-lg">
              {/* Placeholder for profile image - replace with actual image */}
              <div className="absolute inset-0 bg-gradient-to-br from-neutral-100 to-neutral-300 flex items-center justify-center">
                <span className="text-neutral-800 font-serif text-xl">Fotografie Aleše Kaliny</span>
              </div>
            </div>
            
            <div>
              <h2 className="text-3xl font-serif font-bold mb-6">Aleš Kalina</h2>
              <p className="text-lg text-neutral-700 mb-4">
                Vítejte na mé stránce. Jsem odborník na osobní rozvoj a psychologii s více než 10 lety zkušeností v oboru.
              </p>
              <p className="text-neutral-700 mb-4">
                Mou vášní je pomáhat lidem objevovat jejich potenciál, překonávat překážky a žít plnohodnotný život. Věřím, že každý člověk má v sobě sílu k pozitivní změně, jen potřebuje správné nástroje a podporu.
              </p>
              <p className="text-neutral-700 mb-4">
                Ve svých kurzech kombinuji vědecké poznatky s praktickými technikami, které můžete ihned aplikovat ve svém životě. Mým cílem je předávat znalosti srozumitelnou a přístupnou formou, která vás bude inspirovat k akci.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Experience & Education */}
      <section className="py-12 bg-neutral-50">
        <div className="container-custom">
          <h2 className="text-3xl font-serif font-bold mb-8 text-center">Vzdělání a zkušenosti</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-serif font-semibold mb-4">Vzdělání</h3>
              <ul className="space-y-4">
                <li>
                  <p className="font-medium">Psychologie a osobní rozvoj</p>
                  <p className="text-neutral-600">Univerzita Karlova, Praha</p>
                  <p className="text-sm text-neutral-500">2008 - 2013</p>
                </li>
                <li>
                  <p className="font-medium">Mindfulness a meditační techniky</p>
                  <p className="text-neutral-600">Specializovaný výcvik</p>
                  <p className="text-sm text-neutral-500">2014 - 2015</p>
                </li>
                <li>
                  <p className="font-medium">Koučink a terapeutické přístupy</p>
                  <p className="text-neutral-600">Mezinárodní certifikace</p>
                  <p className="text-sm text-neutral-500">2016</p>
                </li>
              </ul>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-serif font-semibold mb-4">Zkušenosti</h3>
              <ul className="space-y-4">
                <li>
                  <p className="font-medium">Soukromá praxe</p>
                  <p className="text-neutral-600">Individuální konzultace a skupinové workshopy</p>
                  <p className="text-sm text-neutral-500">2013 - současnost</p>
                </li>
                <li>
                  <p className="font-medium">Přednášející</p>
                  <p className="text-neutral-600">Univerzita Karlova, odborné konference</p>
                  <p className="text-sm text-neutral-500">2015 - současnost</p>
                </li>
                <li>
                  <p className="font-medium">Autor</p>
                  <p className="text-neutral-600">Publikace v odborných časopisech a online médiích</p>
                  <p className="text-sm text-neutral-500">2014 - současnost</p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Approach */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-3xl font-serif font-bold mb-8 text-center">Můj přístup</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 border border-neutral-200 rounded-lg">
              <h3 className="text-xl font-serif font-semibold mb-3">Vědecký základ</h3>
              <p className="text-neutral-700">
                Všechny mé kurzy a metody jsou založeny na vědeckých poznatcích a ověřených postupech z oblasti psychologie a neurovědy.
              </p>
            </div>
            
            <div className="p-6 border border-neutral-200 rounded-lg">
              <h3 className="text-xl font-serif font-semibold mb-3">Praktičnost</h3>
              <p className="text-neutral-700">
                Kladu důraz na praktické techniky a nástroje, které můžete okamžitě aplikovat ve svém každodenním životě.
              </p>
            </div>
            
            <div className="p-6 border border-neutral-200 rounded-lg">
              <h3 className="text-xl font-serif font-semibold mb-3">Individuální přístup</h3>
              <p className="text-neutral-700">
                Respektuji jedinečnost každého člověka a podporuji vás v nalezení vlastní cesty k osobnímu růstu a rozvoji.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container-custom text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">Připojte se ke komunitě studentů</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            Prozkoumejte mé kurzy a začněte svou cestu k osobnímu rozvoji a lepšímu porozumění sobě samým.
          </p>
          <Link href="/kurzy" className="btn bg-white text-primary-700 hover:bg-neutral-100 inline-flex items-center">
            Prozkoumat kurzy <FiArrowRight className="ml-2" />
          </Link>
        </div>
      </section>
    </MainLayout>
  );
}

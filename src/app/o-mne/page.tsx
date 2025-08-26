import Link from 'next/link';
import Image from 'next/image';
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
            Čím výše jsem, tím více vidím. Čím více vidím, tím méně řeším. Čím méně řeším, tím více žiji.
          </p>
        </div>
      </section>

      {/* About Content */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative h-96 rounded-lg overflow-hidden shadow-lg">
              <Image
                src="/images/Ales-pro-web.jpg"
                alt="Aleš Kalina"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>
            
            <div>
              <h2 className="text-3xl font-serif font-bold mb-6">Aleš Kalina</h2>
              <p className="text-lg text-neutral-700 mb-4">
                Rád se starám o životy druhých jako o svůj vlastní. Jsem přesvědčený, že každý člověk má nárok na skvělý život a naplnění svých tužeb a vizí.
              </p>
              <p className="text-neutral-700 mb-4">
                Během jednoho sezení vám rozklíčuji podstatu vašeho problému takovým způsobem, že vám bude jasné, jak ho vyřešit.
              </p>
              <p className="text-neutral-700 mb-4">
                <strong>20 let jsem pátral</strong>, jak je možné, že někteří, aniž by se příliš namáhali, dosahují úspěchu, a jiní, i přes veškeré své úsilí, končí vždy na místě, odkud vyrazili. Prostudoval jsem <strong>stovky knih</strong>, osobních svědectví a náboženských principů, abych odhalil zákonitosti příjemného života a dobrého pocitu.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Personal Story */}
      <section className="py-12 bg-neutral-50">
        <div className="container-custom">
          <h2 className="text-3xl font-serif font-bold mb-8 text-center">Vše se rodilo z domácího pekla</h2>
          
          <div className="max-w-4xl mx-auto">
            <p className="text-lg text-neutral-700 mb-6">
              Prožil jsem nepříliš lahodné dětství, z čehož mi vzniklo mnoho nepříjemných <strong>emočních programů</strong>, které mi později mnohokrát komplikovaly život. Když jsem na pokraji <strong>zoufalství nad svojí životní cestou</strong> objevil Emoční rovnice, jako programy ovládající naše chování a formující vše, co kolem sebe vidíme, bylo mi jasné, proč jsem právě já musel jít údolím stínů.
            </p>
            
            <p className="text-neutral-700 mb-6">
              Již v <strong>17 letech</strong> se ve mně probudila touha ptát se lidí kolem sebe, jak se mají a proč se necítí dobře. Při pozorováních <strong>lidských osudů</strong> jsem si všiml, že to, co lidé říkají, má přímou souvislost s tím, co denně prožívají.
            </p>
            
            <p className="text-neutral-700 mb-6">
              Při konzultacích jsem začal jednotlivé výroky svých klientů <strong>zapisovat a ověřovat</strong>, zda to, co jsem zapsal, je pro ně pravdou. V <strong>70 až 95 procentech</strong> to pravda skutečně byla. Když se mi podařilo z vyprávění klienta sepsat všechny jeho výroky, bylo z nich jasné, že tyto <strong>Emoční rovnice</strong> přesně zobrazovaly jeho svět, na který si stěžoval a ze kterého chtěl uniknout pryč.
            </p>
          </div>
        </div>
      </section>

      {/* Method */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-3xl font-serif font-bold mb-8 text-center">Sestavil jsem metodu Emoční rovnice</h2>
          
          <div className="max-w-4xl mx-auto">
            <p className="text-lg text-neutral-700 mb-6">
              která pomáhá lidem tak, že když jim pomohu najít jejich Emoční rovnice, pochopí, že jejich svět je pouze <strong>odrazem jejich přesvědčení</strong> a ne hříčkou nevyzpytatelného osudu. Naučí se, že když jejich současný svět odráží to, co vidí před sebou na papíře, je možné změnou obsahu hlavy vstoupit do světa, který skutečně chtějí a tento svět se jim stává realitou.
            </p>
            
            <div className="bg-primary-50 p-6 rounded-lg mb-6">
              <p className="text-lg font-medium text-primary-900 mb-2">
                Ve své hlavě jsem našel skoro <strong>11500 emočních programů</strong>
              </p>
              <p className="text-primary-800">
                které jsem odstranil a vymazal z neuronové mapy. Díky tomuto počinu jsem dnes šťastný člověk, <strong>realizuji svůj talent</strong> a mohu pomáhat dalším lidem s jejich nepříjemnými myšlenkami.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Show Jana Krause */}
      <section className="py-12 bg-neutral-50">
        <div className="container-custom">
          <h2 className="text-3xl font-serif font-bold mb-8 text-center">Show Jana Krause</h2>
          
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-lg text-neutral-700 mb-6">
              Aleš Kalina se stal hostem známé show. Hovořil o svých vynálezech, práci s hlavou, vydělávání peněz a odstraňování destruktivních bloků, které brání na cestě ke štěstí.
            </p>
            <p className="text-neutral-700">
              Společně hovořili o možnostech lepšího životního stylu a občas se i pobavili nad koučinkovými tématy a problémy lidí. Některé trefné otázky laděné přímo na tělo, které jsou normální v této show, ukázaly na neskutečné možnosti koučinku a kapacity lidského mozku.
            </p>
          </div>
        </div>
      </section>

      {/* Life Areas */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-3xl font-serif font-bold mb-8 text-center">Život je ladění 4 oblastí</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 border border-neutral-200 rounded-lg text-center">
              <h3 className="text-xl font-serif font-semibold mb-3">Vztahy</h3>
              <p className="text-neutral-700 text-sm">
                Komunikace, partnerství, rodina
              </p>
            </div>
            
            <div className="p-6 border border-neutral-200 rounded-lg text-center">
              <h3 className="text-xl font-serif font-semibold mb-3">Zdraví</h3>
              <p className="text-neutral-700 text-sm">
                Fyzické i psychické zdraví
              </p>
            </div>
            
            <div className="p-6 border border-neutral-200 rounded-lg text-center">
              <h3 className="text-xl font-serif font-semibold mb-3">Peníze</h3>
              <p className="text-neutral-700 text-sm">
                Finanční svoboda a prosperita
              </p>
            </div>
            
            <div className="p-6 border border-neutral-200 rounded-lg text-center">
              <h3 className="text-xl font-serif font-semibold mb-3">Práce</h3>
              <p className="text-neutral-700 text-sm">
                Kariéra a seberealizace
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Books */}
      <section className="py-12 bg-neutral-50">
        <div className="container-custom">
          <h2 className="text-3xl font-serif font-bold mb-8 text-center">Mé knihy</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Emoční rovnice */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-32 h-48 md:h-40 relative rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src="/images/emocni-rovnice.webp"
                    alt="Emoční rovnice - kniha"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 128px"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-serif font-bold mb-2">Emoční rovnice</h3>
                  <p className="text-primary-600 font-medium mb-3">340,00 Kč</p>
                  <p className="text-neutral-700 text-sm mb-4">
                    Tato kniha vám ukáže, jak vaše dětství ovlivňuje přítomnost, a naučí vás identifikovat a přepisovat skryté vzorce ve vašem podvědomí. Spojuje psychologii s logikou a nabízí praktické kroky ke změně života.
                  </p>
                  <p className="text-neutral-600 text-sm italic">
                    Přestaňte být obětí osudu – převezměte kontrolu nad svými emocemi a vytvořte si realitu, po které toužíte.
                  </p>
                </div>
              </div>
            </div>

            {/* Partnerský manuál */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-32 h-48 md:h-40 relative rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src="/images/partnersky-manual.webp"
                    alt="Partnerský manuál - kniha"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 128px"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-serif font-bold mb-2">Partnerský manuál</h3>
                  <p className="text-primary-600 font-medium mb-3">365,00 Kč</p>
                  <p className="text-neutral-700 text-sm mb-4">
                    Průvodce k nalezení správného partnera a budování harmonického vztahu. Objevte 33 kanálů lásky, praktické testy kompatibility a nástroje pro vytvoření vztahu založeného na lásce, respektu a společném růstu.
                  </p>
                  <p className="text-neutral-600 text-sm italic">
                    Jak si vybrat partnera, se kterým vytvoříte hluboké spojení a naplněný vztah?
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <p className="text-neutral-600 mb-4">
              Obě knihy jsou k dispozici i jako e-knihy a obsahují praktické cvičení a návody.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="https://ales-kalina.cz/obchod/emocni-rovnice-kniha/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-outline inline-flex items-center justify-center"
              >
                Koupit Emoční rovnice <FiArrowRight className="ml-2" />
              </a>
              <a 
                href="https://ales-kalina.cz/obchod/partnersky-manual-kniha/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-outline inline-flex items-center justify-center"
              >
                Koupit Partnerský manuál <FiArrowRight className="ml-2" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container-custom text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">Začněte svou transformaci již dnes</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            Objevte sílu Emočních rovnic a změňte svůj život k lepšímu. Každý člověk má nárok na skvělý život a naplnění svých tužeb a vizí.
          </p>
          <Link href="/kurzy" className="btn bg-white text-primary-700 hover:bg-neutral-100 inline-flex items-center">
            Prozkoumat kurzy <FiArrowRight className="ml-2" />
          </Link>
        </div>
      </section>
    </MainLayout>
  );
}

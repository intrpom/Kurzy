'use client';

import { useState } from 'react';
import { jsPDF } from 'jspdf';

interface Question {
  id: number;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
}

const questions: Question[] = [
  {
    id: 1,
    question: "Když se ráno probudíte vedle partnera, nejčastěji cítíte:",
    options: {
      A: "Radost a vděčnost, že tu je",
      B: "Klid a jistotu",
      C: "Lhostejnost nebo prázdnotu",
      D: "Úzkost nebo napětí"
    }
  },
  {
    id: 2,
    question: "Jak často spolu smysluplně komunikujete (ne jen o praktických věcech)?",
    options: {
      A: "Denně nebo skoro denně",
      B: "Několikrát týdně",
      C: "Občas, spíš výjimečně",
      D: "Prakticky vůbec"
    }
  },
  {
    id: 3,
    question: "Když máte problém, váš partner:",
    options: {
      A: "Naslouchá a snaží se pomoct",
      B: "Většinou se zajímá, ale někdy je zaneprázdněný",
      C: "Poslouchá, ale nechápe nebo bagatelizuje",
      D: "Ignoruje nebo se problému vyhýbá"
    }
  },
  {
    id: 4,
    question: "Představte si svůj vztah za 5 let. Co cítíte?",
    options: {
      A: "Vzrušení a očekávání",
      B: "Spokojenost a jistotu",
      C: "Nejistotu nebo obavy",
      D: "Strach nebo prázdnotu"
    }
  },
  {
    id: 5,
    question: "Jak často se smějete společně?",
    options: {
      A: "Často, humor je součást našeho vztahu",
      B: "Pravidelně, užíváme si společné chvíle",
      C: "Občas, ale spíš vzácně",
      D: "Už si nepamatuju, kdy naposledy"
    }
  },
  {
    id: 6,
    question: "Když máte volný čas, preferujete:",
    options: {
      A: "Trávit ho společně",
      B: "Kombinaci společných aktivit a času pro sebe",
      C: "Spíš čas sami nebo s přáteli",
      D: "Jakkoliv, jen ne s partnerem"
    }
  },
  {
    id: 7,
    question: "Důvěřujete svému partnerovi?",
    options: {
      A: "Absolutně a bez výhrad",
      B: "Ano, i když občas mám malé pochybnosti",
      C: "Částečně, některé věci skrývám",
      D: "Málokdy nebo vůbec"
    }
  },
  {
    id: 8,
    question: "Jak řešíte konflikty?",
    options: {
      A: "Otevřeně komunikujeme a hledáme řešení",
      B: "Někdy se pohádáme, ale nakonec to vyřešíme",
      C: "Spíš se jim vyhýbáme nebo končí hádkou",
      D: "Neřešíme je, nebo skončí mlčením"
    }
  },
  {
    id: 9,
    question: "Cítíte se ve vztahu být sami sebou?",
    options: {
      A: "Ano, úplně přirozeně",
      B: "Většinou ano, jen občas si něco nechám pro sebe",
      C: "Někdy, ale často se přizpůsobuju",
      D: "Ne, neustále hraju roli"
    }
  },
  {
    id: 10,
    question: "Jak partner reaguje na vaše úspěchy?",
    options: {
      A: "Raduje se se mnou a podporuje mě",
      B: "Je rád, i když není tak nadšený",
      C: "Bere to na vědomí, ale bez velkého zájmu",
      D: "Bagatelizuje nebo je lhostejný"
    }
  },
  {
    id: 11,
    question: "Intimita mezi vámi (nejen fyzická):",
    options: {
      A: "Je přirozená a obohacující",
      B: "Funguje dobře, občas má výkyvy",
      C: "Je problematická nebo rutinní",
      D: "Prakticky neexistuje"
    }
  },
  {
    id: 12,
    question: "Když si představíte rozchod:",
    options: {
      A: "Cítím paniku a smutek - nechci si to představovat",
      B: "Je mi smutno, ale zvládl/a bych to",
      C: "Cítím úlevu smíchanou se smutkem",
      D: "Převažuje úleva a vysvobození"
    }
  },
  {
    id: 13,
    question: "Společné plány a cíle:",
    options: {
      A: "Máme je a aktivně na nich pracujeme",
      B: "Většinou se shodneme na důležitých věcech",
      C: "Málokdy se bavíme o budoucnosti",
      D: "Každý táhne jiným směrem"
    }
  },
  {
    id: 14,
    question: "Respekt ve vztahu:",
    options: {
      A: "Vzájemně se respektujeme ve všem",
      B: "Většinou ano, občas dojde k překročení hranic",
      C: "Někdy cítím nerespekt nebo ignoranci",
      D: "Často se cítím nerespektován/á nebo ponížen/á"
    }
  },
  {
    id: 15,
    question: "Celkově byste váš vztah ohodnotil/a jako:",
    options: {
      A: "Šťastný a naplňující",
      B: "Dobrý s menšími problémy",
      C: "Problematický, ale s potenciálem",
      D: "Nefunkční nebo škodlivý"
    }
  }
];

const evaluations = {
  green: {
    range: "35-45 BODŮ",
    title: "ZELENÁ ZÓNA 🟢",
    subtitle: "Váš vztah má pevné základy",
    description: "Gratulujeme! Váš vztah je zdravý a má silné základy. I když žádný vztah není dokonalý, vy jste na dobré cestě. Zaměřte se na udržení toho, co funguje, a pokračujte v otevřené komunikaci.",
    nextSteps: "Investujte do růstu vztahu - společné zážitky, nové výzvy, prohlubování intimity."
  },
  yellow: {
    range: "25-34 BODŮ",
    title: "ŽLUTÁ ZÓNA 🟡",
    subtitle: "Váš vztah potřebuje pozornost",
    description: "Váš vztah má potenciál, ale některé oblasti vyžadují práci. Nejste v krizi, ale ignorování problémů by mohlo vést k jejich prohloubení. Je čas na aktivní změny.",
    nextSteps: "Identifikujte 1-2 hlavní problémy a začněte na nich pracovat. Párová terapie nebo odborná pomoc může být velmi přínosná."
  },
  orange: {
    range: "15-24 BODŮ",
    title: "ORANŽOVÁ ZÓNA 🟠",
    subtitle: "Váš vztah je na rozcestí",
    description: "Nacházíte se přesně tam, kde článek začínal. Váš vztah má vážné problémy, ale ještě není všem dnům konec. Rozhodnutí je na vás - buď investovat energii do záchrany, nebo připravit se na důstojný konec.",
    nextSteps: "Použijte 3 kroky z článku. Zvažte odbornou pomoc nebo si přečtěte další materiály o vztahových krizích."
  },
  red: {
    range: "0-14 BODŮ",
    title: "ČERVENÁ ZÓNA 🔴",
    subtitle: "Je čas na zásadní rozhodnutí",
    description: "Váš vztah vás pravděpodobně více škodí než obohacuje. Pokud jste již vyzkoušeli různé způsoby řešení bez výsledku, možná je čas zvážit ukončení. Nezůstávejte v destruktivním vztahu ze strachu nebo z povinnosti.",
    nextSteps: "Vyhledejte podporu od přátel, rodiny nebo odborníka. Připravte si plán, jak vztah důstojně ukončit, pokud se situace nezlepší."
  }
};

export default function VztahovyChecklist() {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const handleAnswer = (questionId: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const calculateScore = () => {
    let totalScore = 0;
    Object.values(answers).forEach(answer => {
      switch (answer) {
        case 'A': totalScore += 3; break;
        case 'B': totalScore += 2; break;
        case 'C': totalScore += 1; break;
        case 'D': totalScore += 0; break;
      }
    });
    return totalScore;
  };

  const getEvaluation = (score: number) => {
    if (score >= 35) return evaluations.green;
    if (score >= 25) return evaluations.yellow;
    if (score >= 15) return evaluations.orange;
    return evaluations.red;
  };

  const getZoneColor = (score: number) => {
    if (score >= 35) return 'bg-green-50 border-green-200';
    if (score >= 25) return 'bg-yellow-50 border-yellow-200';
    if (score >= 15) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  const handleSubmit = () => {
    if (Object.keys(answers).length === questions.length) {
      setShowResults(true);
    }
  };

  const generateResultsPDF = () => {
    const score = calculateScore();
    const evaluation = getEvaluation(score);
    
    const pdf = new jsPDF();
    
    // Nastavení fontu
    pdf.setFont('helvetica');
    
    // Hlavička
    pdf.setFontSize(20);
    pdf.setTextColor(40, 40, 40);
    pdf.text('VZTAHOVÝ KOMPAS', 20, 30);
    
    pdf.setFontSize(12);
    pdf.text('Výsledky vašeho testu', 20, 40);
    
    // Skóre
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Vaše skóre: ${score} bodů`, 20, 60);
    
    // Vyhodnocení
    pdf.setFontSize(14);
    pdf.text(evaluation.range, 20, 80);
    pdf.text(evaluation.title, 20, 90);
    
    pdf.setFontSize(12);
    pdf.text(evaluation.subtitle, 20, 100);
    
    // Popis - rozdělení na řádky
    const splitDescription = pdf.splitTextToSize(evaluation.description, 170);
    pdf.text(splitDescription, 20, 120);
    
    // Další kroky
    pdf.setFontSize(11);
    pdf.text('Co dál:', 20, 160);
    const splitNextSteps = pdf.splitTextToSize(evaluation.nextSteps, 170);
    pdf.text(splitNextSteps, 20, 170);
    
    // Bonus doporučení
    pdf.text('BONUS: Vaše další kroky', 20, 200);
    const bonusSteps = [
      '✓ Sdělte výsledek partnerovi a proberte ho společně',
      '✓ Identifikujte 3 konkrétní oblasti ke zlepšení',
      '✓ Stanovte si termín pro přehodnocení (za 3-6 měsíců)',
      '✓ Zvažte odbornou pomoc, pokud jste v žluté zóně nebo níže'
    ];
    
    bonusSteps.forEach((step, index) => {
      pdf.text(step, 20, 210 + (index * 8));
    });
    
    // Poznámka
    pdf.setFontSize(10);
    pdf.text('Pamatujte: Tento test je pouze orientační. Důležitější než body jsou vaše pocity a intuice.', 20, 250);
    
    // Stažení PDF
    pdf.save('vztahovy-kompas-vysledky.pdf');
  };

  const generateBlankTestPDF = () => {
    const pdf = new jsPDF();
    pdf.setFont('helvetica');
    
    // Stránka 1 - Úvod a instrukce
    pdf.setFontSize(20);
    pdf.setTextColor(40, 40, 40);
    pdf.text('VZTAHOVÝ KOMPAS', 20, 25);
    
    pdf.setFontSize(12);
    pdf.text('15 otázek, které vám za 5 minut ukážou, jestli má váš vztah budoucnost', 20, 35);
    
    pdf.setFontSize(11);
    pdf.text('INSTRUKCE:', 20, 50);
    pdf.text('• Odpovězte upřímně na každou otázku', 20, 58);
    pdf.text('• Zaškrtněte jednu odpověď u každé otázky', 20, 66);
    pdf.text('• Za každou odpověď získáte body: A = 3 body, B = 2 body, C = 1 bod, D = 0 bodů', 20, 74);
    pdf.text('• Na konci sečtěte všechny body a najděte své vyhodnocení', 20, 82);
    
    // Místo pro jméno a datum
    pdf.setFontSize(10);
    pdf.text('Jméno: ________________________________    Datum: ________________', 20, 100);
    
    let yPosition = 120;
    let currentPage = 1;
    
    // Všechny otázky
    questions.forEach((question, index) => {
      // Kontrola, jestli se vejde otázka na stránku
      if (yPosition > 240) {
        pdf.addPage();
        yPosition = 25;
        currentPage++;
      }
      
      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      
      // Rozdělení dlouhých otázek na více řádků
      const questionText = `${question.id}. ${question.question}`;
      const splitQuestion = pdf.splitTextToSize(questionText, 170);
      pdf.text(splitQuestion, 20, yPosition);
      yPosition += splitQuestion.length * 5 + 3;
      
      pdf.setFontSize(10);
      Object.entries(question.options).forEach(([key, option]) => {
        // Checkbox pro zaškrtnutí
        pdf.rect(25, yPosition - 3, 3, 3); // Prázdný čtvereček
        pdf.text(`${key})`, 32, yPosition);
        
        // Rozdělení dlouhých odpovědí
        const splitOption = pdf.splitTextToSize(option, 150);
        pdf.text(splitOption, 40, yPosition);
        yPosition += Math.max(splitOption.length * 4, 6);
      });
      yPosition += 8;
    });
    
    // Nová stránka pro vyhodnocení
    pdf.addPage();
    
    // Sekce pro sečtení bodů
    pdf.setFontSize(14);
    pdf.text('VYHODNOCENÍ', 20, 25);
    
    pdf.setFontSize(11);
    pdf.text('1. Sečtěte své body:', 20, 40);
    pdf.text('Počet odpovědí A: _____ × 3 = _____ bodů', 30, 50);
    pdf.text('Počet odpovědí B: _____ × 2 = _____ bodů', 30, 58);
    pdf.text('Počet odpovědí C: _____ × 1 = _____ bodů', 30, 66);
    pdf.text('Počet odpovědí D: _____ × 0 = _____ bodů', 30, 74);
    pdf.text('CELKEM: ____________ bodů', 30, 85);
    
    // Vyhodnocovací tabulka
    pdf.setFontSize(12);
    pdf.text('2. Najděte své vyhodnocení:', 20, 100);
    
    yPosition = 115;
    
    Object.values(evaluations).forEach((evaluation) => {
      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      
      // Checkbox pro označení výsledku
      pdf.rect(20, yPosition - 3, 4, 4);
      pdf.text(`${evaluation.range} - ${evaluation.title}`, 30, yPosition);
      yPosition += 8;
      
      pdf.setFontSize(9);
      pdf.text(`"${evaluation.subtitle}"`, 30, yPosition);
      yPosition += 6;
      
      const splitDesc = pdf.splitTextToSize(evaluation.description, 160);
      pdf.text(splitDesc, 30, yPosition);
      yPosition += splitDesc.length * 3 + 5;
      
      pdf.setFontSize(8);
      pdf.text('Co dál:', 30, yPosition);
      yPosition += 4;
      const splitNext = pdf.splitTextToSize(evaluation.nextSteps, 160);
      pdf.text(splitNext, 30, yPosition);
      yPosition += splitNext.length * 3 + 10;
      
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 25;
      }
    });
    
    // Nová stránka pro bonus tipy
    if (yPosition > 200) {
      pdf.addPage();
      yPosition = 25;
    }
    
    pdf.setFontSize(12);
    pdf.text('BONUS: Vaše další kroky', 20, yPosition);
    yPosition += 10;
    
    const bonusSteps = [
      '□ Sdělte výsledek partnerovi a proberte ho společně',
      '□ Identifikujte 3 konkrétní oblasti ke zlepšení',
      '□ Stanovte si termín pro přehodnocení (za 3-6 měsíců)',
      '□ Zvažte odbornou pomoc, pokud jste v žluté zóně nebo níže'
    ];
    
    pdf.setFontSize(10);
    bonusSteps.forEach((step) => {
      pdf.text(step, 20, yPosition);
      yPosition += 8;
    });
    
    yPosition += 10;
    pdf.setFontSize(9);
    pdf.text('Pamatujte: Tento test je pouze orientační. Důležitější než body jsou vaše pocity a intuice.', 20, yPosition);
    pdf.text('Pokud se dlouhodobě necítíte šťastní, je to signál k jednání.', 20, yPosition + 8);
    
    // Stažení PDF
    pdf.save('vztahovy-kompas-test-k-vytisteni.pdf');
  };

  const generateCompletePDF = () => {
    const score = calculateScore();
    const evaluation = getEvaluation(score);
    
    const pdf = new jsPDF();
    pdf.setFont('helvetica');
    
    // Stránka 1 - Úvod a otázky 1-5
    pdf.setFontSize(18);
    pdf.setTextColor(40, 40, 40);
    pdf.text('VZTAHOVÝ KOMPAS', 20, 25);
    
    pdf.setFontSize(11);
    pdf.text('15 otázek, které vám za 5 minut ukážou, jestli má váš vztah budoucnost', 20, 35);
    pdf.text('Odpovězte upřímně na každou otázku. Za každou odpověď získáte body (A=3, B=2, C=1, D=0).', 20, 42);
    
    let yPosition = 55;
    
    // Otázky 1-5
    for (let i = 0; i < 5; i++) {
      const question = questions[i];
      
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`${question.id}. ${question.question}`, 20, yPosition);
      yPosition += 8;
      
      pdf.setFontSize(10);
      Object.entries(question.options).forEach(([key, option]) => {
        const isSelected = answers[question.id] === key;
        if (isSelected) {
          pdf.setTextColor(200, 50, 50);
        } else {
          pdf.setTextColor(80, 80, 80);
        }
        pdf.text(`${key}) ${option}`, 25, yPosition);
        yPosition += 6;
      });
      yPosition += 5;
      
      if (yPosition > 260) {
        pdf.addPage();
        yPosition = 25;
      }
    }
    
    // Stránka 2 - Otázky 6-10
    pdf.addPage();
    yPosition = 25;
    
    for (let i = 5; i < 10; i++) {
      const question = questions[i];
      
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`${question.id}. ${question.question}`, 20, yPosition);
      yPosition += 8;
      
      pdf.setFontSize(10);
      Object.entries(question.options).forEach(([key, option]) => {
        const isSelected = answers[question.id] === key;
        if (isSelected) {
          pdf.setTextColor(200, 50, 50);
        } else {
          pdf.setTextColor(80, 80, 80);
        }
        pdf.text(`${key}) ${option}`, 25, yPosition);
        yPosition += 6;
      });
      yPosition += 5;
      
      if (yPosition > 260) {
        pdf.addPage();
        yPosition = 25;
      }
    }
    
    // Stránka 3 - Otázky 11-15
    pdf.addPage();
    yPosition = 25;
    
    for (let i = 10; i < 15; i++) {
      const question = questions[i];
      
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`${question.id}. ${question.question}`, 20, yPosition);
      yPosition += 8;
      
      pdf.setFontSize(10);
      Object.entries(question.options).forEach(([key, option]) => {
        const isSelected = answers[question.id] === key;
        if (isSelected) {
          pdf.setTextColor(200, 50, 50);
        } else {
          pdf.setTextColor(80, 80, 80);
        }
        pdf.text(`${key}) ${option}`, 25, yPosition);
        yPosition += 6;
      });
      yPosition += 5;
    }
    
    // Stránka 4 - Vyhodnocení
    pdf.addPage();
    
    // Hlavička výsledků
    pdf.setFontSize(20);
    pdf.setTextColor(40, 40, 40);
    pdf.text('VYHODNOCENÍ', 20, 30);
    
    // Skóre
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Vaše skóre: ${score} bodů`, 20, 50);
    
    // Vyhodnocení
    pdf.setFontSize(14);
    pdf.text(evaluation.range, 20, 70);
    pdf.text(evaluation.title, 20, 80);
    
    pdf.setFontSize(12);
    pdf.text(`"${evaluation.subtitle}"`, 20, 90);
    
    // Popis
    const splitDescription = pdf.splitTextToSize(evaluation.description, 170);
    pdf.text(splitDescription, 20, 105);
    
    // Další kroky
    pdf.setFontSize(11);
    pdf.text('Co dál:', 20, 140);
    const splitNextSteps = pdf.splitTextToSize(evaluation.nextSteps, 170);
    pdf.text(splitNextSteps, 20, 150);
    
    // Stránka 5 - Všechna vyhodnocení
    pdf.addPage();
    
    pdf.setFontSize(16);
    pdf.text('KOMPLETNÍ VYHODNOCENÍ VŠECH ZÓN', 20, 25);
    
    yPosition = 40;
    
    Object.values(evaluations).forEach((evaluation) => {
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`${evaluation.range} - ${evaluation.title}`, 20, yPosition);
      yPosition += 8;
      
      pdf.setFontSize(10);
      pdf.text(`"${evaluation.subtitle}"`, 20, yPosition);
      yPosition += 6;
      
      const splitDesc = pdf.splitTextToSize(evaluation.description, 170);
      pdf.text(splitDesc, 20, yPosition);
      yPosition += splitDesc.length * 4 + 8;
      
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 25;
      }
    });
    
    // Bonus doporučení
    if (yPosition > 200) {
      pdf.addPage();
      yPosition = 25;
    }
    
    pdf.setFontSize(12);
    pdf.text('BONUS: Vaše další kroky', 20, yPosition);
    yPosition += 10;
    
    const bonusSteps = [
      '✓ Sdělte výsledek partnerovi a proberte ho společně',
      '✓ Identifikujte 3 konkrétní oblasti ke zlepšení',
      '✓ Stanovte si termín pro přehodnocení (za 3-6 měsíců)',
      '✓ Zvažte odbornou pomoc, pokud jste v žluté zóně nebo níže'
    ];
    
    pdf.setFontSize(10);
    bonusSteps.forEach((step) => {
      pdf.text(step, 20, yPosition);
      yPosition += 8;
    });
    
    yPosition += 10;
    pdf.setFontSize(9);
    pdf.text('Pamatujte: Tento test je pouze orientační. Důležitější než body jsou vaše pocity a intuice.', 20, yPosition);
    pdf.text('Pokud se dlouhodobě necítíte šťastní, je to signál k jednání.', 20, yPosition + 8);
    
    // Stažení PDF
    pdf.save('vztahovy-kompas-kompletni.pdf');
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  if (showResults) {
    const score = calculateScore();
    const evaluation = getEvaluation(score);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Hlavička výsledků */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">
                VZTAHOVÝ KOMPAS
              </h1>
              <p className="text-lg text-gray-600">Vaše výsledky</p>
            </div>

            {/* Skóre */}
            <div className="text-center mb-8">
              <div className="inline-block bg-white rounded-full px-8 py-4 shadow-lg">
                <span className="text-3xl font-bold text-gray-800">
                  {score} bodů
                </span>
              </div>
            </div>

            {/* Vyhodnocení */}
            <div className={`rounded-2xl border-2 p-8 mb-8 ${getZoneColor(score)}`}>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {evaluation.range}
                </h2>
                <h3 className="text-3xl font-bold mb-2">
                  {evaluation.title}
                </h3>
                <p className="text-xl font-semibold text-gray-700">
                  {evaluation.subtitle}
                </p>
              </div>
              
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  {evaluation.description}
                </p>
                
                <div className="bg-white/50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Co dál:</h4>
                  <p className="text-gray-700">
                    {evaluation.nextSteps}
                  </p>
                </div>
              </div>
            </div>

            {/* Bonus doporučení */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">
                BONUS: Vaše další kroky
              </h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <span className="text-green-500 font-bold">✓</span>
                  <span className="text-gray-700">Sdělte výsledek partnerovi a proberte ho společně</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-green-500 font-bold">✓</span>
                  <span className="text-gray-700">Identifikujte 3 konkrétní oblasti ke zlepšení</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-green-500 font-bold">✓</span>
                  <span className="text-gray-700">Stanovte si termín pro přehodnocení (za 3-6 měsíců)</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-green-500 font-bold">✓</span>
                  <span className="text-gray-700">Zvažte odbornou pomoc, pokud jste v žluté zóně nebo níže</span>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 italic">
                  Pamatujte: Tento test je pouze orientační. Důležitější než body jsou vaše pocity a intuice. 
                  Pokud se dlouhodobě necítíte šťastní, je to signál k jednání.
                </p>
              </div>
            </div>

            {/* Akční tlačítka */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={generateResultsPDF}
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-3 rounded-full font-semibold hover:from-pink-600 hover:to-purple-700 transition-all duration-300 shadow-lg"
              >
                📄 Stáhnout pouze výsledky
              </button>
              <button
                onClick={generateCompletePDF}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-3 rounded-full font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-lg"
              >
                📋 Stáhnout kompletní test + výsledky
              </button>
              <button
                onClick={() => {
                  setShowResults(false);
                  setAnswers({});
                  setCurrentQuestion(0);
                }}
                className="bg-gray-500 text-white px-8 py-3 rounded-full font-semibold hover:bg-gray-600 transition-all duration-300"
              >
                🔄 Zkusit znovu
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Hlavička */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              VZTAHOVÝ KOMPAS
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-2">
              15 otázek, které vám za 5 minut ukážou, jestli má váš vztah budoucnost
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Odpovězte upřímně na každou otázku. Za každou odpověď získáte body (A=3, B=2, C=1, D=0).
            </p>
            
            {/* Tlačítko pro stažení prázdného testu */}
            <div className="mb-6">
              <button
                onClick={generateBlankTestPDF}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-full font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg"
              >
                🖨️ Stáhnout test k vytištění
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Chcete test vyplnit na papíře? Stáhněte si prázdnou verzi k vytištění.
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Pokrok</span>
              <span className="text-sm text-gray-600">
                {Object.keys(answers).length} / {questions.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-pink-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Otázka */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="mb-6">
              <span className="inline-block bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
                Otázka {questions[currentQuestion].id}
              </span>
              <h2 className="text-xl md:text-2xl font-semibold text-gray-800 leading-relaxed">
                {questions[currentQuestion].question}
              </h2>
            </div>

            <div className="space-y-3">
              {Object.entries(questions[currentQuestion].options).map(([key, option]) => (
                <label
                  key={key}
                  className={`block p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-md ${
                    answers[questions[currentQuestion].id] === key
                      ? 'border-pink-500 bg-pink-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${questions[currentQuestion].id}`}
                    value={key}
                    checked={answers[questions[currentQuestion].id] === key}
                    onChange={() => handleAnswer(questions[currentQuestion].id, key)}
                    className="sr-only"
                  />
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      answers[questions[currentQuestion].id] === key
                        ? 'border-pink-500 bg-pink-500'
                        : 'border-gray-300'
                    }`}>
                      {answers[questions[currentQuestion].id] === key && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span className="font-semibold text-pink-600">{key})</span>
                    <span className="text-gray-700">{option}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Navigace */}
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={prevQuestion}
              disabled={currentQuestion === 0}
              className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                currentQuestion === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-500 text-white hover:bg-gray-600'
              }`}
            >
              ← Předchozí
            </button>

            {currentQuestion === questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={Object.keys(answers).length !== questions.length}
                className={`px-8 py-3 rounded-full font-semibold transition-all duration-300 ${
                  Object.keys(answers).length === questions.length
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 shadow-lg'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                🎯 Zobrazit výsledky
              </button>
            ) : (
              <button
                onClick={nextQuestion}
                disabled={!answers[questions[currentQuestion].id]}
                className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                  answers[questions[currentQuestion].id]
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Další →
              </button>
            )}
          </div>

          {/* Rychlý přehled otázek */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Rychlý přehled</h3>
            <div className="grid grid-cols-5 md:grid-cols-10 lg:grid-cols-15 gap-2 mb-6">
              {questions.map((q) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestion(q.id - 1)}
                  className={`w-10 h-10 rounded-full font-semibold text-sm transition-all duration-300 ${
                    answers[q.id]
                      ? 'bg-green-500 text-white'
                      : currentQuestion === q.id - 1
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {q.id}
                </button>
              ))}
            </div>
            
            {/* Export tlačítko */}
            {Object.keys(answers).length > 0 && (
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-3">
                  Chcete si uložit test s aktuálními odpověďmi?
                </p>
                <button
                  onClick={generateCompletePDF}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2 rounded-full font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 text-sm"
                >
                  📋 Exportovat aktuální stav do PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

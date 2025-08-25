'use client';

interface CourseDescriptionProps {
  description: string;
}

export default function CourseDescription({ description }: CourseDescriptionProps) {
  // Development flag - snadno zapnout/vypnout debug
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    console.log('CourseDescription komponenta načtena s popisem:', description?.substring(0, 100));
  }
  
  // Funkce pro formátování popisu kurzu z plain textu na HTML
  const formatDescription = (text: string): string => {
    if (!text) return '';
    
    const paragraphs = text.split('\n\n');
    let html = '';
    let i = 0;
    
    while (i < paragraphs.length) {
      const paragraph = paragraphs[i].trim();
      
      if (!paragraph) {
        i++;
        continue;
      }
      
      // Pokud je to nadpis (začíná číslem a tečkou)
      if (/^\d+\./.test(paragraph)) {
        html += `<h3 class="text-lg font-semibold text-primary-700 mb-3">${paragraph}</h3>`;
        
        // Podíváme se na následující odstavce - pokud nezačínají číslem, jsou to body seznamu
        let listItems = [];
        let j = i + 1;
        
        while (j < paragraphs.length && 
               paragraphs[j].trim() && 
               !/^\d+\./.test(paragraphs[j].trim()) &&
               !paragraphs[j].trim().includes('„') && // Citáty začínají uvozovkami
               paragraphs[j].trim().length > 10) { // Krátké texty nejsou body seznamu
          
          listItems.push(paragraphs[j].trim());
          j++;
        }
        
        // Pokud máme body seznamu, vytvoříme ul
        if (listItems.length > 0) {
          html += '<ul class="space-y-2 mb-4">';
          listItems.forEach(item => {
            html += `<li class="flex items-start">
              <svg class="w-5 h-5 text-primary-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
              </svg>
              <span>${item}</span>
            </li>`;
          });
          html += '</ul>';
          
          // Přeskočíme body seznamu
          i = j;
        } else {
          i++;
        }
      } else {
        // Běžný odstavec
        html += `<p class="mb-4 leading-relaxed">${paragraph}</p>`;
        i++;
      }
    }
    
    return html;
  };

  return (
    <div className="course-description">
      <div dangerouslySetInnerHTML={{ __html: formatDescription(description) }} />
    </div>
  );
}

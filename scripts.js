document.addEventListener('DOMContentLoaded', async () => {
    const searchBox = document.getElementById('searchBox');
    const resultDiv = document.getElementById('result');
    const ghostText = document.getElementById('ghostText');
    const searchContainer = document.querySelector('.search-box');
    const wordCountElement = document.getElementById('wordCount');

    

    let dictionaryData = {};
    let clickableWords = {};
    let entryWords = {};
    let specialWords = {};
    let currentMeaningIndex = {};
    let lastQuery = '';
    let hasError = false;
    let isVocabularyLoaded = false;
    let typeWords = {};

    function loadSearchFromHash() {
        if (!isVocabularyLoaded) return;
        const hash = decodeURIComponent(window.location.hash.substring(1));
        if (hash) {
            searchBox.value = hash;
            updateSearch(hash);
            updateSearchBoxPlaceholder(hash);
        }
    }

    window.addEventListener('load', async () => {
        if (!window.location.hash || window.location.hash === "#") {
            window.location.hash = '#';
        }

        const isLoaded = await loadData();
        if (isLoaded) {
            loadSearchFromHash();
        }
    });

    window.addEventListener('hashchange', () => {
        if (!isVocabularyLoaded) return;
        const hash = decodeURIComponent(window.location.hash.substring(1));
        if (hash) {
            searchBox.value = hash;
            updateSearch(hash);
            updateSearchBoxPlaceholder(hash);
        } else {
            resultDiv.classList.add('hidden');
            ghostText.textContent = '';
            searchBox.value = '';
            searchContainer.classList.remove('error');
            resultDiv.innerHTML = '';
        }

        const tooltips = document.querySelectorAll('.tooltip');
        tooltips.forEach(tooltip => tooltip.remove());
    });

    searchBox.addEventListener('input', (e) => {
    let query = e.target.value.toLowerCase();

    query = query.replace(/[^abcçdefgğhıijklmnoöprsştuüvyz ]/g, '');

    // Prevent multiple spaces in a row
    query = query.replace(/\s{2,}/g, ' ');

    e.target.value = query;

    updateSearchBoxPlaceholder(query);
    searchWord(query);
});

function updateSearch(query) {
    if (dictionaryData && Object.keys(dictionaryData).length > 0) {
        searchWord(query);

        // URL'deki hash değerini anında güncelle
        if (query) {
            window.history.replaceState(null, null, `#${encodeURIComponent(query)}`);
        } else {
            window.history.replaceState(null, null, `#`);
        }
    } else {
        console.error('Dictionary data not loaded.');
    }
}

    function searchWord(query) {
        // Son yapılan sorgu ile aynıysa işlemi durdurur
        if (query === lastQuery) {
            return;
        }
        lastQuery = query;
    
        // Sonuç alanını temizler
        resultDiv.innerHTML = '';
    
        // Boş veya yalnızca boşluk karakterlerinden oluşan sorguları işler
        if (query.startsWith(' ') || query.trim().length === 0) {
            // Eğer sorgu tamamen boşsa hata kaldırılır
            if (query.length === 0) {
                searchContainer.classList.remove('error');
                ghostText.textContent = "";
                return;
            }
            // Hatalı giriş gösterimi
            searchContainer.classList.add('error');
            document.getElementById('totalEntries').textContent = `${Object.keys(dictionaryData).length}`; // Hatalı girişte toplam kelime sayısını gösterir
            ghostText.textContent = "";
            return;
        } else {
            // Hatalı giriş değilse hata durumunu kaldırır
            searchContainer.classList.remove('error');
        }
    
        const normalizedQuery = normalizeTurkish(query);
    
        // Başlıklarla eşleşme kontrolü
        if (headings.includes(query)) {
            // Eğer başlık ile eşleşirse copy.ico simgesini gösterir
            document.getElementById('totalEntries').innerHTML = '<img src="copy.ico" alt="Copy Icon">';
        } else {
            // Eşleşme yoksa toplam kelime sayısını gösterir
            const wordCount = Object.keys(dictionaryData).length;
            document.getElementById('totalEntries').textContent = `${wordCount}`;
        }
    
        // Kelimeleri normalize edilmiş sorguya göre sıralar
        const sortedWords = Object.keys(dictionaryData)
            .map(word => ({ word: normalizeTurkish(word), original: word }))
            .sort((a, b) => a.word.localeCompare(b.word));
    
        // Sorguyla en yakın eşleşen kelimeyi bulur
        const closestWord = sortedWords.find(({ word }) => word.startsWith(normalizedQuery));
    
        if (closestWord) {
            // Eşleşen kelimenin açıklamasını alır ve formatlar
            const wordDetails = dictionaryData[closestWord.original];
            const description = wordDetails.a.replace(/\n/g, "<br>");
            const descriptionElement = document.createElement('p');
            descriptionElement.classList.add('description');
            descriptionElement.innerHTML = highlightWords(sanitizeHTML(description));
            resultDiv.appendChild(descriptionElement);
    
            // Açıklama elemanının maksimum yüksekliğini belirler
            const descriptionHeight = descriptionElement.offsetHeight;
            descriptionElement.style.maxHeight = `${descriptionHeight}px`;
    
            // FadIn animasyonunu uygular
            resultDiv.style.animation = 'fadeIn 1s ease-in-out';
            ghostText.textContent = closestWord.word.substring(query.length);
        } else {
            // Eşleşme yoksa hata gösterimi
            ghostText.textContent = "";
            searchContainer.classList.add('error');
            document.getElementById('totalEntries').textContent = `${Object.keys(dictionaryData).length}`; // Hatalı girişte toplam kelime sayısını gösterir
        }
    
        // Animasyonun düzgün çalışması için animasyon sıfırlama
        resultDiv.style.animation = 'none';
        resultDiv.offsetHeight;
        resultDiv.style.animation = 'fadeIn 1s ease-in-out';
    
        // Tıklanabilir kelimeleri oluşturur
        createClickableWords();
    }
    
    
    
  // Prevent right-click menu
  document.addEventListener('contextmenu', event => event.preventDefault());

  // Prevent Ctrl+C, Ctrl+X, Ctrl+V, and Print Screen
  document.addEventListener('keydown', (event) => {
    const forbiddenKeys = ['c', 'x', 'v', 'p', 'u'];
    if ((event.ctrlKey || event.metaKey) && forbiddenKeys.includes(event.key)) {
      event.preventDefault();
    }
  });

  // Detect and block Print Screen
  window.addEventListener('keyup', (event) => {
    if (event.key === 'PrintScreen') {
      navigator.clipboard.writeText('');
    }
  });

  // Disable selection
  document.addEventListener('selectstart', event => event.preventDefault());

    function createClickableWords() {
        const wordsArray = Object.keys(clickableWords).sort((a, b) => b.length - a.length); // Önce uzun kelimeleri işle
    
        wordsArray.forEach(word => {
            const escapedWord = word.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1"); // Özel karakterleri kaçır
            const regex = new RegExp(`(${escapedWord})(?!\\w)`, 'g'); // Tam kelimeyi bul, devamında başka harf olmadığından emin ol
    
            // Eşleşme varsa span ile sar
            resultDiv.innerHTML = resultDiv.innerHTML.replace(
                regex,
                `<span class="clickable-word" data-word="${word}">$1</span>`
            );
        });
    
        const clickableElements = document.querySelectorAll('.clickable-word');
        clickableElements.forEach(element => {
            element.addEventListener('click', function () {
                const word = this.getAttribute('data-word');
                this.classList.add('n'); // Seçili durumu işaretle
                showWordMeanings(word, this); // Anlamı göster
            });
        });
    }
    
    
    

    function showWordMeanings(word, element) {
        const meanings = clickableWords[word];

        const existingTooltips = document.querySelectorAll('.tooltip');
        existingTooltips.forEach(tooltip => tooltip.remove());

        if (meanings && meanings.length > 0) {
            if (!currentMeaningIndex[word]) {
                currentMeaningIndex[word] = 0;
            }

            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';

            let meaning = "";
            meanings[currentMeaningIndex[word]].forEach(tempMeaning => meaning += tempMeaning + "<br>");
            tooltip.innerHTML = meaning;

            document.body.appendChild(tooltip);

            const elementRect = element.getBoundingClientRect();
            tooltip.style.position = 'absolute';
            tooltip.style.display = 'block';

            const tooltipRect = tooltip.getBoundingClientRect();
            let top = elementRect.top + window.scrollY - tooltipRect.height - 5;
            let left = elementRect.left + window.scrollX + (elementRect.width / 2) - (tooltipRect.width / 2);

            if (left + tooltipRect.width > window.innerWidth) {
                left = window.innerWidth - tooltipRect.width - 5;
            }
            if (left < 0) {
                left = 5;
            }

            tooltip.style.top = `${top}px`;
            tooltip.style.left = `${left}px`;

            tooltip.style.opacity = 0;
            tooltip.style.transition = 'opacity 0.3s ease-in-out';
            setTimeout(() => {
                tooltip.style.opacity = 1;
            }, 50);

            element.addEventListener('mouseleave', function () {
                tooltip.style.opacity = 0;
                setTimeout(() => {
                    tooltip.remove();
                   element.classList.remove('n')
                }, 300);
            });

            currentMeaningIndex[word] = (currentMeaningIndex[word] + 1) % meanings.length;
        }
    }

    function normalizeTurkish(text) {
        return text.replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase();
    }

    function sanitizeHTML(htmlString) {
        return DOMPurify.sanitize(htmlString, {
            ALLOWED_TAGS: ['span', 'br']
        });
    }

    function highlightWords(text) {
        let markedText = text;
        for (const [key, value] of Object.entries(specialWords)) {
            const regex = new RegExp(`\\b${key}\\b`, 'gi');
            markedText = markedText.replace(regex, (match) => `[SPECIAL:${key}]`);
        }

        let resultText = markedText;
        for (const [key, value] of Object.entries(specialWords)) {
            const regex = new RegExp(`\\[SPECIAL:${key}\\](\\s+)(\\S+)`, 'gi');
            resultText = resultText.replace(regex, (match, p1, p2) => `<b>${value}</b>${p1}<span class="p">${p2}</span>`);
        }

        resultText = resultText.replace(/\[SPECIAL:\S+\]/g, '');

        return resultText;
    }

    function updateSearchBoxPlaceholder(query) {
        if (!query) {
            ghostText.textContent = '';
            return;
        }
        const queryLower = normalizeTurkish(query);
        const matchingWord = Object.keys(dictionaryData)
            .map(word => ({ word: normalizeTurkish(word), original: word }))
            .sort((a, b) => a.word.localeCompare(b.word))
            .find(({ word }) => word.startsWith(queryLower));

        if (matchingWord) {
            const remainingPart = matchingWord.word.substring(query.length);
            ghostText.textContent = remainingPart;

            const inputRect = searchBox.getBoundingClientRect();
            const inputStyle = window.getComputedStyle(searchBox);
            const paddingLeft = parseFloat(inputStyle.paddingLeft);
            const fontSize = parseFloat(inputStyle.fontSize);

            const firstCharWidth = getTextWidth(query, fontSize);
            ghostText.style.left = `${paddingLeft + firstCharWidth}px`;
        } else {
            ghostText.textContent = "";
        }
    }

    function wrapClickableWords() {
        Object.keys(clickableWords).forEach(key => {
            clickableWords[key] = clickableWords[key].map(group => {
                return group.map(item => {
                    Object.entries(specialWords).forEach(([specialKey, specialValue]) => {
                        const regex = new RegExp(`\\b${specialKey}\\b`, 'gi');
                        item = item.replace(regex, `[SPECIAL:${specialKey}]`);
                    });

                    item = item.replace(/“([^”]+)”/g, '<span class="g">“$1”</span>');

                    item = item.replace(/\b(\d+)\b/g, (match) => {
                        const wordType = typeWords[match];
                        if (wordType) {
                            return `<span class="y">${wordType}</span>`;
                        }
                        return match;
                    });

                    item = item.replace(/\[SPECIAL:\S+\]/g, '');

                    return item;
                });
            });
        });
    }

    let headings = [];

async function loadData() {
    try {
        const [vocabularyResponse] = await Promise.all([fetch('vocabulary.json')]);
        const vocabularyData = await vocabularyResponse.json();

        clickableWords = vocabularyData.clickableWords || {};
        specialWords = vocabularyData.specialWords || {};
        entryWords = vocabularyData.entryWords || {};
        typeWords = vocabularyData.typeWords || {};
        headings = Object.keys(entryWords); // Store headings for quick matching

        dictionaryData = entryWords;

        wrapClickableWords();

        // Show total entry count by default
        const totalEntriesElement = document.getElementById('totalEntries');
        const wordCount = Object.keys(entryWords).length;
        totalEntriesElement.textContent = `${wordCount}`;

        isVocabularyLoaded = true;
        return true;
    } catch (error) {
        console.error('Oops!', error);
    }
}
   
document.getElementById('totalEntries').addEventListener('click', async () => {
    const totalEntriesElement = document.getElementById('totalEntries');
    const searchBox = document.getElementById('searchBox');
    const query = searchBox.value.trim();

    const isCopyIconActive = totalEntriesElement.querySelector('img[src="copy.ico"]') !== null;

    if (isCopyIconActive && dictionaryData[query]) {
        // Görünen sonuçtan açıklamayı alır
        const descriptionElement = document.querySelector('#result .description');
        const description = descriptionElement ? descriptionElement.textContent.trim() : '';

        const clipboardContent = `${query}\n\n\n${description}\n\n\n\nsource: ${window.location.href}`;

        try {
            await navigator.clipboard.writeText(clipboardContent); // Panoya kopyala
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    } else {
        // Eğer kopya simgesi aktif değilse, URL hash'inde rastgele bir kelime gösterir
        const entries = Object.keys(entryWords);
        if (entries.length > 0) {
            const randomEntry = entries[Math.floor(Math.random() * entries.length)];
            window.location.hash = `#${randomEntry}`;
        } else {
            console.warn('No entries found in vocabulary.');
        }
    }
});

    

    function getTextWidth(text, fontSize) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = `${fontSize}px 'Poppins', sans-serif`;
        return context.measureText(text).width;
    }
    
function changeCssVariable() { 
  document.documentElement.style.setProperty('--main-red', 'var(--main-darkgreen)');
}

fetch('vocabulary.json')
  .then(response => {
    if (response.ok) {
      return response.json();
    } else {
      throw new Error('Dosya yüklenemedi');
    }
  })
  .then(data => {
    changeCssVariable();
  });

    searchBox.addEventListener('input', () => {
        const query = searchBox.value;
        updateSearchBoxPlaceholder(query);
        searchWord(query);
    });

    document.querySelector('#result').addEventListener('click', (e) => {
        if (e.target.classList.contains('searchable')) {
            const searchbox = document.querySelector('#searchBox');
            searchBox.value = e.target.textContent;
            searchBox.dispatchEvent(new Event('input'));
        }
    });
    // Monitor changes in the search box
document.getElementById('searchBox').addEventListener('input', updateTotalEntriesDisplay);

function updateTotalEntriesDisplay() {
    const searchBox = document.getElementById('searchBox');
    const totalEntriesElement = document.getElementById('totalEntries');
    const query = searchBox.value.trim();
    const isError = searchContainer.classList.contains('error');

    if (query === "" || isError) { // Eğer giriş hatalıysa veya boşsa kelime sayısını göster
        const wordCount = Object.keys(entryWords).length;
        totalEntriesElement.textContent = `${wordCount}`;
    } else if (dictionaryData[query]) { // Eğer sorgu bir girişle eşleşiyorsa kopya simgesini göster
        totalEntriesElement.innerHTML = '<img src="copy.ico" alt="Copy Icon">';
    } else { // Sorgu bir girişle eşleşmiyorsa kelime sayısını göster
        const wordCount = Object.keys(entryWords).length;
        totalEntriesElement.textContent = `${wordCount}`;
    }

    // URL hash güncellemesi, input'a göre her güncellemede çalışır
    if (query) {
        window.history.replaceState(null, null, `#${encodeURIComponent(query)}`);
    } else {
        window.history.replaceState(null, null, `#`);
    }
}


// Add click event listener for totalEntries to handle copying or showing a random word
document.getElementById('totalEntries').addEventListener('click', async () => {
    const totalEntriesElement = document.getElementById('totalEntries');
    const searchBox = document.getElementById('searchBox');
    const query = searchBox.value.trim();

    const isCopyIconActive = totalEntriesElement.querySelector('img[src="copy.ico"]') !== null;

    if (isCopyIconActive && dictionaryData[query]) {
        // Get the description from the visible result
        const descriptionElement = document.querySelector('#result .description');
        const description = descriptionElement ? descriptionElement.textContent.trim() : '';

        const clipboardContent = `${query}\n\n\n${description}\n\n\n\nsource: ${window.location.href}`;

        try {
            await navigator.clipboard.writeText(clipboardContent); // Copy to clipboard
            
        } catch (err) {
            console.error('Failed to copy:', err);
            
        }
    } else {
        // If the copy icon isn't active, show a random word in the URL hash
        const entries = Object.keys(entryWords);
        if (entries.length > 0) {
            const randomEntry = entries[Math.floor(Math.random() * entries.length)];
            window.location.hash = `#${randomEntry}`;
        } else {
            console.warn('No entries found in vocabulary.');
        }
    }
    
});

    
    

});
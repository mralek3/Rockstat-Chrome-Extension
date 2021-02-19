// Импорт модулей
import objToDoc from '/popup-modules/objToDoc.js';

// Действия при загрузке страницы (DOM дерева)
document.addEventListener('DOMContentLoaded', init);

// Инициализация
function init() {
    // Установка глобальных переменных
    const global = {
        reqCount: 0, // Общее количество выполненных запросов
        blockNum: 1  // Номер раскрываемого блока
    }

    document.querySelector('span.title').innerHTML = chrome.runtime.getManifest().name;
    document.querySelector('span.version').innerHTML = 'Версия ' + chrome.runtime.getManifest().version;
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        let domain = tabs[0].url.match(/.*:\/\/([^\/]+).*/)?.[1] || ''; // Домен активной вкладки
        document.querySelector("#domain").innerHTML = domain;
    });

    msg(global); // Обработка сообщений
    document.querySelector('#filter').addEventListener('input', applyFilter); // Обработка фильтрации
    document.querySelector('#clearFilter').addEventListener('click', clearFilter); // Обработка очистки поля ввода фильтра
}

// Обработка сообщений
function msg(global) {
    let port = chrome.runtime.connect();

    // Если порт был отключен, очистить переменную port
    port.onDisconnect.addListener(() => { port = undefined; });
    
    // Если порт существует/подключен, отправить сообщение
    port?.postMessage({msg: 'handshake'});
    
    // Прослушивать сообщения на port
    port.onMessage.addListener(function(request) {
        if (request.msg === 'requests') {
            // Вывести полученную информацию о запросах в html документ
            document.querySelector('div.container.font').appendChild( objToDoc(request.data, global) );
            applyFilter(); // Обновить список блоков по фильтру
            global.reqCount += request.data.length; // Увеличить счетчик количества выполненных запросов

            // Изменить надпись о количестве выполненных запросов
            let textReqCount;
            let n = global.reqCount; // Число выполненных запросов
            if (n % 10 === 1 && n % 100 !== 11) { // Если число запросов заканчивается на 1
                textReqCount = 'запрос выполнен';
            } else if ( // Если число запросов заканчивается на 2, 3 или 4
                (n % 10 === 2 || n % 10 === 3 || n % 10 === 4) &&
                (n % 100 !== 12 && n % 100 !== 13 && n % 100 !== 14)
            ) {
                textReqCount = 'запроса выполнено';
            } else { // Все остальные варианты
                textReqCount = 'запросов выполнено';
            }
            document.querySelector("#requestCount").innerText = n;
            document.querySelector("#textReqCount").innerText = ` ${textReqCount} на `;
        }
    });
}

// Функция применения фильтра
function applyFilter() {
    let input = document.querySelector('#filter');
    let filterStr = input.value || '';
    let blocksCollection = document.querySelector('div.container.font').children; // HTML-коллекция блоков с содержимым
    let clear = document.querySelector('#clearFilter');

    // Если текст фильтра пустой
    if (filterStr === '') {
        clear.style.display = 'none'; // Скрыть кнопку очистки поля ввода фильтра
    } else {
        clear.style.display = 'inline-block'; // Показать кнопку очистки поля ввода фильтра
    }

    // Перебор HTML-коллекции блоков с содержимым
    for (let i = 0; i < blocksCollection.length; i++) {
        let el = blocksCollection[i];
        // Если заголовок блока содержит текст из фильтра
        if ( el.querySelector('label')?.innerText.includes(filterStr) ) {
            el.style.display = ''; // Показать блок
        } else {
            el.style.display = 'none'; // Скрыть блок
        }
    }
}

// Функция очистки поля ввода фильтра
function clearFilter() {
    let input = document.querySelector('#filter');
    input.value = '';
    applyFilter();
    input.focus();
}
(function() {
let connection; // Порт для связи с popup
const requestsAll = {}; // Объект, в котором хранятся все запросы со всех открытых вкладок браузера
const filterStr = 't4k.json'; // Строка, которую обязательно должен содержать запрос в url

// Слушатель события отправки запроса
chrome.webRequest.onBeforeRequest.addListener(
	onRequest,
	{urls: ['*://*/*']},
	['requestBody']
);

// Слушатель и обработчик события перезагрузки вкладки
chrome.tabs.onUpdated.addListener(function(id, info, tab) {
	// Если в объекте requestsAll хранятся данные для перезагруженной вкладки
	if ( info.status === 'loading' && requestsAll.hasOwnProperty(id) ) {
		delete requestsAll[id]; // Удалить данные для перезагруженной вкладки
	}
});

// Слушатель и обработчик события закрытия вкладки
chrome.tabs.onRemoved.addListener(function(id, info) {
	// Если в объекте requestsAll хранятся данные для закрытой вкладки
	if ( requestsAll.hasOwnProperty(id) ) {
		delete requestsAll[id]; // Удалить данные для закрытой вкладки
	}
});

// Слушатель и обработчик события действия браузера
chrome.browserAction.onClicked.addListener(function(tab) {
	chrome.browserAction.setPopup({popup: 'popup.html'});
});

// Слушатель и обработчик события установления соединения с popup
chrome.runtime.onConnect.addListener(function(port) {
	connection = port; // Записать данные соединения в переменную connection
    connection.onDisconnect.addListener(() => { connection = undefined; }); // При отключении очистить переменную connection
	// Слушатель и обработчик события получения сообщения
	port.onMessage.addListener(function(request) {
		if (request.msg !== 'handshake') return; // Если полученное сообщение не "handshake", завершить функцию
		// Получить id активной вкладки
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			let id = tabs[0].id;
			// Отправить ответ
			let data = requestsAll[id];
			if ( !requestsAll.hasOwnProperty(id) ) data = []; // Если нет данных для активной вкладки
			port.postMessage({msg: 'requests', data: data});
		});
	});
});

// Callback функция при событии отправки запроса
function onRequest(details) {
	if ( details.method === 'POST' && details.url.includes(filterStr) ) {
		let arrayBuffer = details.requestBody.raw[0].bytes;
		let encodedURI = String.fromCharCode.apply( null, new Uint8Array(arrayBuffer) );
		encodedURI = decodeURIComponent( escape(encodedURI) ); // Преобразовать ISO-8859-1 в UTF-8
		let postedString = decodeURIComponent( encodedURI );
		let postedObj = JSON.parse(postedString);
		writeNewRequest(details.tabId, postedObj);
	}
}

// Функция записи данных нового запроса в объект requestsAll
function writeNewRequest(tabId, bodyObj) {
	if ( requestsAll.hasOwnProperty(tabId) ) {
		let requestsTab = requestsAll[tabId];
		requestsTab[requestsTab.length] = bodyObj;
	} else {
		requestsAll[tabId] = [bodyObj]; // Добавить объект в массив запросов для указанной вкладки
	}

	let reqCount = requestsAll[tabId].length; // Количество выполненных запросов

	// Установить значок для действия браузера с количеством выполненных запросов
	chrome.browserAction.setBadgeText({tabId: tabId, text: reqCount.toString()}, () => {});
	chrome.browserAction.setBadgeBackgroundColor({color: '#0000FF', tabId: tabId}, () => {});

	// Отправить новые данные запроса в popup
	connection?.postMessage({msg: 'requests', data: [bodyObj]});
}

})();
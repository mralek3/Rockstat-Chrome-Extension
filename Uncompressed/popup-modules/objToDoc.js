// Перевод массива объектов в DocumentFragment в виде списка раскрываемых блоков
export default function objToDoc(objArr, global) {
    let fragment = document.createDocumentFragment(); // Создать новый пустой фрагмент

    // Перебор массива объектов - запросов для активной вкладки
    objArr.forEach(function(obj) {
        let labelText = (obj.name || '') + ' - ' + (obj.projectId || '');
        createHtmlBlock(obj, labelText, fragment);
    });

    // Создание разворачиваемого блока HTML
    function createHtmlBlock(obj, labelText, fragment) {
        let divBlock = document.createElement('div'); // Создать новый элемент div
        divBlock.className = 'block';

        let inputHide = document.createElement('input'); // Создать новый элемент input
        inputHide.id = 'hd-' + global.blockNum;
        inputHide.className = 'hide';
        inputHide.type = 'checkbox';
        inputHide.addEventListener('change', scrollToContent); // Добавить слушатель события изменения состояния чекбокса
        divBlock.appendChild(inputHide);

        let label = document.createElement('label'); // Создать новый элемент label
        label.htmlFor = 'hd-' + global.blockNum;
        label.innerHTML = labelText;
        divBlock.appendChild(label);
        global.blockNum++;

        let divContent = document.createElement('div'); // Создать новый элемент div
        // Создание вложенного содержимого
        divContent.appendChild( createInnerContent(obj) );
        divBlock.appendChild(divContent); // Добавить содержимое в divBlock элемент

        fragment.appendChild(divBlock); // Поместить элемент div в фрагмент
    }

    // Перебор всех свойств объекта, создание DocumentFragment
    function createInnerContent(obj) {
        let contentFragment = document.createDocumentFragment(); // Создать новый пустой фрагмент

        for (let key in obj) {
            if (
                key == 'name' ||
                key == 'projectId' ||
                key == '__proto__'
            ) continue; // Пропустить определенные свойства

            if ( typeof(obj[key]) !== 'object' ) {
                // Если текущее свойство не является объектом
                let span = document.createElement('span'); // Создать новый элемент span
                let value = obj[key];
                span.innerHTML = '<span class="key">' + key + ': ' + '</span>' + value; // Текст текущего пункта списка
                contentFragment.appendChild(span);
            } else {
                // Если текущее свойство является объектом
                let stringObj = objToStr(obj[key]);
                // Заголовок раскрываемого блока
                let labelText = '<span class="key">' + key + ': ' + '</span>' + '<span class="autohide">' + stringObj + '</span>';
                createHtmlBlock(obj[key], labelText, contentFragment);
            }
        }

        // Функция перевода объекта в строку (без кавычек)
        function objToStr(obj) {
            let content = '';
            let i = 0;
            for (let key in obj) {
                i++;
                content += `${key}: ${typeof(obj[key]) === 'object' ? objToStr(obj[key]) : obj[key]}${i === Object.keys(obj).length ? '' : ', '}`;
            }
            return `{${content}}`;
        }

        return contentFragment;
    }

    // Прокрутка к содержимому раскрытого блока
    function scrollToContent() {
        let input = this; // Элемент input (скрытый чекбокс)

        if (input.checked) { // Если чекбокс активен (блок был раскрыт)
            let block = input.parentElement; // Блок, в котором хранится чекбокс, заголовок и содержимое
            let rect = block.getBoundingClientRect(); // Получить координаты границ раскрытого блока
            if (rect.bottom > window.innerHeight) { // Если блок находится ниже области просмотра
                let wrapp = document.querySelector('div.wrapp'); // Контейнер wrapp
                let wrappHeight = parseInt( getComputedStyle(wrapp).height ); // Высота контейнера wrapp

                // Если высота блока больше высоты окна
                if ( block.offsetHeight > wrappHeight ) {
                    block.scrollIntoView(); // Прокрутить к верхней границе содержимого
                } else {
                    block.scrollIntoView(false); // Прокрутить к нижней границе содержимого
                }
            }
        }
    }

    return fragment;
}
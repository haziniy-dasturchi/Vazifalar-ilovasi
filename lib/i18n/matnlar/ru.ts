import type { MatnKaliti } from './uz'

/** Ruscha matnlar. Kalitlar `uz.ts` bilan bir xil bo'lishi shart. */
export const ru: Record<MatnKaliti, string> = {
  // ---------- Главная страница (открытая, для поисковиков) ----------
  'bosh.meta.sarlavha': 'Samara — бесплатный менеджер задач и планировщик',
  'bosh.meta.qisqaSarlavha': 'Samara — бесплатный менеджер задач',
  'bosh.meta.tavsif':
    'Бесплатный список дел и планировщик дня. Задачи, напоминания по времени, папки, прогресс и отчёт за день. Без рекламы и слежки, работает офлайн.',

  'bosh.h1': 'Список задач и планирование дня',
  'bosh.kirish':
    'Samara помогает спланировать день и довести дела до конца. Список задач, напоминания по времени, папки и отчёт за день. Без рекламы и слежки, бесплатно для всех.',
  'bosh.tugma.boshlash': 'Начать бесплатно',
  'bosh.tugma.ochish': 'Открыть Samara',
  'bosh.kirishIzoh':
    'Войдите через аккаунт Google — придумывать отдельный пароль не нужно.',

  'bosh.imkoniyatlar.sarlavha': 'Что внутри',
  'bosh.imkoniyat.bittaIsh.nom': 'Одно дело за раз',
  'bosh.imkoniyat.bittaIsh.matn':
    'Начатая задача всегда на виду в отдельном разделе, поэтому вопрос «что делать сейчас?» решается одним нажатием.',
  'bosh.imkoniyat.reja.nom': 'Сегодня и дальше',
  'bosh.imkoniyat.reja.matn':
    'Сегодняшние, просроченные и будущие дела — в отдельных списках. Повторяющиеся задачи тоже есть.',
  'bosh.imkoniyat.eslatma.nom': 'Напоминания по времени',
  'bosh.imkoniyat.eslatma.matn':
    'Укажите время у задачи — и телефон напомнит о ней, даже если приложение закрыто.',
  'bosh.imkoniyat.papka.nom': 'Папки и проекты',
  'bosh.imkoniyat.papka.matn':
    'Работа, учёба, домашние дела — каждое в своей папке, а внутри ещё и разделы.',
  'bosh.imkoniyat.foiz.nom': 'Прогресс в процентах',
  'bosh.imkoniyat.foiz.matn':
    'Для дел, которые не закончить за день: отметьте 50% сегодня и продолжите завтра с того же места.',
  'bosh.imkoniyat.offline.nom': 'Работает офлайн',
  'bosh.imkoniyat.offline.matn':
    'Пропала связь — ничего не потеряется: изменения сохранятся на устройстве и отправятся сами, когда интернет вернётся.',
  'bosh.imkoniyat.mavzu.nom': 'Тёмная тема',
  'bosh.imkoniyat.mavzu.matn':
    'Светлая, тёмная или как настроено на устройстве.',
  'bosh.imkoniyat.bepul.nom': 'Бесплатно и без рекламы',
  'bosh.imkoniyat.bepul.matn':
    'Никакой рекламы и трекеров. Ваши данные не продаются.',

  'bosh.savollar.sarlavha': 'Частые вопросы',
  'bosh.savol.bepul': 'Samara бесплатна?',
  'bosh.javob.bepul':
    'Да, полностью. Нет платных тарифов, рекламы и скрытых списаний.',
  'bosh.savol.ornatish': 'Можно установить на телефон?',
  'bosh.javob.ornatish':
    'Да. Samara — это PWA: откройте в браузере, добавьте на главный экран, и она будет работать как обычное приложение. На Android появится кнопка «Установить», на iPhone — «Поделиться» → «На экран «Домой»» в Safari.',
  'bosh.savol.offline': 'Работает без интернета?',
  'bosh.javob.offline':
    'Да. Задачи, добавленные или изменённые офлайн, сохраняются на устройстве и отправляются на сервер автоматически, когда связь восстановится.',
  'bosh.savol.eslatma': 'Как работают напоминания?',
  'bosh.javob.eslatma':
    'Укажите время у задачи — в этот момент на телефон придёт уведомление. Разрешение на уведомления нужно дать один раз.',
  'bosh.savol.xavfsizlik': 'Мои данные в безопасности?',
  'bosh.javob.xavfsizlik':
    'Каждый аккаунт видит только свои данные — это обеспечивается на уровне базы. Удалить аккаунт вместе со всеми данными можно в любой момент прямо в приложении.',

  'bosh.chaqiriq.sarlavha': 'Начните сегодня',
  'bosh.chaqiriq.matn':
    'Регистрация — одно нажатие. Платёжные данные не запрашиваются.',

  'bosh.havola.maxfiylik': 'Политика конфиденциальности',
  'bosh.havola.shartlar': 'Условия использования',
  'bosh.havola.hisobOchirish': 'Удалить аккаунт',
  'bosh.tilTanlash': 'Язык',

  // ---------- Общие действия ----------
  'umumiy.saqlash': 'Сохранить',
  'umumiy.saqlanmoqda': 'Сохранение…',
  'umumiy.qoshish': 'Добавить',
  'umumiy.ochirish': 'Удалить',
  'umumiy.yopish': 'Закрыть',
  'umumiy.bekor': 'Отмена',
  'umumiy.tayyor': 'Готово',
  'umumiy.kuting': 'Подождите…',
  'umumiy.yoqish': 'Включить',
  'umumiy.qaytaUrinish': 'Повторить',
  'umumiy.yuklanmoqda': 'Загрузка…',
  'umumiy.xato': 'Произошла ошибка',
  'umumiy.xatoMatn': 'Не удалось загрузить данные. Проверьте подключение.',
  'umumiy.bajarilmadi': 'Не получилось. Попробуйте ещё раз.',
  'umumiy.saqlanmadi': 'Не удалось сохранить. Попробуйте ещё раз.',

  // ---------- Навигация ----------
  'nav.jarayonda': 'В работе',
  'nav.bugun': 'Сегодня',
  'nav.kelgusi': 'Предстоящие',
  'nav.korish': 'Обзор',
  'nav.papkalar': 'Папки',
  'nav.yangiPapka': 'Новая папка',
  'nav.arxiv': 'Архив папок',
  'nav.sozlamalar': 'Настройки',
  'nav.chiqish': 'Выйти',
  'nav.profilMenyusi': 'Меню профиля',
  'nav.asosiyBolimlar': 'Основные разделы',

  // ---------- Задача ----------
  'vazifa.yangi': 'Новая задача',
  'vazifa.tahrirlash': 'Изменить задачу',
  'vazifa.nomiJoy': 'Что нужно сделать?',
  'vazifa.qachon': 'Когда',
  'vazifa.muhimlik': 'Приоритет',
  'vazifa.bajarildi': 'Выполнено',
  'vazifa.papka': 'Папка',
  'vazifa.bolim': 'Раздел',
  'vazifa.bolimsiz': 'Без раздела',
  'vazifa.loyiha': 'Проект',
  'vazifa.loyihasiz': 'Без проекта',
  'vazifa.izoh': 'Описание',
  'vazifa.qoshildi': 'Задача добавлена',
  'vazifa.yangilandi': 'Задача обновлена',
  'vazifa.ochirildi': 'Задача удалена',
  'vazifa.ochirishSarlavha': 'Удалить задачу',
  'vazifa.ochirishTasdiq':
    '«{nom}» будет удалена безвозвратно. Это действие нельзя отменить.',
  'vazifa.ochirilmadi': 'Не удалось удалить. Попробуйте ещё раз.',

  // ---------- Выбор даты ----------
  'sana.tanlash': 'Выбрать дату',
  'sana.bugun': 'Сегодня',
  'sana.ertaga': 'Завтра',
  'sana.keyingiHafta': 'Следующая неделя',
  'sana.damOlish': 'Выходные',
  'sana.sanasiz': 'Без даты',
  'sana.vaqtQoshish': 'Добавить время',
  'sana.vaqtniOlib': 'Убрать время',
  'sana.boshqaVaqt': 'Укажите другое время',
  'sana.takrorlanish': 'Повтор',
  'sana.takrorniOlib': 'Убрать повтор',
  'sana.harKuni': 'Каждый день',
  'sana.ishKunlari': 'По будням',
  'sana.harHafta': 'Каждую неделю',
  'sana.harOy': 'Каждый месяц',
  'sana.oldingiOy': 'Предыдущий месяц',
  'sana.keyingiOy': 'Следующий месяц',
  // ---------- Дни недели (для повтора) ----------
  'kun.1.qisqa': 'Пн', 'kun.2.qisqa': 'Вт', 'kun.3.qisqa': 'Ср',
  'kun.4.qisqa': 'Чт', 'kun.5.qisqa': 'Пт', 'kun.6.qisqa': 'Сб',
  'kun.7.qisqa': 'Вс',
  'kun.1.toliq': 'Понедельник', 'kun.2.toliq': 'Вторник',
  'kun.3.toliq': 'Среда', 'kun.4.toliq': 'Четверг',
  'kun.5.toliq': 'Пятница', 'kun.6.toliq': 'Суббота', 'kun.7.toliq': 'Воскресенье',
  'sana.tanlanganKunlar': 'Выбранные дни',
  'sana.kunlarniTanlang': 'Выберите дни',
  'sana.haftaKunlari': 'Дни недели',
  // ---------- Быстрое добавление и проекты ----------
  'vazifa.qoshishTugma': 'Добавить задачу',
  'kechki.nimaQilasiz': 'Что сделаете завтра?',
  'loyiha.bolimi': 'Проекты',
  'loyiha.izoh':
    'Эта папка устроена иначе: каждый раздел внутри неё — отдельный проект. Разбейте большую работу на части и сразу видите, насколько продвинулась каждая.',
  'loyiha.belgisi': 'Проект',
  'loyiha.soni': 'проектов: {son}',
  'loyiha.yangi': 'Новый проект',
  'loyiha.guruh.jarayonda': 'Проекты в работе',
  'loyiha.guruh.rejada': 'Проекты в планах',
  'loyiha.guruh.bajarilgan': 'Завершённые проекты',
  // ---------- Поручения ----------
  'topshiriq.bolimi': 'Поручения',
  'topshiriq.kelgan': 'Входящие',
  'topshiriq.yuborilgan': 'Отправленные',
  'topshiriq.yangi': 'Отправить поручение',
  'topshiriq.kimga': 'Кому (email)',
  'topshiriq.kimgaJoy': 'colleague@example.com',
  'topshiriq.sarlavha': 'Что нужно сделать',
  'topshiriq.izoh': 'Примечание (необязательно)',
  'topshiriq.izohJoy': 'Дополнительные детали…',
  'topshiriq.muddat': 'Срок',
  'topshiriq.yubor': 'Отправить',
  'topshiriq.yuborildi': 'Поручение отправлено',
  'topshiriq.yuborilmadi': 'Не удалось отправить. Попробуйте ещё раз.',
  'topshiriq.ozigaBolmaydi': 'Нельзя отправить поручение самому себе',
  'topshiriq.emailNotogri': 'Адрес электронной почты указан неверно',
  'topshiriq.yuborishIzohi':
    'Поручение дойдёт только до пользователя Samara. Если аккаунта с этим адресом пока нет, человек увидит его после регистрации.',
  'topshiriq.qabul': 'Принять',
  'topshiriq.rad': 'Отклонить',
  'topshiriq.radSababi': 'Почему отклоняете?',
  'topshiriq.radSababiJoy': 'Например: нет времени, это не моя задача…',
  'topshiriq.radYubor': 'Отправить отказ',
  'topshiriq.qabulQilindi': 'Принято — добавлено во «Входящие»',
  'topshiriq.radEtildi': 'Отклонено',
  'topshiriq.bekor': 'Отменить',
  'topshiriq.bekorQilindi': 'Поручение отменено',
  'topshiriq.holat.kutilmoqda': 'Ожидает ответа',
  'topshiriq.holat.qabul': 'Принято',
  'topshiriq.holat.rad': 'Отклонено',
  'topshiriq.holat.bajarildi': 'Выполнено',
  'topshiriq.kimdan': 'от {kim}',
  'topshiriq.boshKelgan': 'Поручений пока нет',
  'topshiriq.boshKelganMatn':
    'Когда вам отправят поручение, оно появится здесь и придёт уведомление.',
  'topshiriq.boshYuborilgan': 'Вы ещё не отправляли поручений',
  'topshiriq.boshYuborilganMatn':
    'Нажмите кнопку выше, чтобы поручить работу другому пользователю Samara.',
  'topshiriq.tavsiyalar': 'Использованные ранее',




  // ---------- Настройки ----------
  'sozlamalar.sarlavha': 'Настройки',
  'sozlamalar.tavsif':
    'Здесь можно управлять профилем, внешним видом и уведомлениями.',
  'sozlamalar.bolimlar': 'Разделы настроек',
  'sozlamalar.yuklanmadi':
    'Не удалось загрузить настройки. Проверьте подключение и обновите страницу.',
  'sozlamalar.tab.profil': 'Профиль',
  'sozlamalar.tab.umumiy': 'Общие',
  'sozlamalar.tab.korinish': 'Внешний вид',
  'sozlamalar.tab.yonPanel': 'Боковая панель',
  'sozlamalar.tab.bildirishnoma': 'Уведомления',

  'sozlamalar.rasm.sarlavha': 'Фото профиля',
  'sozlamalar.rasm.tavsif': 'JPG, PNG или WebP. До 2 МБ.',
  'sozlamalar.rasm.yuklash': 'Загрузить фото',
  'sozlamalar.rasm.yuklanmoqda': 'Загрузка…',
  'sozlamalar.rasm.olibTashlash': 'Убрать',
  'sozlamalar.rasm.yangilandi': 'Фото профиля обновлено',
  'sozlamalar.rasm.olindi': 'Фото профиля удалено',
  'sozlamalar.rasm.notogriTur': 'Загрузить можно только JPG, PNG или WebP',
  'sozlamalar.rasm.kattaHajm': 'Размер изображения не должен превышать 2 МБ',
  'sozlamalar.rasm.yuklanmadi':
    'Не удалось загрузить изображение. Проверьте подключение и попробуйте снова.',

  'sozlamalar.ism.sarlavha': 'Имя',
  'sozlamalar.ism.saqlandi': 'Имя сохранено',
  'sozlamalar.ism.bosh': 'Имя не может быть пустым',
  'sozlamalar.email.sarlavha': 'Эл. почта',
  'sozlamalar.email.tavsif':
    '{email} — привязана к аккаунту Google, изменить её здесь нельзя.',

  'sozlamalar.mintaqa.sarlavha': 'Часовой пояс',
  'sozlamalar.mintaqa.tavsif':
    'Напоминания приходят по этому поясу. Сейчас там {vaqt}.',
  'sozlamalar.mintaqa.qurilmadagi': 'Взять с устройства ({mintaqa})',
  'sozlamalar.mintaqa.saqlandi': 'Часовой пояс сохранён',

  'sozlamalar.til.sarlavha': 'Язык',
  'sozlamalar.til.tavsif':
    'Язык приложения. Выбор применяется на этом устройстве сразу и сохраняется в аккаунт.',
  'sozlamalar.til.saqlandi': 'Язык изменён',

  'sozlamalar.korinish.sarlavha': 'Внешний вид',
  'sozlamalar.korinish.tizim': 'Система',
  'sozlamalar.korinish.yorug': 'Светлая',
  'sozlamalar.korinish.qorongi': 'Тёмная',
  'sozlamalar.korinish.tizimTavsif':
    'Как настроено на устройстве — сейчас {holat}.',
  'sozlamalar.korinish.qorongiTavsif':
    'Всегда тёмная, даже если на устройстве выбрана светлая.',
  'sozlamalar.korinish.yorugTavsif':
    'Всегда светлая, даже если на устройстве выбрана тёмная.',

  'sozlamalar.yonPanel.sarlavha': 'Порядок разделов',
  'sozlamalar.yonPanel.tavsif':
    'Верхний раздел открывается при запуске приложения. Сейчас — «{bolim}».',
  'sozlamalar.yonPanel.birinchi': 'первый',
  'sozlamalar.yonPanel.yuqoriga': '{nom} — выше',
  'sozlamalar.yonPanel.pastga': '{nom} — ниже',
  'sozlamalar.yonPanel.sukut': 'Вернуть порядок по умолчанию',
  'sozlamalar.yonPanel.izoh':
    'Порядок сохраняется в аккаунте — он одинаков и на телефоне, и на компьютере.',

  'sozlamalar.bildirishnoma.sarlavha': 'Напоминания о задачах',
  'sozlamalar.bildirishnoma.qollamaydi':
    'Этот браузер не поддерживает уведомления.',
  'sozlamalar.bildirishnoma.radEtilgan':
    'Уведомления запрещены в настройках браузера.',
  // ---------- Напоминание об уведомлениях (нижняя панель) ----------
  'eslatma.sarlavha': 'Включить напоминания?',
  'eslatma.matn':
    'Напомним о задачах, у которых указано время, — даже если приложение закрыто.',
  'umumiy.keyinroq': 'Позже',

  'sozlamalar.bildirishnoma.yoqilgan':
    'Напомним о задачах, у которых указано время, — даже если приложение закрыто.',
  'sozlamalar.bildirishnoma.ochiq':
    'Включите, чтобы получать напоминания о задачах с указанным временем.',
  'sozlamalar.bildirishnoma.tavsiya': 'Рекомендуем',
  'sozlamalar.bildirishnoma.tavsiyaMatn':
    'Без напоминаний задачи с указанным временем легко пропустить. Браузер один раз спросит разрешение.',
  'sozlamalar.bildirishnoma.qaytarish':
    'Чтобы вернуть разрешение, нажмите значок замка в адресной строке браузера и переведите «Уведомления» в разрешённые.',
  'sozlamalar.bildirishnoma.yoqildi': 'Уведомления включены',
  'sozlamalar.bildirishnoma.ochirildi': 'Уведомления выключены',
  'sozlamalar.bildirishnoma.ruxsatYoq':
    'Браузер отказал. Разрешите уведомления в его настройках.',

  // ---------- Отчёт ----------
  'hisobot.qisman': 'Частично выполненные',
  'hisobot.qismanXulosa': 'задач: {soni} · в среднем {ortacha}%',
  'hisobot.qismanHolat': 'Сейчас выполнено {foiz}%',

  // ---------- Повтор (RRULE) ----------
  'takror.harNKun': 'Каждые {n} дн.',
  'takror.harNHafta': 'Каждые {n} нед.',
  'takror.harNHaftaKunlar': 'Каждые {n} нед.: {kunlar}',
  'takror.harNOy': 'Каждые {n} мес.',
  'takror.harYili': 'Каждый год',
  'takror.harNYil': 'Каждые {n} года',
  'takror.oySana': 'Каждое {kunlar} число месяца',
  'takror.oyOxirgi': 'В последний день месяца',
  'takror.oyHafta': 'Каждый {orn}-й {kun} месяца',
  'takror.oyOxirgiHafta': 'В последний {kun} месяца',
  'takror.qisqaSana': '{kunlar} число',
  'takror.qisqaOxirgi': 'последний день',
  'takror.qisqaHafta': '{orn}-й {kun}',
  'takror.qisqaOxirgiHafta': 'последний {kun}',
  'takror.tugashSana': 'до {sana}',
  'takror.tugashMarta': '{n} раз',
  // Окно настройки повтора
  'takror.boshqa': 'Другое...',
  'takror.sarlavha': 'Настройка повтора',
  'takror.asos': 'Отсчёт',
  'takror.asosJadval': 'От запланированной даты',
  'takror.asosJadvalIzoh': 'Следующая дата считается по расписанию',
  'takror.asosBajarilgan': 'От даты выполнения',
  'takror.asosBajarilganIzoh':
    'Следующая дата считается со дня выполнения задачи',
  'takror.har': 'Каждые',
  'takror.birlik.kun': 'дн.',
  'takror.birlik.hafta': 'нед.',
  'takror.birlik.oy': 'мес.',
  'takror.birlik.yil': 'г.',
  'takror.oyUsuli.sana': 'Число месяца',
  'takror.oyUsuli.haftaKuni': 'День недели',
  'takror.oxirgiKun': 'Последний день',
  'takror.oxirgisi': 'Последний',
  'takror.uzunOyOgoh':
    '29, 30 и 31 число в коротких месяцах переносятся на последний день.',
  'takror.kopSanaOgoh':
    'Если выбрано несколько чисел, 29–31 в коротких месяцах пропускаются.',
  'takror.tugashi': 'Окончание',
  'takror.tugashHech': 'Никогда',
  'takror.tugashSanagacha': 'До даты (включительно)',
  'takror.tugashMartaTanlov': 'После',
  'takror.martaBirlik': 'раз',
  'takror.martaChek':
    'Ограничение «раз» не работает вместе с «от даты выполнения».',
  'takror.xulosa': 'Результат',
  'takror.kunTanlashKerak': 'Выберите хотя бы один день',

  // ---------- Состояние офлайн ----------
  'offline.yoq': 'Нет интернета — продолжайте работать, изменения сохранятся при подключении',
  'offline.kutmoqda': 'изменений в очереди: {n}',
  'offline.yuborilmoqda': 'Синхронизация изменений: {n}',
  'offline.xato':
    'Не сохранено изменений: {n}. Перезагрузите приложение и попробуйте снова.',

  // ---------- Ошибка и состояние соединения ----------
  'xato.sarlavha': 'Не удалось загрузить данные',
  'xato.matn': 'Связь может быть слабой. Попробуйте ещё раз через минуту.',
  'xato.offlineSarlavha': 'Нет интернета',
  'xato.offlineMatn':
    'Сейчас доступен только список, сохранённый на этом устройстве. Ничего не потеряется — всё сохранится само, когда связь вернётся.',

  // ---------- Папка: всё выполнено ----------
  'papka.hammasiBajarildi': 'Всё выполнено',
  'papka.hammasiBajarildiMatn':
    'Здесь не осталось открытых задач. Выполненные скрыты, чтобы не загромождать список — их видно на странице «Отчёт».',
}

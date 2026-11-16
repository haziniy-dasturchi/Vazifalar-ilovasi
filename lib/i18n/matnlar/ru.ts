import type { MatnKaliti } from './uz'

/** Ruscha matnlar. Kalitlar `uz.ts` bilan bir xil bo'lishi shart. */
export const ru: Record<MatnKaliti, string> = {
  // ---------- Главная страница (открытая, для поисковиков) ----------
  'bosh.meta.sarlavha': 'Samara — бесплатный список задач и ежедневник',
  'bosh.meta.qisqaSarlavha': 'Samara — список задач и ежедневник',
  'bosh.meta.tavsif':
    'Samara — бесплатное приложение для списка задач и планирования дня. Напоминания по времени, папки и отчёт за день. Без рекламы, работает офлайн.',

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
    'Язык интерфейса. Выбор сохраняется в аккаунте — на других устройствах будет тот же язык.',
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
}

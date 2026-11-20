import type { MatnKaliti } from './uz'

/** Inglizcha matnlar. Kalitlar `uz.ts` bilan bir xil bo'lishi shart. */
export const en: Record<MatnKaliti, string> = {
  // ---------- Landing page (public, for search engines) ----------
  'bosh.meta.sarlavha': 'Samara — free task manager and daily planner',
  'bosh.meta.qisqaSarlavha': 'Samara — free task manager',
  'bosh.meta.tavsif':
    'A free to-do list and daily planner. Tasks, timed reminders, folders, progress tracking and a daily report. No ads, no tracking, works offline.',

  'bosh.h1': 'A to-do list and daily planner that keeps you moving',
  'bosh.kirish':
    'Samara helps you plan and finish your day in one place. A to-do list, timed reminders, folders and a daily report. No ads, no tracking, free for everyone.',
  'bosh.tugma.boshlash': 'Start for free',
  'bosh.tugma.ochish': 'Open Samara',
  'bosh.kirishIzoh':
    'Sign in with your Google account — no new password to remember.',

  'bosh.imkoniyatlar.sarlavha': 'What you get',
  'bosh.imkoniyat.bittaIsh.nom': 'One task at a time',
  'bosh.imkoniyat.bittaIsh.matn':
    'Whatever you started stays in its own view, so “what should I do now?” is answered in a single tap.',
  'bosh.imkoniyat.reja.nom': 'Today and what’s coming',
  'bosh.imkoniyat.reja.matn':
    'Today, overdue and upcoming work live in separate lists. Recurring tasks are supported too.',
  'bosh.imkoniyat.eslatma.nom': 'Timed reminders',
  'bosh.imkoniyat.eslatma.matn':
    'Give a task a time and your phone will remind you — even when the app is closed.',
  'bosh.imkoniyat.papka.nom': 'Folders and projects',
  'bosh.imkoniyat.papka.matn':
    'Work, study, errands — keep each in its own folder and split it into sections.',
  'bosh.imkoniyat.foiz.nom': 'Progress in percent',
  'bosh.imkoniyat.foiz.matn':
    'For work that spans days: mark it 50% today and pick up where you left off tomorrow.',
  'bosh.imkoniyat.offline.nom': 'Works offline',
  'bosh.imkoniyat.offline.matn':
    'Lose connection and nothing is lost — your changes are saved on the device and sent as soon as you are back online.',
  'bosh.imkoniyat.mavzu.nom': 'Dark mode',
  'bosh.imkoniyat.mavzu.matn':
    'Light, dark, or follow whatever your device is set to.',
  'bosh.imkoniyat.bepul.nom': 'Free, with no ads',
  'bosh.imkoniyat.bepul.matn':
    'No advertising, no tracking scripts. Your data is never sold.',

  'bosh.savollar.sarlavha': 'Frequently asked questions',
  'bosh.savol.bepul': 'Is Samara free?',
  'bosh.javob.bepul':
    'Yes, completely. There is no paid tier, no advertising and no hidden charges.',
  'bosh.savol.ornatish': 'Can I install it on my phone?',
  'bosh.javob.ornatish':
    'Yes. Samara is a PWA: open it in your browser, add it to the home screen and it behaves like any other app. Android shows an “Install” button; on iPhone use Share → “Add to Home Screen” in Safari.',
  'bosh.savol.offline': 'Does it work without internet?',
  'bosh.javob.offline':
    'Yes. Tasks you add or change offline are stored on the device and sent to the server automatically once the connection returns.',
  'bosh.savol.eslatma': 'How do reminders work?',
  'bosh.javob.eslatma':
    'Give a task a time and your phone gets a notification then. You only need to allow notifications once.',
  'bosh.savol.xavfsizlik': 'Is my data safe?',
  'bosh.javob.xavfsizlik':
    'Every account can only ever read its own data — this is enforced by the database itself. You can delete your account and everything in it from inside the app at any time.',

  'bosh.chaqiriq.sarlavha': 'Start today',
  'bosh.chaqiriq.matn':
    'Signing up takes one tap. No payment details are asked for.',

  'bosh.havola.maxfiylik': 'Privacy policy',
  'bosh.havola.shartlar': 'Terms of use',
  'bosh.havola.hisobOchirish': 'Delete account',
  'bosh.tilTanlash': 'Language',

  // ---------- Common actions ----------
  'umumiy.saqlash': 'Save',
  'umumiy.saqlanmoqda': 'Saving…',
  'umumiy.qoshish': 'Add',
  'umumiy.ochirish': 'Delete',
  'umumiy.yopish': 'Close',
  'umumiy.bekor': 'Cancel',
  'umumiy.tayyor': 'Done',
  'umumiy.kuting': 'Please wait…',
  'umumiy.yoqish': 'Turn on',
  'umumiy.qaytaUrinish': 'Try again',
  'umumiy.yuklanmoqda': 'Loading…',
  'umumiy.xato': 'Something went wrong',
  'umumiy.xatoMatn': 'Could not load the data. Check your connection.',
  'umumiy.bajarilmadi': 'That did not work. Please try again.',
  'umumiy.saqlanmadi': 'Could not save. Please try again.',

  // ---------- Navigation ----------
  'nav.jarayonda': 'In progress',
  'nav.bugun': 'Today',
  'nav.kelgusi': 'Upcoming',
  'nav.korish': 'Overview',
  'nav.papkalar': 'Folders',
  'nav.yangiPapka': 'New folder',
  'nav.arxiv': 'Archived folders',
  'nav.sozlamalar': 'Settings',
  'nav.chiqish': 'Sign out',
  'nav.profilMenyusi': 'Profile menu',
  'nav.asosiyBolimlar': 'Main sections',

  // ---------- Task ----------
  'vazifa.yangi': 'New task',
  'vazifa.tahrirlash': 'Edit task',
  'vazifa.nomiJoy': 'What needs doing?',
  'vazifa.qachon': 'When',
  'vazifa.muhimlik': 'Priority',
  'vazifa.bajarildi': 'Progress',
  'vazifa.papka': 'Folder',
  'vazifa.bolim': 'Section',
  'vazifa.bolimsiz': 'No section',
  'vazifa.loyiha': 'Project',
  'vazifa.loyihasiz': 'No project',
  'vazifa.izoh': 'Description',
  'vazifa.qoshildi': 'Task added',
  'vazifa.yangilandi': 'Task updated',
  'vazifa.ochirildi': 'Task deleted',
  'vazifa.ochirishSarlavha': 'Delete task',
  'vazifa.ochirishTasdiq':
    '“{nom}” will be deleted for good. This cannot be undone.',
  'vazifa.ochirilmadi': 'Could not delete. Please try again.',

  // ---------- Date picker ----------
  'sana.tanlash': 'Pick a date',
  'sana.bugun': 'Today',
  'sana.ertaga': 'Tomorrow',
  'sana.keyingiHafta': 'Next week',
  'sana.damOlish': 'This weekend',
  'sana.sanasiz': 'No date',
  'sana.vaqtQoshish': 'Add a time',
  'sana.vaqtniOlib': 'Remove time',
  'sana.boshqaVaqt': 'Enter another time',
  'sana.takrorlanish': 'Repeat',
  'sana.takrorniOlib': 'Remove repeat',
  'sana.harKuni': 'Every day',
  'sana.ishKunlari': 'Weekdays',
  'sana.harHafta': 'Every week',
  'sana.harOy': 'Every month',
  'sana.oldingiOy': 'Previous month',
  'sana.keyingiOy': 'Next month',
  // ---------- Weekdays (for recurrence) ----------
  'kun.1.qisqa': 'Mon', 'kun.2.qisqa': 'Tue', 'kun.3.qisqa': 'Wed',
  'kun.4.qisqa': 'Thu', 'kun.5.qisqa': 'Fri', 'kun.6.qisqa': 'Sat',
  'kun.7.qisqa': 'Sun',
  'kun.1.toliq': 'Monday', 'kun.2.toliq': 'Tuesday',
  'kun.3.toliq': 'Wednesday', 'kun.4.toliq': 'Thursday',
  'kun.5.toliq': 'Friday', 'kun.6.toliq': 'Saturday', 'kun.7.toliq': 'Sunday',
  'sana.tanlanganKunlar': 'Selected days',
  'sana.kunlarniTanlang': 'Pick the days',
  'sana.haftaKunlari': 'Days of the week',
  // ---------- Quick add and projects ----------
  'vazifa.qoshishTugma': 'Add task',
  'kechki.nimaQilasiz': 'What will you do tomorrow?',
  'loyiha.bolimi': 'Projects',
  'loyiha.izoh':
    'This folder works differently: each section inside it is a separate project. Break a large piece of work into parts and see at a glance how far along each one is.',
  'loyiha.belgisi': 'Project',
  'loyiha.soni': '{son} projects',
  'loyiha.yangi': 'New project',
  'loyiha.guruh.jarayonda': 'In progress',
  'loyiha.guruh.rejada': 'Planned',
  'loyiha.guruh.bajarilgan': 'Completed',
  // ---------- Assignments ----------
  'topshiriq.bolimi': 'Assignments',
  'topshiriq.kelgan': 'Received',
  'topshiriq.yuborilgan': 'Sent',
  'topshiriq.yangi': 'Send an assignment',
  'topshiriq.kimga': 'To (email)',
  'topshiriq.kimgaJoy': 'colleague@example.com',
  'topshiriq.sarlavha': 'What needs doing',
  'topshiriq.izoh': 'Note (optional)',
  'topshiriq.izohJoy': 'Any extra detail…',
  'topshiriq.muddat': 'Due date',
  'topshiriq.yubor': 'Send',
  'topshiriq.yuborildi': 'Assignment sent',
  'topshiriq.yuborilmadi': 'Could not send. Please try again.',
  'topshiriq.ozigaBolmaydi': 'You cannot assign something to yourself',
  'topshiriq.emailNotogri': 'That email address does not look right',
  'topshiriq.yuborishIzohi':
    'Assignments only reach Samara users. If no account uses this address yet, they will see it once they sign up.',
  'topshiriq.qabul': 'Accept',
  'topshiriq.rad': 'Decline',
  'topshiriq.radSababi': 'Why are you declining?',
  'topshiriq.radSababiJoy': 'For example: no time, not my area…',
  'topshiriq.radYubor': 'Send decline',
  'topshiriq.qabulQilindi': 'Accepted — added to your Inbox',
  'topshiriq.radEtildi': 'Declined',
  'topshiriq.bekor': 'Cancel',
  'topshiriq.bekorQilindi': 'Assignment cancelled',
  'topshiriq.holat.kutilmoqda': 'Awaiting reply',
  'topshiriq.holat.qabul': 'Accepted',
  'topshiriq.holat.rad': 'Declined',
  'topshiriq.holat.bajarildi': 'Done',
  'topshiriq.kimdan': 'from {kim}',
  'topshiriq.boshKelgan': 'No assignments yet',
  'topshiriq.boshKelganMatn':
    'When someone sends you an assignment it appears here and you get a notification.',
  'topshiriq.boshYuborilgan': 'You have not sent any assignments',
  'topshiriq.boshYuborilganMatn':
    'Use the button above to hand work to another Samara user.',
  'topshiriq.tavsiyalar': 'Previously used',




  // ---------- Settings ----------
  'sozlamalar.sarlavha': 'Settings',
  'sozlamalar.tavsif':
    'Manage your profile, appearance and notifications here.',
  'sozlamalar.bolimlar': 'Settings sections',
  'sozlamalar.yuklanmadi':
    'Could not load your settings. Check your connection and reload the page.',
  'sozlamalar.tab.profil': 'Profile',
  'sozlamalar.tab.umumiy': 'General',
  'sozlamalar.tab.korinish': 'Appearance',
  'sozlamalar.tab.yonPanel': 'Sidebar',
  'sozlamalar.tab.bildirishnoma': 'Notifications',

  'sozlamalar.rasm.sarlavha': 'Profile photo',
  'sozlamalar.rasm.tavsif': 'JPG, PNG or WebP. Up to 2 MB.',
  'sozlamalar.rasm.yuklash': 'Upload photo',
  'sozlamalar.rasm.yuklanmoqda': 'Uploading…',
  'sozlamalar.rasm.olibTashlash': 'Remove',
  'sozlamalar.rasm.yangilandi': 'Profile photo updated',
  'sozlamalar.rasm.olindi': 'Profile photo removed',
  'sozlamalar.rasm.notogriTur': 'Only JPG, PNG or WebP images can be uploaded',
  'sozlamalar.rasm.kattaHajm': 'The image must be under 2 MB',
  'sozlamalar.rasm.yuklanmadi':
    'Could not upload the image. Check your connection and try again.',

  'sozlamalar.ism.sarlavha': 'Name',
  'sozlamalar.ism.saqlandi': 'Name saved',
  'sozlamalar.ism.bosh': 'Name cannot be empty',
  'sozlamalar.email.sarlavha': 'Email',
  'sozlamalar.email.tavsif':
    '{email} — tied to your Google account and cannot be changed here.',

  'sozlamalar.mintaqa.sarlavha': 'Time zone',
  'sozlamalar.mintaqa.tavsif':
    'Reminders are sent according to this zone. It is {vaqt} there right now.',
  'sozlamalar.mintaqa.qurilmadagi': 'Use this device’s zone ({mintaqa})',
  'sozlamalar.mintaqa.saqlandi': 'Time zone saved',

  'sozlamalar.til.sarlavha': 'Language',
  'sozlamalar.til.tavsif':
    'The language of the app. Your choice applies on this device right away and is saved to your account too.',
  'sozlamalar.til.saqlandi': 'Language changed',

  'sozlamalar.korinish.sarlavha': 'Appearance',
  'sozlamalar.korinish.tizim': 'System',
  'sozlamalar.korinish.yorug': 'Light',
  'sozlamalar.korinish.qorongi': 'Dark',
  'sozlamalar.korinish.tizimTavsif':
    'Follows your device — currently {holat}.',
  'sozlamalar.korinish.qorongiTavsif':
    'Always dark, even when your device is set to light.',
  'sozlamalar.korinish.yorugTavsif':
    'Always light, even when your device is set to dark.',

  'sozlamalar.yonPanel.sarlavha': 'Section order',
  'sozlamalar.yonPanel.tavsif':
    'The section at the top is what you see when the app opens. Right now — “{bolim}”.',
  'sozlamalar.yonPanel.birinchi': 'first',
  'sozlamalar.yonPanel.yuqoriga': 'Move {nom} up',
  'sozlamalar.yonPanel.pastga': 'Move {nom} down',
  'sozlamalar.yonPanel.sukut': 'Restore default order',
  'sozlamalar.yonPanel.izoh':
    'The order is saved to your account, so it is the same on your phone and your computer.',

  'sozlamalar.bildirishnoma.sarlavha': 'Task reminders',
  'sozlamalar.bildirishnoma.qollamaydi':
    'This browser does not support notifications.',
  'sozlamalar.bildirishnoma.radEtilgan':
    'Notifications are blocked in your browser settings.',
  // ---------- Notification nudge (bottom bar) ----------
  'eslatma.sarlavha': 'Turn on reminders?',
  'eslatma.matn':
    'We will remind you about tasks that have a time — even when the app is closed.',
  'umumiy.keyinroq': 'Later',

  'sozlamalar.bildirishnoma.yoqilgan':
    'We will remind you about tasks that have a time — even when the app is closed.',
  'sozlamalar.bildirishnoma.ochiq':
    'Turn this on to get reminders for tasks that have a time.',
  'sozlamalar.bildirishnoma.tavsiya': 'Recommended',
  'sozlamalar.bildirishnoma.tavsiyaMatn':
    'Without reminders, tasks with a set time are easy to miss. Your browser will ask for permission once.',
  'sozlamalar.bildirishnoma.qaytarish':
    'To allow them again, click the lock icon in your browser’s address bar and set “Notifications” to allowed.',
  'sozlamalar.bildirishnoma.yoqildi': 'Notifications turned on',
  'sozlamalar.bildirishnoma.ochirildi': 'Notifications turned off',
  'sozlamalar.bildirishnoma.ruxsatYoq':
    'The browser refused. Allow notifications in its settings.',

  // ---------- Report ----------
  'hisobot.qisman': 'Partly done',
  'hisobot.qismanXulosa': '{soni} tasks · {ortacha}% on average',
  'hisobot.qismanHolat': '{foiz}% done so far',
}

export type Language = 'en' | 'ur'

export const translations = {
  en: {
    myTasks:          'My Tasks',
    myWages:          'My Wages',
    home:             'Home',
    wages:            'Wages',
    noTasks:          'No tasks assigned',
    noTasksDesc:      'Your supervisor will assign work to you',
    taskAssigned:     'Assigned',
    taskInProgress:   'In Progress',
    taskDone:         'Done',
    taskCollected:    'Collected',
    taskApproved:     'Approved',
    startWork:        'Start Work',
    markDone:         'Mark as Done',
    waitingCollection:'Waiting for Collection',
    collected:        'Piece Collected',
    process:          'Process',
    item:             'Item',
    weight:           'Weight',
    karat:            'Karat',
    nextProcess:      'Next Process',
    estimatedWage:    'Estimated Wage',
    pendingApproval:  'Pending Approval',
    approved:         'Approved',
    paid:             'Paid',
    thisWeek:         'This Week',
    total:            'Total',
    notifications:    'Notifications',
    noNotifications:  'No notifications',
    signOut:          'Sign Out',
    language:         'Language',
    casting:          'Casting',
    filing:           'Filing',
    stoneSetting:     'Stone Setting',
    polishing:        'Polishing',
    rhodium:          'Rhodium Plating',
    engraving:        'Engraving',
    meenakari:        'Meenakari',
    soldering:        'Soldering',
    buffing:          'Buffing',
    qualityCheck:     'Quality Check',
    areYouSure:       'Are you sure?',
    confirmDone:      'Confirm you have completed this task',
    confirm:          'Confirm',
    cancel:           'Cancel',
    back:             'Back',
    good:             'Good',
    great:            'Great',
  },
  ur: {
    myTasks:          'میرے کام',
    myWages:          'میری اجرت',
    home:             'ہوم',
    wages:            'اجرت',
    noTasks:          'کوئی کام نہیں',
    noTasksDesc:      'سپروائزر آپ کو کام دیں گے',
    taskAssigned:     'تفویض',
    taskInProgress:   'جاری ہے',
    taskDone:         'مکمل',
    taskCollected:    'جمع کیا',
    taskApproved:     'منظور',
    startWork:        'کام شروع کریں',
    markDone:         'مکمل کریں',
    waitingCollection:'جمع کرنے کا انتظار',
    collected:        'ٹکڑا جمع ہو گیا',
    process:          'عمل',
    item:             'چیز',
    weight:           'وزن',
    karat:            'کیرٹ',
    nextProcess:      'اگلا عمل',
    estimatedWage:    'متوقع اجرت',
    pendingApproval:  'منظوری زیر التواء',
    approved:         'منظور شدہ',
    paid:             'ادا شدہ',
    thisWeek:         'اس ہفتے',
    total:            'کل',
    notifications:    'اطلاعات',
    noNotifications:  'کوئی اطلاع نہیں',
    signOut:          'باہر نکلیں',
    language:         'زبان',
    casting:          'ڈھلائی',
    filing:           'ریتی',
    stoneSetting:     'نگینہ جڑائی',
    polishing:        'پالش',
    rhodium:          'روڈیم کوٹنگ',
    engraving:        'نقش کاری',
    meenakari:        'مینا کاری',
    soldering:        'ملاپ',
    buffing:          'چمکانا',
    qualityCheck:     'معیار جانچ',
    areYouSure:       'کیا آپ یقین رکھتے ہیں؟',
    confirmDone:      'تصدیق کریں کہ آپ نے یہ کام مکمل کر لیا ہے',
    confirm:          'تصدیق کریں',
    cancel:           'منسوخ',
    back:             'واپس',
    good:             'اچھا',
    great:            'بہت اچھا',
  },
}

export function t(lang: Language, key: keyof typeof translations['en']): string {
  return translations[lang][key] ?? translations['en'][key]
}

export const PROCESS_ICONS: Record<string, string> = {
  'casting':         '🔥',
  'filing':          '🔨',
  'stone setting':   '💎',
  'polishing':       '✨',
  'rhodium plating': '⚗️',
  'engraving':       '🖊️',
  'meenakari':       '🎨',
  'soldering':       '🔧',
  'buffing':         '💫',
  'quality check':   '✅',
  'design':          '📐',
  'default':         '⚙️',
}

export function getProcessIcon(processName: string): string {
  const key = processName.toLowerCase()
  for (const [k, v] of Object.entries(PROCESS_ICONS)) {
    if (key.includes(k)) return v
  }
  return PROCESS_ICONS['default']
}

export const CATEGORY_ICONS: Record<string, string> = {
  'bangles':         '⭕',
  'kara':            '🔘',
  'rings':           '💍',
  'gents rings':     '💍',
  'bracelets':       '📿',
  'gents bracelets': '📿',
  'necklaces':       '📿',
  'earrings':        '✨',
  'sets':            '🎁',
  'pendants':        '🔮',
  'default':         '💰',
}

export function getCategoryIcon(categoryName: string): string {
  const key = categoryName.toLowerCase()
  for (const [k, v] of Object.entries(CATEGORY_ICONS)) {
    if (key.includes(k)) return v
  }
  return CATEGORY_ICONS['default']
}

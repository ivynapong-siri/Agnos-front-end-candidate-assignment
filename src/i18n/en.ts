/**
 * English is the source of truth for the dictionary *shape*: `Dictionary` is
 * `typeof en`, so a missing or misspelled key in another language is a compile
 * error rather than a blank space on the page.
 *
 * Values are plain strings only — no functions. The dictionary is loaded in a
 * server component and handed to client components as props, and functions
 * cannot cross that boundary. Placeholders are `{name}`, filled by `fill()`.
 */
const en = {
  meta: {
    siteTitle: 'Agnos Patient Intake',
    siteDescription:
      'A responsive patient intake form that mirrors every keystroke onto a live front-desk dashboard.',
    patientTitle: 'Patient form',
    patientDescription: 'Tell us who you are before your appointment.',
    staffTitle: 'Front desk',
    staffDescription: 'Live view of every patient form currently being filled in.',
  },

  nav: {
    languageLabel: 'Language',
    home: 'Agnos Health, back to start',
  },

  landing: {
    eyebrow: 'Patient intake',
    heading: 'Paperwork that the front desk can already see.',
    body: 'The patient fills in one form on their own phone. Every answer appears on the staff screen as it is typed — so nobody re-reads a clipboard, and nobody waits to find out a field was missed.',
    patientTitle: "I'm a patient",
    patientBlurb: 'Fill in your details before you see the doctor. Takes about two minutes on a phone.',
    patientCta: 'Start the form',
    staffTitle: "I'm staff",
    staffBlurb: 'Watch every form fill in live, and see at a glance who has finished and who needs a hand.',
    staffCta: 'Open the front desk',
    footnote: 'Open both in two windows — or one on a laptop and one on a phone — to see them sync.',
  },

  form: {
    heading: 'Before you see the doctor',
    intro:
      '{total} questions, {optional} of them optional. The front desk sees your answers as you type, so there is nothing to hand over at the end.',
    optional: 'optional',
    choose: 'Please choose…',
    progress: '{filled} of {total} required answers',
    progressLabel: 'Form completion',
    privacy:
      'Sent to the front desk over an encrypted connection and shown only to staff on duty. Nothing is written to a database, and closing this page clears it.',
    submit: 'Submit my information',
    errorSummary_one: '1 answer needs another look',
    errorSummary_other: '{count} answers need another look',

    sections: {
      personal: {
        title: 'Who you are',
        blurb: 'Your name and date of birth, exactly as they appear on your ID or passport.',
      },
      contact: {
        title: 'How we reach you',
        blurb: 'We use these to confirm your appointment and send your results — nothing else.',
      },
      background: {
        title: 'A few last details',
        blurb:
          'These help us care for you well. Anything marked optional can be left blank if you would rather not share it.',
      },
    },

    fields: {
      firstName: { label: 'First name', placeholder: 'Somchai', hint: '' },
      middleName: { label: 'Middle name', placeholder: '', hint: '' },
      lastName: { label: 'Last name', placeholder: 'Jaidee', hint: '' },
      dateOfBirth: { label: 'Date of birth', placeholder: '', hint: 'Year, month, day' },
      gender: { label: 'Gender', placeholder: '', hint: '' },
      phone: {
        label: 'Phone number',
        placeholder: '081 234 5678',
        hint: 'Mobile preferred, so we can send you a reminder',
      },
      email: { label: 'Email address', placeholder: 'somchai@example.com', hint: '' },
      address: {
        label: 'Home address',
        placeholder: '99/1 Sukhumvit Road, Khlong Toei, Bangkok 10110',
        hint: 'Street, district, city and postal code',
      },
      preferredLanguage: {
        label: 'Preferred language',
        placeholder: '',
        hint: 'The language you would like us to speak and write in',
      },
      nationality: {
        label: 'Nationality',
        placeholder: 'Thai',
        hint: 'Start typing, or pick from the list',
      },
      religion: {
        label: 'Religion',
        placeholder: '',
        hint: 'Only so we can respect your dietary and care preferences',
      },
      emergencyContactName: { label: 'Emergency contact name', placeholder: 'Malee Jaidee', hint: '' },
      emergencyContactRelationship: { label: 'Relationship to you', placeholder: '', hint: '' },
    },

    // Keys are the canonical stored values, which stay English in every
    // language so a mid-form language switch cannot invalidate an answer.
    options: {
      gender: {
        Male: 'Male',
        Female: 'Female',
        'Non-binary': 'Non-binary',
        Other: 'Other',
        'Prefer not to say': 'Prefer not to say',
      },
      language: {
        Thai: 'Thai',
        English: 'English',
        'Chinese (Mandarin)': 'Chinese (Mandarin)',
        Japanese: 'Japanese',
        Korean: 'Korean',
        Burmese: 'Burmese',
        Khmer: 'Khmer',
        Lao: 'Lao',
        Arabic: 'Arabic',
        Other: 'Other',
      },
      religion: {
        Buddhism: 'Buddhism',
        Christianity: 'Christianity',
        Islam: 'Islam',
        Hinduism: 'Hinduism',
        Sikhism: 'Sikhism',
        Judaism: 'Judaism',
        'No religion': 'No religion',
        Other: 'Other',
        'Prefer not to say': 'Prefer not to say',
      },
      relationship: {
        Parent: 'Parent',
        'Spouse or partner': 'Spouse or partner',
        Sibling: 'Sibling',
        Child: 'Child',
        'Other relative': 'Other relative',
        Friend: 'Friend',
        Caregiver: 'Caregiver',
        Other: 'Other',
      },
      // Nationality is free text; these are only datalist suggestions, so the
      // stored value is whatever the patient actually types.
      nationality: {
        Thai: 'Thai',
        American: 'American',
        British: 'British',
        Australian: 'Australian',
        Canadian: 'Canadian',
        Chinese: 'Chinese',
        Japanese: 'Japanese',
        Korean: 'Korean',
        Indian: 'Indian',
        Singaporean: 'Singaporean',
        Malaysian: 'Malaysian',
        Vietnamese: 'Vietnamese',
        Filipino: 'Filipino',
        Indonesian: 'Indonesian',
        Burmese: 'Burmese',
        Lao: 'Lao',
        Cambodian: 'Cambodian',
        German: 'German',
        French: 'French',
        Dutch: 'Dutch',
        Russian: 'Russian',
        Brazilian: 'Brazilian',
      },
    },
  },

  receipt: {
    thanks: 'Thank you, {name}',
    next: 'Your details are now on the front desk screen. A staff member will call your name shortly — you do not need to queue again. If anything is wrong, tell them your reference and they can correct it on the spot.',
    another: 'Fill in another form',
  },

  staff: {
    title: 'Front desk',
    none: 'No patients yet',
    count_one: '1 patient this session',
    count_other: '{count} patients this session',
    openForm: 'Open a patient form ↗',
    all: 'All',
    details: 'Submitted details',
    notAnswered: 'Not answered yet',
    ofRequired: '{filled} of {total} required',
    emptyTitle: 'Waiting for the first patient',
    emptyBody:
      'Every keystroke on a patient form appears here within a quarter of a second. Open a form in another tab or on your phone to watch it fill in live.',
    noneWithStatus: 'No patients with the status “{status}” right now.',
    showAll: 'Show everyone',
    export: {
      button: 'Export CSV',
      nothing: 'Nothing to export yet',
      filename: 'agnos-patients',
      reference: 'Reference',
      status: 'Status',
      progress: 'Answered',
      updated: 'Last updated',
    },
  },

  status: {
    filling: { label: 'Actively filling', short: 'Filling', title: 'Typed within the last {idle} seconds' },
    idle: { label: 'Paused', short: 'Paused', title: 'No input for {idle}s or more, still on the page' },
    inactive: {
      label: 'Inactive',
      short: 'Inactive',
      title: 'No input for {inactive}s or more — may need help',
    },
    submitted: { label: 'Submitted', short: 'Submitted', title: 'Form completed and submitted' },
    disconnected: {
      label: 'Left the form',
      short: 'Left',
      title: 'Closed the page before submitting',
    },
  },

  connection: {
    live: 'Live',
    connecting: 'Connecting…',
    error: 'Reconnecting…',
    off: 'Sync off',
  },

  setup: {
    title: 'Real-time sync is switched off',
    body: 'No Supabase credentials are set, so this page cannot talk to the other one. Copy {example} to {local}, add your project URL and anon key, and restart the dev server. Everything else on this page works without it.',
    back: 'Back to start',
  },

  theme: {
    label: 'Colour-blind mode',
    hint: 'Raises contrast, and changes the status colours so they stay distinct with red–green colour blindness',
  },

  picker: {
    search: 'Search',
    empty: 'Nothing matches that',
    useCustom: 'Use “{value}”',
    country: 'Country code',
    chooseDate: 'Choose a date',
    year: 'Choose a year',
    prevMonth: 'Previous month',
    nextMonth: 'Next month',
    clear: 'Clear',
    weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  },

  contact: {
    open: 'Questions?',
    title: 'We can help',
    blurb: 'Front desk, every day 8am to 8pm. Nothing you type here is sent when you contact us.',
    phone: 'Call the clinic',
    line: 'Chat on LINE',
    email: 'Email us',
  },

  time: {
    justNow: 'just now',
    seconds: '{n}s ago',
    minutes: '{n}m ago',
    hours: '{n}h ago',
  },

  validation: {
    required: '{label} is required',
    tooLong: '{label} must be {max} characters or fewer',
    nameChars: '{label} may only contain letters, spaces, hyphens and apostrophes',
    chooseOne: 'Please select {label}',
    chooseFromList: 'Please choose an option from the list',
    dobRequired: 'Date of birth is required',
    dobInvalid: 'Enter a valid date in YYYY-MM-DD format',
    dobFuture: 'Date of birth cannot be in the future',
    dobTooOld: 'Date of birth cannot be more than {max} years ago',
    phoneChars: 'Phone number may only contain digits, spaces and + ( ) -',
    phoneLength: 'Enter a valid phone number ({min}–{max} digits)',
    emailInvalid: 'Enter a valid email address, e.g. name@example.com',
    addressTooShort: 'Please include street, city and postal code',
    nationalityTooShort: 'Nationality is required',
    emergencyNeedsRelationship: 'Tell us how this person is related to you',
    emergencyNeedsName: 'Add the name of your emergency contact',
  },
}

export default en

import type { Dictionary } from './index'

/**
 * Typed as Dictionary, so a key added to English and forgotten here fails the
 * build rather than rendering blank. `dictionaries have matching shapes` in
 * i18n.test.ts covers the runtime side.
 *
 * Copy is written short and plain: many of these patients are elderly, and this
 * form is read on a phone in a waiting room.
 */
const th: Dictionary = {
  meta: {
    siteTitle: 'ลงทะเบียนผู้ป่วย Agnos',
    siteDescription: 'ฟอร์มลงทะเบียนผู้ป่วย ที่ส่งทุกคำตอบขึ้นหน้าจอเคาน์เตอร์แบบเรียลไทม์',
    patientTitle: 'ฟอร์มผู้ป่วย',
    patientDescription: 'บอกเราหน่อยว่าคุณเป็นใคร ก่อนถึงเวลานัด',
    staffTitle: 'เคาน์เตอร์ต้อนรับ',
    staffDescription: 'ดูฟอร์มผู้ป่วยทุกใบที่กำลังกรอกอยู่ แบบสด',
    loginTitle: 'เข้าสู่ระบบเจ้าหน้าที่',
    loginDescription: 'เข้าสู่ระบบเพื่อดูหน้าเคาน์เตอร์ของ Agnos',
    registerTitle: 'สมัครใช้งานสำหรับเจ้าหน้าที่',
    registerDescription: 'ลงทะเบียนเพื่อขอสิทธิ์เข้าหน้าเคาน์เตอร์ของ Agnos',
    resetTitle: 'ตั้งรหัสผ่านใหม่',
    resetDescription: 'ส่งลิงก์ตั้งรหัสผ่านใหม่สำหรับหน้าเคาน์เตอร์',
  },

  nav: {
    languageLabel: 'ภาษา',
    home: 'Agnos Health กลับหน้าแรก',
  },

  landing: {
    eyebrow: 'ลงทะเบียนผู้ป่วย',
    heading: 'กรอกข้อมูลที่เคาน์เตอร์เห็นทันที',
    body: 'ผู้ป่วยกรอกฟอร์มเดียวบนมือถือของตัวเอง ทุกคำตอบขึ้นบนหน้าจอเจ้าหน้าที่ระหว่างที่พิมพ์ ไม่ต้องอ่านกระดาษซ้ำ และไม่ต้องรอถึงตอนท้ายจึงรู้ว่ากรอกไม่ครบ',
    patientTitle: 'ฉันเป็นผู้ป่วย',
    patientBlurb:
      'กรอกข้อมูลก่อนพบแพทย์ ใช้เวลาประมาณ 2 นาทีบนมือถือของคุณเอง หยุดพักกลางคันได้ ระบบเก็บสิ่งที่กรอกไว้ให้',
    patientCta: 'เริ่มกรอกฟอร์ม',
    staffTitle: 'ฉันเป็นเจ้าหน้าที่',
    staffBlurb: 'ดูทุกฟอร์มที่กำลังกรอกแบบสด เห็นได้ทันทีว่าใครกรอกเสร็จ ใครต้องการความช่วยเหลือ',
    staffCta: 'เปิดหน้าเคาน์เตอร์',
    footnote: 'เปิดสองหน้าต่างพร้อมกัน หรือหน้าหนึ่งบนคอมและอีกหน้าบนมือถือ เพื่อดูการซิงค์',
  },

  form: {
    heading: 'ก่อนพบแพทย์',
    intro:
      '{total} คำถาม ไม่บังคับ {optional} ข้อ เจ้าหน้าที่เห็นคำตอบของคุณระหว่างที่พิมพ์ จึงไม่ต้องยื่นเอกสารอะไรตอนท้าย',
    optional: 'ไม่บังคับ',
    choose: 'กรุณาเลือก',
    progress: 'ตอบแล้ว {filled} จาก {total} ข้อที่ต้องกรอก',
    progressLabel: 'ความคืบหน้าการกรอกฟอร์ม',
    privacy:
      'ส่งถึงเคาน์เตอร์ผ่านการเชื่อมต่อที่เข้ารหัส และแสดงเฉพาะเจ้าหน้าที่ที่ปฏิบัติงานอยู่ เมื่อกดส่ง ข้อมูลจะถูกเก็บไว้ 24 ชั่วโมงเพื่อให้เจ้าหน้าที่เปิดดูย้อนหลังได้ แล้วลบทิ้งอัตโนมัติ — เว็บตัวอย่างนี้บันทึกภาพหน้าจอระหว่างใช้งานไว้เพื่อหาข้อผิดพลาด กรุณาอย่ากรอกข้อมูลจริง',
    submit: 'ส่งข้อมูลของฉัน',
    errorSummary_one: 'มี 1 ข้อที่ต้องแก้ไข',
    errorSummary_other: 'มี {count} ข้อที่ต้องแก้ไข',

    sections: {
      personal: {
        title: 'ข้อมูลของคุณ',
        blurb: 'ชื่อและวันเกิด ตามที่ปรากฏในบัตรประชาชนหรือหนังสือเดินทาง',
      },
      contact: {
        title: 'ช่องทางติดต่อ',
        blurb: 'เราใช้เพื่อยืนยันนัดและส่งผลตรวจให้คุณเท่านั้น ไม่ใช้ทำอย่างอื่น',
      },
      background: {
        title: 'ข้อมูลเพิ่มเติมเล็กน้อย',
        blurb: 'ช่วยให้เราดูแลคุณได้ดีขึ้น ข้อที่เขียนว่าไม่บังคับ เว้นว่างไว้ได้หากไม่สะดวกบอก',
      },
    },

    fields: {
      firstName: { label: 'ชื่อ', placeholder: 'สมชาย', hint: '' },
      middleName: { label: 'ชื่อกลาง', placeholder: '', hint: '' },
      lastName: { label: 'นามสกุล', placeholder: 'ใจดี', hint: '' },
      dateOfBirth: { label: 'วันเกิด', placeholder: '', hint: 'ปี เดือน วัน' },
      gender: { label: 'เพศ', placeholder: '', hint: '' },
      phone: {
        label: 'เบอร์โทรศัพท์',
        placeholder: '081 234 5678',
        hint: 'แนะนำเบอร์มือถือ เพื่อให้เราส่งข้อความแจ้งเตือนได้',
      },
      email: { label: 'อีเมล', placeholder: 'somchai@example.com', hint: '' },
      address: {
        label: 'ที่อยู่',
        placeholder: '99/1 ถนนสุขุมวิท คลองเตย กรุงเทพฯ 10110',
        hint: 'ถนน เขตหรืออำเภอ จังหวัด และรหัสไปรษณีย์',
      },
      preferredLanguage: {
        label: 'ภาษาที่ต้องการใช้สื่อสาร',
        placeholder: '',
        hint: 'ภาษาที่คุณต้องการให้เราพูดและเขียนด้วย',
      },
      nationality: {
        label: 'สัญชาติ',
        placeholder: 'ไทย',
        hint: 'เริ่มพิมพ์ หรือเลือกจากรายการ',
      },
      religion: {
        label: 'ศาสนา',
        placeholder: '',
        hint: 'เพื่อให้เราเคารพเรื่องอาหารและการดูแลของคุณเท่านั้น',
      },
      emergencyContactName: { label: 'ชื่อผู้ติดต่อกรณีฉุกเฉิน', placeholder: 'มาลี ใจดี', hint: '' },
      emergencyContactRelationship: { label: 'ความสัมพันธ์กับคุณ', placeholder: '', hint: '' },
    },

    options: {
      gender: {
        Male: 'ชาย',
        Female: 'หญิง',
        'Non-binary': 'ไม่ระบุเพศสภาพ',
        Other: 'อื่น ๆ',
        'Prefer not to say': 'ไม่ต้องการระบุ',
      },
      language: {
        Thai: 'ไทย',
        English: 'อังกฤษ',
        'Chinese (Mandarin)': 'จีนกลาง',
        Japanese: 'ญี่ปุ่น',
        Korean: 'เกาหลี',
        Burmese: 'พม่า',
        Khmer: 'เขมร',
        Lao: 'ลาว',
        Arabic: 'อาหรับ',
        Other: 'อื่น ๆ',
      },
      religion: {
        Buddhism: 'พุทธ',
        Christianity: 'คริสต์',
        Islam: 'อิสลาม',
        Hinduism: 'ฮินดู',
        Sikhism: 'ซิกข์',
        Judaism: 'ยูดาห์',
        'No religion': 'ไม่มีศาสนา',
        Other: 'อื่น ๆ',
        'Prefer not to say': 'ไม่ต้องการระบุ',
      },
      relationship: {
        Parent: 'พ่อหรือแม่',
        'Spouse or partner': 'คู่สมรสหรือคู่ชีวิต',
        Sibling: 'พี่หรือน้อง',
        Child: 'ลูก',
        'Other relative': 'ญาติอื่น',
        Friend: 'เพื่อน',
        Caregiver: 'ผู้ดูแล',
        Other: 'อื่น ๆ',
      },
      nationality: {
        Thai: 'ไทย',
        American: 'อเมริกัน',
        British: 'อังกฤษ',
        Australian: 'ออสเตรเลีย',
        Canadian: 'แคนาดา',
        Chinese: 'จีน',
        Japanese: 'ญี่ปุ่น',
        Korean: 'เกาหลี',
        Indian: 'อินเดีย',
        Singaporean: 'สิงคโปร์',
        Malaysian: 'มาเลเซีย',
        Vietnamese: 'เวียดนาม',
        Filipino: 'ฟิลิปปินส์',
        Indonesian: 'อินโดนีเซีย',
        Burmese: 'พม่า',
        Lao: 'ลาว',
        Cambodian: 'กัมพูชา',
        German: 'เยอรมัน',
        French: 'ฝรั่งเศส',
        Dutch: 'เนเธอร์แลนด์',
        Russian: 'รัสเซีย',
        Brazilian: 'บราซิล',
      },
    },
  },

  receipt: {
    thanks: 'ขอบคุณ คุณ{name}',
    next: 'ข้อมูลของคุณอยู่บนหน้าจอเคาน์เตอร์แล้ว เจ้าหน้าที่จะเรียกชื่อคุณในไม่ช้า ไม่ต้องเข้าคิวใหม่ หากมีข้อมูลผิด แจ้งรหัสอ้างอิงกับเจ้าหน้าที่ แก้ไขได้ทันที',
    another: 'กรอกฟอร์มใหม่อีกครั้ง',
  },

  staff: {
    title: 'เคาน์เตอร์ต้อนรับ',
    none: 'ยังไม่มีผู้ป่วย',
    count_one: 'ผู้ป่วย 1 คนในรอบนี้',
    count_other: 'ผู้ป่วย {count} คนในรอบนี้',
    all: 'ทั้งหมด',
    details: 'ข้อมูลที่กรอก',
    notAnswered: 'ยังไม่ได้ตอบ',
    ofRequired: 'ตอบแล้ว {filled} จาก {total}',
    emptyTitle: 'รอผู้ป่วยคนแรก',
    emptyBody:
      'ทุกครั้งที่ผู้ป่วยพิมพ์ ข้อมูลจะขึ้นที่นี่ภายในเสี้ยววินาที เปิดฟอร์มในอีกแท็บหรือบนมือถือ เพื่อดูข้อมูลขึ้นแบบสด',
    noneWithStatus: 'ตอนนี้ไม่มีผู้ป่วยสถานะ “{status}”',
    showAll: 'แสดงทั้งหมด',
    export: {
      button: 'ดาวน์โหลด CSV',
      nothing: 'ยังไม่มีข้อมูลให้ดาวน์โหลด',
      filename: 'agnos-patients',
      reference: 'รหัสอ้างอิง',
      status: 'สถานะ',
      progress: 'ตอบแล้ว',
      updated: 'อัปเดตล่าสุด',
    },
  },

  status: {
    filling: { label: 'กำลังกรอก', short: 'กำลังกรอก', title: 'พิมพ์ภายใน {idle} วินาทีที่ผ่านมา' },
    idle: { label: 'พักอยู่', short: 'พักอยู่', title: 'ไม่พิมพ์นาน {idle} วินาทีขึ้นไป แต่ยังอยู่ในหน้า' },
    inactive: {
      label: 'ไม่มีการเคลื่อนไหว',
      short: 'ไม่ขยับ',
      title: 'ไม่พิมพ์นาน {inactive} วินาทีขึ้นไป อาจต้องการความช่วยเหลือ',
    },
    submitted: { label: 'ส่งแล้ว', short: 'ส่งแล้ว', title: 'กรอกครบและส่งเรียบร้อย' },
    disconnected: { label: 'ออกจากฟอร์ม', short: 'ออกแล้ว', title: 'ปิดหน้าไปก่อนกดส่ง' },
  },

  connection: {
    live: 'เชื่อมต่อแล้ว',
    connecting: 'กำลังเชื่อมต่อ…',
    error: 'กำลังเชื่อมต่อใหม่…',
    off: 'ปิดการซิงค์',
  },

  setup: {
    title: 'การซิงค์เรียลไทม์ปิดอยู่',
    body: 'ยังไม่ได้ตั้งค่า Supabase หน้านี้จึงคุยกับอีกหน้าไม่ได้ คัดลอก {example} เป็น {local} ใส่ Project URL และ anon key แล้วรีสตาร์ท dev server ส่วนอื่นของหน้านี้ใช้งานได้ปกติ',
    back: 'กลับหน้าแรก',
  },

  theme: {
    label: 'โหมดตาบอดสี',
    hint: 'เพิ่มความคมชัด และเปลี่ยนสีสถานะให้ยังแยกออกจากกันได้ สำหรับผู้ที่ตาบอดสีแดง–เขียว',
  },

  picker: {
    search: 'ค้นหา',
    empty: 'ไม่พบรายการที่ตรงกัน',
    useCustom: 'ใช้ “{value}”',
    country: 'รหัสประเทศ',
    chooseDate: 'เลือกวันที่',
    year: 'เลือกปี',
    prevMonth: 'เดือนก่อนหน้า',
    nextMonth: 'เดือนถัดไป',
    clear: 'ล้างค่า',
    weekdays: ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'],
  },

  contact: {
    open: 'มีข้อสงสัย',
    title: 'เราช่วยคุณได้',
    blurb: 'เคาน์เตอร์ต้อนรับ ทุกวัน 8.00 - 20.00 น. การติดต่อเราไม่ได้ส่งข้อมูลที่คุณกรอกไว้',
    phone: 'โทรหาคลินิก',
    line: 'แชตทาง LINE',
    email: 'ส่งอีเมล',
  },

  time: {
    justNow: 'เมื่อสักครู่',
    seconds: '{n} วินาทีที่แล้ว',
    minutes: '{n} นาทีที่แล้ว',
    hours: '{n} ชั่วโมงที่แล้ว',
  },

  validation: {
    required: 'กรุณากรอก{label}',
    tooLong: '{label}ต้องไม่เกิน {max} ตัวอักษร',
    nameChars: '{label}ใส่ได้เฉพาะตัวอักษร เว้นวรรค ขีดกลาง และเครื่องหมายวรรคตอน',
    chooseOne: 'กรุณาเลือก{label}',
    chooseFromList: 'กรุณาเลือกจากรายการที่มีให้',
    dobRequired: 'กรุณากรอกวันเกิด',
    dobInvalid: 'กรุณากรอกวันที่ให้ถูกต้อง รูปแบบ ปี-เดือน-วัน',
    dobFuture: 'วันเกิดต้องไม่เป็นวันในอนาคต',
    dobTooOld: 'วันเกิดต้องไม่เกิน {max} ปีย้อนหลัง',
    phoneChars: 'เบอร์โทรศัพท์ใส่ได้เฉพาะตัวเลข เว้นวรรค และ + ( ) -',
    phoneLength: 'กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง ({min}–{max} หลัก)',
    emailInvalid: 'กรุณากรอกอีเมลให้ถูกต้อง เช่น name@example.com',
    addressTooShort: 'กรุณาระบุถนน เขตหรืออำเภอ จังหวัด และรหัสไปรษณีย์',
    nationalityTooShort: 'กรุณากรอกสัญชาติ',
    emergencyNeedsRelationship: 'กรุณาระบุว่าบุคคลนี้เกี่ยวข้องกับคุณอย่างไร',
    emergencyNeedsName: 'กรุณากรอกชื่อผู้ติดต่อกรณีฉุกเฉิน',
    fieldRequired: 'กรุณากรอกช่องนี้',
    passwordShort: 'รหัสผ่านต้องยาวอย่างน้อย {min} ตัวอักษร',
    passwordMismatch: 'รหัสผ่านสองช่องไม่ตรงกัน',
    inviteInvalid: 'รหัสเชิญไม่ถูกต้อง ขอจากหัวหน้าเวรได้เลย',
  },
  auth: {
    badge: 'สำหรับเจ้าหน้าที่',
    demoNotice:
      'หน้านี้เป็นตัวอย่าง โจทย์นี้เป็นงานฝั่งหน้าเว็บและไม่มีระบบหลังบ้าน จึงยังตรวจรหัสผ่านจริงไม่ได้ และไม่มีอีเมลถูกส่งออกไปจริง',
    fillSample: 'ติ๊กเพื่อกรอกข้อมูลตัวอย่างให้เลย',
    fillSampleHint: 'ไม่ต้องพิมพ์เอง ติ๊กแล้วกดปุ่มต่อได้ทันที',
    email: 'อีเมล',
    password: 'รหัสผ่าน',
    name: 'ชื่อ-นามสกุล',
    invite: 'รหัสเชิญจากหัวหน้าเวร',
    confirm: 'ยืนยันรหัสผ่าน',
    showPassword: 'แสดงรหัสผ่าน',
    hidePassword: 'ซ่อนรหัสผ่าน',
    wrongCredentials: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
    or: 'หรือ',
    login: {
      title: 'เข้าสู่ระบบเจ้าหน้าที่',
      description: 'เข้าเพื่อดูฟอร์มที่ผู้ป่วยกำลังกรอกอยู่แบบสด',
      submit: 'เข้าสู่ระบบ',
      remember: 'จำฉันไว้ในเครื่องนี้',
      forgot: 'ลืมรหัสผ่าน',
      noAccount: 'ยังไม่มีบัญชี',
      createOne: 'สมัครใช้งาน',
    },
    register: {
      title: 'สมัครใช้งานสำหรับเจ้าหน้าที่',
      description: 'ใช้รหัสเชิญจากหัวหน้าเวร เพื่อเปิดสิทธิ์เข้าหน้าเคาน์เตอร์',
      submit: 'สมัครใช้งาน',
      haveAccount: 'มีบัญชีอยู่แล้ว',
      signIn: 'เข้าสู่ระบบ',
      inviteHint: 'ตัวอย่างใช้รหัส {code}',
    },
    reset: {
      title: 'ลืมรหัสผ่าน',
      description: 'กรอกอีเมลที่ใช้สมัคร แล้วเราจะส่งลิงก์ตั้งรหัสใหม่ไปให้',
      submit: 'ส่งลิงก์ตั้งรหัสใหม่',
      back: 'กลับไปหน้าเข้าสู่ระบบ',
      sentTitle: 'ส่งเรียบร้อย',
      sentBody:
        'ถ้ามีบัญชีที่ใช้ {email} อยู่ จะได้รับลิงก์ตั้งรหัสใหม่ในไม่กี่นาที — แต่ในตัวอย่างนี้ยังไม่มีอีเมลถูกส่งออกไปจริง',
    },
    points: {
      oneTitle: 'เห็นทุกคำตอบระหว่างที่ผู้ป่วยพิมพ์',
      oneBody: 'ไม่ต้องรอให้กดส่ง และไม่ต้องอ่านกระดาษซ้ำ',
      twoTitle: 'รู้ว่าใครกำลังกรอก ใครหยุดไป',
      twoBody: 'มีสถานะแยก 5 แบบ พร้อมเวลาที่ขยับล่าสุด',
      threeTitle: 'ดาวน์โหลดเป็นไฟล์ Excel ได้',
      threeBody: 'ภาษาไทยไม่เพี้ยน เปิดได้ทันทีไม่ต้องตั้งค่า',
    },
    session: {
      signedInAs: 'เข้าใช้งานเป็น {name}',
      signOut: 'ออกจากระบบ',
      guest: 'ยังไม่ได้เข้าสู่ระบบ',
      signIn: 'เข้าสู่ระบบ',
      gateTitle: 'ต้องเข้าสู่ระบบก่อน',
      gateBody: 'หน้าเคาน์เตอร์แสดงข้อมูลผู้ป่วย จึงเปิดให้เฉพาะเจ้าหน้าที่ที่เข้าสู่ระบบแล้ว',
    },
  },
}

export default th

import type { Metadata } from 'next';
import Link from 'next/link';
import {
  BarChart3,
  LockKeyhole,
  PackageCheck,
  ShieldCheck,
} from 'lucide-react';
import styles from './privacy-policy.module.css';

type Locale = 'ar' | 'en';

type PolicySection = {
  id: string;
  title: string;
  paragraphs?: string[];
  items?: string[];
  contact?: boolean;
};

const policy = {
  en: {
    brand: 'Wafi Store',
    title: 'Privacy Policy',
    intro:
      'This Privacy Policy explains how Wafi Store (the “App”, “we”, “us”, or “our”) collects, uses, stores, and shares information when you use our mobile app or online store.',
    updated: 'Last updated: September 23, 2026',
    language: 'العربية',
    contents: 'On this page',
    home: 'Back to store',
    summary: [
      {
        title: 'Order information',
        text: 'We use your contact and delivery details to process and support your order.',
        icon: PackageCheck,
      },
      {
        title: 'Service analytics',
        text: 'We use limited device and visit data to understand and improve the service.',
        icon: BarChart3,
      },
      {
        title: 'Your control',
        text: 'You may ask us to access, correct, or delete your personal information.',
        icon: LockKeyhole,
      },
    ],
    sections: [
      {
        id: 'information-we-collect',
        title: '1. Information we collect',
        paragraphs: ['We collect information in the following ways:'],
        items: [
          'Information you provide when placing an order, including your name, phone number, city, delivery address, optional second phone number, and any notes you submit.',
          'Order and transaction information, including the products, quantities, selected product options, coupon, delivery area, and order totals. The App does not directly collect or store payment-card details.',
          'Usage and technical information, including a randomly generated visitor ID and session ID, pages viewed, product interactions, referring page, browser or device user-agent, and visit date and time.',
          'Information stored on your device, such as your shopping cart in local storage, so your cart remains available between visits.',
          'Administrator account information used only by authorized store personnel to manage the store.',
        ],
      },
      {
        id: 'how-we-use-data',
        title: '2. How we use information',
        items: [
          'Process, confirm, deliver, and provide support for your orders.',
          'Communicate with the store owner and customer about an order, including operational WhatsApp notifications where enabled.',
          'Remember cart contents and provide requested app features.',
          'Measure visits and product performance, troubleshoot problems, prevent misuse, and improve the App.',
          'Comply with applicable legal obligations and protect our rights, users, and service.',
        ],
      },
      {
        id: 'sharing',
        title: '3. How we share information',
        paragraphs: [
          'We do not sell your personal information. We share information only as needed to operate the App, fulfill orders, comply with law, or protect the service.',
        ],
        items: [
          'Supabase, which provides database, authentication, and storage infrastructure.',
          'Twilio and WhatsApp, when enabled, to send order-related operational notifications.',
          'Hosting and technical service providers that help us make the App available and secure.',
          'Authorities or other parties when required by law, to respond to lawful requests, or to protect rights and safety.',
          'A successor organization if the store is involved in a merger, acquisition, financing, or sale, subject to applicable law.',
        ],
      },
      {
        id: 'retention',
        title: '4. Data retention',
        paragraphs: [
          'We keep personal information only for as long as reasonably necessary to provide the service, support orders, maintain business and tax records, resolve disputes, enforce agreements, and meet legal obligations. Retention periods vary by the type of record and applicable requirements. We delete or anonymize information when it is no longer needed, unless the law requires or permits us to retain it.',
          'Cart information remains on your device until you clear it, clear browser or app storage, or complete an order through the cart. A visitor ID may remain in local storage and a session ID remains for the browser session unless you clear that storage.',
        ],
      },
      {
        id: 'security',
        title: '5. Data security',
        paragraphs: [
          'We use reasonable administrative, technical, and organizational safeguards designed to protect personal information. However, no internet transmission or storage system is completely secure, and we cannot guarantee absolute security.',
        ],
      },
      {
        id: 'choices',
        title: '6. Your choices and data deletion',
        paragraphs: [
          'Depending on where you live, you may have the right to request access to, correction of, or deletion of your personal information, or to object to or restrict certain processing. Wafi does not offer customer account creation; customers generally place orders as guests.',
          'To request deletion of order or other personal data, email us using the address below and include the phone number used for the order so we can verify and locate the relevant records. We will respond within a reasonable period. We may retain limited information where required for legal, tax, fraud-prevention, security, or dispute-resolution purposes.',
          'You can remove locally stored cart and visitor information through your browser or device storage settings. Blocking or clearing local storage may affect cart functionality.',
        ],
        contact: true,
      },
      {
        id: 'children',
        title: '7. Children’s privacy',
        paragraphs: [
          'The App is not directed to children under 13, and we do not knowingly collect personal information from children under 13. If you believe a child has provided personal information, please contact us so we can review and delete it where appropriate.',
        ],
      },
      {
        id: 'international',
        title: '8. International processing',
        paragraphs: [
          'Our service providers may process information in countries other than your own. Where required, we take appropriate steps to protect information in accordance with applicable law.',
        ],
      },
      {
        id: 'changes',
        title: '9. Changes to this policy',
        paragraphs: [
          'We may update this Privacy Policy as our practices or legal requirements change. We will publish the updated version on this page and change the “Last updated” date above. Material changes may also be communicated through the App where appropriate.',
        ],
      },
      {
        id: 'contact',
        title: '10. Contact us',
        paragraphs: [
          'Wafi Store is the developer and operator responsible for the information described in this policy. If you have a privacy question or request, contact us:',
        ],
        contact: true,
      },
    ] as PolicySection[],
    contactLabel: 'Privacy email',
    contactNote: 'Please write “Privacy Request” in the subject line.',
    copyright: 'Wafi Store. All rights reserved.',
  },
  ar: {
    brand: 'متجر وافي',
    title: 'سياسة الخصوصية',
    intro:
      'توضح سياسة الخصوصية هذه كيفية جمع متجر وافي (ويُشار إليه بـ «التطبيق» أو «نحن») للمعلومات واستخدامها وحفظها ومشاركتها عند استخدام تطبيقنا للهاتف أو متجرنا الإلكتروني.',
    updated: 'آخر تحديث: 23 سبتمبر 2026',
    language: 'English',
    contents: 'محتويات الصفحة',
    home: 'العودة إلى المتجر',
    summary: [
      {
        title: 'بيانات الطلب',
        text: 'نستخدم بيانات التواصل والتوصيل لمعالجة طلبك وخدمتك.',
        icon: PackageCheck,
      },
      {
        title: 'تحليلات الخدمة',
        text: 'نستخدم بيانات محدودة عن الجهاز والزيارة لفهم الخدمة وتحسينها.',
        icon: BarChart3,
      },
      {
        title: 'تحكمك ببياناتك',
        text: 'يمكنك طلب الوصول إلى معلوماتك الشخصية أو تصحيحها أو حذفها.',
        icon: LockKeyhole,
      },
    ],
    sections: [
      {
        id: 'information-we-collect',
        title: '1. المعلومات التي نجمعها',
        paragraphs: ['نجمع المعلومات بالطرق التالية:'],
        items: [
          'المعلومات التي تقدمها عند تنفيذ طلب، ومنها الاسم ورقم الهاتف والمدينة وعنوان التوصيل ورقم هاتف ثانٍ اختياري وأي ملاحظات ترسلها.',
          'بيانات الطلب والمعاملة، ومنها المنتجات والكميات وخيارات المنتجات المختارة والكوبون ومنطقة التوصيل وإجماليات الطلب. لا يجمع التطبيق أو يخزن بيانات بطاقات الدفع مباشرةً.',
          'بيانات الاستخدام والبيانات التقنية، ومنها معرّف زائر ومعرّف جلسة مولّدان عشوائياً، والصفحات التي تمت زيارتها، والتفاعل مع المنتجات، والصفحة المُحيلة، ومعلومات المتصفح أو الجهاز، وتاريخ الزيارة ووقتها.',
          'المعلومات المحفوظة على جهازك، مثل سلة التسوق في التخزين المحلي، حتى تبقى السلة متاحة بين الزيارات.',
          'بيانات حسابات المشرفين التي يستخدمها موظفو المتجر المصرح لهم فقط لإدارة المتجر.',
        ],
      },
      {
        id: 'how-we-use-data',
        title: '2. كيفية استخدام المعلومات',
        items: [
          'معالجة الطلبات وتأكيدها وتوصيلها وتقديم الدعم المتعلق بها.',
          'التواصل مع صاحب المتجر والعميل بشأن الطلب، بما في ذلك إشعارات واتساب التشغيلية عند تفعيلها.',
          'تذكر محتويات السلة وتوفير ميزات التطبيق التي تطلبها.',
          'قياس الزيارات وأداء المنتجات ومعالجة المشكلات ومنع إساءة الاستخدام وتحسين التطبيق.',
          'الامتثال للالتزامات القانونية المعمول بها وحماية حقوقنا ومستخدمينا وخدمتنا.',
        ],
      },
      {
        id: 'sharing',
        title: '3. كيفية مشاركة المعلومات',
        paragraphs: [
          'لا نبيع معلوماتك الشخصية. ولا نشاركها إلا بالقدر اللازم لتشغيل التطبيق وتنفيذ الطلبات والامتثال للقانون أو حماية الخدمة.',
        ],
        items: [
          'Supabase، التي توفر البنية التحتية لقاعدة البيانات والمصادقة والتخزين.',
          'Twilio وWhatsApp، عند التفعيل، لإرسال إشعارات تشغيلية متعلقة بالطلبات.',
          'مقدمو خدمات الاستضافة والخدمات التقنية الذين يساعدوننا في إتاحة التطبيق وتأمينه.',
          'الجهات المختصة أو أطراف أخرى عند طلب ذلك قانوناً أو استجابةً لطلب قانوني أو لحماية الحقوق والسلامة.',
          'أي جهة تخلف المتجر إذا كان طرفاً في اندماج أو استحواذ أو تمويل أو بيع، وفقاً للقانون المعمول به.',
        ],
      },
      {
        id: 'retention',
        title: '4. الاحتفاظ بالبيانات',
        paragraphs: [
          'نحتفظ بالمعلومات الشخصية فقط للمدة اللازمة بصورة معقولة لتقديم الخدمة ودعم الطلبات والاحتفاظ بالسجلات التجارية والضريبية وتسوية النزاعات وإنفاذ الاتفاقيات والوفاء بالالتزامات القانونية. تختلف مدة الاحتفاظ بحسب نوع السجل والمتطلبات المطبقة. نحذف المعلومات أو نجعلها مجهولة الهوية عندما لا نعود بحاجة إليها، ما لم يطلب القانون أو يسمح بالاحتفاظ بها.',
          'تبقى بيانات السلة على جهازك حتى تحذفها أو تمسح بيانات المتصفح أو التطبيق أو تُكمل طلباً من خلال السلة. وقد يبقى معرّف الزائر في التخزين المحلي، بينما يبقى معرّف الجلسة طوال جلسة المتصفح، ما لم تمسح هذه البيانات.',
        ],
      },
      {
        id: 'security',
        title: '5. أمن البيانات',
        paragraphs: [
          'نستخدم ضمانات إدارية وتقنية وتنظيمية معقولة صُممت لحماية المعلومات الشخصية. ومع ذلك، لا توجد وسيلة نقل عبر الإنترنت أو نظام تخزين آمن بصورة مطلقة، ولذلك لا يمكننا ضمان الأمان الكامل.',
        ],
      },
      {
        id: 'choices',
        title: '6. خياراتك وحذف البيانات',
        paragraphs: [
          'قد يحق لك، حسب مكان إقامتك، طلب الوصول إلى معلوماتك الشخصية أو تصحيحها أو حذفها، أو الاعتراض على بعض عمليات المعالجة أو تقييدها. لا يتيح وافي إنشاء حسابات للعملاء؛ إذ ينفّذ العملاء طلباتهم عادةً كضيوف.',
          'لطلب حذف بيانات طلب أو أي بيانات شخصية أخرى، أرسل رسالة إلى البريد الإلكتروني أدناه وأدرج رقم الهاتف المستخدم في الطلب حتى نتمكن من التحقق والعثور على السجلات المعنية. سنرد خلال مدة معقولة. وقد نحتفظ بمعلومات محدودة عندما يكون ذلك مطلوباً لأغراض قانونية أو ضريبية أو لمنع الاحتيال أو للأمن أو لتسوية النزاعات.',
          'يمكنك حذف بيانات السلة ومعرّف الزائر المحفوظة محلياً من خلال إعدادات تخزين المتصفح أو الجهاز. قد يؤثر حظر التخزين المحلي أو مسحه في عمل سلة التسوق.',
        ],
        contact: true,
      },
      {
        id: 'children',
        title: '7. خصوصية الأطفال',
        paragraphs: [
          'التطبيق غير موجّه للأطفال دون سن 13 عاماً، ولا نجمع عن علم معلومات شخصية من أطفال دون هذا السن. إذا كنت تعتقد أن طفلاً قدم معلومات شخصية، فيرجى التواصل معنا لنراجع الأمر ونحذفها عند الاقتضاء.',
        ],
      },
      {
        id: 'international',
        title: '8. معالجة البيانات دولياً',
        paragraphs: [
          'قد يعالج مقدمو خدماتنا المعلومات في دول غير دولتك. وعندما يلزم، نتخذ الخطوات المناسبة لحماية المعلومات وفقاً للقانون المعمول به.',
        ],
      },
      {
        id: 'changes',
        title: '9. التغييرات على هذه السياسة',
        paragraphs: [
          'قد نحدّث سياسة الخصوصية عندما تتغير ممارساتنا أو المتطلبات القانونية. سننشر النسخة المحدّثة في هذه الصفحة ونغيّر تاريخ «آخر تحديث» أعلاه. وقد نبلغك أيضاً بالتغييرات الجوهرية من خلال التطبيق عندما يكون ذلك مناسباً.',
        ],
      },
      {
        id: 'contact',
        title: '10. تواصل معنا',
        paragraphs: [
          'متجر وافي هو المطور والمشغّل المسؤول عن المعلومات الموضحة في هذه السياسة. إذا كان لديك سؤال أو طلب متعلق بالخصوصية، فتواصل معنا:',
        ],
        contact: true,
      },
    ] as PolicySection[],
    contactLabel: 'البريد الإلكتروني للخصوصية',
    contactNote: 'يرجى كتابة «طلب خصوصية» في عنوان الرسالة.',
    copyright: 'متجر وافي. جميع الحقوق محفوظة.',
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isArabic = locale === 'ar';

  return {
    title: isArabic ? 'سياسة الخصوصية | متجر وافي' : 'Privacy Policy | Wafi Store',
    description: isArabic
      ? 'سياسة الخصوصية لتطبيق ومتجر وافي.'
      : 'Privacy Policy for the Wafi Store app and online store.',
  };
}

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale: Locale = localeParam === 'en' ? 'en' : 'ar';
  const copy = policy[locale];
  const otherLocale: Locale = locale === 'ar' ? 'en' : 'ar';
  const year = new Date().getFullYear();

  return (
    <main className={styles.page} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <Link href={`/${locale}`} className={styles.brand}>
            <span className={styles.brandMark} aria-hidden="true">
              <ShieldCheck size={22} />
            </span>
            {copy.brand}
          </Link>
          <Link
            href={`/${otherLocale}/privacy-policy`}
            className={styles.languageLink}
            hrefLang={otherLocale}
          >
            {copy.language}
          </Link>
        </header>

        <section className={styles.hero}>
          <span className={styles.eyebrow}>
            <ShieldCheck size={16} aria-hidden="true" />
            {copy.brand}
          </span>
          <h1>{copy.title}</h1>
          <p>{copy.intro}</p>
          <span className={styles.updated}>{copy.updated}</span>
        </section>

        <div className={styles.layout}>
          <nav className={styles.contents} aria-label={copy.contents}>
            <strong>{copy.contents}</strong>
            {copy.sections.map((section) => (
              <a key={section.id} href={`#${section.id}`}>
                {section.title}
              </a>
            ))}
          </nav>

          <article className={styles.article}>
            <div className={styles.summary}>
              {copy.summary.map(({ title, text, icon: Icon }) => (
                <div className={styles.summaryCard} key={title}>
                  <span aria-hidden="true">
                    <Icon size={18} />
                  </span>
                  <strong>{title}</strong>
                  <p>{text}</p>
                </div>
              ))}
            </div>

            {copy.sections.map((section) => (
              <section className={styles.section} id={section.id} key={section.id}>
                <h2>{section.title}</h2>
                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.items && (
                  <ul>
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
                {section.contact && (
                  <div className={styles.contactBox}>
                    <p>
                      <strong>{copy.contactLabel}: </strong>
                      <a href="mailto:wafi@matjari.com">wafi@matjari.com</a>
                    </p>
                    <p>{copy.contactNote}</p>
                  </div>
                )}
              </section>
            ))}
          </article>
        </div>

        <footer className={styles.footer}>
          <span>© {year} {copy.copyright}</span>
          <Link href={`/${locale}`}>{copy.home}</Link>
        </footer>
      </div>
    </main>
  );
}

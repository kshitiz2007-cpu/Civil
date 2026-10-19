export interface QuizQuestion {
  id: string;
  text: string;
  textHi?: string;
  options: string[];
  optionsHi?: string[];
  correct: number;
  explanation?: string;
  explanationHi?: string;
  subject?: string;
  topic?: string;
  difficulty?: 'Moderate' | 'Tough' | 'UPSC Standard';
  pyqRef?: string;
}

export interface QuizPaper {
  id: string;
  title: string;
  titleHi?: string;
  category: string;
  section?: string;
  description?: string;
  time_limit: number;
  positive_marks?: number;
  negative_marking?: number;
  cutoff?: number;
  is_paid?: boolean;
  price?: number;
  active?: boolean;
  created_at?: string;
  questions: QuizQuestion[];
}

export const FALLBACK_QUIZZES: QuizPaper[] = [
  {
    id: 'upsc-gs1-polity-01',
    title: 'UPSC CSE Prelims Simulator — Constitutional Framework, Writs & Parliamentary Sovereignty',
    titleHi: 'यूपीएससी प्रारंभिक परीक्षा सिम्युलेटर — संवैधानिक ढांचा, रिट और संसदीय संप्रभुता',
    category: 'Polity',
    section: 'Constitutional & Parliamentary Core',
    description: 'High-yield multi-statement & pair-counting questions modeled on latest UPSC CSE Prelims trends covering Part III, Basic Structure, Money Bills, and Parliamentary Committees.',
    time_limit: 20,
    positive_marks: 2.0,
    negative_marking: 0.66,
    cutoff: 50,
    active: true,
    created_at: '2026-10-15T09:00:00Z',
    questions: [
      {
        id: 'pol_q1',
        subject: 'Polity',
        topic: 'Fundamental Rights & Writs (Art. 32 vs 226)',
        difficulty: 'UPSC Standard',
        pyqRef: 'UPSC CSE 2022 / Laxmikanth Ch. 7',
        text: `With reference to the Writ Jurisdiction of the Supreme Court and High Courts in India, consider the following statements:
1. The Supreme Court can issue writs only for the enforcement of Fundamental Rights, whereas a High Court can issue writs for both Fundamental Rights and ordinary legal rights.
2. The territorial jurisdiction of the Supreme Court for issuing writs is wider than that of a High Court.
3. A High Court cannot refuse to exercise its writ jurisdiction under Article 226 as it is a guaranteed Fundamental Right.

How many of the statements given above are correct?`,
        textHi: `भारत में सर्वोच्च न्यायालय और उच्च न्यायालयों के रिट क्षेत्राधिकार के संदर्भ में, निम्नलिखित कथनों पर विचार कीजिए:
1. सर्वोच्च न्यायालय केवल मौलिक अधिकारों के प्रवर्तन के लिए रिट जारी कर सकता है, जबकि उच्च न्यायालय मौलिक अधिकारों और साधारण कानूनी अधिकारों दोनों के लिए रिट जारी कर सकता है।
2. रिट जारी करने के लिए सर्वोच्च न्यायालय का क्षेत्रीय अधिकार क्षेत्र उच्च न्यायालय की तुलना में व्यापक है।
3. उच्च न्यायालय अनुच्छेद 226 के तहत अपने रिट क्षेत्राधिकार का प्रयोग करने से इनकार नहीं कर सकता क्योंकि यह एक गारंटीकृत मौलिक अधिकार है।

उपर्युक्त कथनों में से कितने सही हैं?`,
        options: [
          'Only one',
          'Only two',
          'All three',
          'None',
        ],
        optionsHi: [
          'केवल एक',
          'केवल दो',
          'सभी तीन',
          'कोई नहीं',
        ],
        correct: 1,
        explanation: 'Statements 1 and 2 are correct. Statement 3 is incorrect: Article 32 (Supreme Court) is itself a Fundamental Right and cannot be refused, whereas Article 226 (High Court) is a discretionary constitutional remedy and not a Fundamental Right.',
        explanationHi: 'कथन 1 और 2 सही हैं। कथन 3 गलत है: अनुच्छेद 32 स्वयं एक मौलिक अधिकार है इसलिए सर्वोच्च न्यायालय रिट जारी करने से मना नहीं कर सकता, जबकि अनुच्छेद 226 के तहत उच्च न्यायालय का उपाय विवेकाधीन है।',
      },
      {
        id: 'pol_q2',
        subject: 'Polity',
        topic: 'Parliamentary Devices & Money Bills',
        difficulty: 'Tough',
        pyqRef: 'UPSC CSE 2023 Pattern',
        text: `Consider the following statements regarding a Money Bill under Article 110 of the Constitution of India:
1. A bill shall be deemed to be a Money Bill if it provides for the imposition of fines or other pecuniary penalties by a local authority.
2. The Rajya Sabha cannot amend or reject a Money Bill and must return it within 14 days with or without recommendations.
3. A Joint Sitting of both Houses under Article 108 can be summoned if a deadlock arises over recommendations made to a Money Bill.

Which of the statements given above is/are correct?`,
        textHi: `भारतीय संविधान के अनुच्छेद 110 के तहत धन विधेयक (Money Bill) के संबंध में निम्नलिखित कथनों पर विचार कीजिए:
1. किसी विधेयक को धन विधेयक माना जाएगा यदि वह किसी स्थानीय प्राधिकारी द्वारा जुर्माना या अन्य आर्थिक दंड लगाने का प्रावधान करता है।
2. राज्य सभा धन विधेयक में संशोधन या उसे अस्वीकार नहीं कर सकती है और उसे सिफारिशों के साथ या बिना 14 दिनों के भीतर लौटाना होता है।
3. धन विधेयक पर गतिरोध उत्पन्न होने की स्थिति में अनुच्छेद 108 के तहत दोनों सदनों की संयुक्त बैठक बुलाई जा सकती है।

उपर्युक्त कथनों में से कौन-सा/से सही है/हैं?`,
        options: [
          '1 and 2 only',
          '2 only',
          '2 and 3 only',
          '1, 2 and 3',
        ],
        optionsHi: [
          'केवल 1 और 2',
          'केवल 2',
          'केवल 2 और 3',
          '1, 2 और 3',
        ],
        correct: 1,
        explanation: 'Only Statement 2 is correct. Under Article 110(2), imposition of fines or local taxes does NOT make a bill a Money Bill. Under Article 108, there is NO provision for a Joint Sitting on a Money Bill or a Constitutional Amendment Bill.',
        explanationHi: 'केवल कथन 2 सही है। अनुच्छेद 110(2) के अनुसार जुर्माना या स्थानीय निकायों के कर धन विधेयक की श्रेणी में नहीं आते। साथ ही धन विधेयक पर संयुक्त बैठक (अनुच्छेद 108) का कोई प्रावधान नहीं है।',
      },
      {
        id: 'pol_q3',
        subject: 'Polity',
        topic: 'Anti-Defection Law (Tenth Schedule)',
        difficulty: 'UPSC Standard',
        pyqRef: 'Kihoto Hollohan Case / 52nd Amendment',
        text: `With reference to the Tenth Schedule (Anti-Defection Law) of the Indian Constitution, consider the following statements:
1. A nominated member of a House becomes disqualified if they join any political party before the expiry of six months from the date on which they take their seat.
2. The Constitution does not specify a time-frame within which the Presiding Officer must decide a disqualification petition.
3. The decision of the Speaker/Chairman on disqualification is immune from judicial review under all circumstances.

Which of the statements given above is/are correct?`,
        textHi: `भारतीय संविधान की दसवीं अनुसूची (दल-बदल विरोधी कानून) के संदर्भ में, निम्नलिखित कथनों पर विचार कीजिए:
1. सदन का एक मनोनीत सदस्य अयोग्य हो जाता है यदि वह अपनी सीट ग्रहण करने की तिथि से छह महीने की समाप्ति से पहले किसी राजनीतिक दल में शामिल हो जाता है।
2. संविधान कोई समय-सीमा निर्धारित नहीं करता है जिसके भीतर पीठासीन अधिकारी को अयोग्यता याचिका पर निर्णय लेना होगा।
3. अयोग्यता पर अध्यक्ष/सभापति का निर्णय सभी परिस्थितियों में न्यायिक समीक्षा से मुक्त है।

उपर्युक्त कथनों में से कौन-सा/से सही है/हैं?`,
        options: [
          '1 and 2 only',
          '2 only',
          '2 and 3 only',
          '1 and 3 only',
        ],
        optionsHi: [
          'केवल 1 और 2',
          'केवल 2',
          'केवल 2 और 3',
          'केवल 1 और 3',
        ],
        correct: 1,
        explanation: 'Statement 2 is correct. Statement 1 is reversed: a nominated member can join a political party WITHIN 6 months, and is disqualified only if they join AFTER 6 months. Statement 3 is incorrect: in Kihoto Hollohan (1992), the Supreme Court held that the Speaker acts as a tribunal and their decision is subject to judicial review.',
        explanationHi: 'केवल कथन 2 सही है। कथन 1 गलत है क्योंकि मनोनीत सदस्य 6 महीने के भीतर किसी दल में शामिल हो सकता है, 6 महीने के बाद शामिल होने पर अयोग्य होता है। किहोतो होलोहान मामले (1992) के अनुसार अध्यक्ष का निर्णय न्यायिक समीक्षा के अधीन है।',
      },
      {
        id: 'pol_q4',
        subject: 'Polity',
        topic: 'Parliamentary Financial Committees',
        difficulty: 'Moderate',
        pyqRef: 'UPSC CSE 2021 / Parliamentary Committees',
        text: `Consider the following statements regarding the Financial Committees of the Parliament:
1. The Estimates Committee consists of 30 members drawn exclusively from the Lok Sabha.
2. A Minister cannot be elected as a member of the Public Accounts Committee or the Committee on Public Undertakings.
3. The Chairman of the Estimates Committee is invariably appointed from the main Opposition party by convention.

How many of the above statements are correct?`,
        textHi: `संसद की वित्तीय समितियों के संबंध में निम्नलिखित कथनों पर विचार कीजिए:
1. प्राक्कलन समिति (Estimates Committee) में 30 सदस्य होते हैं जो केवल लोकसभा से चुने जाते हैं।
2. किसी मंत्री को लोक लेखा समिति या सार्वजनिक उपक्रम समिति के सदस्य के रूप में नहीं चुना जा सकता है।
3. प्राक्कलन समिति के अध्यक्ष की नियुक्ति परंपरा के अनुसार हमेशा मुख्य विपक्षी दल से की जाती है।

उपर्युक्त कथनों में से कितने सही हैं?`,
        options: [
          'Only one',
          'Only two',
          'All three',
          'None',
        ],
        optionsHi: [
          'केवल एक',
          'केवल दो',
          'सभी तीन',
          'कोई नहीं',
        ],
        correct: 1,
        explanation: 'Statements 1 and 2 are correct. Statement 3 is incorrect: the Chairman of the Public Accounts Committee (PAC) is appointed from the Opposition by convention (since 1967), whereas the Chairman of the Estimates Committee is invariably from the ruling party.',
        explanationHi: 'कथन 1 और 2 सही हैं। कथन 3 गलत है: लोक लेखा समिति (PAC) का अध्यक्ष विपक्षी दल से होता है, जबकि प्राक्कलन समिति का अध्यक्ष सत्तारूढ़ दल से नियुक्त किया जाता है।',
      },
      {
        id: 'pol_q5',
        subject: 'Polity',
        topic: 'Basic Structure & Ninth Schedule',
        difficulty: 'Tough',
        pyqRef: 'I.R. Coelho Case (2007)',
        text: `In the context of the Ninth Schedule of the Indian Constitution and Judicial Review, which of the following reflects the landmark judgment in I.R. Coelho v. State of Tamil Nadu (2007)?`,
        textHi: `भारतीय संविधान की नौवीं अनुसूची और न्यायिक समीक्षा के संदर्भ में, निम्नलिखित में से कौन-सा आई.आर. कोएल्हो बनाम तमिलनाडु राज्य (2007) के ऐतिहासिक निर्णय को दर्शाता है?`,
        options: [
          'All laws placed in the Ninth Schedule since 1951 enjoy absolute immunity from judicial review.',
          'Laws placed in the Ninth Schedule after April 24, 1973 are open to judicial scrutiny if they violate Fundamental Rights forming part of the Basic Structure.',
          'Parliament has no power to insert state agrarian reform laws into the Ninth Schedule without ratification by half of the States.',
          'The Ninth Schedule itself was struck down as unconstitutional for violating Article 14.',
        ],
        optionsHi: [
          '1951 से नौवीं अनुसूची में रखे गए सभी कानूनों को न्यायिक समीक्षा से पूर्ण उन्मुक्ति प्राप्त है।',
          '24 अप्रैल, 1973 के बाद नौवीं अनुसूची में डाले गए कानून न्यायिक समीक्षा के अधीन हैं यदि वे मूल संरचना का हिस्सा बनने वाले मौलिक अधिकारों का उल्लंघन करते हैं।',
          'आधे राज्यों के अनुसमर्थन के बिना संसद को नौवीं अनुसूची में राज्य भूमि सुधार कानून डालने की शक्ति नहीं है।',
          'अनुच्छेद 14 के उल्लंघन के कारण नौवीं अनुसूची को ही असंवैधानिक घोषित कर दिया गया।',
        ],
        correct: 1,
        explanation: 'In I.R. Coelho (2007), a 9-judge bench ruled that there cannot be blanket immunity from judicial review for laws inserted into the Ninth Schedule after April 24, 1973 (the date of the Kesavananda Bharati judgment).',
        explanationHi: 'आई.आर. कोएल्हो (2007) में सर्वोच्च न्यायालय ने निर्णय दिया कि 24 अप्रैल, 1973 (केशवानंद भारती निर्णय की तिथि) के बाद नौवीं अनुसूची में शामिल किए गए कानूनों को न्यायिक समीक्षा से पूर्ण छूट नहीं मिल सकती।',
      },
    ],
  },
  {
    id: 'upsc-gs1-economy-02',
    title: 'Monetary Policy, External Sector & Union Fiscal Architecture — GS-III Sectional',
    titleHi: 'मौद्रिक नीति, बाह्य क्षेत्र और केंद्रीय राजकोषीय संरचना — सामान्य अध्ययन मॉक',
    category: 'Economy',
    section: 'Macroeconomics & RBI',
    description: 'Covers RBI liquidity tools (SDF, MSF), Real Effective Exchange Rate (REER), Primary Deficit mechanics, and Sovereign Green Bonds.',
    time_limit: 15,
    positive_marks: 2.0,
    negative_marking: 0.66,
    cutoff: 50,
    active: true,
    created_at: '2026-10-16T10:30:00Z',
    questions: [
      {
        id: 'eco_q1',
        subject: 'Economy',
        topic: 'Standing Deposit Facility (SDF)',
        difficulty: 'UPSC Standard',
        pyqRef: 'RBI Monetary Policy Framework',
        text: `With reference to the Standing Deposit Facility (SDF) operated by the Reserve Bank of India, consider the following statements:
1. It allows the RBI to absorb excess liquidity from commercial banks without providing government securities as collateral.
2. The SDF rate serves as the floor of the Liquidity Adjustment Facility (LAF) corridor, replacing the fixed Reverse Repo rate.
3. Funds parked by banks under SDF are eligible to be counted towards their Cash Reserve Ratio (CRR) requirement.

Which of the statements given above are correct?`,
        textHi: `भारतीय रिजर्व बैंक द्वारा संचालित स्थायी जमा सुविधा (SDF) के संदर्भ में, निम्नलिखित कथनों पर विचार कीजिए:
1. यह आरबीआई को सरकारी प्रतिभूतियों को संपार्श्विक (collateral) के रूप में प्रदान किए बिना वाणिज्यिक बैंकों से अतिरिक्त तरलता को अवशोषित करने की अनुमति देता है।
2. SDF दर तरलता समायोजन सुविधा (LAF) गलियारे के निचले स्तर (floor) के रूप में कार्य करती है।
3. SDF के तहत बैंकों द्वारा रखे गए धन को उनके नकद आरक्षित अनुपात (CRR) की आवश्यकता में गिना जाता है।

उपर्युक्त कथनों में से कौन-से सही हैं?`,
        options: [
          '1 and 2 only',
          '2 and 3 only',
          '1 and 3 only',
          '1, 2 and 3',
        ],
        optionsHi: [
          'केवल 1 और 2',
          'केवल 2 और 3',
          'केवल 1 और 3',
          '1, 2 और 3',
        ],
        correct: 0,
        explanation: 'Statements 1 and 2 are correct. Statement 3 is incorrect: balances held by banks with the RBI under SDF are NOT eligible for Cash Reserve Ratio (CRR), though they are eligible as Statutory Liquidity Ratio (SLR) assets.',
        explanationHi: 'कथन 1 और 2 सही हैं। कथन 3 गलत है: SDF के तहत रखी गई राशि CRR के लिए पात्र नहीं होती है, हालांकि इसे SLR के तहत गिना जा सकता है।',
      },
      {
        id: 'eco_q2',
        subject: 'Economy',
        topic: 'NEER & REER Exchange Rates',
        difficulty: 'Tough',
        pyqRef: 'UPSC CSE 2019 / External Sector',
        text: `Consider the following statements regarding Nominal Effective Exchange Rate (NEER) and Real Effective Exchange Rate (REER):
1. An increase in a country's REER above 100 indicates that its exports are becoming more price-competitive in international markets.
2. If domestic inflation in India is persistently higher than that of its major trading partners, the divergence between REER and NEER tends to widen.

Which of the statements given above is/are correct?`,
        textHi: `नाममात्र प्रभावी विनिमय दर (NEER) और वास्तविक प्रभावी विनिमय दर (REER) के संबंध में निम्नलिखित कथनों पर विचार कीजिए:
1. किसी देश के REER में 100 से ऊपर की वृद्धि यह दर्शाती है कि उसके निर्यात अंतर्राष्ट्रीय बाजारों में अधिक मूल्य-प्रतिस्पर्धी हो रहे हैं।
2. यदि भारत में घरेलू मुद्रास्फीति उसके प्रमुख व्यापारिक भागीदारों की तुलना में लगातार अधिक है, तो REER और NEER के बीच का अंतर बढ़ने लगता है।

उपर्युक्त कथनों में से कौन-सा/से सही है/हैं?`,
        options: [
          '1 only',
          '2 only',
          'Both 1 and 2',
          'Neither 1 nor 2',
        ],
        optionsHi: [
          'केवल 1',
          'केवल 2',
          '1 और 2 दोनों',
          'न तो 1 और न ही 2',
        ],
        correct: 1,
        explanation: 'Statement 1 is incorrect: an increase in REER implies real appreciation of the domestic currency, which makes exports DEARER (less competitive) and imports cheaper. Statement 2 is correct because REER adjusts NEER for relative inflation differentials.',
        explanationHi: 'कथन 1 गलत है: REER में वृद्धि का अर्थ घरेलू मुद्रा का वास्तविक अधिमूल्यन है, जिससे निर्यात महंगे (कम प्रतिस्पर्धी) हो जाते हैं। कथन 2 सही है क्योंकि REER मुद्रास्फीति के अंतर को समायोजित करता है।',
      },
      {
        id: 'eco_q3',
        subject: 'Economy',
        topic: 'Fiscal Deficit & Primary Deficit',
        difficulty: 'Moderate',
        pyqRef: 'Union Budget Concepts',
        text: `If the Union Government's Primary Deficit is zero in a given fiscal year, what does it directly imply?`,
        textHi: `यदि किसी दिए गए वित्तीय वर्ष में केंद्र सरकार का प्राथमिक घाटा (Primary Deficit) शून्य है, तो इसका सीधा अर्थ क्या है?`,
        options: [
          'The government is not borrowing any money from the market during that year.',
          'The Fiscal Deficit is exactly equal to the interest payments on previous borrowings.',
          'The Revenue Deficit has been completely eliminated.',
          'Total tax revenue equals total capital expenditure.',
        ],
        optionsHi: [
          'सरकार उस वर्ष के दौरान बाजार से कोई पैसा उधार नहीं ले रही है।',
          'राजकोषीय घाटा पिछले उधारों पर ब्याज भुगतान के ठीक बराबर है।',
          'राजस्व घाटा पूरी तरह समाप्त हो गया है।',
          'कुल कर राजस्व कुल पूंजीगत व्यय के बराबर है।',
        ],
        correct: 1,
        explanation: 'Primary Deficit = Fiscal Deficit − Interest Payments. Therefore, if Primary Deficit = 0, then Fiscal Deficit = Interest Payments, meaning the government is borrowing solely to service past debt interest.',
        explanationHi: 'प्राथमिक घाटा = राजकोषीय घाटा − ब्याज भुगतान। अतः यदि प्राथमिक घाटा शून्य है, तो राजकोषीय घाटा पिछले ऋणों के ब्याज भुगतान के बराबर होता है।',
      },
    ],
  },
  {
    id: 'upsc-gs1-env-03',
    title: 'Biodiversity, Protected Areas, Carbon Markets & Climate Conventions',
    titleHi: 'जैव विविधता, संरक्षित क्षेत्र, कार्बन बाज़ार और जलवायु सम्मेलन',
    category: 'Environment',
    section: 'Ecology & International Conventions',
    description: 'Tests Wildlife Protection Act 1972 (2022 Amendments), Ramsar Wetlands, Kunming-Montreal Global Biodiversity Framework, and Blue Carbon ecosystems.',
    time_limit: 15,
    positive_marks: 2.0,
    negative_marking: 0.66,
    cutoff: 50,
    active: true,
    created_at: '2026-10-17T14:00:00Z',
    questions: [
      {
        id: 'env_q1',
        subject: 'Environment',
        topic: 'Wildlife Protection Amendment Act 2022',
        difficulty: 'UPSC Standard',
        pyqRef: 'WPA 2022 Rationalized Schedules',
        text: `With reference to the Wild Life (Protection) Amendment Act, 2022, consider the following statements:
1. It rationalized the Act from six schedules down to four schedules, removing the separate schedule for "Vermin" species.
2. It inserted a dedicated schedule exclusively for specimens listed in the Appendices under CITES (Convention on International Trade in Endangered Species).
3. It empowers the Central Government alone to declare any area as a Community Reserve without state consultation.

How many of the statements given above are correct?`,
        textHi: `वन्य जीव (संरक्षण) संशोधन अधिनियम, 2022 के संदर्भ में, निम्नलिखित कथनों पर विचार कीजिए:
1. इसने अधिनियम की छह अनुसूचियों को घटाकर चार अनुसूचियां कर दिया और 'पीड़क जंतु' (Vermin) के लिए अलग अनुसूची को हटा दिया।
2. इसने CITES के परिशिष्टों में सूचीबद्ध प्रजातियों के लिए एक समर्पित अनुसूची (Schedule IV) जोड़ी है।
3. यह राज्य के परामर्श के बिना किसी भी क्षेत्र को सामुदायिक रिजर्व घोषित करने का अधिकार केवल केंद्र सरकार को देता है।

उपर्युक्त कथनों में से कितने सही हैं?`,
        options: [
          'Only one',
          'Only two',
          'All three',
          'None',
        ],
        optionsHi: [
          'केवल एक',
          'केवल दो',
          'सभी तीन',
          'कोई नहीं',
        ],
        correct: 1,
        explanation: 'Statements 1 and 2 are correct (Schedules I, II, III, and IV for CITES). Statement 3 is incorrect as State Governments notify Community Reserves under Section 36C.',
        explanationHi: 'कथन 1 और 2 सही हैं (अनुसूचियों को 6 से घटाकर 4 किया गया और अनुसूची IV CITES के लिए है)। कथन 3 गलत है।',
      },
      {
        id: 'env_q2',
        subject: 'Environment',
        topic: 'Blue Carbon & Coastal Ecosystems',
        difficulty: 'Moderate',
        pyqRef: 'UPSC CSE 2021 / IPCC Special Report',
        text: `Which of the following ecosystems are globally recognized as the primary coastal "Blue Carbon" sinks capable of sequestering carbon at rates up to ten times faster per unit area than mature tropical forests?
1. Mangrove forests
2. Tidal salt marshes
3. Seagrass meadows
4. Alpine tundra peatlands

Select the correct answer using the code given below:`,
        textHi: `निम्नलिखित में से कौन-से पारिस्थितिकी तंत्र विश्व स्तर पर प्राथमिक तटीय "ब्लू कार्बन" सिंक के रूप में पहचाने जाते हैं?
1. मैंग्रोव वन
2. ज्वारीय लवण दलदल (Tidal salt marshes)
3. समुद्री घास के मैदान (Seagrass meadows)
4. अल्पाइन टुंड्रा पीटलैंड

नीचे दिए गए कूट का प्रयोग कर सही उत्तर चुनिए:`,
        options: [
          '1 and 3 only',
          '1, 2 and 3 only',
          '2, 3 and 4 only',
          '1, 2, 3 and 4',
        ],
        optionsHi: [
          'केवल 1 और 3',
          'केवल 1, 2 और 3',
          'केवल 2, 3 और 4',
          '1, 2, 3 और 4',
        ],
        correct: 1,
        explanation: 'Mangroves, tidal salt marshes, and seagrass meadows form the triad of coastal Blue Carbon ecosystems. Alpine tundra peatlands are terrestrial carbon sinks ("Teal/Brown carbon"), not coastal Blue Carbon.',
        explanationHi: 'मैंग्रोव, ज्वारीय लवण दलदल और समुद्री घास के मैदान तटीय "ब्लू कार्बन" पारिस्थितिकी तंत्र हैं। अल्पाइन टुंड्रा स्थलीय कार्बन सिंक है।',
      },
    ],
  },
  {
    id: 'upsc-gs1-history-04',
    title: 'Modern Indian History & Art/Culture — Temple Architecture & Freedom Struggle',
    titleHi: 'आधुनिक भारतीय इतिहास एवं कला/संस्कृति — मंदिर वास्तुकला और स्वतंत्रता संग्राम',
    category: 'History',
    section: 'Art, Culture & National Movement',
    description: 'Covers Nagara vs Dravida architecture, Quit India Movement, Cabinet Mission Plan 1946, and Buddhist Councils.',
    time_limit: 15,
    positive_marks: 2.0,
    negative_marking: 0.66,
    cutoff: 50,
    active: true,
    created_at: '2026-10-18T11:00:00Z',
    questions: [
      {
        id: 'his_q1',
        subject: 'History',
        topic: 'Cabinet Mission Plan 1946',
        difficulty: 'UPSC Standard',
        pyqRef: 'Spectrum Modern India',
        text: `With reference to the Cabinet Mission Plan of 1946, consider the following statements:
1. It explicitly rejected the demand for a full-fledged sovereign Pakistan.
2. It proposed a three-tier federation with provinces grouped into three sections (A, B, and C) having the right to frame group constitutions.
3. Residuary powers were vested in the Union Legislature rather than the Provinces.

Which of the statements given above are correct?`,
        textHi: `1946 की कैबिनेट मिशन योजना के संदर्भ में, निम्नलिखित कथनों पर विचार कीजिए:
1. इसने पूर्ण संप्रभु पाकिस्तान की मांग को स्पष्ट रूप से अस्वीकार कर दिया।
2. इसने प्रांतों को तीन समूहों (A, B और C) में विभाजित करते हुए त्रि-स्तरीय संघ का प्रस्ताव रखा।
3. अवशिष्ट शक्तियां प्रांतों के बजाय केंद्रीय विधानमंडल में निहित की गई थीं।

उपर्युक्त कथनों में से कौन-से सही हैं?`,
        options: [
          '1 and 2 only',
          '2 and 3 only',
          '1 and 3 only',
          '1, 2 and 3',
        ],
        optionsHi: [
          'केवल 1 और 2',
          'केवल 2 और 3',
          'केवल 1 और 3',
          '1, 2 और 3',
        ],
        correct: 0,
        explanation: 'Statements 1 and 2 are correct. Statement 3 is incorrect: under the Cabinet Mission Plan, the Union controlled only Defence, Foreign Affairs, and Communications, while all Residuary Powers were vested in the Provinces.',
        explanationHi: 'कथन 1 और 2 सही हैं। कथन 3 गलत है क्योंकि कैबिनेट मिशन योजना के तहत अवशिष्ट शक्तियां (Residuary Powers) प्रांतों को दी गई थीं, न कि केंद्र को।',
      },
      {
        id: 'his_q2',
        subject: 'History',
        topic: 'Hoysala & Vesara Temple Architecture',
        difficulty: 'Moderate',
        pyqRef: 'UNESCO World Heritage — Sacred Ensembles of Hoysalas',
        text: `Consider the following architectural features regarding the Sacred Ensembles of the Hoysalas (Belur, Halebidu, and Somnathपुरा):
1. Stellate (star-shaped) ground plan of the main vimana shrine.
2. Extensive use of soft chloritic schist (soapstone) enabling intricate jewelry-like carvings.
3. Complete absence of jagati (raised platform) for circumambulation (pradakshina).

How many of the above features are characteristic of Hoysala temples?`,
        textHi: `होयसल के पवित्र मंदिर समूहों (बेलूर, हलेबिदु और सोमनाथपुरा) की स्थापत्य विशेषताओं पर विचार कीजिए:
1. मुख्य विमान का तारकीय (स्टार के आकार का) भूमि प्लान।
2. सूक्ष्म नक्काशी के लिए नरम सोपस्टोन (chloritic schist) का व्यापक उपयोग।
3. प्रदक्षिणा के लिए जगती (उठे हुए चबूतरे) का पूर्ण अभाव।

उपर्युक्त में से कितनी विशेषताएं होयसल मंदिरों की पहचान हैं?`,
        options: [
          'Only one',
          'Only two',
          'All three',
          'None',
        ],
        optionsHi: [
          'केवल एक',
          'केवल दो',
          'सभी तीन',
          'कोई नहीं',
        ],
        correct: 1,
        explanation: 'Features 1 and 2 are hallmark characteristics of Hoysala architecture. Feature 3 is incorrect: Hoysala temples famously stand on a high star-shaped raised platform called a Jagati used for open-air circumambulation.',
        explanationHi: 'विशेषता 1 और 2 सही हैं। कथन 3 गलत है क्योंकि होयसल मंदिर एक ऊंचे तारे के आकार के चबूतरे (जगती) पर निर्मित हैं जो खुला प्रदक्षिणा पथ प्रदान करता है।',
      },
    ],
  },
];

export const FALLBACK_ATTEMPTS = [
  {
    id: 'att_demo_1',
    user_id: 'demo_user',
    user_name: 'Aarav Sharma (AIR Target)',
    quiz_id: 'upsc-gs1-polity-01',
    quiz_title: 'UPSC CSE Prelims Simulator — Constitutional Framework, Writs & Parliamentary Sovereignty',
    quiz_title_hi: 'यूपीएससी प्रारंभिक परीक्षा सिम्युलेटर — संवैधानिक ढांचा, रिट और संसदीय संप्रभुता',
    category: 'Polity',
    score: 73,
    correct: 4,
    wrong: 1,
    skipped: 0,
    total: 5,
    completed_at: '2026-10-18T16:40:00Z',
    details: [
      {
        question_id: 'pol_q1',
        question: FALLBACK_QUIZZES[0].questions[0].text,
        question_hi: FALLBACK_QUIZZES[0].questions[0].textHi,
        selected_answer: 'Only two',
        selected_answer_hi: 'केवल दो',
        correct_answer: 'Only two',
        correct_answer_hi: 'केवल दो',
        isCorrect: true,
        marks_awarded: 2.0,
        confidence: 'sure',
        eliminated_count: 2,
        time_spent: 48,
        explanation: FALLBACK_QUIZZES[0].questions[0].explanation,
        explanation_hi: FALLBACK_QUIZZES[0].questions[0].explanationHi,
      },
      {
        question_id: 'pol_q2',
        question: FALLBACK_QUIZZES[0].questions[1].text,
        question_hi: FALLBACK_QUIZZES[0].questions[1].textHi,
        selected_answer: '2 only',
        selected_answer_hi: 'केवल 2',
        correct_answer: '2 only',
        correct_answer_hi: 'केवल 2',
        isCorrect: true,
        marks_awarded: 2.0,
        confidence: 'fifty',
        eliminated_count: 2,
        time_spent: 62,
        explanation: FALLBACK_QUIZZES[0].questions[1].explanation,
        explanation_hi: FALLBACK_QUIZZES[0].questions[1].explanationHi,
      },
      {
        question_id: 'pol_q3',
        question: FALLBACK_QUIZZES[0].questions[2].text,
        question_hi: FALLBACK_QUIZZES[0].questions[2].textHi,
        selected_answer: '1 and 2 only',
        selected_answer_hi: 'केवल 1 और 2',
        correct_answer: '2 only',
        correct_answer_hi: 'केवल 2',
        isCorrect: false,
        marks_awarded: -0.66,
        confidence: 'guess',
        eliminated_count: 1,
        time_spent: 84,
        explanation: FALLBACK_QUIZZES[0].questions[2].explanation,
        explanation_hi: FALLBACK_QUIZZES[0].questions[2].explanationHi,
      },
      {
        question_id: 'pol_q4',
        question: FALLBACK_QUIZZES[0].questions[3].text,
        question_hi: FALLBACK_QUIZZES[0].questions[3].textHi,
        selected_answer: 'Only two',
        selected_answer_hi: 'केवल दो',
        correct_answer: 'Only two',
        correct_answer_hi: 'केवल दो',
        isCorrect: true,
        marks_awarded: 2.0,
        confidence: 'sure',
        eliminated_count: 2,
        time_spent: 41,
        explanation: FALLBACK_QUIZZES[0].questions[3].explanation,
        explanation_hi: FALLBACK_QUIZZES[0].questions[3].explanationHi,
      },
      {
        question_id: 'pol_q5',
        question: FALLBACK_QUIZZES[0].questions[4].text,
        question_hi: FALLBACK_QUIZZES[0].questions[4].textHi,
        selected_answer: 'Laws placed in the Ninth Schedule after April 24, 1973 are open to judicial scrutiny if they violate Fundamental Rights forming part of the Basic Structure.',
        selected_answer_hi: '24 अप्रैल, 1973 के बाद नौवीं अनुसूची में डाले गए कानून न्यायिक समीक्षा के अधीन हैं यदि वे मूल संरचना का हिस्सा बनने वाले मौलिक अधिकारों का उल्लंघन करते हैं।',
        correct_answer: 'Laws placed in the Ninth Schedule after April 24, 1973 are open to judicial scrutiny if they violate Fundamental Rights forming part of the Basic Structure.',
        correct_answer_hi: '24 अप्रैल, 1973 के बाद नौवीं अनुसूची में डाले गए कानून न्यायिक समीक्षा के अधीन हैं यदि वे मूल संरचना का हिस्सा बनने वाले मौलिक अधिकारों का उल्लंघन करते हैं।',
        isCorrect: true,
        marks_awarded: 2.0,
        confidence: 'sure',
        eliminated_count: 3,
        time_spent: 39,
        explanation: FALLBACK_QUIZZES[0].questions[4].explanation,
        explanation_hi: FALLBACK_QUIZZES[0].questions[4].explanationHi,
      },
    ],
  },
];

export const FALLBACK_RESOURCES = [
  {
    id: 'res_pol_1',
    title: 'Constitutional Remedies, Writs & Basic Structure Doctrine — High-Yield Handout',
    file_type: 'pdf',
    file_url: 'https://legislative.gov.in/constitution-of-india/',
    category: 'Polity',
    section: 'Part III & Constitutional Remedies',
    created_at: '2026-10-12T10:00:00Z',
  },
  {
    id: 'res_eco_1',
    title: 'RBI Monetary Policy Committee, LAF Corridor (SDF/MSF) & External Balance Digest',
    file_type: 'pdf',
    file_url: 'https://www.rbi.org.in/',
    category: 'Economy',
    section: 'Monetary & Fiscal Policy',
    created_at: '2026-10-14T10:00:00Z',
  },
  {
    id: 'res_env_1',
    title: 'Wildlife Protection Amendment Act 2022 & India Ramsar Sites Atlas',
    file_type: 'pdf',
    file_url: 'https://moef.gov.in/',
    category: 'Environment',
    section: 'Protected Areas & Conventions',
    created_at: '2026-10-15T10:00:00Z',
  },
  {
    id: 'res_his_1',
    title: 'UNESCO World Heritage Sites in India — Hoysala, Maratha & Chola Architecture',
    file_type: 'link',
    file_url: 'https://whc.unesco.org/en/statesparties/in',
    category: 'History',
    section: 'Indian Art & Architecture',
    created_at: '2026-10-16T10:00:00Z',
  },
];

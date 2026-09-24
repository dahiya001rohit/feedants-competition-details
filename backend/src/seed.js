// Resets the database with demo data. Dates are relative to now so every lifecycle state is always demoable.
const crypto = require('node:crypto');
const mongoose = require('mongoose');
const config = require('./config');
const User = require('./models/User');
const Competition = require('./models/Competition');
const Registration = require('./models/Registration');
const Testimonial = require('./models/Testimonial');

const H = 3600e3;
const D = 24 * H;
const at = (ms) => new Date(Date.now() + ms);
const avatar = (g, n) => `https://randomuser.me/api/portraits/${g}/${n}.jpg`;
// Placeholder clips (CC0 / public test media) standing in for real performance videos.
const VIDEOS = [
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4',
  'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
];
const video = (i) => VIDEOS[i % VIDEOS.length];
const code = () => crypto.randomBytes(4).toString('hex');

const RULES = {
  en: [
    '• Open to all age groups; participants under 18 need guardian consent.',
    '• One entry per participant. Solo performances only.',
    '• Video length 2–5 minutes, one continuous take, no edits or filters.',
    '• Upload before the submission deadline. Late entries are not accepted.',
    '• The entry fee is non-refundable once the submission window opens.',
  ].join('\n'),
  hi: [
    '• सभी आयु वर्ग के लिए खुला; 18 वर्ष से कम आयु के प्रतिभागियों को अभिभावक की सहमति आवश्यक है।',
    '• प्रति प्रतिभागी एक प्रविष्टि। केवल एकल प्रस्तुतियाँ।',
    '• वीडियो की अवधि 2–5 मिनट, एक ही टेक में, बिना एडिट या फ़िल्टर के।',
    '• सबमिशन की अंतिम तिथि से पहले अपलोड करें। देर से आई प्रविष्टियाँ स्वीकार नहीं होंगी।',
    '• सबमिशन शुरू होने के बाद प्रवेश शुल्क वापस नहीं होगा।',
  ].join('\n'),
};

const COMMON = {
  status: 'published',
  certificateForWinners: true,
  entryFee: 99,
  rules: RULES,
  disclaimer: {
    en: 'Only contributions from paid participants will be considered for judging.',
    hi: 'केवल भुगतान करने वाले प्रतिभागियों की प्रविष्टियों पर ही निर्णय के लिए विचार किया जाएगा।',
  },
  refundPolicy: {
    en: 'Full refund if the competition is cancelled, or if you withdraw before the submission window opens. Refunds reach your original payment method in 5–7 working days.',
    hi: 'प्रतियोगिता रद्द होने पर, या सबमिशन शुरू होने से पहले नाम वापस लेने पर पूरा रिफंड मिलेगा। रिफंड 5–7 कार्यदिवसों में आपके मूल भुगतान माध्यम में पहुँच जाएगा।',
  },
  prizeInfoVideoUrl: video(4),
  rewards: [550, 300, 240, 200, 130, 80].map((amount, i) => ({ position: i + 1, amount })),
};

async function seed() {
  if (config.isProd) throw new Error('Refusing to seed in production');
  await mongoose.connect(config.mongoUrl);
  await mongoose.connection.dropDatabase();
  await Promise.all([User, Competition, Registration, Testimonial].map((m) => m.syncIndexes()));

  const [aditi, kabir] = await User.create([
    { name: 'Aditi Sharma', avatarUrl: avatar('women', 19), referralCode: 'referral123', isDemo: true },
    { name: 'Kabir Khan', avatarUrl: avatar('men', 35), referralCode: code(), isDemo: true },
    { name: 'Meera Iyer', avatarUrl: avatar('women', 26), referralCode: code(), isDemo: true },
  ]);
  const others = await User.create(
    Array.from({ length: 10 }, (_, i) => ({ name: `Participant ${i + 1}`, referralCode: code() })),
  );

  const [dance, singing, poetry, painting] = await Competition.create([
    {
      ...COMMON,
      slug: 'feedants-classical-dance',
      title: { en: 'Feedants Classical Dance', hi: 'फीडेंट्स शास्त्रीय नृत्य' },
      category: { en: 'Dance', hi: 'नृत्य' },
      tags: [{ en: 'Multi-Win', hi: 'मल्टी-विन' }],
      capacity: 20,
      judge: {
        name: 'Manju Dubey',
        title: { en: 'Professional Kathak Dancer', hi: 'पेशेवर कथक नृत्यांगना' },
        experience: { en: '12+ Years of Experience', hi: '12+ वर्षों का अनुभव' },
        photoUrl: avatar('women', 15),
        introVideoUrl: video(0),
      },
      schedule: {
        registrationOpensAt: at(-5 * D),
        registrationClosesAt: at(D + 6 * H + 28.5 * 60e3),
        submissionStartsAt: at(-D),
        submissionEndsAt: at(20 * D),
        resultAt: at(22 * D),
      },
      previousWinners: [
        { name: 'Riya Shah', position: 1, photoUrl: avatar('women', 22), videoUrl: video(2) },
        { name: 'Aarav Mehta', position: 1, photoUrl: avatar('men', 58), videoUrl: video(1) },
        { name: 'Neha Verma', position: 2, photoUrl: avatar('women', 40), videoUrl: video(3) },
        { name: 'Ishita Chopra', position: 3, photoUrl: avatar('women', 99), videoUrl: video(0) },
      ],
      about: {
        en: [
          'This is an online classical dance competition open for all age groups.',
          'Participate from anywhere and showcase your talent.',
          'Express your passion through traditional dance.',
          'All classical forms are welcome: Kathak, Bharatanatyam, Odissi, Kuchipudi, Manipuri, Mohiniyattam and more.',
          'Entries are judged by a professional classical dancer and results are announced on the result date.',
        ].join('\n'),
        hi: [
          'यह सभी आयु वर्गों के लिए एक ऑनलाइन शास्त्रीय नृत्य प्रतियोगिता है।',
          'कहीं से भी भाग लें और अपनी प्रतिभा दिखाएँ।',
          'पारंपरिक नृत्य के माध्यम से अपने जुनून को व्यक्त करें।',
          'सभी शास्त्रीय शैलियों का स्वागत है: कथक, भरतनाट्यम, ओडिसी, कुचिपुड़ी, मणिपुरी, मोहिनीअट्टम और अन्य।',
          'प्रविष्टियों का मूल्यांकन एक पेशेवर शास्त्रीय नृत्यांगना करेंगी और परिणाम घोषित तिथि पर जारी होंगे।',
        ].join('\n'),
      },
      judgingParameters: {
        en: '• Technique & footwork: 30%\n• Expression (Abhinaya): 25%\n• Rhythm & timing (Laya): 20%\n• Costume & presentation: 15%\n• Overall impact: 10%',
        hi: '• तकनीक और पदचालन: 30%\n• भाव-भंगिमा (अभिनय): 25%\n• लय और ताल: 20%\n• वेशभूषा और प्रस्तुति: 15%\n• समग्र प्रभाव: 10%',
      },
    },
    {
      ...COMMON,
      slug: 'feedants-voice-of-india',
      title: { en: 'Feedants Voice of India', hi: 'फीडेंट्स वॉइस ऑफ़ इंडिया' },
      category: { en: 'Singing', hi: 'गायन' },
      tags: [{ en: 'Multi-Win', hi: 'मल्टी-विन' }],
      capacity: 10,
      judge: {
        name: 'Arjun Rao',
        title: { en: 'Playback Singer', hi: 'पार्श्व गायक' },
        experience: { en: '15+ Years of Experience', hi: '15+ वर्षों का अनुभव' },
        photoUrl: avatar('men', 56),
        introVideoUrl: video(1),
      },
      schedule: {
        registrationOpensAt: at(-3 * D),
        registrationClosesAt: at(5 * H),
        submissionStartsAt: at(6 * H),
        submissionEndsAt: at(10 * D),
        resultAt: at(12 * D),
      },
      about: { en: 'Sing any song in any Indian language. Unplugged or with a backing track, your voice is the star.' },
      judgingParameters: { en: '• Pitch & tune: 40%\n• Voice quality: 30%\n• Expression: 20%\n• Song choice: 10%' },
    },
    {
      ...COMMON,
      slug: 'feedants-poetry-slam',
      title: { en: 'Feedants Poetry Slam', hi: 'फीडेंट्स काव्य मंच' },
      category: { en: 'Poetry', hi: 'कविता' },
      tags: [],
      capacity: 5,
      judge: {
        name: 'Sana Qureshi',
        title: { en: 'Poet & Author', hi: 'कवयित्री और लेखिका' },
        experience: { en: '10+ Years of Experience', hi: '10+ वर्षों का अनुभव' },
        photoUrl: avatar('women', 88),
      },
      schedule: {
        registrationOpensAt: at(-4 * D),
        registrationClosesAt: at(2 * D),
        submissionStartsAt: at(-D),
        submissionEndsAt: at(9 * D),
        resultAt: at(11 * D),
      },
      about: { en: 'Perform an original poem in Hindi, English or Urdu. Up to 3 minutes.' },
      judgingParameters: { en: '• Originality: 40%\n• Delivery: 35%\n• Language: 25%' },
    },
    {
      ...COMMON,
      slug: 'feedants-canvas-colours',
      title: { en: 'Feedants Canvas & Colours', hi: 'फीडेंट्स कैनवास और रंग' },
      category: { en: 'Art', hi: 'कला' },
      tags: [{ en: 'Multi-Win', hi: 'मल्टी-विन' }],
      capacity: 30,
      judge: {
        name: 'Vikram Sethi',
        title: { en: 'Contemporary Artist', hi: 'समकालीन कलाकार' },
        experience: { en: '20+ Years of Experience', hi: '20+ वर्षों का अनुभव' },
        photoUrl: avatar('men', 69),
      },
      schedule: {
        registrationOpensAt: at(-20 * D),
        registrationClosesAt: at(-8 * D),
        submissionStartsAt: at(-10 * D),
        submissionEndsAt: at(-D),
        resultAt: at(2 * D),
      },
      about: { en: 'Paint on the theme "Monsoon". Record a time-lapse of your process.' },
      judgingParameters: { en: '• Creativity: 40%\n• Technique: 40%\n• Theme: 20%' },
    },
    {
      ...COMMON,
      slug: 'feedants-street-photography',
      title: { en: 'Feedants Street Photography', hi: 'फीडेंट्स स्ट्रीट फ़ोटोग्राफ़ी' },
      category: { en: 'Photography', hi: 'फ़ोटोग्राफ़ी' },
      tags: [],
      capacity: 50,
      judge: {
        name: 'Rahul Menon',
        title: { en: 'Photojournalist', hi: 'फ़ोटो पत्रकार' },
        experience: { en: '8+ Years of Experience', hi: '8+ वर्षों का अनुभव' },
        photoUrl: avatar('men', 50),
      },
      schedule: {
        registrationOpensAt: at(2 * D),
        registrationClosesAt: at(9 * D),
        submissionStartsAt: at(3 * D),
        submissionEndsAt: at(14 * D),
        resultAt: at(16 * D),
      },
      about: { en: 'Capture everyday life in your city. Submit a 1-minute slideshow video of up to 10 photos.' },
      judgingParameters: { en: '• Storytelling: 40%\n• Composition: 40%\n• Editing: 20%' },
    },
  ]);

  // bookedCount must always equal the number of registrations.
  const book = async (competition, users, submitted = false) => {
    await Registration.create(
      users.map((u) => ({
        competition: competition._id,
        user: u._id,
        payment: { provider: 'mock', paymentId: `mock_${crypto.randomUUID()}`, amount: competition.entryFee, status: 'captured' },
        ...(submitted && {
          submission: { fileName: 'entry.mp4', mimeType: 'video/mp4', size: 12e6, storageKey: 'seed.mp4', submittedAt: at(-2 * D) },
        }),
      })),
    );
    await Competition.updateOne({ _id: competition._id }, { $set: { bookedCount: users.length } });
  };
  await book(dance, [aditi]);
  await book(singing, others.slice(0, 8));
  await book(poetry, others.slice(0, 5));
  await book(painting, [aditi, kabir, ...others.slice(0, 6)], true);

  await Testimonial.create([
    {
      name: 'Pooja Nair',
      avatarUrl: avatar('women', 1),
      role: { en: 'Bharatanatyam dancer, Kochi', hi: 'भरतनाट्यम नृत्यांगना, कोच्चि' },
      quote: {
        en: 'I got real feedback from a judge I admire. Winning 2nd place gave me the confidence to start teaching.',
        hi: 'मुझे अपनी पसंदीदा जज से सच्चा फ़ीडबैक मिला। दूसरा स्थान जीतकर मुझे सिखाना शुरू करने का आत्मविश्वास मिला।',
      },
      rating: 5,
    },
    {
      name: 'Rohan Gupta',
      avatarUrl: avatar('men', 39),
      role: { en: 'Singer, Lucknow', hi: 'गायक, लखनऊ' },
      quote: {
        en: 'Registration took a minute and the prize money reached my account within a week of the results.',
        hi: 'रजिस्ट्रेशन में एक मिनट लगा और परिणाम के एक हफ़्ते के अंदर इनाम की राशि मेरे खाते में आ गई।',
      },
      rating: 5,
    },
    {
      name: 'Ananya Das',
      avatarUrl: avatar('women', 13),
      role: { en: 'Odissi dancer, Bhubaneswar', hi: 'ओडिसी नृत्यांगना, भुवनेश्वर' },
      quote: {
        en: 'Transparent judging parameters and a fair process. I have participated three times already.',
        hi: 'पारदर्शी मूल्यांकन मानदंड और निष्पक्ष प्रक्रिया। मैं तीन बार भाग ले चुकी हूँ।',
      },
      rating: 4,
    },
  ]);

  console.log('Seeded. Demo users:', (await User.find({ isDemo: true }).sort({ _id: 1 }).lean()).map((u) => u.name).join(', '));
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

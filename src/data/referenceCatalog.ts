/** Static panchang/festival catalogs — not family records (safe for live app). */

export const LUNAR_MONTHS = [
  { id: 'chaitra', nameEn: 'Chaitra', nameMr: 'चैत्र', nameHi: 'चैत्र' },
  { id: 'vaishakha', nameEn: 'Vaishakha', nameMr: 'वैशाख', nameHi: 'वैशाख' },
  { id: 'jyeshtha', nameEn: 'Jyeshtha', nameMr: 'ज्येष्ठ', nameHi: 'ज्येष्ठ' },
  { id: 'ashadha', nameEn: 'Ashadha', nameMr: 'आषाढ', nameHi: 'आषाढ़' },
  { id: 'shravana', nameEn: 'Shravana', nameMr: 'श्रावण', nameHi: 'श्रावण' },
  { id: 'bhadrapada', nameEn: 'Bhadrapada', nameMr: 'भाद्रपद', nameHi: 'भाद्रपद' },
  { id: 'ashwin', nameEn: 'Ashwin', nameMr: 'अश्विन', nameHi: 'अश्विन' },
  { id: 'kartik', nameEn: 'Kartik', nameMr: 'कार्तिक', nameHi: 'कार्तिक' },
  { id: 'margashirsha', nameEn: 'Margashirsha', nameMr: 'मार्गशीर्ष', nameHi: 'मार्गशीर्ष' },
  { id: 'pausha', nameEn: 'Pausha', nameMr: 'पौष', nameHi: 'पौष' },
  { id: 'magha', nameEn: 'Magha', nameMr: 'माघ', nameHi: 'माघ' },
  { id: 'phalguna', nameEn: 'Phalguna', nameMr: 'फाल्गुन', nameHi: 'फाल्गुन' },
  { id: 'adhik', nameEn: 'Adhik (Extra Month)', nameMr: 'अधिक मास', nameHi: 'अधिक मास' },
];

export const TITHI_NAMES = [
  { id: 'pratipada', nameEn: 'Pratipada (1)', nameMr: 'प्रतिपदा (पडवा)', nameHi: 'प्रतिपदा' },
  { id: 'dwitiya', nameEn: 'Dwitiya (2)', nameMr: 'द्वितीया (बीज)', nameHi: 'द्वितीया' },
  { id: 'tritiya', nameEn: 'Tritiya (3)', nameMr: 'तृतीया', nameHi: 'तृतीया' },
  { id: 'chaturthi', nameEn: 'Chaturthi (4)', nameMr: 'चतुर्थी', nameHi: 'चतुर्थी' },
  { id: 'panchami', nameEn: 'Panchami (5)', nameMr: 'पंचमी', nameHi: 'पंचमी' },
  { id: 'shashthi', nameEn: 'Shashthi (6)', nameMr: 'षष्ठी', nameHi: 'षष्ठी' },
  { id: 'saptami', nameEn: 'Saptami (7)', nameMr: 'सप्तमी', nameHi: 'सप्तमी' },
  { id: 'ashtami', nameEn: 'Ashtami (8)', nameMr: 'अष्टमी', nameHi: 'अष्टमी' },
  { id: 'navami', nameEn: 'Navami (9)', nameMr: 'नवमी', nameHi: 'नवमी' },
  { id: 'dashami', nameEn: 'Dashami (10)', nameMr: 'दशमी', nameHi: 'दशमी' },
  { id: 'ekadashi', nameEn: 'Ekadashi (11)', nameMr: 'एकादशी', nameHi: 'एकादशी' },
  { id: 'dwadashi', nameEn: 'Dwadashi (12)', nameMr: 'द्वादशी', nameHi: 'द्वादशी' },
  { id: 'trayodashi', nameEn: 'Trayodashi (13)', nameMr: 'त्रयोदशी', nameHi: 'त्रयोदशी' },
  { id: 'chaturdashi', nameEn: 'Chaturdashi (14)', nameMr: 'चतुर्दशी', nameHi: 'चतुर्दशी' },
  { id: 'purnima_amavasya', nameEn: 'Purnima / Amavasya (15)', nameMr: 'पौर्णिमा / अमावास्या', nameHi: 'पूर्णिमा / अमावस्या' },
];

export const AVAILABLE_FESTIVALS = [
  { id: 'ganesh_chaturthi', nameEn: 'Ganesh Chaturthi', nameMr: 'गणेश चतुर्थी', nameHi: 'गणेश चतुर्थी', defaultMonth: 'Bhadrapada', defaultPaksha: 'Shukla' },
  { id: 'diwali_lakshmi', nameEn: 'Diwali / Lakshmi Puja', nameMr: 'दिवाळी / लक्ष्मीपूजन', nameHi: 'दीपावली / लक्ष्मी पूजन', defaultMonth: 'Ashwin', defaultPaksha: 'Krishna' },
  { id: 'bhau_beej', nameEn: 'Bhau-beej / Bhai Dooj', nameMr: 'भाऊबीज', nameHi: 'भाई दूज', defaultMonth: 'Kartik', defaultPaksha: 'Shukla' },
  { id: 'raksha_bandhan', nameEn: 'Raksha Bandhan', nameMr: 'रक्षाबंधन', nameHi: 'रक्षाबंधन', defaultMonth: 'Shravana', defaultPaksha: 'Shukla' },
  { id: 'karva_chauth', nameEn: 'Karva Chauth', nameMr: 'करवा चौथ', nameHi: 'करवा चौथ', defaultMonth: 'Kartik', defaultPaksha: 'Krishna' },
  { id: 'makar_sankranti', nameEn: 'Makar Sankranti', nameMr: 'मकर संक्रांत', nameHi: 'मकर संक्रांति', defaultMonth: 'Pausha', defaultPaksha: 'Solar' },
  { id: 'gudi_padwa', nameEn: 'Gudi Padwa', nameMr: 'गुढीपाडवा', nameHi: 'गुड़ी पड़वा', defaultMonth: 'Chaitra', defaultPaksha: 'Shukla' },
  { id: 'navratri', nameEn: 'Navratri Ghatasthapana', nameMr: 'घटस्थापना (नवरात्र)', nameHi: 'नवरात्रि घटस्थापना', defaultMonth: 'Ashwin', defaultPaksha: 'Shukla' },
  { id: 'dussehra', nameEn: 'Dussehra / Vijayadashami', nameMr: 'दसरा / विजयादशमी', nameHi: 'दशहरा / विजयादशमी', defaultMonth: 'Ashwin', defaultPaksha: 'Shukla' },
  { id: 'janmashtami', nameEn: 'Janmashtami', nameMr: 'गोकुळाष्टमी / श्रीकृष्ण जन्मोत्सव', nameHi: 'श्रीकृष्ण जन्माष्टमी', defaultMonth: 'Shravana', defaultPaksha: 'Krishna' },
  { id: 'maha_shivratri', nameEn: 'Maha Shivratri', nameMr: 'महाशिवरात्र', nameHi: 'महाशिवरात्रि', defaultMonth: 'Magha', defaultPaksha: 'Krishna' },
];

export const AVAILABLE_VRATS = [
  { id: 'sankashti', nameEn: 'Sankashti Chaturthi (Monthly)', nameMr: 'संकष्टी चतुर्थी (मासिक)', nameHi: 'संकष्टी चतुर्थी' },
  { id: 'angarki', nameEn: 'Angarki Sankashti (When on Tuesday)', nameMr: 'अंगारकी संकष्टी', nameHi: 'अंगारकी संकष्टी' },
  { id: 'ekadashi_both', nameEn: 'Ekadashi (Both Shukla & Krishna)', nameMr: 'सर्व एकादशी (दोन्ही पक्षांतील)', nameHi: 'एकादशी (दोनों पक्षों की)' },
  { id: 'ekadashi_ashadhi_kartiki', nameEn: 'Major Ekadashis (Ashadhi & Kartiki)', nameMr: 'आषाढी व कार्तिकी एकादशी', nameHi: 'देवशयनी व प्रबोधिनी एकादशी' },
  { id: 'satyanarayan', nameEn: 'Satyanarayan Puja (Family Purnima)', nameMr: 'सत्यनारायण पूजा (पौर्णिमा)', nameHi: 'श्री सत्यनारायण कथा' },
  { id: 'kuldevta_day', nameEn: 'Kuldevta Special Day (e.g. Champa Shashthi)', nameMr: 'कुलदैवत वार/तिथी (चंपाषष्ठी/खंडोबा)', nameHi: 'कुलदेवता विशेष दिवस' },
  { id: 'pradosh', nameEn: 'Pradosh Vrat', nameMr: 'प्रदोष व्रत', nameHi: 'प्रदोष व्रत' },
];

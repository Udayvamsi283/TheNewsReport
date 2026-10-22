import React, { createContext, useContext, useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export type SupportedLanguage = 'en' | 'te' | 'hi';

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' }
];

export const NAV_TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    frontPage: 'Front Page',
    home: 'Home',
    latest: 'Latest Wire',
    trending: 'Trending',
    videos: 'Videos',
    saved: 'Saved Articles',
    liked: 'Liked Articles',
    preferences: 'Reading Preferences',
    admin: 'Admin Console',
    signIn: 'Sign In',
    signOut: 'Sign Out',
    register: 'Register',
    profile: 'My Profile',
    globalEdition: 'Global Edition',
    search: 'Search',
    // Homepage Section Headings & Controls
    featuredStories: 'Featured Stories',
    fullWire: 'Full Wire',
    latestDispatches: 'Latest Dispatches',
    forYou: 'For You',
    chronological: 'Chronological',
    trendingThisWeek: 'Trending This Week',
    top10: 'Top 10 →',
    editorialCharter: 'Editorial Charter',
    charterHeadline: 'Independent Public-Interest Reporting',
    charterBody: 'The News Report delivers verifiable, fact-based dispatches across international affairs, science, policy, and cultural shifts.',
    exploreFullArchive: 'Explore Full Archive →',
    moreStoriesFromToday: 'More Stories From Today',
    viewAll: 'View All →',
    noStoriesPublished: 'No stories have been published yet.',
    emptyStateHelp: 'Articles and breaking alerts will appear here as soon as they are published by the editorial team.',
    // Common Card & Metadata Badges
    breaking: 'Breaking',
    exclusive: 'Exclusive',
    subscriberExclusive: 'Subscriber Exclusive',
    readStory: 'Read Story',
    moreIn: 'More in',
    by: 'By',
    theNewsReport: 'The News Report',
    minRead: 'min read',
    mRead: 'm read',
    views: 'views',
    likes: 'likes',
    comments: 'comments',
    prevBreaking: 'Previous breaking news',
    nextBreaking: 'Next breaking news',
    dismissBreaking: 'Dismiss breaking news bar',
    // Phase 3 Article Detail Enhancements
    relatedStories: 'Related Stories',
    relatedDispatches: 'Related Stories',
    latestNews: 'Latest News',
    latestNewsWire: 'Latest News',
    trendingTopics: 'Trending Topics',
    trendingTags: 'Trending Topics',
    previousArticle: 'Previous Article',
    nextArticle: 'Next Article',
    followUs: 'Follow Us',
    socialLinksHelp: 'Stay connected with The News Report across official social channels.',
    shareStory: 'Share Story'
  },
  te: {
    frontPage: 'హోమ్',
    home: 'హోమ్',
    latest: 'తాజా వార్తలు',
    trending: 'ట్రెండింగ్',
    videos: 'వీడియోలు',
    saved: 'భద్రపరిచిన కథనాలు',
    liked: 'ఇష్టపడిన కథనాలు',
    preferences: 'పఠన ప్రాధాన్యతలు',
    admin: 'అడ్మిన్ కన్సోల్',
    signIn: 'సైన్ ఇన్',
    signOut: 'లాగ్ అవుట్',
    register: 'రిజిస్టర్',
    profile: 'నా ప్రొఫైల్',
    globalEdition: 'గ్లోబల్ ఎడిషన్',
    search: 'శోధించండి',
    // Homepage Section Headings & Controls
    featuredStories: 'ప్రత్యేక కథనాలు',
    fullWire: 'పూర్తి వార్తలు',
    latestDispatches: 'తాజా సమాచారం',
    forYou: 'మీ కోసం',
    chronological: 'కాలానుక్రమం',
    trendingThisWeek: 'ఈ వారం ట్రెండింగ్',
    top10: 'టాప్ 10 →',
    editorialCharter: 'సంపాదకీయ నియమావళి',
    charterHeadline: 'స్వతంత్ర ప్రజా ప్రయోజన జర్నలిజం',
    charterBody: 'ది న్యూస్ రిపోర్ట్ అంతర్జాతీయ వ్యవహారాలు, విజ్ఞానం, ప్రజా విధానాలు మరియు సాంస్కృతిక పరిణామాలపై ప్రామాణికమైన, వాస్తవాధారిత కథనాలను అందిస్తుంది.',
    exploreFullArchive: 'పూర్తి ఆర్కైవ్ చూడండి →',
    moreStoriesFromToday: 'నేటి మరిన్ని కథనాలు',
    viewAll: 'అన్నీ చూడండి →',
    noStoriesPublished: 'ఇంకా ఎలాంటి కథనాలు ప్రచురించబడలేదు.',
    emptyStateHelp: 'సంపాదకీయ బృందం ప్రచురించిన వెంటనే కథనాలు మరియు బ్రేకింగ్ వార్తలు ఇక్కడ కనిపిస్తాయి.',
    // Common Card & Metadata Badges
    breaking: 'బ్రేకింగ్',
    exclusive: 'ప్రత్యేకం',
    subscriberExclusive: 'చందాదారుల ప్రత్యేకం',
    readStory: 'కథనం చదవండి',
    moreIn: 'మరిన్ని కథనాలు:',
    by: 'రచన:',
    theNewsReport: 'ది న్యూస్ రిపోర్ట్',
    minRead: 'నిమిషాల పఠనం',
    mRead: 'నిమిషాల పఠనం',
    views: 'వీక్షణలు',
    likes: 'ఇష్టాలు',
    comments: 'వ్యాఖ్యలు',
    prevBreaking: 'మునుపటి బ్రేకింగ్ వార్త',
    nextBreaking: 'తర్వాతి బ్రేకింగ్ వార్త',
    dismissBreaking: 'బ్రేకింగ్ బార్ మూసివేయండి',
    // Phase 3 Article Detail Enhancements
    relatedStories: 'సంబంధిత కథనాలు',
    relatedDispatches: 'సంబంధిత కథనాలు',
    latestNews: 'తాజా వార్తలు',
    latestNewsWire: 'తాజా వార్తలు',
    trendingTopics: 'ట్రెండింగ్ అంశాలు',
    trendingTags: 'ట్రెండింగ్ అంశాలు',
    previousArticle: 'మునుపటి కథనం',
    nextArticle: 'తర్వాతి కథనం',
    followUs: 'మమ్మల్ని అనుసరించండి',
    socialLinksHelp: 'అధికారిక సోషల్ మీడియా మాధ్యమాలలో ది న్యూస్ రిపోర్ట్‌తో అనుసంధానమై ఉండండి.',
    shareStory: 'కథనం పంచుకోండి'
  },
  hi: {
    frontPage: 'होम',
    home: 'होम',
    latest: 'ताज़ा खबरें',
    trending: 'ट्रेंडिंग',
    videos: 'वीडियो',
    saved: 'सहेजे गए लेख',
    liked: 'पसंद किए गए लेख',
    preferences: 'पठन प्राथमिकताएं',
    admin: 'एडमिन कंसोल',
    signIn: 'साइन इन',
    signOut: 'लॉग आउट',
    register: 'रजिस्टर',
    profile: 'मेरी प्रोफाइल',
    globalEdition: 'ग्लोबल संस्करण',
    search: 'खोजें',
    // Homepage Section Headings & Controls
    featuredStories: 'प्रमुख ख़बरें',
    fullWire: 'पूरी वायर',
    latestDispatches: 'ताज़ा संदेश',
    forYou: 'आपके लिए',
    chronological: 'कालक्रमानुसार',
    trendingThisWeek: 'इस सप्ताह ट्रेंडिंग',
    top10: 'शीर्ष 10 →',
    editorialCharter: 'संपादकीय घोषणापत्र',
    charterHeadline: 'स्वतंत्र लोकहित पत्रकारिता',
    charterBody: 'द न्यूज़ रिपोर्ट अंतर्राष्ट्रीय मामलों, विज्ञान, सार्वजनिक नीति और सांस्कृतिक परिवर्तनों पर प्रमाणित, तथ्यात्मक समाचार प्रस्तुत करती है।',
    exploreFullArchive: 'पूरा संग्रह देखें →',
    moreStoriesFromToday: 'आज की और ख़बरें',
    viewAll: 'सभी देखें →',
    noStoriesPublished: 'अभी तक कोई खबर प्रकाशित नहीं हुई है।',
    emptyStateHelp: 'संपादकीय टीम द्वारा प्रकाशित होते ही लेख और ताज़ा सूचनाएं यहाँ दिखाई देंगी।',
    // Common Card & Metadata Badges
    breaking: 'ब्रेकिंग',
    exclusive: 'विशेष',
    subscriberExclusive: 'सदस्य विशेष',
    readStory: 'खबर पढ़ें',
    moreIn: 'और ख़बरें:',
    by: 'द्वारा',
    theNewsReport: 'द न्यूज़ रिपोर्ट',
    minRead: 'मिनट पठन',
    mRead: 'मिनट पठन',
    views: 'दृश्य',
    likes: 'पसंद',
    comments: 'टिप्पणियाँ',
    prevBreaking: 'पिछली ब्रेकिंग खबर',
    nextBreaking: 'अगली ब्रेकिंग खबर',
    dismissBreaking: 'ब्रेकिंग बार बंद करें',
    // Phase 3 Article Detail Enhancements
    relatedStories: 'संबंधित ख़बरें',
    relatedDispatches: 'संबंधित ख़बरें',
    latestNews: 'ताज़ा समाचार',
    latestNewsWire: 'ताज़ा समाचार',
    trendingTopics: 'ट्रेंडिंग विषय',
    trendingTags: 'ट्रेंडिंग विषय',
    previousArticle: 'पिछला लेख',
    nextArticle: 'अगला लेख',
    followUs: 'हमें फॉलो करें',
    socialLinksHelp: 'आधिकारिक सोशल मीडिया माध्यमों पर द न्यूज़ रिपोर्ट से जुड़े रहें।',
    shareStory: 'खबर साझा करें'
  }
};

export const CATEGORY_TRANSLATIONS: Record<string, Record<SupportedLanguage, string>> = {
  national: { en: 'National', te: 'జాతీయం', hi: 'राष्ट्रीय' },
  international: { en: 'International', te: 'అంతర్జాతీయం', hi: 'अंतर्राष्ट्रीय' },
  politics: { en: 'Politics', te: 'రాజకీయాలు', hi: 'राजनीति' },
  business: { en: 'Business', te: 'వ్యాపారం', hi: 'व्यापार' },
  technology: { en: 'Technology', te: 'టెక్నాలజీ', hi: 'टेक्नोलॉजी' },
  sports: { en: 'Sports', te: 'క్రీడలు', hi: 'खेल' },
  entertainment: { en: 'Entertainment', te: 'వినోదం', hi: 'मनोरंजन' },
  regional: { en: 'Regional', te: 'ప్రాంతీయం', hi: 'क्षेत्रीय' },
  'andhra-pradesh': { en: 'Andhra Pradesh', te: 'ఆంధ్రప్రదేశ్', hi: 'आंध्र प्रदेश' },
  telangana: { en: 'Telangana', te: 'తెలంగాణ', hi: 'तेलंगाना' }
};

interface LanguageContextType {
  currentLanguage: SupportedLanguage;
  setLanguage: (code: SupportedLanguage) => void;
  availableLanguages: LanguageInfo[];
  t: (key: string) => string;
  getCategoryName: (slug: string, defaultName: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  // Session-explicit language priority
  const [explicitLanguage, setExplicitLanguageState] = useState<SupportedLanguage | null>(() => {
    try {
      const stored = sessionStorage.getItem('reader_language');
      if (stored === 'en' || stored === 'te' || stored === 'hi') {
        return stored;
      }
    } catch {
      // sessionStorage unavailable
    }
    return null;
  });

  const setLanguage = (code: SupportedLanguage) => {
    setExplicitLanguageState(code);
    try {
      sessionStorage.setItem('reader_language', code);
    } catch {
      // Ignore
    }
  };

  // Determine current active language based on priority rules:
  // 1. Explicit navbar/session selection
  // 2. User profile preferred language (if logged in)
  // 3. English fallback ('en')
  let currentLanguage: SupportedLanguage = 'en';
  if (explicitLanguage) {
    currentLanguage = explicitLanguage;
  } else if (user?.preferredLanguage) {
    const pref = user.preferredLanguage.toLowerCase().trim();
    if (pref === 'te' || pref === 'telugu') currentLanguage = 'te';
    else if (pref === 'hi' || pref === 'hindi') currentLanguage = 'hi';
    else currentLanguage = 'en';
  }

  const t = (key: string): string => {
    const langDict = NAV_TRANSLATIONS[currentLanguage] || NAV_TRANSLATIONS.en;
    return langDict[key] || NAV_TRANSLATIONS.en[key] || key;
  };

  const getCategoryName = (slug: string, defaultName: string): string => {
    const normalizedSlug = (slug || '').toLowerCase().trim();
    const catDict = CATEGORY_TRANSLATIONS[normalizedSlug];
    if (catDict && catDict[currentLanguage]) {
      return catDict[currentLanguage];
    }
    return defaultName;
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        setLanguage,
        availableLanguages: SUPPORTED_LANGUAGES,
        t,
        getCategoryName
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

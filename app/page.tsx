"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle, Clock, DollarSign, Activity, Settings2, BarChart, Hammer, Layers, LayoutList, UploadCloud, X, Mail, Lock, User, Hash } from "lucide-react";
import { Button, Card, Pill, Accordion, Spinner } from "@/components/ui";
import { CITY_SUGGESTIONS } from "@/lib/cities";

type StageLabel = "Planning" | "Foundation" | "Structure" | "Services" | "Finishing" | "Completed";

type BaseResult = {
  project_status: "under_construction" | "completed";
  stage_of_construction: StageLabel;
  progress_percent: number;
  timeline: { hours_remaining: number; manpower_hours: number; machinery_hours: number };
  category_matrix: {
    Category: string;
    Typology: string;
    Style: string;
    ClimateAdaptability: string;
    Terrain: string;
    SoilType: string;
    MaterialUsed: string;
    InteriorLayout: string;
    RoofType: string;
    Exterior: string;
    AdditionalFeatures: string;
    Sustainability: string;
  };
  scope: { stages_completed: string[]; stages_left: string[]; dependencies: string[] };
  notes: string[];
};

type AdvancedResult = {
  progress_vs_ideal: "Ahead" | "On Track" | "Delayed";
  timeline_drift: string;
  cost_risk_signals: string[];
  recommendations: string[];
};

type Lang = "EN" | "HI" | "ES" | "FR" | "DE" | "TA" | "TE" | "KN" | "ML" | "MR" | "GU" | "PA" | "ZH" | "JA";

type Currency =
  | "USD"
  | "INR"
  | "AED"
  | "EUR"
  | "GBP"
  | "SGD"
  | "AUD"
  | "CAD"
  | "NZD"
  | "CHF"
  | "SEK"
  | "NOK"
  | "DKK"
  | "ZAR"
  | "JPY"
  | "CNY"
  | "HKD"
  | "SAR"
  | "QAR"
  | "KRW"
  | "THB"
  | "MYR"
  | "IDR"
  | "PHP"
  | "BRL"
  | "MXN"
  | "PLN"
  | "CZK"
  | "TRY";

const STAGE_RANGES = [
  { label: "Planning", min: 0, max: 5 },
  { label: "Foundation", min: 5, max: 20 },
  { label: "Structure", min: 20, max: 55 },
  { label: "Services", min: 55, max: 75 },
  { label: "Finishing", min: 75, max: 95 },
  { label: "Completed", min: 100, max: 100 }
] as const;

const LANGUAGE_LABELS: Record<Lang, Record<string, string>> = {
  EN: {
    title: "Builtattic",
    subtitle: "Construction Analysis",
    engine: "Powered by VitruviAI",
    capture: "Capture + Ingest",
    inputWindow: "Input Window",
    constructionProgress: "Construction Progress",
    executionEstimation: "Execution Estimation",
    resources: "Resources",
    stagesLeft: "Stages Left",
    singleUse: "Single Use",
    stored: "Stored",
    valuationInsights: "Valuation + Insights",
    signals: "Signals",
    progressVsIdeal: "Progress vs Ideal",
    timelineDrift: "Timeline Drift",
    insights: "Insights",
    riskReveal: "Risk Reveal",
    revealRisks: "Reveal Risks",
    assumptions: "Assumptions",
    photoEstimate: "Photo-based estimation only.",
    indicative: "Indicative outputs. Validate on-site.",
    projectType: "Project Type",
    scale: "Scale",
    constructionType: "Construction Type",
    location: "Location",
    notes: "Notes",
    useGps: "Use GPS",
    browse: "Browse",
    live: "Live",
    analyze: "Analyze",
    status: "Status",
    stage: "Stage",
    progress: "Progress",
    timeLeft: "Time Left",
    timeTaken: "Time Taken",
    manpower: "Manpower",
    machinery: "Machinery",
    used: "Used",
    remaining: "Remaining",
    confidence: "Confidence",
    budgetLeft: "Budget Left",
    budgetUsed: "Budget Used",
    landVal: "Land Val",
    projectVal: "Project Val",
    propertyVal: "Property Valuation",
    awaitingBase: "Awaiting base analysis",
    runRiskReveal: "Run risk reveal to unlock",
    pending: "Pending",
    notAnalyzed: "Not analyzed",
    climateInferred: "Climate inferred from location",
    climateAssumed: "Climate assumed generically",
    weatherSensitive: "Weather-sensitive phase detected",
    structuralOngoing: "Structural execution ongoing",
    pacingApplied: "Mid-rise pacing benchmark applied",
    currency: "Currency",
    language: "Language",
    light: "Light",
    dark: "Dark",
    highContrast: "HC",
    gps: "GPS",
    exif: "EXIF",
    gpsOff: "GPS Off",
    noGps: "No GPS",
    manual: "Manual"
  },
  HI: {
    title: "Builtattic",
    subtitle: "निर्माण विश्लेषण",
    engine: "VitruviAI द्वारा संचालित",
    capture: "कैप्चर + इनजेस्ट",
    inputWindow: "इनपुट विंडो",
    constructionProgress: "निर्माण प्रगति",
    executionEstimation: "निष्पादन अनुमान",
    resources: "संसाधन",
    stagesLeft: "बाकी चरण",
    singleUse: "सिंगल यूज़",
    stored: "स्टोर किया गया",
    valuationInsights: "वैल्यूएशन + इनसाइट्स",
    signals: "संकेत",
    progressVsIdeal: "आदर्श बनाम प्रगति",
    timelineDrift: "समय विचलन",
    insights: "इनसाइट्स",
    riskReveal: "जोखिम दिखाएँ",
    revealRisks: "जोखिम दिखाएँ",
    assumptions: "मान्यताएँ",
    photoEstimate: "केवल फोटो-आधारित अनुमान।",
    indicative: "संकेतात्मक परिणाम। साइट पर सत्यापित करें।",
    projectType: "प्रोजेक्ट प्रकार",
    scale: "स्केल",
    constructionType: "निर्माण प्रकार",
    location: "स्थान",
    notes: "नोट्स",
    useGps: "GPS उपयोग करें",
    browse: "अपलोड",
    live: "लाइव",
    analyze: "विश्लेषण",
    status: "स्थिति",
    stage: "चरण",
    progress: "प्रगति",
    timeLeft: "बाकी समय",
    timeTaken: "लगा समय",
    manpower: "मैनपावर",
    machinery: "मशीनरी",
    confidence: "विश्वास स्तर",
    budgetLeft: "बचा बजट",
    budgetUsed: "खर्च बजट",
    landVal: "भूमि मूल्य",
    projectVal: "प्रोजेक्ट मूल्य",
    propertyVal: "संपत्ति मूल्यांकन",
    awaitingBase: "बेस विश्लेषण लंबित",
    runRiskReveal: "जोखिम दिखाने के लिए चलाएँ",
    pending: "लंबित",
    notAnalyzed: "विश्लेषण नहीं हुआ",
    climateInferred: "लोकेशन से जलवायु अनुमानित",
    climateAssumed: "सामान्य जलवायु मान लिया",
    weatherSensitive: "मौसम-संवेदनशील चरण",
    structuralOngoing: "स्ट्रक्चर कार्य जारी",
    pacingApplied: "मिड-राइज़ गति मानक लागू",
    currency: "मुद्रा",
    language: "भाषा",
    light: "लाइट",
    dark: "डार्क",
    highContrast: "HC",
    gps: "GPS",
    exif: "EXIF",
    gpsOff: "GPS बंद",
    noGps: "GPS नहीं",
    manual: "मैनुअल"
  },
  ES: {
    subtitle: "Análisis de construcción",
    engine: "Impulsado por VitruviAI",
    capture: "Captura + Ingesta",
    inputWindow: "Ventana de entrada",
    constructionProgress: "Progreso de obra",
    executionEstimation: "Estimación de ejecución",
    resources: "Recursos",
    stagesLeft: "Fases restantes",
    singleUse: "Uso único",
    stored: "Almacenado",
    valuationInsights: "Valoración + Insights",
    signals: "Señales",
    progressVsIdeal: "Progreso vs ideal",
    timelineDrift: "Desvío de plazo",
    insights: "Insights",
    riskReveal: "Revelar riesgos",
    revealRisks: "Ver riesgos",
    assumptions: "Supuestos",
    photoEstimate: "Estimación solo con foto.",
    indicative: "Resultados indicativos. Validar en sitio.",
    projectType: "Tipo de proyecto",
    scale: "Escala",
    constructionType: "Tipo constructivo",
    location: "Ubicación",
    notes: "Notas",
    useGps: "Usar GPS",
    browse: "Cargar",
    live: "Vivo",
    analyze: "Analizar",
    status: "Estado",
    stage: "Etapa",
    progress: "Progreso",
    timeLeft: "Tiempo restante",
    timeTaken: "Tiempo total",
    manpower: "Mano de obra",
    machinery: "Maquinaria",
    confidence: "Confianza",
    budgetLeft: "Presupuesto restante",
    budgetUsed: "Presupuesto usado",
    landVal: "Valor del terreno",
    projectVal: "Valor del proyecto",
    propertyVal: "Valoración de propiedad",
    awaitingBase: "Esperando análisis base",
    runRiskReveal: "Ejecuta riesgos para ver",
    pending: "Pendiente",
    notAnalyzed: "No analizado",
    climateInferred: "Clima inferido por ubicación",
    climateAssumed: "Clima asumido",
    weatherSensitive: "Fase sensible al clima",
    structuralOngoing: "Estructura en curso",
    pacingApplied: "Referencia de ritmo mid-rise",
    currency: "Moneda",
    language: "Idioma",
    light: "Claro",
    dark: "Oscuro",
    highContrast: "HC",
    gps: "GPS",
    exif: "EXIF",
    gpsOff: "GPS apagado",
    noGps: "Sin GPS",
    manual: "Manual"
  },
  FR: {
    subtitle: "Analyse de construction",
    engine: "Propulsé par VitruviAI",
    capture: "Capture + Ingestion",
    inputWindow: "Fenêtre d'entrée",
    constructionProgress: "Avancement chantier",
    executionEstimation: "Estimation d'exécution",
    resources: "Ressources",
    stagesLeft: "Étapes restantes",
    singleUse: "Usage unique",
    stored: "Enregistré",
    valuationInsights: "Valorisation + Insights",
    signals: "Signaux",
    progressVsIdeal: "Progrès vs idéal",
    timelineDrift: "Dérive planning",
    insights: "Insights",
    riskReveal: "Révéler les risques",
    revealRisks: "Voir les risques",
    assumptions: "Hypothèses",
    photoEstimate: "Estimation basée sur photo.",
    indicative: "Résultats indicatifs. Vérifier sur site.",
    projectType: "Type de projet",
    scale: "Échelle",
    constructionType: "Type constructif",
    location: "Localisation",
    notes: "Notes",
    useGps: "Utiliser GPS",
    browse: "Importer",
    live: "Live",
    analyze: "Analyser",
    status: "Statut",
    stage: "Étape",
    progress: "Progrès",
    timeLeft: "Temps restant",
    timeTaken: "Temps total",
    manpower: "Main-d'œuvre",
    machinery: "Machinerie",
    confidence: "Confiance",
    budgetLeft: "Budget restant",
    budgetUsed: "Budget utilisé",
    landVal: "Valeur du terrain",
    projectVal: "Valeur du projet",
    propertyVal: "Valorisation",
    awaitingBase: "En attente d'analyse",
    runRiskReveal: "Lancer les risques pour voir",
    pending: "En attente",
    notAnalyzed: "Non analysé",
    climateInferred: "Climat déduit de la localisation",
    climateAssumed: "Climat supposé",
    weatherSensitive: "Phase sensible au climat",
    structuralOngoing: "Structure en cours",
    pacingApplied: "Référence mid-rise appliquée",
    currency: "Devise",
    language: "Langue",
    light: "Clair",
    dark: "Sombre",
    highContrast: "HC",
    gps: "GPS",
    exif: "EXIF",
    gpsOff: "GPS coupé",
    noGps: "Pas de GPS",
    manual: "Manuel"
  },
  DE: {
    subtitle: "Bauanalyse",
    engine: "Powered by VitruviAI",
    capture: "Erfassung + Eingabe",
    inputWindow: "Eingabefenster",
    constructionProgress: "Baufortschritt",
    executionEstimation: "Ausführungsabschätzung",
    resources: "Ressourcen",
    stagesLeft: "Offene Phasen",
    singleUse: "Einmalnutzung",
    stored: "Gespeichert",
    valuationInsights: "Bewertung + Insights",
    signals: "Signale",
    progressVsIdeal: "Fortschritt vs Ideal",
    timelineDrift: "Terminabweichung",
    insights: "Insights",
    riskReveal: "Risiken anzeigen",
    revealRisks: "Risiken zeigen",
    assumptions: "Annahmen",
    photoEstimate: "Schätzung nur anhand Foto.",
    indicative: "Indikative Ergebnisse. Vor Ort prüfen.",
    projectType: "Projekttyp",
    scale: "Skalierung",
    constructionType: "Bauart",
    location: "Standort",
    notes: "Notizen",
    useGps: "GPS nutzen",
    browse: "Upload",
    live: "Live",
    analyze: "Analysieren",
    status: "Status",
    stage: "Phase",
    progress: "Fortschritt",
    timeLeft: "Restzeit",
    timeTaken: "Gesamtzeit",
    manpower: "Arbeitskraft",
    machinery: "Maschinen",
    confidence: "Sicherheit",
    budgetLeft: "Restbudget",
    budgetUsed: "Budget genutzt",
    landVal: "Grundwert",
    projectVal: "Projektwert",
    propertyVal: "Objektbewertung",
    awaitingBase: "Basisanalyse ausstehend",
    runRiskReveal: "Risiken ausführen, um zu sehen",
    pending: "Ausstehend",
    notAnalyzed: "Nicht analysiert",
    climateInferred: "Klima aus Standort abgeleitet",
    climateAssumed: "Klima angenommen",
    weatherSensitive: "Wetterkritische Phase",
    structuralOngoing: "Strukturphase aktiv",
    pacingApplied: "Mid-rise Referenz genutzt",
    currency: "Währung",
    language: "Sprache",
    light: "Hell",
    dark: "Dunkel",
    highContrast: "HC",
    gps: "GPS",
    exif: "EXIF",
    gpsOff: "GPS aus",
    noGps: "Kein GPS",
    manual: "Manuell"
  },
  TA: {
    subtitle: "கட்டிடம் பகுப்பாய்வு",
    engine: "VitruviAI இயந்திரம்",
    capture: "பிடிப்பு + உள்ளீடு",
    inputWindow: "உள்ளீட்டு சாளரம்",
    constructionProgress: "கட்டுமான முன்னேற்றம்",
    executionEstimation: "நிறைவேற்ற மதிப்பீடு",
    resources: "வளங்கள்",
    stagesLeft: "மீதமுள்ள கட்டங்கள்",
    singleUse: "ஒருமுறை பயன்பாடு",
    stored: "சேமிக்கப்பட்டது",
    valuationInsights: "மதிப்பீடு + குறிப்புகள்",
    signals: "சிக்னல்கள்",
    progressVsIdeal: "இயல்புடன் ஒப்பீடு",
    timelineDrift: "கால அசைவுகள்",
    insights: "குறிப்புகள்",
    riskReveal: "ஆபத்து காண்க",
    revealRisks: "ஆபத்து காண்க",
    assumptions: "கருதுகோள்கள்",
    photoEstimate: "படத்தை மட்டும் வைத்து மதிப்பீடு.",
    indicative: "கணிசமான முடிவுகள். தளத்தில் சரிபார்க்கவும்.",
    projectType: "திட்ட வகை",
    scale: "அளவு",
    constructionType: "கட்டுமான வகை",
    location: "இடம்",
    notes: "குறிப்புகள்",
    useGps: "GPS பயன்படுத்து",
    browse: "அப்லோடு",
    live: "நேரடி",
    analyze: "பகுப்பு",
    status: "நிலை",
    stage: "கட்டம்",
    progress: "முன்னேற்றம்",
    timeLeft: "மீதமுள்ள நேரம்",
    timeTaken: "எடுத்த நேரம்",
    manpower: "மனோபவர்",
    machinery: "இயந்திரங்கள்",
    confidence: "நம்பிக்கை",
    budgetLeft: "மீதமுள்ள பட்ஜெட்",
    budgetUsed: "பயன்பட்ட பட்ஜெட்",
    landVal: "நில மதிப்பு",
    projectVal: "திட்ட மதிப்பு",
    propertyVal: "சொத்து மதிப்பீடு",
    awaitingBase: "அடிப்படை பகுப்பாய்வு காத்திருப்பு",
    runRiskReveal: "ஆபத்து காண இயக்கவும்",
    pending: "நிலுவையில்",
    notAnalyzed: "பகுப்பாய்வு இல்லை",
    climateInferred: "இடத்தின் அடிப்படையில் காலநிலை",
    climateAssumed: "பொது காலநிலை கருதப்பட்டது",
    weatherSensitive: "வானிலை சென்சிடிவ் கட்டம்",
    structuralOngoing: "ஸ்ட்ரக்சர் வேலை நடைபெறுகிறது",
    pacingApplied: "மிட்-ரைஸ் அளவீடு பயன்படுத்தப்பட்டது",
    currency: "நாணயம்",
    language: "மொழி",
    light: "லைட்",
    dark: "டார்க்",
    highContrast: "HC",
    gps: "GPS",
    exif: "EXIF",
    gpsOff: "GPS ஆஃப்",
    noGps: "GPS இல்லை",
    manual: "கையேடு"
  },
  TE: {
    subtitle: "నిర్మాణ విశ్లేషణ",
    engine: "VitruviAI ఇంజిన్",
    capture: "క్యాప్చర్ + ఇన్పుట్",
    inputWindow: "ఇన్పుట్ విండో",
    constructionProgress: "నిర్మాణ పురోగతి",
    executionEstimation: "నిర్వహణ అంచనా",
    resources: "వనరులు",
    stagesLeft: "మిగిలిన దశలు",
    singleUse: "ఒకసారి ఉపయోగం",
    stored: "సేవ్ అయ్యింది",
    valuationInsights: "విలువ + సూచనలు",
    signals: "సిగ్నల్స్",
    progressVsIdeal: "ఆదర్శంతో పోలిక",
    timelineDrift: "టైమ్ డ్రిఫ్ట్",
    insights: "సూచనలు",
    riskReveal: "రిస్క్ చూపు",
    revealRisks: "రిస్క్ చూపు",
    assumptions: "అంచనాలు",
    photoEstimate: "ఫోటో ఆధారిత అంచనా మాత్రమే.",
    indicative: "సూచనాత్మక ఫలితాలు. సైట్‌లో తనిఖీ చేయండి.",
    projectType: "ప్రాజెక్ట్ టైప్",
    scale: "స్కేల్",
    constructionType: "నిర్మాణ టైప్",
    location: "స్థానం",
    notes: "నోట్స్",
    useGps: "GPS ఉపయోగించు",
    browse: "అప్‌లోడ్",
    live: "లైవ్",
    analyze: "విశ్లేషణ",
    status: "స్థితి",
    stage: "దశ",
    progress: "పురోగతి",
    timeLeft: "మిగిలిన సమయం",
    timeTaken: "పట్టిన సమయం",
    manpower: "మ్యాన్‌పవర్",
    machinery: "యంత్రాలు",
    confidence: "నమ్మకం",
    budgetLeft: "మిగిలిన బడ్జెట్",
    budgetUsed: "ఖర్చైన బడ్జెట్",
    landVal: "భూమి విలువ",
    projectVal: "ప్రాజెక్ట్ విలువ",
    propertyVal: "ఆస్తి విలువ",
    awaitingBase: "బేస్ విశ్లేషణ కోసం వేచి ఉంది",
    runRiskReveal: "రిస్క్ చూపడానికి రన్ చేయండి",
    pending: "పెండింగ్",
    notAnalyzed: "విశ్లేషణ లేదు",
    climateInferred: "లొకేషన్ ఆధారంగా క్లైమేట్",
    climateAssumed: "సాధారణ క్లైమేట్ అంచనా",
    weatherSensitive: "వాతావరణానికి సున్నితమైన దశ",
    structuralOngoing: "స్ట్రక్చర్ వర్క్ కొనసాగుతోంది",
    pacingApplied: "మిడ్-రైజ్ బెంచ్‌మార్క్ వర్తించింది",
    currency: "కరెన్సీ",
    language: "భాష",
    light: "లైట్",
    dark: "డార్క్",
    highContrast: "HC",
    gps: "GPS",
    exif: "EXIF",
    gpsOff: "GPS ఆఫ్",
    noGps: "GPS లేదు",
    manual: "మాన్యువల్"
  },
  KN: {
    subtitle: "ನಿರ್ಮಾಣ ವಿಶ್ಲೇಷಣೆ",
    engine: "VitruviAI ಎಂಜಿನ್",
    capture: "ಕ್ಯಾಪ್ಚರ್ + ಇನ್‌ಪುಟ್",
    inputWindow: "ಇನ್‌ಪುಟ್ ವಿಂಡೋ",
    constructionProgress: "ನಿರ್ಮಾಣ ಪ್ರಗತಿ",
    executionEstimation: "ಕಾರ್ಯನಿರ್ವಹಣೆ ಅಂದಾಜು",
    resources: "ಸಂಪನ್ಮೂಲಗಳು",
    stagesLeft: "ಉಳಿದ ಹಂತಗಳು",
    singleUse: "ಒಮ್ಮೆ ಬಳಕೆ",
    stored: "ಸೇವ್ ಆಗಿದೆ",
    valuationInsights: "ಮೌಲ್ಯಮಾಪನ + ಇನ್ಸೈಟ್ಸ್",
    signals: "ಸಿಗ್ನಲ್ಸ್",
    progressVsIdeal: "ಆದರ್ಶದೊಂದಿಗೆ ಹೋಲಿಕೆ",
    timelineDrift: "ಟೈಮ್ಲೈನ್ ಡ್ರಿಫ್ಟ್",
    insights: "ಇನ್ಸೈಟ್ಸ್",
    riskReveal: "ರಿಸ್ಕ್ ತೋರಿಸಿ",
    revealRisks: "ರಿಸ್ಕ್ ತೋರಿಸಿ",
    assumptions: "ಅಂದಾಜುಗಳು",
    photoEstimate: "ಫೋಟೋ ಆಧಾರಿತ ಅಂದಾಜು ಮಾತ್ರ.",
    indicative: "ಸೂಚಕ ಫಲಿತಾಂಶಗಳು. ಸೈಟ್‌ನಲ್ಲಿ ಪರಿಶೀಲಿಸಿ.",
    projectType: "ಪ್ರಾಜೆಕ್ಟ್ ಟೈಪ್",
    scale: "ಸ್ಕೇಲ್",
    constructionType: "ಕಾನ್ಸ್ಟ್ರಕ್ಷನ್ ಟೈಪ್",
    location: "ಸ್ಥಳ",
    notes: "ನೋಟ್ಸ್",
    useGps: "GPS ಬಳಸಿ",
    browse: "ಅಪ್ಲೋಡ್",
    live: "ಲೈವ್",
    analyze: "ವಿಶ್ಲೇಷಣೆ",
    status: "ಸ್ಥಿತಿ",
    stage: "ಹಂತ",
    progress: "ಪ್ರಗತಿ",
    timeLeft: "ಉಳಿದ ಸಮಯ",
    timeTaken: "ತೆಗೆದುಕೊಂಡ ಸಮಯ",
    manpower: "ಮ್ಯಾನ್ಪವರ್",
    machinery: "ಯಂತ್ರಗಳು",
    confidence: "ನಂಬಿಕೆ",
    budgetLeft: "ಉಳಿದ ಬಜೆಟ್",
    budgetUsed: "ಬಳಸಿದ ಬಜೆಟ್",
    landVal: "ಭೂಮಿ ಮೌಲ್ಯ",
    projectVal: "ಪ್ರಾಜೆಕ್ಟ್ ಮೌಲ್ಯ",
    propertyVal: "ಆಸ್ತಿ ಮೌಲ್ಯ",
    awaitingBase: "ಬೇಸ್ ವಿಶ್ಲೇಷಣೆಗೆ ಕಾಯುತ್ತಿದೆ",
    runRiskReveal: "ರಿಸ್ಕ್ ನೋಡಲು ರನ್ ಮಾಡಿ",
    pending: "ಪೆಂಡಿಂಗ್",
    notAnalyzed: "ವಿಶ್ಲೇಷಣೆ ಇಲ್ಲ",
    climateInferred: "ಸ್ಥಳದಿಂದ ಹವಾಮಾನ ಅಂದಾಜು",
    climateAssumed: "ಸಾಮಾನ್ಯ ಹವಾಮಾನ ಅಂದಾಜು",
    weatherSensitive: "ಹವಾಮಾನ ಸಂವೇದನಾಶೀಲ ಹಂತ",
    structuralOngoing: "ಸ್ಟ್ರಕ್ಚರ್ ಕೆಲಸ ನಡೆಯುತ್ತಿದೆ",
    pacingApplied: "ಮಿಡ್-ರೈಸ್ ಬೆಂಚ್ಮಾರ್ಕ್ ಅನ್ವಯಿಸಲಾಗಿದೆ",
    currency: "ಕರೆನ್ಸಿ",
    language: "ಭಾಷೆ",
    light: "ಲೈಟ್",
    dark: "ಡಾರ್ಕ್",
    highContrast: "HC",
    gps: "GPS",
    exif: "EXIF",
    gpsOff: "GPS ಆಫ್",
    noGps: "GPS ಇಲ್ಲ",
    manual: "ಮಾನುವಲ್"
  },
  ML: {
    subtitle: "നിർമാണ വിശകലനം",
    engine: "VitruviAI എൻജിൻ",
    capture: "ക്യാപ്ചർ + ഇൻപുട്ട്",
    inputWindow: "ഇൻപുട്ട് വിൻഡോ",
    constructionProgress: "നിർമാണ പുരോഗതി",
    executionEstimation: "നിർവഹണ അനുമാനം",
    resources: "വിഭവങ്ങൾ",
    stagesLeft: "ബാക്കി ഘട്ടങ്ങൾ",
    singleUse: "ഒറ്റ ഉപയോഗം",
    stored: "സേവ് ചെയ്തു",
    valuationInsights: "വിലയിരുത്തൽ + ഇൻസൈറ്റ്സ്",
    signals: "സിഗ്നലുകൾ",
    progressVsIdeal: "ഇഡിയൽ താരതമ്യം",
    timelineDrift: "ടൈംലൈൻ ഡ്രിഫ്റ്റ്",
    insights: "ഇൻസൈറ്റ്സ്",
    riskReveal: "റിസ്ക് കാണിക്കുക",
    revealRisks: "റിസ്ക് കാണിക്കുക",
    assumptions: "അനുമാനങ്ങൾ",
    photoEstimate: "ഫോട്ടോ അടിസ്ഥാനമാക്കിയുള്ള വിലയിരുത്തൽ മാത്രം.",
    indicative: "സൂചനാത്മക ഫലങ്ങൾ. സൈറ്റിൽ പരിശോധിക്കുക.",
    projectType: "പ്രോജക്റ്റ് തരം",
    scale: "സ്കെയിൽ",
    constructionType: "നിർമാണ തരം",
    location: "സ്ഥലം",
    notes: "നോട്ട്സ്",
    useGps: "GPS ഉപയോഗിക്കുക",
    browse: "അപ്‌ലോഡ്",
    live: "ലൈവ്",
    analyze: "വിശകലനം",
    status: "സ്റ്റാറ്റസ്",
    stage: "ഘട്ടം",
    progress: "പുരോഗതി",
    timeLeft: "ബാക്കി സമയം",
    timeTaken: "എടുത്ത സമയം",
    manpower: "മാൻപവർ",
    machinery: "മെഷിനറി",
    confidence: "വിശ്വാസം",
    budgetLeft: "ബാക്കി ബജറ്റ്",
    budgetUsed: "ഉപയോഗിച്ച ബജറ്റ്",
    landVal: "ഭൂമി മൂല്യം",
    projectVal: "പ്രോജക്റ്റ് മൂല്യം",
    propertyVal: "സ്വത്ത് മൂല്യം",
    awaitingBase: "ബേസ് വിശകലനം കാത്തിരിക്കുന്നു",
    runRiskReveal: "റിസ്ക് കാണാൻ റൺ ചെയ്യുക",
    pending: "പെൻഡിങ്",
    notAnalyzed: "വിശകലനം ഇല്ല",
    climateInferred: "ലൊക്കേഷൻ അടിസ്ഥാനത്തിൽ കാലാവസ്ഥ",
    climateAssumed: "സാധാരണ കാലാവസ്ഥ അനുമാനം",
    weatherSensitive: "കാലാവസ്ഥയ്ക്ക് സെൻസിറ്റീവ് ഘട്ടം",
    structuralOngoing: "സ്ട്രക്ചർ ജോലി നടക്കുന്നു",
    pacingApplied: "മിഡ്-റൈസ് ബെഞ്ച്മാർക്ക് പ്രയോഗിച്ചു",
    currency: "കറൻസി",
    language: "ഭാഷ",
    light: "ലൈറ്റ്",
    dark: "ഡാർക്ക്",
    highContrast: "HC",
    gps: "GPS",
    exif: "EXIF",
    gpsOff: "GPS ഓഫ്",
    noGps: "GPS ഇല്ല",
    manual: "മാനുവൽ"
  },
  MR: {
    subtitle: "बांधकाम विश्लेषण",
    engine: "VitruviAI इंजिन",
    capture: "कॅप्चर + इनपुट",
    inputWindow: "इनपुट विंडो",
    constructionProgress: "बांधकाम प्रगती",
    executionEstimation: "अंमलबजावणी अंदाज",
    resources: "संसाधने",
    stagesLeft: "उर्वरित टप्पे",
    singleUse: "एकदाच वापर",
    stored: "जतन केले",
    valuationInsights: "मूल्यांकन + इनसाइट्स",
    signals: "सिग्नल्स",
    progressVsIdeal: "आदर्शाशी तुलना",
    timelineDrift: "टाइमलाइन ड्रिफ्ट",
    insights: "इनसाइट्स",
    riskReveal: "धोका दाखवा",
    revealRisks: "धोका दाखवा",
    assumptions: "गृहितके",
    photoEstimate: "फोटो-आधारित अंदाज.",
    indicative: "सूचक परिणाम. साइटवर तपासा.",
    projectType: "प्रकल्प प्रकार",
    scale: "स्केल",
    constructionType: "बांधकाम प्रकार",
    location: "स्थान",
    notes: "नोट्स",
    useGps: "GPS वापरा",
    browse: "अपलोड",
    live: "लाइव्ह",
    analyze: "विश्लेषण",
    status: "स्थिती",
    stage: "टप्पा",
    progress: "प्रगती",
    timeLeft: "उरलेला वेळ",
    timeTaken: "लागलेला वेळ",
    manpower: "मनपावर",
    machinery: "यंत्रे",
    confidence: "विश्वास",
    budgetLeft: "उरलेले बजेट",
    budgetUsed: "वापरलेला बजेट",
    landVal: "जमीन मूल्य",
    projectVal: "प्रकल्प मूल्य",
    propertyVal: "मालमत्ता मूल्य",
    awaitingBase: "बेस विश्लेषण प्रतीक्षेत",
    runRiskReveal: "धोका पाहण्यासाठी चालवा",
    pending: "प्रलंबित",
    notAnalyzed: "विश्लेषण नाही",
    climateInferred: "स्थानावरून हवामान अंदाज",
    climateAssumed: "सामान्य हवामान गृहित",
    weatherSensitive: "हवामान संवेदनशील टप्पा",
    structuralOngoing: "स्ट्रक्चर काम सुरू आहे",
    pacingApplied: "मिड-राईज मानक लागू",
    currency: "चलन",
    language: "भाषा",
    light: "लाइट",
    dark: "डार्क",
    highContrast: "HC",
    gps: "GPS",
    exif: "EXIF",
    gpsOff: "GPS बंद",
    noGps: "GPS नाही",
    manual: "मॅन्युअल"
  },
  GU: {
    subtitle: "બાંધકામ વિશ્લેષણ",
    engine: "VitruviAI એન્જિન",
    capture: "કૅપ્ચર + ઇનપુટ",
    inputWindow: "ઇનપુટ વિન્ડો",
    constructionProgress: "બાંધકામ પ્રગતિ",
    executionEstimation: "અનુમાનિત અમલ",
    resources: "સ્રોતો",
    stagesLeft: "બાકી તબક્કા",
    singleUse: "એક વખત ઉપયોગ",
    stored: "સેવ કરેલું",
    valuationInsights: "મૂલ્યાંકન + ઇનસાઇટ્સ",
    signals: "સિગ્નલ્સ",
    progressVsIdeal: "આદર્શની તુલના",
    timelineDrift: "ટાઇમલાઇન ડ્રિફ્ટ",
    insights: "ઇનસાઇટ્સ",
    riskReveal: "જોખમ બતાવો",
    revealRisks: "જોખમ બતાવો",
    assumptions: "ધારણાઓ",
    photoEstimate: "ફોટો આધારિત અંદાજ.",
    indicative: "સૂચક પરિણામો. સાઇટ પર ચકાસો.",
    projectType: "પ્રોજેક્ટ પ્રકાર",
    scale: "સ્કેલ",
    constructionType: "બાંધકામ પ્રકાર",
    location: "સ્થાન",
    notes: "નોંધો",
    useGps: "GPS ઉપયોગ કરો",
    browse: "અપલોડ",
    live: "લાઇવ",
    analyze: "વિશ્લેષણ",
    status: "સ્થિતિ",
    stage: "તબક્કો",
    progress: "પ્રગતિ",
    timeLeft: "બાકી સમય",
    timeTaken: "લાગેલો સમય",
    manpower: "મેનપાવર",
    machinery: "યંત્રો",
    confidence: "વિશ્વાસ",
    budgetLeft: "બાકી બજેટ",
    budgetUsed: "ઉપયોગ કરેલો બજેટ",
    landVal: "જમીન મૂલ્ય",
    projectVal: "પ્રોજેક્ટ મૂલ્ય",
    propertyVal: "મિલકત મૂલ્ય",
    awaitingBase: "બેઝ વિશ્લેષણ માટે રાહ",
    runRiskReveal: "જોખમ જોવા માટે ચલાવો",
    pending: "બાકી",
    notAnalyzed: "વિશ્લેષણ નથી",
    climateInferred: "સ્થાન આધારિત હવામાન",
    climateAssumed: "સામાન્ય હવામાન ધાર્યું",
    weatherSensitive: "હવામાન સંવેદનશીલ તબક્કો",
    structuralOngoing: "સ્ટ્રક્ચર કામ ચાલુ છે",
    pacingApplied: "મિડ-રાઈઝ બેન્ચમાર્ક લાગુ",
    currency: "ચલણ",
    language: "ભાષા",
    light: "લાઇટ",
    dark: "ડાર્ક",
    highContrast: "HC",
    gps: "GPS",
    exif: "EXIF",
    gpsOff: "GPS બંધ",
    noGps: "GPS નથી",
    manual: "મેન્યુઅલ"
  },
  PA: {
    subtitle: "ਨਿਰਮਾਣ ਵਿਸ਼ਲੇਸ਼ਣ",
    engine: "VitruviAI ਇੰਜਨ",
    capture: "ਕੈਪਚਰ + ਇਨਪੁਟ",
    inputWindow: "ਇਨਪੁਟ ਵਿੰਡੋ",
    constructionProgress: "ਨਿਰਮਾਣ ਪ੍ਰਗਤੀ",
    executionEstimation: "ਕਾਰਜ ਅੰਦਾਜ਼ਾ",
    resources: "ਸਰੋਤ",
    stagesLeft: "ਬਾਕੀ ਪੜਾਅ",
    singleUse: "ਇੱਕ ਵਾਰ ਵਰਤੋਂ",
    stored: "ਸੇਵ ਕੀਤਾ",
    valuationInsights: "ਮੁੱਲਾਂਕਨ + ਇਨਸਾਈਟਸ",
    signals: "ਸਿਗਨਲ",
    progressVsIdeal: "ਆਦਰਸ਼ ਨਾਲ ਤੁਲਨਾ",
    timelineDrift: "ਟਾਈਮਲਾਈਨ ਡ੍ਰਿਫਟ",
    insights: "ਇਨਸਾਈਟਸ",
    riskReveal: "ਖਤਰਾ ਵੇਖੋ",
    revealRisks: "ਖਤਰਾ ਵੇਖੋ",
    assumptions: "ਅਨੁਮਾਨ",
    photoEstimate: "ਸਿਰਫ਼ ਫੋਟੋ ਆਧਾਰਿਤ ਅੰਦਾਜ਼ਾ।",
    indicative: "ਸੰਕੇਤਕ ਨਤੀਜੇ। ਸਾਈਟ ਤੇ ਚੈੱਕ ਕਰੋ।",
    projectType: "ਪਰੋਜੈਕਟ ਕਿਸਮ",
    scale: "ਸਕੇਲ",
    constructionType: "ਨਿਰਮਾਣ ਕਿਸਮ",
    location: "ਥਾਂ",
    notes: "ਨੋਟਸ",
    useGps: "GPS ਵਰਤੋਂ",
    browse: "ਅਪਲੋਡ",
    live: "ਲਾਈਵ",
    analyze: "ਵਿਸ਼ਲੇਸ਼ਣ",
    status: "ਹਾਲਤ",
    stage: "ਪੜਾਅ",
    progress: "ਪ੍ਰਗਤੀ",
    timeLeft: "ਬਾਕੀ ਸਮਾਂ",
    timeTaken: "ਲੱਗਿਆ ਸਮਾਂ",
    manpower: "ਮੈਨਪਾਵਰ",
    machinery: "ਮਸ਼ੀਨਰੀ",
    confidence: "ਭਰੋਸਾ",
    budgetLeft: "ਬਾਕੀ ਬਜਟ",
    budgetUsed: "ਵਰਤਿਆ ਬਜਟ",
    landVal: "ਜਮੀਨ ਮੁੱਲ",
    projectVal: "ਪਰੋਜੈਕਟ ਮੁੱਲ",
    propertyVal: "ਸੰਪਤੀ ਮੁੱਲ",
    awaitingBase: "ਬੇਸ ਵਿਸ਼ਲੇਸ਼ਣ ਦੀ ਉਡੀਕ",
    runRiskReveal: "ਖਤਰਾ ਦੇਖਣ ਲਈ ਚਲਾਓ",
    pending: "ਬਾਕੀ",
    notAnalyzed: "ਵਿਸ਼ਲੇਸ਼ਣ ਨਹੀਂ",
    climateInferred: "ਥਾਂ ਤੋਂ ਹਵਾਮਾਨ ਅੰਦਾਜ਼ਾ",
    climateAssumed: "ਆਮ ਹਵਾਮਾਨ ਮੰਨਿਆ",
    weatherSensitive: "ਮੌਸਮ ਸੰਵੇਦਨਸ਼ੀਲ ਪੜਾਅ",
    structuralOngoing: "ਸਟਰਕਚਰ ਕੰਮ ਚੱਲ ਰਿਹਾ",
    pacingApplied: "ਮਿਡ-ਰਾਈਜ਼ ਬੈਂਚਮਾਰਕ ਲਾਗੂ",
    currency: "ਮੁਦਰਾ",
    language: "ਭਾਸ਼ਾ",
    light: "ਲਾਈਟ",
    dark: "ਡਾਰਕ",
    highContrast: "HC",
    gps: "GPS",
    exif: "EXIF",
    gpsOff: "GPS ਬੰਦ",
    noGps: "GPS ਨਹੀਂ",
    manual: "ਮੈਨੁਅਲ"
  },
  ZH: {
    subtitle: "施工分析",
    engine: "由 VitruviAI 驱动",
    capture: "采集 + 输入",
    inputWindow: "输入窗口",
    constructionProgress: "施工进度",
    executionEstimation: "执行估算",
    resources: "资源",
    stagesLeft: "剩余阶段",
    singleUse: "单次使用",
    stored: "已保存",
    valuationInsights: "估值 + 见解",
    signals: "信号",
    progressVsIdeal: "进度对比",
    timelineDrift: "工期偏差",
    insights: "见解",
    riskReveal: "风险揭示",
    revealRisks: "查看风险",
    assumptions: "假设",
    photoEstimate: "仅基于照片估算。",
    indicative: "仅供参考，请现场核实。",
    projectType: "项目类型",
    scale: "规模",
    constructionType: "结构类型",
    location: "位置",
    notes: "备注",
    useGps: "使用 GPS",
    browse: "上传",
    live: "现场",
    analyze: "分析",
    status: "状态",
    stage: "阶段",
    progress: "进度",
    timeLeft: "剩余时间",
    timeTaken: "耗时",
    manpower: "人力",
    machinery: "机械",
    confidence: "置信度",
    budgetLeft: "剩余预算",
    budgetUsed: "已用预算",
    landVal: "土地估值",
    projectVal: "项目估值",
    propertyVal: "资产估值",
    awaitingBase: "等待基础分析",
    runRiskReveal: "运行风险以查看",
    pending: "待处理",
    notAnalyzed: "未分析",
    climateInferred: "基于位置推断气候",
    climateAssumed: "采用通用气候假设",
    weatherSensitive: "天气敏感阶段",
    structuralOngoing: "结构施工进行中",
    pacingApplied: "采用中高层基准",
    currency: "货币",
    language: "语言",
    light: "浅色",
    dark: "深色",
    highContrast: "高对比",
    gps: "GPS",
    exif: "EXIF",
    gpsOff: "GPS 关闭",
    noGps: "无 GPS",
    manual: "手动"
  },
  JA: {
    subtitle: "建設分析",
    engine: "VitruviAI エンジン",
    capture: "撮影 + 入力",
    inputWindow: "入力ウィンドウ",
    constructionProgress: "施工進捗",
    executionEstimation: "実行見積り",
    resources: "リソース",
    stagesLeft: "残り工程",
    singleUse: "単回使用",
    stored: "保存済み",
    valuationInsights: "評価 + インサイト",
    signals: "シグナル",
    progressVsIdeal: "理想との差",
    timelineDrift: "工程のズレ",
    insights: "インサイト",
    riskReveal: "リスク表示",
    revealRisks: "リスクを見る",
    assumptions: "前提",
    photoEstimate: "写真ベースの推定のみ。",
    indicative: "参考値です。現地確認を推奨。",
    projectType: "プロジェクト種別",
    scale: "規模",
    constructionType: "構造種別",
    location: "場所",
    notes: "メモ",
    useGps: "GPS を使用",
    browse: "アップロード",
    live: "ライブ",
    analyze: "解析",
    status: "状態",
    stage: "工程",
    progress: "進捗",
    timeLeft: "残り時間",
    timeTaken: "所要時間",
    manpower: "人員",
    machinery: "機械",
    confidence: "信頼度",
    budgetLeft: "残予算",
    budgetUsed: "使用済み予算",
    landVal: "土地評価",
    projectVal: "プロジェクト評価",
    propertyVal: "物件評価",
    awaitingBase: "ベース分析待ち",
    runRiskReveal: "リスク表示を実行",
    pending: "保留",
    notAnalyzed: "未解析",
    climateInferred: "位置情報から気候推定",
    climateAssumed: "一般的な気候仮定",
    weatherSensitive: "天候影響のある工程",
    structuralOngoing: "構造工程進行中",
    pacingApplied: "中高層ベンチマーク適用",
    currency: "通貨",
    language: "言語",
    light: "ライト",
    dark: "ダーク",
    highContrast: "高コントラスト",
    gps: "GPS",
    exif: "EXIF",
    gpsOff: "GPS オフ",
    noGps: "GPS なし",
    manual: "手動"
  }
};

const CURRENCY_LABELS: Record<Currency, { code: Currency; name: string; locale: string }> = {
  USD: { code: "USD", name: "US Dollar", locale: "en-US" },
  INR: { code: "INR", name: "Indian Rupee", locale: "hi-IN" },
  AED: { code: "AED", name: "UAE Dirham", locale: "en-AE" },
  EUR: { code: "EUR", name: "Euro", locale: "fr-FR" },
  GBP: { code: "GBP", name: "British Pound", locale: "en-GB" },
  SGD: { code: "SGD", name: "Singapore Dollar", locale: "en-SG" },
  AUD: { code: "AUD", name: "Australian Dollar", locale: "en-AU" },
  CAD: { code: "CAD", name: "Canadian Dollar", locale: "en-CA" },
  NZD: { code: "NZD", name: "New Zealand Dollar", locale: "en-NZ" },
  CHF: { code: "CHF", name: "Swiss Franc", locale: "de-CH" },
  SEK: { code: "SEK", name: "Swedish Krona", locale: "sv-SE" },
  NOK: { code: "NOK", name: "Norwegian Krone", locale: "nb-NO" },
  DKK: { code: "DKK", name: "Danish Krone", locale: "da-DK" },
  ZAR: { code: "ZAR", name: "South African Rand", locale: "en-ZA" },
  JPY: { code: "JPY", name: "Japanese Yen", locale: "ja-JP" },
  CNY: { code: "CNY", name: "Chinese Yuan", locale: "zh-CN" },
  HKD: { code: "HKD", name: "Hong Kong Dollar", locale: "en-HK" },
  SAR: { code: "SAR", name: "Saudi Riyal", locale: "ar-SA" },
  QAR: { code: "QAR", name: "Qatari Riyal", locale: "ar-QA" },
  KRW: { code: "KRW", name: "South Korean Won", locale: "ko-KR" },
  THB: { code: "THB", name: "Thai Baht", locale: "th-TH" },
  MYR: { code: "MYR", name: "Malaysian Ringgit", locale: "ms-MY" },
  IDR: { code: "IDR", name: "Indonesian Rupiah", locale: "id-ID" },
  PHP: { code: "PHP", name: "Philippine Peso", locale: "en-PH" },
  BRL: { code: "BRL", name: "Brazilian Real", locale: "pt-BR" },
  MXN: { code: "MXN", name: "Mexican Peso", locale: "es-MX" },
  PLN: { code: "PLN", name: "Polish Zloty", locale: "pl-PL" },
  CZK: { code: "CZK", name: "Czech Koruna", locale: "cs-CZ" },
  TRY: { code: "TRY", name: "Turkish Lira", locale: "tr-TR" }
};

const LANGUAGE_OPTIONS: { value: Lang; label: string }[] = [
  { value: "EN", label: "English" },
  { value: "HI", label: "Hindi" },
  { value: "ES", label: "Spanish" },
  { value: "FR", label: "French" },
  { value: "DE", label: "German" },
  { value: "TA", label: "Tamil" },
  { value: "TE", label: "Telugu" },
  { value: "KN", label: "Kannada" },
  { value: "ML", label: "Malayalam" },
  { value: "MR", label: "Marathi" },
  { value: "GU", label: "Gujarati" },
  { value: "PA", label: "Punjabi" },
  { value: "ZH", label: "Chinese" },
  { value: "JA", label: "Japanese" }
];

type RatesPayload = { base: Currency; rates: Record<string, number>; updatedAt?: number };

function formatCurrencyValue(currency: Currency, amount: number, rates: RatesPayload | null) {
  if (!rates || !rates.rates) return "-";
  const usdRate = rates.rates["USD"];
  const targetRate = rates.rates[currency];
  if (!targetRate) return "-";
  const baseAmount = rates.base === "USD" ? 1 : usdRate ? 1 / usdRate : null;
  if (!baseAmount) return "-";
  const amountInBase = rates.base === "USD" ? amount : amount * baseAmount;
  const converted = amountInBase * targetRate;
  const fmt = new Intl.NumberFormat(CURRENCY_LABELS[currency].locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  });
  return fmt.format(converted);
}

function formatCurrencyRange(currency: Currency, min: number, max: number, rates: RatesPayload | null) {
  if (!rates || !rates.rates) return "—";
  const usdRate = rates.rates["USD"];
  const targetRate = rates.rates[currency];
  if (!targetRate) return "—";
  const baseAmount = rates.base === "USD" ? 1 : usdRate ? 1 / usdRate : null;
  if (!baseAmount) return "—";
  const convert = (amountUsd: number) => {
    const amountInBase = rates.base === "USD" ? amountUsd : amountUsd * baseAmount;
    return amountInBase * targetRate;
  };
  const fmt = new Intl.NumberFormat(CURRENCY_LABELS[currency].locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  });
  return `${fmt.format(convert(min))} – ${fmt.format(convert(max))}`;
}

function formatDurationDetailed(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "—";
  let hours = Math.round(value);
  const years = Math.floor(hours / (24 * 365));
  hours -= years * 24 * 365;
  const months = Math.floor(hours / (24 * 30));
  hours -= months * 24 * 30;
  const days = Math.floor(hours / 24);
  hours -= days * 24;
  const parts = [];
  if (years) parts.push(`${years} ${years === 1 ? "year" : "years"}`);
  if (months) parts.push(`${months} ${months === 1 ? "month" : "months"}`);
  if (days) parts.push(`${days} ${days === 1 ? "day" : "days"}`);
  if (hours || parts.length === 0) parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
  return parts.join(" ");
}

function roundTo(value: number, step: number) {
  if (!Number.isFinite(value)) return value;
  return Math.round(value / step) * step;
}

function compactWords(value?: string, maxWords = 2) {
  if (!value) return "-";
  return value
    .replace(/[\n\r]+/g, " ")
    .trim()
    .split(/\s+/)
    .slice(0, maxWords)
    .join(" ");
}

function cleanSentence(value: string, maxLength = 120) {
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (trimmed.length <= maxLength) return trimmed;
  return trimmed.slice(0, maxLength).replace(/\s+\S*$/, "") + "…";
}

function parsePercent(value?: string) {
  if (!value) return null;
  const m = value.match(/[-+]?\d+(?:\.\d+)?/);
  if (!m) return null;
  return Number(m[0]);
}

function normalizeStage(value?: string, status?: BaseResult["project_status"]): StageLabel {
  if (status === "completed") return "Completed";
  if (!value) return "Planning";
  const v = value.toLowerCase();
  if (v.includes("plan")) return "Planning";
  if (v.includes("found")) return "Foundation";
  if (v.includes("struct") || v.includes("frame")) return "Structure";
  if (v.includes("service") || v.includes("mep") || v.includes("electric") || v.includes("plumb")) return "Services";
  if (v.includes("finish") || v.includes("interior") || v.includes("paint")) return "Finishing";
  return "Structure";
}


function manpowerTag(stage: string) {
  if (stage === "Planning") return "Planners";
  if (stage === "Foundation") return "Masons";
  if (stage === "Structure") return "Steel";
  if (stage === "Services") return "MEP";
  if (stage === "Finishing") return "Finishers";
  return "Inspect";
}

function machineryTag(stage: string) {
  if (stage === "Planning") return "Survey";
  if (stage === "Foundation") return "Mixers";
  if (stage === "Structure") return "Cranes";
  if (stage === "Services") return "Lifts";
  if (stage === "Finishing") return "Scaff";
  return "None";
}

function hardwareTag(stage: string) {
  if (stage === "Planning") return "Docs";
  if (stage === "Foundation") return "Rebar";
  if (stage === "Structure") return "Steel";
  if (stage === "Services") return "Wiring";
  if (stage === "Finishing") return "Fixtures";
  return "Snag";
}

function skillsTag(stage: string) {
  if (stage === "Planning") return "Survey";
  if (stage === "Foundation") return "Formwork";
  if (stage === "Structure") return "Shuttering";
  if (stage === "Services") return "MEP";
  if (stage === "Finishing") return "Interiors";
  return "QA";
}

function useCountUp(value: number, duration = 800) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!Number.isFinite(value)) {
      setDisplay(0);
      return;
    }
    const start = performance.now();
    const from = 0;
    const to = value;
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return display;
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">{children}</div>;
}

function Info({ text }: { text: string }) {
  const [open, setOpen] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setOpen((value) => !value)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onBlur={() => setOpen(false)}
      className="relative ml-2 inline-flex h-4 w-4 items-center justify-center rounded-full border border-[color:var(--line)] text-[10px] font-bold text-[color:var(--muted)]"
      aria-label="Info"
    >
      i
      <span
        className={`pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-52 -translate-x-1/2 rounded-lg border border-[color:var(--line)] bg-[color:var(--card)] p-2 text-[10px] font-semibold text-[color:var(--text)] shadow-lg transition ${
          open ? "opacity-100" : "opacity-0"
        }`}
      >
        {text}
      </span>
    </button>
  );
}

function StatCard({ label, value, tooltip, tag }: { label: string; value: React.ReactNode; tooltip?: string; tag?: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-2xl border border-[color:var(--line)] bg-[color:var(--card)] px-3 py-3">
      <div className="flex items-center text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
        {label}
        {tooltip ? <Info text={tooltip} /> : null}
      </div>
      <div className="mt-2 break-words text-[clamp(12px,1.4vw,18px)] font-black leading-tight text-[color:var(--text)]">{value}</div>
      {tag ? <div className="mt-2">{tag}</div> : null}
    </div>
  );
}

function PieCard({
  title,
  segments,
  valueFormatter,
  infoText
}: {
  title: string;
  segments: { label: string; value: number; color: string }[];
  valueFormatter?: (value: number) => string;
  infoText?: string;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  let acc = 0;
  const gradient = segments
    .map((s) => {
      const start = (acc / total) * 100;
      acc += s.value;
      const end = (acc / total) * 100;
      return `${s.color} ${start}% ${end}%`;
    })
    .join(", ");

  return (
    <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--card)] p-3">
      <div className="flex items-center text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
        {title}
        {infoText ? <Info text={infoText} /> : null}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="h-20 w-20 shrink-0 rounded-full aspect-square" style={{ background: `conic-gradient(${gradient})` }} />
        <div className="flex flex-col gap-1">
          {segments.map((s) => (
            <div key={s.label} className="flex items-center gap-2 text-[9px] font-semibold text-[color:var(--text)]">
              <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
              <span className="max-w-[90px] truncate">{s.label}</span>
              <span className="text-[color:var(--muted)]">{valueFormatter ? valueFormatter(s.value) : ""}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const [usage, setUsage] = useState<{ freeUsed: number; freeRemaining: number | "∞"; paid: boolean; hasPro?: boolean; user?: any } | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [authMode, setAuthMode] = useState<"signin" | "register" | "accesscode" | null>(null);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<any | null>(null);

  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState({
    location: "",
    projectType: "Residential",
    scale: "Low-rise",
    constructionType: "RCC",
    note: ""
  });
  const [geoStatus, setGeoStatus] = useState<"exif" | "gps" | "manual" | "denied" | "none">("none");

  const [loading, setLoading] = useState(false);
  const [advLoading, setAdvLoading] = useState(false);

  const [base, setBase] = useState<BaseResult | null>(null);
  const [advanced, setAdvanced] = useState<AdvancedResult | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark" | "hc">("light");
  const [lang, setLang] = useState<Lang>("EN");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [rates, setRates] = useState<RatesPayload | null>(null);
  const [rateStatus, setRateStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");

  const browseInputRef = useRef<HTMLInputElement>(null);
  const liveInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedTheme = window.localStorage.getItem("theme");
    const savedLang = window.localStorage.getItem("lang");
    const savedCurrency = window.localStorage.getItem("currency");
    if (savedTheme === "dark" || savedTheme === "hc" || savedTheme === "light") setTheme(savedTheme);
    if (savedLang && LANGUAGE_OPTIONS.some((option) => option.value === savedLang)) {
      setLang(savedLang as Lang);
    }
    if (
      savedCurrency &&
      [
        "USD",
        "INR",
        "AED",
        "EUR",
        "GBP",
        "SGD",
        "AUD",
        "CAD",
        "NZD",
        "CHF",
        "SEK",
        "NOK",
        "DKK",
        "ZAR",
        "JPY",
        "CNY",
        "HKD",
        "SAR",
        "QAR",
        "KRW",
        "THB",
        "MYR",
        "IDR",
        "PHP",
        "BRL",
        "MXN",
        "PLN",
        "CZK",
        "TRY"
      ].includes(savedCurrency)
    ) {
      setCurrency(savedCurrency as Currency);
    }
    // Load access code from localStorage
    const savedAccessCode = localStorage.getItem("va_access_code");
    if (savedAccessCode) {
      setAccessCode(savedAccessCode);
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem("lang", lang);
    window.localStorage.setItem("currency", currency);
  }, [lang, currency]);

  const selectedCategoryRow = useMemo(() => {
    return base?.category_matrix ?? null;
  }, [base]);

  const categoryEntries = selectedCategoryRow
    ? [
        { label: "Category", value: selectedCategoryRow.Category },
        { label: "Typology", value: selectedCategoryRow.Typology },
        { label: "Style", value: selectedCategoryRow.Style },
        { label: "Climate Adaptability", value: selectedCategoryRow.ClimateAdaptability },
        { label: "Terrain", value: selectedCategoryRow.Terrain },
        { label: "Soil Type", value: selectedCategoryRow.SoilType },
        { label: "Material Used", value: selectedCategoryRow.MaterialUsed },
        { label: "Interior Layout", value: selectedCategoryRow.InteriorLayout },
        { label: "Roof Type", value: selectedCategoryRow.RoofType },
        { label: "Exterior", value: selectedCategoryRow.Exterior },
        { label: "Additional Features", value: selectedCategoryRow.AdditionalFeatures },
        { label: "Sustainability", value: selectedCategoryRow.Sustainability }
      ]
    : [];

  useEffect(() => {
    let active = true;
    const loadRates = async () => {
      setRateStatus("loading");
      try {
        const r = await fetch("/api/rates?base=USD", { cache: "no-store" });
        const j = (await r.json()) as RatesPayload;
        if (!r.ok || !j?.rates) throw new Error("rates");
        if (!active) return;
        setRates(j);
        setRateStatus("ok");
      } catch {
        if (!active) return;
        setRateStatus("error");
      }
    };
    loadRates();
    return () => {
      active = false;
    };
  }, []);

  const t = useCallback(
    (key: string) => {
      return LANGUAGE_LABELS[lang][key] ?? LANGUAGE_LABELS.EN[key] ?? key;
    },
    [lang]
  );

  const languageName = useMemo(() => {
    return LANGUAGE_OPTIONS.find((item) => item.value === lang)?.label ?? "English";
  }, [lang]);

  async function readJson<T>(r: Response): Promise<{ data: T | null; text: string }> {
    const text = await r.text();
    if (!text) return { data: null, text: "" };
    try {
      return { data: JSON.parse(text) as T, text };
    } catch {
      return { data: null, text };
    }
  }

  const refreshUsage = useCallback(async () => {
    const headers: Record<string, string> = {};
    if (accessCode) {
      headers["x-vitruvi-access-code"] = accessCode;
    }
    const r = await fetch("/api/usage", { cache: "no-store", headers });
    const { data } = await readJson<{ freeUsed: number; freeRemaining: number | null; paid: boolean; hasPro?: boolean; user?: any }>(r);
    if (!data) return;
    setUsage({
      freeUsed: data.freeUsed,
      freeRemaining: data.freeRemaining === null ? "∞" : data.freeRemaining,
      paid: data.paid,
      hasPro: data.hasPro,
      user: data.user
    });
    if (data.user) {
      setAuthUser(data.user);
      setAuthEmail(data.user.email);
    }
  }, [accessCode]);

  useEffect(() => {
    refreshUsage().catch(() => {});
  }, [refreshUsage]);

  const freeRemaining = usage ? (usage.freeRemaining === "∞" ? Infinity : usage.freeRemaining) : 0;
  const paywalled = usage ? !usage.paid && freeRemaining <= 0 : false;
  const canRun = useMemo(() => {
    if (!usage) return false;
    if (usage.paid) return true;
    return (usage.freeRemaining as number) > 0;
  }, [usage]);

  async function requestGps() {
    if (!navigator.geolocation) {
      setGeoStatus("none");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(5);
        const lon = pos.coords.longitude.toFixed(5);
        setMeta((s) => ({ ...s, location: `${lat},${lon}` }));
        setGeoStatus("gps");
      },
      () => {
        setGeoStatus("denied");
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  }

  async function tryExif(file: File) {
    try {
      const exifr = await import("exifr");
      const gps = await exifr.gps(file);
      if (gps?.latitude && gps?.longitude) {
        const lat = gps.latitude.toFixed(5);
        const lon = gps.longitude.toFixed(5);
        setMeta((s) => ({ ...s, location: `${lat},${lon}` }));
        setGeoStatus("exif");
        return true;
      }
    } catch {
      return false;
    }
    return false;
  }

  async function onPickFile(file: File) {
    setError(null);
    setBase(null);
    setAdvanced(null);

    const reader = new FileReader();
    reader.onload = () => setImageDataUrl(String(reader.result));
    reader.readAsDataURL(file);

    const exifFound = await tryExif(file);
    if (!exifFound) await requestGps();
  }

  async function runBase() {
    if (!imageDataUrl) return;
    setLoading(true);
    setError(null);
    setAdvanced(null);

    try {
      const headers: Record<string, string> = { "content-type": "application/json" };
      if (accessCode) {
        headers["x-vitruvi-access-code"] = accessCode;
      }
      const r = await fetch("/api/analyze", {
        method: "POST",
        headers,
        body: JSON.stringify({ imageDataUrl, meta: { ...meta, language: languageName } })
      });

      const { data: j, text } = await readJson<any>(r);
      if (!r.ok) {
        if (j?.error === "PAYWALL") throw new Error("Paywall");
        const detail = (j?.message ?? j?.error ?? text) || `Request failed (${r.status})`;
        throw new Error(detail);
      }

      if (!j) throw new Error("Failed");
      setBase(j.base);
      setUsage(j.usage);
    } catch (e: any) {
      setError(e.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function runAdvanced() {
    if (!imageDataUrl || !base) return;
    setAdvLoading(true);
    setError(null);

    try {
      const headers: Record<string, string> = { "content-type": "application/json" };
      if (accessCode) {
        headers["x-vitruvi-access-code"] = accessCode;
      }
      const r = await fetch("/api/advanced", {
        method: "POST",
        headers,
        body: JSON.stringify({ imageDataUrl, base, language: languageName })
      });

      const { data: j, text } = await readJson<any>(r);
      if (!r.ok) {
        if (j?.error === "PAYWALL") throw new Error("Paywall");
        const detail = (j?.message ?? j?.error ?? text) || `Request failed (${r.status})`;
        throw new Error(detail);
      }

      if (!j) throw new Error("Failed");
      setAdvanced(j.advanced);
    } catch (e: any) {
      setError(e.message ?? "Failed");
    } finally {
      setAdvLoading(false);
    }
  }

  async function signIn() {
    setError(null);
    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    if (!r.ok) {
      const { data: j, text } = await readJson<any>(r);
      setError((j?.error ?? text) || "Failed");
      return;
    }
    const { data: j } = await readJson<any>(r);
    setAuthEmail(email.toLowerCase());
    setAuthUser(j?.user || null);
    setEmail("");
    setPassword("");
    setAuthMode(null);
    await refreshUsage();
  }

  async function register() {
    setError(null);
    const r = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, name })
    });
    if (!r.ok) {
      const { data: j, text } = await readJson<any>(r);
      setError((j?.error ?? text) || "Failed");
      return;
    }
    const { data: j } = await readJson<any>(r);
    setAuthEmail(email.toLowerCase());
    setAuthUser(j?.user || null);
    setEmail("");
    setPassword("");
    setName("");
    setAuthMode(null);
    await refreshUsage();
  }

  async function validateAccessCode() {
    setError(null);
    const r = await fetch("/api/auth/access-code", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ accessCode })
    });
    if (!r.ok) {
      const { data: j, text } = await readJson<any>(r);
      setError((j?.error ?? text) || "Invalid access code");
      return;
    }
    // Store in localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("va_access_code", accessCode);
    }
    setAuthMode(null);
    await refreshUsage();
  }

  async function signOut() {
    setError(null);
    await fetch("/api/auth/logout", { method: "POST" });
    setAuthEmail(null);
    setAuthUser(null);
    setAccessCode("");
    if (typeof window !== "undefined") {
      localStorage.removeItem("va_access_code");
    }
    await refreshUsage();
  }

  async function upgrade() {
    setError(null);
    const r = await fetch("/api/stripe/checkout", { method: "POST" });
    const { data: j, text } = await readJson<any>(r);
    if (!r.ok) {
      setError((j?.error ?? text) || "Failed");
      return;
    }
    if (j?.url) window.location.href = j.url;
  }

  const status = base?.project_status === "completed" ? "Completed" : base?.project_status === "under_construction" ? "Under Construction" : "Unknown";
  let stageLabel = normalizeStage(base?.stage_of_construction, base?.project_status);

  const rawProgress = Math.min(100, Math.max(0, base?.progress_percent ?? 0));
  const stageRange = STAGE_RANGES.find((range) => range.label === stageLabel);
  const progressValue = stageRange ? Math.min(stageRange.max, Math.max(stageRange.min, rawProgress)) : rawProgress;
  const baseValid = !!base && (status === "Completed" ? progressValue === 100 : stageRange ? progressValue >= stageRange.min && progressValue <= stageRange.max : false);

  const remainingDisplay = useCountUp(base?.timeline.hours_remaining ?? 0, 900);
  const manpowerDisplay = useCountUp(base?.timeline.manpower_hours ?? 0, 900);
  const machineryDisplay = useCountUp(base?.timeline.machinery_hours ?? 0, 900);

  const totalEffort = (base?.timeline.manpower_hours ?? 0) + (base?.timeline.machinery_hours ?? 0);
  const timeTakenDisplay = useCountUp(totalEffort, 900);

  const driftNumber = parsePercent(advanced?.timeline_drift ?? "");
  const driftDisplay = !baseValid
    ? t("awaitingBase")
    : !advanced
      ? t("revealRisks")
      : driftNumber === null
        ? "On Track (±3%)"
        : Math.abs(driftNumber) <= 3
          ? "On Track (±3%)"
          : `${driftNumber > 0 ? "+" : ""}${driftNumber.toFixed(0)}%`;

  const progressVsIdealDisplay = !baseValid ? t("awaitingBase") : advanced?.progress_vs_ideal ?? t("revealRisks");

  const progressFactor = progressValue / 100;
  const geminiVal = base?.valuation;
  const valConfidence: "Low" | "Medium" | "High" = geminiVal?.confidence ?? (stageLabel === "Completed" || stageLabel === "Finishing" ? "High" : stageLabel === "Structure" || stageLabel === "Services" ? "Medium" : "Low");

  // Use Gemini's location-aware valuation when available, fall back to formula
  const scaleFactor =
    meta.scale === "High-rise" ? 1.3 : meta.scale === "Mid-rise" ? 1.15 : meta.scale === "Large-site" ? 1.4 : 1;
  const typeFactor =
    meta.projectType === "Commercial" ? 1.15 : meta.projectType === "Industrial" ? 1.25 : meta.projectType === "Mixed-use" ? 1.2 : 1;
  const fallbackBase = (280000 + progressFactor * 220000) * scaleFactor * typeFactor;

  const minVal = geminiVal ? geminiVal.property_value_min_usd : roundTo(fallbackBase * 0.94, 5000);
  const maxVal = geminiVal ? geminiVal.property_value_max_usd : roundTo(fallbackBase * 1.06, 5000);
  const minBudgetUsed = geminiVal ? geminiVal.budget_used_min_usd : roundTo(fallbackBase * progressFactor * 0.94, 5000);
  const maxBudgetUsed = geminiVal ? geminiVal.budget_used_max_usd : roundTo(fallbackBase * progressFactor * 1.06, 5000);
  const remainingBase = fallbackBase * Math.max(0, 1 - progressFactor);
  const minBudget = roundTo(remainingBase * 0.94, 5000);
  const maxBudget = roundTo(remainingBase * 1.06, 5000);
  const landBase = (120000 + progressFactor * 80000) * scaleFactor;
  const minLand = roundTo(landBase * 0.94, 5000);
  const maxLand = roundTo(landBase * 1.06, 5000);

  const errorShort = error ? compactWords(error, 2) : null;

  const stagesLeft = Array.from(new Set((base?.scope.stages_left ?? []).map((stage) => normalizeStage(stage))))
    .filter((stage) => stage !== "Completed")
    .slice(0, 5);
  const progressDisplay = useCountUp(baseValid ? progressValue : 0, 900);

  const insights = advanced?.recommendations ?? [];

  const contextLower = `${meta.location} ${meta.note}`.toLowerCase();
  const humanInsights: string[] = [];
  const insightSet = new Set<string>();
  const addInsight = (value: string) => {
    const cleaned = cleanSentence(value);
    if (!insightSet.has(cleaned)) {
      insightSet.add(cleaned);
      humanInsights.push(cleaned);
    }
  };

  if (contextLower.includes("coast") || contextLower.includes("beach") || contextLower.includes("bay") || contextLower.includes("sea")) {
    addInsight("Coastal sites usually need extra protection against rust and salt damage.");
  }
  if (contextLower.includes("river") || contextLower.includes("flood") || contextLower.includes("delta") || contextLower.includes("low-lying")) {
    addInsight("Flood risk looks higher here; drainage planning is important.");
  }
  if (contextLower.includes("hill") || contextLower.includes("mountain") || contextLower.includes("slope")) {
    addInsight("Sloped land can slow deliveries and add extra setup time.");
  }
  if (contextLower.includes("clay") || contextLower.includes("black cotton") || contextLower.includes("expansive") || contextLower.includes("soft soil")) {
    addInsight("Soft soil may need stronger foundations than normal.");
  }
  if (contextLower.includes("rock") || contextLower.includes("granite") || contextLower.includes("basalt")) {
    addInsight("Hard rock can slow digging and increase machinery time.");
  }
  if (contextLower.includes("monsoon") || contextLower.includes("rain") || contextLower.includes("humid") || contextLower.includes("wet")) {
    addInsight("Rainy or humid weather can delay outdoor work.");
  }
  if (contextLower.includes("desert") || contextLower.includes("arid") || contextLower.includes("dry") || contextLower.includes("hot")) {
    addInsight("Hot, dry weather can cause faster wear and extra water use.");
  }
  if (contextLower.includes("snow") || contextLower.includes("cold") || contextLower.includes("winter")) {
    addInsight("Cold weather can slow curing and finishing.");
  }
  if (contextLower.includes("seismic") || contextLower.includes("earthquake") || contextLower.includes("fault")) {
    addInsight("Earthquake zones need stronger detailing and checks.");
  }
  if (contextLower.includes("urban") || contextLower.includes("metro") || contextLower.includes("city") || contextLower.includes("downtown")) {
    addInsight("City sites often face tighter delivery and work-hour limits.");
  }
  if (contextLower.includes("rural") || contextLower.includes("village") || contextLower.includes("remote")) {
    addInsight("Remote sites can face slower labour and material supply.");
  }
  if (contextLower.includes("industrial") || contextLower.includes("highway") || contextLower.includes("airport")) {
    addInsight("Noise and dust controls may be stricter nearby.");
  }
  if (contextLower.includes("political") || contextLower.includes("border") || contextLower.includes("sensitive")) {
    addInsight("Local approvals may take longer than usual.");
  }

  if (stageLabel === "Planning") addInsight("Early approvals and site setup decide how fast work can move.");
  if (stageLabel === "Foundation") addInsight("Foundation speed depends on soil and groundwater conditions.");
  if (stageLabel === "Structure") addInsight("Main structure takes the most labour; delays here affect the whole timeline.");
  if (stageLabel === "Services") addInsight("Plumbing and electrical work often slow down if details are missed.");
  if (stageLabel === "Finishing") addInsight("Finishing relies on skilled workers; quality checks can add time.");

  if (meta.projectType === "Residential") addInsight("Expect visible dust and noise; plan for nearby residents.");
  if (meta.projectType === "Commercial") addInsight("Interior fit-out timing can shift handover dates.");

  if (!humanInsights.length) {
    addInsight("Site conditions look standard; confirm pace with a supervisor on-site.");
  }

  const insightsDisplay = !baseValid
    ? [t("awaitingBase")]
    : paywalled
      ? [t("revealRisks")]
      : [...humanInsights.slice(0, 3), ...insights.map((item) => cleanSentence(item)).slice(0, 2)].slice(0, 4);

  const signalPool = new Set<string>();
  if (baseValid) {
    if (geoStatus === "exif" || geoStatus === "gps" || geoStatus === "manual") signalPool.add("Climate tagged");
    if (geoStatus === "none" || geoStatus === "denied") signalPool.add("Climate assumed");
    if (stageLabel === "Planning") signalPool.add("Approval risk");
    if (stageLabel === "Foundation") signalPool.add("Soil check");
    if (stageLabel === "Structure") signalPool.add("Structure work");
    if (stageLabel === "Services") signalPool.add("Services fit");
    if (stageLabel === "Finishing") signalPool.add("Finish quality");
    if (meta.scale.includes("Mid")) signalPool.add("Mid-rise pace");
    if (meta.projectType === "Commercial") signalPool.add("Fit-out risk");
    if (meta.projectType === "Residential") signalPool.add("Neighbour impact");
    if (!paywalled && (advanced?.cost_risk_signals ?? []).length) {
      advanced?.cost_risk_signals.forEach((item) => signalPool.add(compactWords(item, 2)));
    }
  }
  const signals = Array.from(signalPool).slice(0, 4);

  const pendingValue = <span className="text-[color:var(--muted)]">{t("pending")}</span>;
  const premium = (value: React.ReactNode) => (paywalled ? <span className="text-[color:var(--muted)]">Locked</span> : value);

  const fxRate = rates?.rates?.[currency];
  const fxInfo =
    rateStatus === "ok" && fxRate
      ? `FX: 1 ${rates?.base ?? "USD"} = ${fxRate.toFixed(3)} ${currency}`
      : rateStatus === "error"
        ? "FX unavailable"
        : "FX loading";

  const timelineZero =
    base &&
    base.project_status !== "completed" &&
    base.timeline.hours_remaining === 0 &&
    base.timeline.manpower_hours === 0 &&
    base.timeline.machinery_hours === 0;
  const timelineValue = !baseValid
    ? t("pending")
    : status === "Completed"
      ? formatDurationDetailed(timeTakenDisplay)
      : timelineZero
        ? t("pending")
        : formatDurationDetailed(remainingDisplay);

  const remainingHours = base?.timeline.hours_remaining ?? 0;
  const baseTotalHours =
    status === "Completed"
      ? Math.max(totalEffort, 800)
      : progressFactor >= 0.05
        ? Math.max(remainingHours / Math.max(1 - progressFactor, 0.1), remainingHours * 1.1)
        : remainingHours * 1.4;
  const totalHoursEstimate = baseValid ? Math.min(baseTotalHours || 1200, 20000) : 1200;

  const manpowerRaw = base?.timeline.manpower_hours ?? 0;
  const machineryRaw = base?.timeline.machinery_hours ?? 0;
  const ratioByStage: Record<StageLabel, { manpower: number; machinery: number }> = {
    Planning: { manpower: 0.8, machinery: 0.2 },
    Foundation: { manpower: 0.6, machinery: 0.4 },
    Structure: { manpower: 0.55, machinery: 0.45 },
    Services: { manpower: 0.7, machinery: 0.3 },
    Finishing: { manpower: 0.8, machinery: 0.2 },
    Completed: { manpower: 0.65, machinery: 0.35 }
  };
  const ratio = ratioByStage[stageLabel];
  const baseHoursForSplit =
    status === "Completed"
      ? (totalEffort > 0 ? totalEffort : totalHoursEstimate)
      : (remainingHours > 0 ? remainingHours : totalHoursEstimate * Math.max(1 - progressFactor, 0.15));
  const rawSum = manpowerRaw + machineryRaw;
  let manpowerEstimate = rawSum > 0 ? manpowerRaw : baseHoursForSplit * ratio.manpower;
  let machineryEstimate = rawSum > 0 ? machineryRaw : baseHoursForSplit * ratio.machinery;
  if (rawSum > 0 && baseHoursForSplit > 0) {
    const scale = baseHoursForSplit / rawSum;
    manpowerEstimate *= scale;
    machineryEstimate *= scale;
  }
  const manpowerValue = !baseValid || timelineZero ? t("pending") : formatDurationDetailed(manpowerEstimate);
  const machineryValue = !baseValid || timelineZero ? t("pending") : formatDurationDetailed(machineryEstimate);
  const manpowerLabel = status === "Completed" ? `${t("manpower")} ${t("used")}` : `${t("manpower")} ${t("remaining")}`;
  const machineryLabel = status === "Completed" ? `${t("machinery")} ${t("used")}` : `${t("machinery")} ${t("remaining")}`;
  const stageWeightTotal = STAGE_RANGES.slice(0, 5).reduce((sum, range) => sum + (range.max - range.min), 0);
  const baseColors = ["#0f172a", "#334155", "#64748b", "#94a3b8", "#cbd5f5"];
  const greyColor = "#cbd5f5";
  const timeSplitSegments = STAGE_RANGES.slice(0, 5).map((range, idx) => ({
    label: range.label,
    value: baseValid ? Math.max(1, Math.round((totalHoursEstimate * (range.max - range.min)) / stageWeightTotal)) : 1,
    color: baseValid ? baseColors[idx] ?? greyColor : greyColor
  }));

  const budgetMix: Record<StageLabel, { label: string; value: number; color: string }[]> = {
    Planning: [
      { label: "Labor", value: 0.22, color: "#0f172a" },
      { label: "Materials", value: 0.3, color: "#334155" },
      { label: "Equipment", value: 0.08, color: "#64748b" },
      { label: "Overhead", value: 0.4, color: "#94a3b8" }
    ],
    Foundation: [
      { label: "Labor", value: 0.24, color: "#0f172a" },
      { label: "Materials", value: 0.46, color: "#334155" },
      { label: "Equipment", value: 0.16, color: "#64748b" },
      { label: "Overhead", value: 0.14, color: "#94a3b8" }
    ],
    Structure: [
      { label: "Labor", value: 0.28, color: "#0f172a" },
      { label: "Materials", value: 0.42, color: "#334155" },
      { label: "Equipment", value: 0.16, color: "#64748b" },
      { label: "Overhead", value: 0.14, color: "#94a3b8" }
    ],
    Services: [
      { label: "Labor", value: 0.34, color: "#0f172a" },
      { label: "Materials", value: 0.33, color: "#334155" },
      { label: "Equipment", value: 0.12, color: "#64748b" },
      { label: "Overhead", value: 0.21, color: "#94a3b8" }
    ],
    Finishing: [
      { label: "Labor", value: 0.38, color: "#0f172a" },
      { label: "Materials", value: 0.32, color: "#334155" },
      { label: "Equipment", value: 0.06, color: "#64748b" },
      { label: "Overhead", value: 0.24, color: "#94a3b8" }
    ],
    Completed: [
      { label: "Labor", value: 0.32, color: "#0f172a" },
      { label: "Materials", value: 0.4, color: "#334155" },
      { label: "Equipment", value: 0.1, color: "#64748b" },
      { label: "Overhead", value: 0.18, color: "#94a3b8" }
    ]
  };
  const budgetSplitBase = baseValid ? (geminiVal ? (minVal + maxVal) / 2 : fallbackBase) : 0;
  const budgetSplitSegments = budgetMix[stageLabel].map((item) => ({
    ...item,
    value: baseValid ? Math.max(1, Math.round(budgetSplitBase * item.value)) : 1,
    color: baseValid ? item.color : greyColor
  }));



  return (
    <div className="min-h-screen flex flex-col overflow-hidden bg-[color:var(--bg)] text-[color:var(--text)] font-sans">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 opacity-[0.03] [background-image:radial-gradient(var(--text)_1px,transparent_1px)] [background-size:32px_32px]" />
        <div className="absolute -top-24 right-10 h-96 w-96 rounded-full bg-[radial-gradient(circle_at_center,var(--glow-1),transparent_70%)]" />
        <div className="absolute bottom-[-120px] left-[-80px] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_at_center,var(--glow-2),transparent_70%)]" />
      </div>

      <header className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-[color:var(--line)] bg-[color:var(--card)]/60 px-6 py-3 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <div className="text-center sm:text-left">
            <div className="text-xl font-black tracking-tight text-[color:var(--text)]">{t("title")}</div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold uppercase tracking-[0.28em] text-[color:var(--muted)]">{t("subtitle")}</span>
              <Pill className="text-[8px] px-1.5 py-0 border-none bg-[color:var(--accent)] text-[color:var(--accent-contrast)]">{t("engine")}</Pill>
            </div>
          </div>
          {errorShort ? <Pill className="border-red-500/20 bg-red-500/10 text-red-500 font-bold">{errorShort}</Pill> : null}
          {usage ? <Pill className="bg-[color:var(--card-weak)] border-none font-bold text-[color:var(--text)]">{usage.paid ? "PRO" : `${Math.max(0, 3 - usage.freeUsed)}/3 FREE`}</Pill> : null}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-[color:var(--line)] bg-[color:var(--card)]/50 px-2 py-1 shadow-sm transition-all hover:bg-[color:var(--card)]">
            <Settings2 size={14} className="text-[color:var(--muted)]" />
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
              className="bg-transparent text-xs font-bold text-[color:var(--text)] outline-none cursor-pointer"
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="bg-[color:var(--card)]">
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-[color:var(--line)] bg-[color:var(--card)]/50 px-2 py-1 shadow-sm transition-all hover:bg-[color:var(--card)]" title={fxInfo}>
            <DollarSign size={14} className="text-[color:var(--muted)]" />
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className="bg-transparent text-xs font-bold text-[color:var(--text)] outline-none cursor-pointer"
            >
              {Object.values(CURRENCY_LABELS).map((item) => (
                <option key={item.code} value={item.code} className="bg-[color:var(--card)]">
                  {item.code}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-[color:var(--line)] bg-[color:var(--card)]/50 p-1 shadow-sm">
            <button onClick={() => setTheme("light")} className={`px-2 py-1 text-[10px] font-black rounded-lg transition-all ${theme === 'light' ? 'bg-[color:var(--accent)] text-[color:var(--accent-contrast)] shadow-sm' : 'text-[color:var(--muted)] hover:text-[color:var(--text)]'}`}>LT</button>
            <button onClick={() => setTheme("dark")} className={`px-2 py-1 text-[10px] font-black rounded-lg transition-all ${theme === 'dark' ? 'bg-[color:var(--accent)] text-[color:var(--accent-contrast)] shadow-sm' : 'text-[color:var(--muted)] hover:text-[color:var(--text)]'}`}>DK</button>
            <button onClick={() => setTheme("hc")} className={`px-2 py-1 text-[10px] font-black rounded-lg transition-all ${theme === 'hc' ? 'bg-[color:var(--accent)] text-[color:var(--accent-contrast)] shadow-sm' : 'text-[color:var(--muted)] hover:text-[color:var(--text)]'}`}>HC</button>
          </div>
          
          {authEmail ? (
            <div className="flex items-center gap-2">
              <Pill className="font-bold border-[color:var(--accent)]/10">{authUser?.name || authEmail.split("@")[0]}</Pill>
              <Button variant="outline" onClick={signOut} className="h-8 px-3 text-xs border-none hover:bg-red-500/10 hover:text-red-500">
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setAuthMode("signin")} className="h-8 px-3 text-xs border-none">Log In</Button>
              <Button variant="primary" onClick={() => setAuthMode("register")} className="h-8 px-4 text-xs shadow-sm">Join</Button>
            </div>
          )}
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col overflow-hidden lg:flex-row">
        {error ? (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 backdrop-blur-md shadow-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle size={18} className="text-red-500" />
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-red-500">System Error</div>
                  <div className="text-xs font-bold text-red-500">{error}</div>
                </div>
              </div>
              <button onClick={() => setError(null)} className="text-red-500 hover:bg-red-500/20 p-1.5 rounded-lg transition-colors"><CheckCircle2 size={16} /></button>
            </motion.div>
          </div>
        ) : null}

        {/* Left Side: Capture & Input */}
        <motion.div
          layout
          initial={{ opacity: 0, x: 0 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -60 }}
          transition={{
            layout: { type: "spring", damping: 30, stiffness: 90 },
            opacity: { duration: 0.5 },
            x: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
          }}
          style={baseValid ? {
            paddingTop: '51px',
            paddingLeft: '107px',
            width: '483px'
          } : {}}
          className={`flex flex-col p-6 sm:p-8 ${baseValid ? "justify-start w-full border-b border-[color:var(--line)] lg:h-full lg:border-b-0 lg:border-r bg-[color:var(--card)]/20 pb-12" : "justify-center mx-auto w-full h-full max-w-xl"}`}
        >
          <div className={`flex flex-col ${baseValid ? "items-start" : "items-center"}`}>
            <Card className={`w-full transition-all duration-500 ${baseValid ? "shadow-none border-none p-0 bg-transparent" : "p-8 shadow-2xl bg-[color:var(--card)]/80 backdrop-blur-sm"}`}>
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-1">
                  <Activity size={16} className="text-[color:var(--accent)]" />
                  <Label>{t("capture")}</Label>
                </div>
                <div className="text-2xl font-black text-[color:var(--text)]">{t("inputWindow")}</div>
              </div>

              <div className={`relative mx-auto mb-10 flex aspect-square w-full max-w-[280px] items-center justify-center overflow-hidden rounded-[2rem] border-2 border-dashed border-[color:var(--line)] bg-[color:var(--card)] shadow-lg transition-all duration-300 hover:border-[color:var(--accent)]/40 hover:shadow-xl ${imageDataUrl ? "border-solid border-[color:var(--accent)]/10" : ""}`}>
                {imageDataUrl ? (
                  <Image src={imageDataUrl} alt="Preview" fill className="object-cover transition-transform duration-1000 hover:scale-[1.03]" />
                ) : (
                  <div className="flex flex-col items-center gap-4 text-[color:var(--muted)]">
                    <div className="p-5 rounded-full bg-[color:var(--card-weak)]">
                      <UploadCloud size={40} strokeWidth={1.5} className="text-[color:var(--accent)]" />
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-black text-[color:var(--text)] block mb-1">Upload Photo</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest">{t("browse")} or Drop</span>
                    </div>
                  </div>
                )}
                <div className="pointer-events-none absolute inset-0 opacity-10 [background-image:linear-gradient(to_right,rgba(0,0,0,0.5)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.5)_1px,transparent_1px)] [background-size:12.5%_100%,100%_12.5%]" />
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-11 rounded-2xl bg-[color:var(--card)] shadow-sm hover:shadow-md transition-all" onClick={() => {
                    if (browseInputRef.current) { browseInputRef.current.value = ""; browseInputRef.current.click(); }
                  }}>
                    {t("browse")}
                  </Button>
                  <Button variant="outline" className="h-11 rounded-2xl bg-[color:var(--card)] shadow-sm hover:shadow-md transition-all" onClick={() => {
                    if (liveInputRef.current) { liveInputRef.current.value = ""; liveInputRef.current.click(); }
                  }}>
                    {t("live")}
                  </Button>
                </div>

                <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_auto]">
                  <div className="relative">
                    <input
                      value={meta.location}
                      onChange={(e) => {
                        const value = e.target.value;
                        setMeta((s) => ({ ...s, location: value }));
                        setGeoStatus(value ? "manual" : "none");
                      }}
                      placeholder={t("location")}
                      list="city-list"
                      className="h-12 w-full rounded-2xl border border-[color:var(--line)] bg-[color:var(--card)] px-4 text-xs font-bold text-[color:var(--text)] outline-none focus:border-[color:var(--accent)] transition-all shadow-sm focus:shadow-md"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={requestGps} className="h-12 w-12 p-0 rounded-2xl shadow-sm">
                      <Activity size={18} />
                    </Button>
                    <Pill className="h-12 px-4 rounded-2xl font-black bg-[color:var(--card-weak)] border-none">
                      {geoStatus === "exif" ? "EXIF" : geoStatus === "gps" ? "GPS" : geoStatus === "manual" ? "MAN" : "OFF"}
                    </Pill>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: meta.projectType, key: 'projectType', opts: ['Residential', 'Commercial', 'Industrial', 'Mixed-use', 'Infrastructure'] },
                    { val: meta.scale, key: 'scale', opts: ['Low-rise', 'Mid-rise', 'High-rise', 'Large-site'] },
                    { val: meta.constructionType, key: 'constructionType', opts: ['RCC', 'Steel', 'Hybrid'] }
                  ].map(sel => (
                    <select 
                      key={sel.key}
                      value={sel.val} 
                      onChange={(e) => setMeta((s) => ({ ...s, [sel.key]: e.target.value }))} 
                      className="h-11 rounded-2xl border border-[color:var(--line)] bg-[color:var(--card)] px-3 text-[10px] font-black text-[color:var(--text)] outline-none cursor-pointer hover:bg-[color:var(--card-weak)] transition-colors"
                    >
                      {sel.opts.map(o => <option key={o}>{o}</option>)}
                    </select>
                  ))}
                </div>

                <input
                  value={meta.note}
                  onChange={(e) => setMeta((s) => ({ ...s, note: e.target.value }))}
                  placeholder={t("notes")}
                  className="h-12 w-full rounded-2xl border border-[color:var(--line)] bg-[color:var(--card)] px-4 text-xs font-bold text-[color:var(--text)] outline-none focus:border-[color:var(--accent)] shadow-sm"
                />

                <Button
                  variant="primary"
                  onClick={runBase}
                  disabled={!imageDataUrl || loading || !canRun}
                  className="h-14 w-full rounded-[1.5rem] text-lg font-black shadow-xl shadow-black/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? <Spinner /> : t("analyze").toUpperCase()}
                </Button>

                <datalist id="city-list">
                  {CITY_SUGGESTIONS.map((city) => <option key={city} value={city} />)}
                </datalist>
                <input ref={browseInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onPickFile(e.target.files[0])} />
                <input ref={liveInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && onPickFile(e.target.files[0])} />
              </div>
            </Card>
          </div>
        </motion.div>

        {/* Right Side: Results (Scrollable Fit-to-Screen) */}
        <AnimatePresence>
          {baseValid && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.6, type: "spring", bounce: 0 }}
              className="flex-1 overflow-y-auto p-6 sm:p-10 h-full scrollbar-hide"
            >
              <div className="mx-auto w-full max-w-6xl space-y-8 pb-24">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`h-3 w-3 rounded-full animate-pulse ${status === 'Completed' ? 'bg-green-500' : 'bg-orange-500'}`} />
                      <span className="text-xs font-black uppercase tracking-[0.3em] text-[color:var(--muted)]">Current Phase</span>
                    </div>
                    <h2 className="text-6xl font-black text-[color:var(--text)] tracking-tighter leading-none">{status}</h2>
                  </div>
                  <div className="flex items-end gap-6 bg-[color:var(--card)] p-6 rounded-[2.5rem] shadow-sm border border-[color:var(--line)]">
                    <div className="text-right">
                      <div className="text-6xl font-black text-[color:var(--accent)] tracking-tighter leading-none">{Math.round(progressDisplay)}%</div>
                      <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-[color:var(--muted)]">{t("progress")}</p>
                    </div>
                    <div className="h-12 w-[1px] bg-[color:var(--line)]" />
                    <div className="text-right">
                      <div className="text-2xl font-black text-[color:var(--text)]">{stageLabel}</div>
                      <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-[color:var(--muted)]">{t("stage")}</p>
                    </div>
                  </div>
                </div>

                <div className="relative px-2">
                  <div className="relative h-4 overflow-hidden rounded-full bg-[color:var(--card)] border border-[color:var(--line)] shadow-inner p-1">
                    <motion.div 
                      className="absolute inset-y-1 left-1 rounded-full bg-[color:var(--accent)] shadow-lg" 
                      initial={{ width: 0 }}
                      animate={{ width: `calc(${progressDisplay}% - 8px)` }}
                      transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
                    />
                    {STAGE_RANGES.slice(1, 5).map((stage) => (
                      <span key={stage.label} className="absolute top-0 h-full w-[2px] bg-[color:var(--bg)]/50 z-10" style={{ left: `${stage.min}%` }} />
                    ))}
                  </div>
                  <div className="mt-4 grid grid-cols-5 text-[10px] font-black uppercase tracking-widest text-[color:var(--muted)]">
                    <span className="text-left">Planning</span>
                    <span className="text-center">Foundation</span>
                    <span className="text-center">Structure</span>
                    <span className="text-center">Services</span>
                    <span className="text-right">Finishing</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <Accordion title="Execution Performance" icon={<Hammer size={20} />} defaultOpen={true} extra={<Pill className="font-bold border-none bg-[color:var(--accent)] text-[color:var(--accent-contrast)]">{stageLabel}</Pill>}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <StatCard label={status === "Completed" ? t("timeTaken") : t("timeLeft")} value={timelineValue} />
                        <StatCard label={manpowerLabel} value={manpowerValue} />
                        <StatCard label={machineryLabel} value={machineryValue} />
                      </div>
                      
                      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <Label>{t("resources").toUpperCase()}</Label>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {[
                              { label: manpowerTag(stageLabel), color: 'bg-blue-500' },
                              { label: skillsTag(stageLabel), color: 'bg-emerald-500' },
                              { label: machineryTag(stageLabel), color: 'bg-orange-500' },
                              { label: hardwareTag(stageLabel), color: 'bg-purple-500' }
                            ].map((tag, idx) => (
                              <Pill key={idx} className={`border-none ${tag.color}/10 ${tag.color.replace('bg-', 'text-')} font-black px-4 py-2`}>{tag.label}</Pill>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label>{t("stagesLeft").toUpperCase()}</Label>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {stagesLeft.length ? (
                              stagesLeft.map((item, idx) => (
                                <motion.span 
                                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.1 }}
                                  key={item} 
                                  className="rounded-xl border-2 border-[color:var(--line)] bg-[color:var(--card)] px-4 py-2 text-[11px] font-black text-[color:var(--text)] shadow-sm hover:border-[color:var(--accent)]/20 transition-colors"
                                >
                                  {item}
                                </motion.span>
                              ))
                            ) : (
                              <span className="text-xs font-bold text-[color:var(--muted)]">Sequence Complete</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Accordion>

                    <Accordion title="Advanced Risk & Benchmarks" icon={<AlertTriangle size={20} />} extra={paywalled ? <Pill className="bg-red-500/10 text-red-500 border-none font-black text-[10px]">LOCKED</Pill> : null}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <StatCard label={t("progressVsIdeal")} value={premium(progressVsIdealDisplay)} />
                        <StatCard label={t("timelineDrift")} value={premium(driftDisplay)} />
                      </div>

                      <div className="mt-8 p-6 rounded-[2rem] bg-[color:var(--bg)] border border-[color:var(--line)]">
                        <div className="flex items-center gap-2 mb-4">
                          <Activity size={18} className="text-[color:var(--accent)]" />
                          <Label>{t("insights").toUpperCase()}</Label>
                        </div>
                        <ul className="space-y-4">
                          {insightsDisplay.map((item, i) => (
                            <motion.li key={`insight-${i}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex items-start gap-4">
                              <div className="h-6 w-6 rounded-lg bg-[color:var(--accent)] text-[color:var(--accent-contrast)] flex items-center justify-center shrink-0 shadow-sm">
                                <CheckCircle2 size={14} />
                              </div>
                              <span className="text-sm font-bold leading-relaxed text-[color:var(--text)]">{item}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-8">
                        <Button
                          variant="primary"
                          onClick={paywalled ? () => setAuthMode('accesscode') : runAdvanced}
                          disabled={!baseValid || advLoading}
                          className={`w-full h-14 rounded-2xl font-black shadow-lg ${!advLoading ? "shadow-black/10" : "opacity-40"}`}
                        >
                          {advLoading ? <Spinner /> : paywalled ? "UNLOCK PRO" : t("revealRisks").toUpperCase()}
                        </Button>
                      </div>
                    </Accordion>
                  </div>

                  <div className="space-y-6">
                    <Accordion title="Financial Valuation" icon={<BarChart size={20} />} defaultOpen={true}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {status === "Completed" ? (
                          <>
                            <div className="col-span-1 sm:col-span-2">
                              <StatCard label={t("propertyVal")} value={premium(formatCurrencyRange(currency, minVal, maxVal, rates))} tag={<Pill className="border-none bg-[color:var(--card-weak)] font-black">{CURRENCY_LABELS[currency].code}</Pill>} />
                            </div>
                            <StatCard label={t("budgetUsed")} value={premium(formatCurrencyRange(currency, minBudgetUsed, maxBudgetUsed, rates))} />
                            <StatCard label={t("confidence")} value={premium(valConfidence)} />
                          </>
                        ) : (
                          <>
                            <StatCard label={t("budgetLeft")} value={premium(formatCurrencyRange(currency, minBudget, maxBudget, rates))} />
                            <StatCard label={t("budgetUsed")} value={premium(formatCurrencyRange(currency, minBudgetUsed, maxBudgetUsed, rates))} />
                            <StatCard label={t("landVal")} value={premium(formatCurrencyRange(currency, minLand, maxLand, rates))} />
                            <StatCard label={t("projectVal")} value={premium(formatCurrencyRange(currency, minVal, maxVal, rates))} />
                          </>
                        )}
                      </div>
                      
                      <div className="mt-8">
                        <Label>{t("signals").toUpperCase()}</Label>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {signals.length ? (
                            signals.map((item, idx) => (
                              <motion.span 
                                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + idx * 0.1 }}
                                key={item} 
                                className="rounded-xl border border-[color:var(--line)] bg-[color:var(--bg)] px-4 py-2 text-[10px] font-black text-[color:var(--text)] shadow-sm"
                              >
                                {item.toUpperCase()}
                              </motion.span>
                            ))
                          ) : (
                            <span className="text-[11px] font-bold text-[color:var(--muted)]">Calculating signals...</span>
                          )}
                        </div>
                      </div>
                    </Accordion>
                    
                    <Accordion title="Data Distribution" icon={<Layers size={20} />}>
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <PieCard title="Stage Time Split" segments={timeSplitSegments} valueFormatter={(value) => (baseValid ? `${value}h` : "-")} />
                        <PieCard title="Budget Allocation" segments={budgetSplitSegments} valueFormatter={(value) => (baseValid ? formatCurrencyValue(currency, value, rates) : "-")} />
                      </div>

                      <div className="mt-8 overflow-hidden rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--bg)] shadow-inner">
                        {selectedCategoryRow ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[color:var(--line)]">
                            {categoryEntries.map((entry, i) => (
                              <div key={entry.label} className="bg-[color:var(--bg)] p-5 transition-colors hover:bg-[color:var(--card)]/50">
                                <div className="text-[9px] font-black uppercase tracking-widest text-[color:var(--muted)] mb-1">{entry.label}</div>
                                <div className="text-sm font-bold text-[color:var(--text)]">{entry.value}</div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-10 text-center">
                            <Activity size={32} className="mx-auto text-[color:var(--line)] mb-4" />
                            <div className="text-sm font-black text-[color:var(--muted)] uppercase tracking-widest">Matrix Pending Analysis</div>
                          </div>
                        )}
                      </div>
                    </Accordion>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Authentication Modal Overlay */}
        <AnimatePresence>
          {authMode && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setAuthMode(null)}
                className="absolute inset-0 bg-[color:var(--bg)]/80 backdrop-blur-sm" 
              />
              <motion.div
                layoutId="auth-modal"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] border border-[color:var(--line)] bg-[color:var(--card)] p-8 shadow-2xl"
              >
                <button 
                  onClick={() => setAuthMode(null)}
                  className="absolute right-6 top-6 text-[color:var(--muted)] hover:text-[color:var(--text)] transition-colors"
                >
                  <X size={20} />
                </button>

                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-[color:var(--accent)]/10 text-[color:var(--accent)]">
                      {authMode === 'signin' ? <Lock size={18} /> : authMode === 'register' ? <User size={18} /> : <Hash size={18} />}
                    </div>
                    <Label>{authMode === 'signin' ? "Welcome Back" : authMode === 'register' ? "Create Account" : "Access Code"}</Label>
                  </div>
                  <h3 className="text-3xl font-black text-[color:var(--text)] tracking-tight">
                    {authMode === 'signin' ? "Sign In" : authMode === 'register' ? "Join Builtattic" : "Enter Code"}
                  </h3>
                </div>

                <div className="space-y-4">
                  {authMode === 'register' && (
                    <div className="space-y-1.5">
                      <Label>Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--muted)]" size={16} />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="John Doe"
                          className="h-12 w-full rounded-2xl border border-[color:var(--line)] bg-[color:var(--bg)] pl-11 pr-4 text-xs font-bold text-[color:var(--text)] outline-none focus:border-[color:var(--accent)] transition-all"
                        />
                      </div>
                    </div>
                  )}

                  {authMode !== 'accesscode' ? (
                    <>
                      <div className="space-y-1.5">
                        <Label>Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--muted)]" size={16} />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@company.com"
                            className="h-12 w-full rounded-2xl border border-[color:var(--line)] bg-[color:var(--bg)] pl-11 pr-4 text-xs font-bold text-[color:var(--text)] outline-none focus:border-[color:var(--accent)] transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label>Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--muted)]" size={16} />
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="h-12 w-full rounded-2xl border border-[color:var(--line)] bg-[color:var(--bg)] pl-11 pr-4 text-xs font-bold text-[color:var(--text)] outline-none focus:border-[color:var(--accent)] transition-all"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-1.5">
                      <Label>Access Code</Label>
                      <div className="relative">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--muted)]" size={16} />
                        <input
                          type="text"
                          value={accessCode}
                          onChange={(e) => setAccessCode(e.target.value)}
                          placeholder="Enter your pro code"
                          className="h-12 w-full rounded-2xl border border-[color:var(--line)] bg-[color:var(--bg)] pl-11 pr-4 text-xs font-bold text-[color:var(--text)] outline-none focus:border-[color:var(--accent)] transition-all"
                        />
                      </div>
                      <p className="text-[10px] font-bold text-[color:var(--muted)] px-1">Enter a valid code to instantly unlock Pro features.</p>
                    </div>
                  )}

                  <Button
                    onClick={authMode === 'signin' ? signIn : authMode === 'register' ? register : validateAccessCode}
                    className="h-14 w-full rounded-[1.5rem] text-lg font-black shadow-xl shadow-black/10 mt-4"
                  >
                    {authMode === 'signin' ? "Sign In" : authMode === 'register' ? "Create Account" : "Unlock Pro"}
                  </Button>

                  <div className="pt-4 text-center">
                    <p className="text-[11px] font-bold text-[color:var(--muted)]">
                      {authMode === 'signin' ? (
                        <>
                          Don&apos;t have an account?{" "}
                          <button onClick={() => setAuthMode('register')} className="text-[color:var(--accent)] hover:underline">Join Now</button>
                        </>
                      ) : authMode === 'register' ? (
                        <>
                          Already have an account?{" "}
                          <button onClick={() => setAuthMode('signin')} className="text-[color:var(--accent)] hover:underline">Sign In</button>
                        </>
                      ) : (
                        <button onClick={() => setAuthMode('signin')} className="text-[color:var(--accent)] hover:underline">Back to Sign In</button>
                      )}
                    </p>
                    {authMode !== 'accesscode' && (
                      <button onClick={() => setAuthMode('accesscode')} className="mt-2 text-[10px] font-black uppercase tracking-widest text-[color:var(--muted)] hover:text-[color:var(--text)] transition-colors">
                        Have an access code?
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

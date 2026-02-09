"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Button, Card, Pill } from "@/components/ui";
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
      <div className="mt-2 break-words text-[clamp(15px,2vw,26px)] font-black leading-tight text-[color:var(--text)]">{value}</div>
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
  const [authMode, setAuthMode] = useState<"signin" | "register" | "accesscode">("signin");
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
  const scaleFactor =
    meta.scale === "High-rise" ? 1.3 : meta.scale === "Mid-rise" ? 1.15 : meta.scale === "Large-site" ? 1.4 : 1;
  const typeFactor =
    meta.projectType === "Commercial" ? 1.15 : meta.projectType === "Industrial" ? 1.25 : meta.projectType === "Mixed-use" ? 1.2 : 1;
  const baseValue = (280000 + progressFactor * 220000) * scaleFactor * typeFactor;
  const stageConfidenceMap: Record<StageLabel, { spread: number; confidence: "Low" | "Medium" | "High" }> = {
    Planning: { spread: 0.45, confidence: "Low" },
    Foundation: { spread: 0.35, confidence: "Low" },
    Structure: { spread: 0.25, confidence: "Medium" },
    Services: { spread: 0.2, confidence: "Medium" },
    Finishing: { spread: 0.12, confidence: "High" },
    Completed: { spread: 0.06, confidence: "High" }
  };
  const stageMeta = stageConfidenceMap[stageLabel];
  const minVal = roundTo(baseValue * (1 - stageMeta.spread), 5000);
  const maxVal = roundTo(baseValue * (1 + stageMeta.spread), 5000);
  const budgetBase = baseValue * Math.max(0, 1 - progressFactor);
  const minBudget = roundTo(budgetBase * (1 - stageMeta.spread), 5000);
  const maxBudget = roundTo(budgetBase * (1 + stageMeta.spread), 5000);
  const budgetUsedBase = baseValue * progressFactor;
  const minBudgetUsed = roundTo(budgetUsedBase * (1 - stageMeta.spread), 5000);
  const maxBudgetUsed = roundTo(budgetUsedBase * (1 + stageMeta.spread), 5000);
  const landBase = (120000 + progressFactor * 80000) * scaleFactor;
  const minLand = roundTo(landBase * (1 - stageMeta.spread), 5000);
  const maxLand = roundTo(landBase * (1 + stageMeta.spread), 5000);

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
  const budgetSplitBase = baseValid ? baseValue : 0;
  const budgetSplitSegments = budgetMix[stageLabel].map((item) => ({
    ...item,
    value: baseValid ? Math.max(1, Math.round(budgetSplitBase * item.value)) : 1,
    color: baseValid ? item.color : greyColor
  }));

  return (
    <div className="min-h-screen">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-24 right-10 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,var(--glow-1),transparent_70%)]" />
        <div className="absolute bottom-[-120px] left-[-80px] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_center,var(--glow-2),transparent_70%)]" />
      </div>

      <header className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-4 px-4 pt-8 lg:grid-cols-[1fr_auto_1fr]">
        <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
          {errorShort ? <Pill>{errorShort}</Pill> : null}
          {usage ? <Pill>{usage.paid ? "Pro" : `${Math.max(0, 3 - usage.freeUsed)}/3`}</Pill> : null}
        </div>
        <div className="text-center">
          <div className="text-2xl font-black tracking-tight text-[color:var(--text)]">{t("title")}</div>
          <div className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">{t("subtitle")}</div>
          <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">{t("engine")}</div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-end">
          <div className="flex items-center gap-2 rounded-xl border border-[color:var(--line)] bg-[color:var(--card)] px-2 py-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">{t("language")}</span>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
              className="bg-transparent text-xs font-semibold text-[color:var(--text)] outline-none"
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-[color:var(--line)] bg-[color:var(--card)] px-2 py-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">{t("currency")}</span>
            <Info text={fxInfo} />
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className="bg-transparent text-xs font-semibold text-[color:var(--text)] outline-none"
            >
              {Object.values(CURRENCY_LABELS).map((item) => (
                <option key={item.code} value={item.code}>
                  {item.name} ({item.code})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <Button variant={theme === "light" ? "primary" : "outline"} onClick={() => setTheme("light")} className="h-9 px-2 text-xs">
              {t("light")}
            </Button>
            <Button variant={theme === "dark" ? "primary" : "outline"} onClick={() => setTheme("dark")} className="h-9 px-2 text-xs">
              {t("dark")}
            </Button>
            <Button variant={theme === "hc" ? "primary" : "outline"} onClick={() => setTheme("hc")} className="h-9 px-2 text-xs">
              {t("highContrast")}
            </Button>
          </div>
          {authEmail ? (
            <>
              {usage?.hasPro ? (
                <Pill className="bg-green-500/10 text-green-500 border-green-500/20">Pro</Pill>
              ) : (
                <Pill className="bg-amber-500/10 text-amber-500 border-amber-500/20">Free</Pill>
              )}
              <Pill>{authUser?.name || authEmail.split("@")[0]}</Pill>
              <Button variant="outline" onClick={signOut} className="h-9 px-3 text-xs">
                Sign Out
              </Button>
            </>
          ) : (
            <>
              {authMode === "signin" && (
                <>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="h-9 w-[140px] rounded-xl border border-[color:var(--line)] bg-[color:var(--card)] px-3 text-xs font-semibold text-[color:var(--text)] outline-none focus:border-[color:var(--text)]"
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="h-9 w-[120px] rounded-xl border border-[color:var(--line)] bg-[color:var(--card)] px-3 text-xs font-semibold text-[color:var(--text)] outline-none focus:border-[color:var(--text)]"
                  />
                  <Button onClick={signIn} disabled={!email.includes("@") || !password} className="h-9 px-3 text-xs">
                    Sign In
                  </Button>
                  <Button variant="outline" onClick={() => setAuthMode("register")} className="h-9 px-2 text-xs">
                    Register
                  </Button>
                  <Button variant="outline" onClick={() => setAuthMode("accesscode")} className="h-9 px-2 text-xs">
                    Access Code
                  </Button>
                </>
              )}
              {authMode === "register" && (
                <>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Name"
                    className="h-9 w-[120px] rounded-xl border border-[color:var(--line)] bg-[color:var(--card)] px-3 text-xs font-semibold text-[color:var(--text)] outline-none focus:border-[color:var(--text)]"
                  />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="h-9 w-[140px] rounded-xl border border-[color:var(--line)] bg-[color:var(--card)] px-3 text-xs font-semibold text-[color:var(--text)] outline-none focus:border-[color:var(--text)]"
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="h-9 w-[120px] rounded-xl border border-[color:var(--line)] bg-[color:var(--card)] px-3 text-xs font-semibold text-[color:var(--text)] outline-none focus:border-[color:var(--text)]"
                  />
                  <Button onClick={register} disabled={!name || !email.includes("@") || password.length < 6} className="h-9 px-3 text-xs">
                    Register
                  </Button>
                  <Button variant="outline" onClick={() => setAuthMode("signin")} className="h-9 px-2 text-xs">
                    Back
                  </Button>
                </>
              )}
              {authMode === "accesscode" && (
                <>
                  <input
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    placeholder="Access Code"
                    className="h-9 w-[180px] rounded-xl border border-[color:var(--line)] bg-[color:var(--card)] px-3 text-xs font-semibold text-[color:var(--text)] outline-none focus:border-[color:var(--text)]"
                  />
                  <Button onClick={validateAccessCode} disabled={!accessCode} className="h-9 px-3 text-xs">
                    Activate
                  </Button>
                  <Button variant="outline" onClick={() => setAuthMode("signin")} className="h-9 px-2 text-xs">
                    Back
                  </Button>
                </>
              )}
            </>
          )}
          {!usage?.hasPro && (
            <Button variant="primary" onClick={() => {
              const marketplaceUrl = process.env.NEXT_PUBLIC_MARKETPLACE_URL || "https://marketplace-xi-sage.vercel.app";
              window.open(`${marketplaceUrl}/subscription-request`, "_blank");
            }} className="h-9 px-3 text-xs">
              Upgrade
            </Button>
          )}
        </div>
      </header>

      <main className="mx-auto mt-6 max-w-[1400px] px-4 pb-12">
        {error ? (
          <div className="mb-4 rounded-2xl border border-[color:var(--line)] bg-[color:var(--card)] px-4 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">Error</div>
            <div className="mt-2 break-words text-xs font-semibold text-[color:var(--text)]">{error}</div>
          </div>
        ) : null}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_400px_1fr]">
          <Card className="order-2 lg:order-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label>{t("constructionProgress")}</Label>
                <Info text="Progress and stage are derived from visual cues in the image." />
              </div>
              <Pill>{status}</Pill>
            </div>

            <div className="mt-4">
              <div className="flex items-end justify-between">
                <div className="text-5xl font-black text-[color:var(--text)]">{baseValid ? `${Math.round(progressDisplay)}%` : "—"}</div>
                <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  {t("progress")}
                  <Info text="Progress is derived from the image stage classification and mapped to the stage range." />
                </div>
              </div>

              <div className="mt-3">
                <div className="relative h-2 overflow-hidden rounded-full bg-[color:var(--card-weak)]">
                  <div className="h-full rounded-full bg-[color:var(--accent)]" style={{ width: `${progressDisplay}%` }} />
                  {STAGE_RANGES.slice(0, 5).map((stage) => (
                    <span
                      key={stage.label}
                      className="absolute top-0 h-2 w-[2px] bg-[color:var(--line)]"
                      style={{ left: `${stage.max}%` }}
                    />
                  ))}
                </div>
                <div className="mt-2 grid grid-cols-5 text-[8px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)] sm:text-[9px]">
                  <span>Planning</span>
                  <span>Foundation</span>
                  <span>Structure</span>
                  <span>Services</span>
                  <span>Finishing</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  {t("stage")}
                  <Info text="Stage is chosen from the allowed construction phases based on image cues." />
                </div>
                <div className="text-3xl font-black text-[color:var(--text)]">{baseValid ? stageLabel : "—"}</div>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center gap-2">
                <Label>{t("executionEstimation")}</Label>
                <Info text="Time and effort are estimated from detected stage, progress, and typical productivity ranges." />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <StatCard
                  label={status === "Completed" ? t("timeTaken") : t("timeLeft")}
                  value={timelineValue}
                  tooltip="Estimated from visual progress density and phase benchmarks."
                />
                <StatCard
                  label={manpowerLabel}
                  value={manpowerValue}
                  tooltip={
                    status === "Completed"
                      ? "Man-hours used are scaled to the total effort for the completed project."
                      : "Remaining man-hours are split by stage ratio and aligned to time left."
                  }
                />
                <StatCard
                  label={machineryLabel}
                  value={machineryValue}
                  tooltip={
                    status === "Completed"
                      ? "Machine-hours used are scaled to the total effort for the completed project."
                      : "Remaining machine-hours are split by stage ratio and aligned to time left."
                  }
                />
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center gap-2">
                <Label>{t("resources")}</Label>
                <Info text="Resource tags reflect typical trades, equipment, and materials for the detected stage." />
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Pill className="text-[color:var(--text)]">{manpowerTag(stageLabel)}</Pill>
                <Pill className="text-[color:var(--text)]">{skillsTag(stageLabel)}</Pill>
                <Pill className="text-[color:var(--text)]">{machineryTag(stageLabel)}</Pill>
                <Pill className="text-[color:var(--text)]">{hardwareTag(stageLabel)}</Pill>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center gap-2">
                <Label>{t("stagesLeft")}</Label>
                <Info text="Stages left are deduced from the detected phase and typical construction sequence." />
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {stagesLeft.length ? (
                  stagesLeft.map((item) => (
                    <span key={item} className="max-w-[140px] truncate rounded-full border border-[color:var(--line)] bg-[color:var(--card-weak)] px-3 py-1 text-xs font-semibold text-[color:var(--text)]">
                      {item}
                    </span>
                  ))
                ) : (
                  <span className="text-xs font-semibold text-[color:var(--muted)]">{baseValid ? "-" : t("pending")}</span>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 lg:grid-cols-2">
              <PieCard
                title="Stage Time Split (Est.)"
                segments={timeSplitSegments}
                valueFormatter={(value) => (baseValid ? `${value}h` : "-")}
                infoText="Split is estimated from total effort and standard stage weightings."
              />
              <PieCard
                title="Budget Split (Est.)"
                segments={budgetSplitSegments}
                valueFormatter={(value) => (baseValid ? formatCurrencyValue(currency, value, rates) : "-")}
                infoText="Budget shares are estimated from stage norms and project scale."
              />
            </div>

            <div className="mt-4 flex items-center justify-between">
              <Label>{t("singleUse")}</Label>
              <div className="text-sm font-semibold text-[color:var(--text)]">{t("stored")}</div>
            </div>
          </Card>

          <div className="order-1 mx-auto flex w-full max-w-[400px] flex-col gap-4 lg:order-none lg:w-[400px] lg:max-w-none">
            <Card className="flex flex-col items-center gap-2 lg:h-[400px]">
              <div className="text-center">
                <Label>{t("capture")}</Label>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">{t("inputWindow")}</div>
              </div>

              <div className="relative h-[190px] w-[190px] overflow-hidden rounded-2xl border border-[color:var(--line)] bg-[color:var(--card)] sm:h-[210px] sm:w-[210px] lg:h-[210px] lg:w-[210px]">
                {imageDataUrl ? (
                  <Image src={imageDataUrl} alt="Preview" fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-[color:var(--muted)]">Empty</div>
                )}
                <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(to_right,rgba(0,0,0,0.25)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.25)_1px,transparent_1px)] [background-size:33%_100%,100%_33%]" />
                <div className="pointer-events-none absolute inset-2 rounded-xl border border-[color:var(--line)]" />
              </div>

              <div className="w-full max-w-[300px] space-y-1.5">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (browseInputRef.current) {
                        browseInputRef.current.value = "";
                        browseInputRef.current.click();
                      }
                    }}
                    className="rounded-lg border border-[color:var(--line)] bg-[color:var(--card)] px-2 py-1.5 text-center text-[11px] font-semibold text-[color:var(--text)] hover:bg-[color:var(--pill)]"
                  >
                    {t("browse")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (liveInputRef.current) {
                        liveInputRef.current.value = "";
                        liveInputRef.current.click();
                      }
                    }}
                    className="rounded-lg border border-[color:var(--line)] bg-[color:var(--card)] px-2 py-1.5 text-center text-[11px] font-semibold text-[color:var(--text)] hover:bg-[color:var(--pill)]"
                  >
                    {t("live")}
                  </button>
                </div>
                <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_auto_auto]">
                  <input
                    value={meta.location}
                    onChange={(e) => {
                      const value = e.target.value;
                      setMeta((s) => ({ ...s, location: value }));
                      setGeoStatus(value ? "manual" : "none");
                    }}
                    placeholder={t("location")}
                    list="city-list"
                    autoComplete="address-level2"
                    className="h-7 rounded-lg border border-[color:var(--line)] bg-[color:var(--card)] px-2 text-[10px] font-semibold text-[color:var(--text)] outline-none"
                  />
                  <button
                    type="button"
                    onClick={requestGps}
                    className="rounded-lg border border-[color:var(--line)] bg-[color:var(--card)] px-2 py-1 text-[10px] font-semibold text-[color:var(--text)]"
                  >
                    {t("useGps")}
                  </button>
                  <Pill>
                    {geoStatus === "exif"
                      ? t("exif")
                      : geoStatus === "gps"
                        ? t("gps")
                        : geoStatus === "manual"
                          ? t("manual")
                          : geoStatus === "denied"
                            ? t("gpsOff")
                            : t("noGps")}
                  </Pill>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={meta.projectType}
                    onChange={(e) => setMeta((s) => ({ ...s, projectType: e.target.value }))}
                    className="h-7 rounded-lg border border-[color:var(--line)] bg-[color:var(--card)] px-2 text-[9px] font-semibold text-[color:var(--text)] outline-none"
                  >
                    <option>Residential</option>
                    <option>Commercial</option>
                    <option>Industrial</option>
                    <option>Mixed-use</option>
                    <option>Infrastructure</option>
                  </select>
                  <select
                    value={meta.scale}
                    onChange={(e) => setMeta((s) => ({ ...s, scale: e.target.value }))}
                    className="h-7 rounded-lg border border-[color:var(--line)] bg-[color:var(--card)] px-2 text-[9px] font-semibold text-[color:var(--text)] outline-none"
                  >
                    <option>Low-rise</option>
                    <option>Mid-rise</option>
                    <option>High-rise</option>
                    <option>Large-site</option>
                  </select>
                  <select
                    value={meta.constructionType}
                    onChange={(e) => setMeta((s) => ({ ...s, constructionType: e.target.value }))}
                    className="h-7 rounded-lg border border-[color:var(--line)] bg-[color:var(--card)] px-2 text-[9px] font-semibold text-[color:var(--text)] outline-none"
                  >
                    <option>RCC</option>
                    <option>Steel</option>
                    <option>Hybrid</option>
                  </select>
                </div>
                <input
                  value={meta.note}
                  onChange={(e) => setMeta((s) => ({ ...s, note: e.target.value }))}
                  placeholder={t("notes")}
                  className="h-7 rounded-lg border border-[color:var(--line)] bg-[color:var(--card)] px-2 text-[10px] font-semibold text-[color:var(--text)] outline-none"
                />
                <button
                  type="button"
                  onClick={runBase}
                  disabled={!imageDataUrl || loading || !canRun}
                  className="w-full rounded-lg bg-[color:var(--accent)] px-2 py-2 text-center text-[11px] font-semibold text-[color:var(--accent-contrast)] disabled:opacity-40"
                >
                  {loading ? "..." : t("analyze")}
                </button>
                <datalist id="city-list">
                  {CITY_SUGGESTIONS.map((city) => (
                    <option key={city} value={city} />
                  ))}
                </datalist>
                <input
                  ref={browseInputRef}
                  type="file"
                  accept="image/*"
                  multiple={false}
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && onPickFile(e.target.files[0])}
                />
                <input
                  ref={liveInputRef}
                  type="file"
                  accept="image/*"
                  multiple={false}
                  capture="environment"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && onPickFile(e.target.files[0])}
                />
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label>Category Matrix</Label>
                  <Info text="AI selects the closest row from the reference dataset based on the image context." />
                </div>
                <Pill>AI</Pill>
              </div>
              <div className="mt-3">
                {baseValid && selectedCategoryRow ? (
                  <table className="w-full border-collapse text-[10px] text-[color:var(--text)]">
                    <tbody>
                      {categoryEntries.map((entry) => (
                        <tr key={entry.label} className="border-t border-[color:var(--line)]">
                          <td className="w-[40%] px-2 py-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                            {entry.label}
                          </td>
                          <td className="px-2 py-2 break-words text-[10px] font-semibold text-[color:var(--text)]">{entry.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="px-2 py-2 text-[color:var(--muted)]">{baseValid ? "No category matrix returned" : t("pending")}</div>
                )}
              </div>
            </Card>
          </div>

          <Card className="order-3 lg:order-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label>{t("valuationInsights")}</Label>
                <Info text="Values are indicative ranges based on stage, scale, and comparable benchmarks." />
              </div>
              {paywalled ? <Pill>Locked</Pill> : <Pill>Active</Pill>}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {status === "Completed" ? (
                <>
                  <div className="col-span-2">
                    <StatCard
                      label={t("propertyVal")}
                      value={baseValid ? premium(formatCurrencyRange(currency, minVal, maxVal, rates)) : pendingValue}
                      tooltip="Estimated using visual construction density and comparable benchmarks."
                      tag={<Pill>{CURRENCY_LABELS[currency].name}</Pill>}
                    />
                  </div>
                  <StatCard
                    label={t("budgetUsed")}
                    value={baseValid ? premium(formatCurrencyRange(currency, minBudgetUsed, maxBudgetUsed, rates)) : pendingValue}
                    tooltip="Estimated from total project value multiplied by progress."
                    tag={<Pill>{CURRENCY_LABELS[currency].name}</Pill>}
                  />
                  <StatCard
                    label={t("confidence")}
                    value={baseValid ? premium(stageMeta.confidence) : pendingValue}
                    tooltip="Confidence tightens as construction advances."
                    tag={<Pill>Indicative</Pill>}
                  />
                </>
              ) : (
                <>
                  <StatCard
                    label={t("budgetLeft")}
                    value={baseValid ? premium(formatCurrencyRange(currency, minBudget, maxBudget, rates)) : pendingValue}
                    tooltip="Indicative range based on stage and confidence." 
                    tag={<Pill>{CURRENCY_LABELS[currency].name}</Pill>}
                  />
                  <StatCard
                    label={t("budgetUsed")}
                    value={baseValid ? premium(formatCurrencyRange(currency, minBudgetUsed, maxBudgetUsed, rates)) : pendingValue}
                    tooltip="Estimated from total project value multiplied by progress."
                    tag={<Pill>{CURRENCY_LABELS[currency].name}</Pill>}
                  />
                  <StatCard
                    label={t("landVal")}
                    value={baseValid ? premium(formatCurrencyRange(currency, minLand, maxLand, rates)) : pendingValue}
                    tooltip="Land value is scaled by project size and stage confidence."
                    tag={<Pill>{CURRENCY_LABELS[currency].name}</Pill>}
                  />
                  <StatCard
                    label={t("projectVal")}
                    value={baseValid ? premium(formatCurrencyRange(currency, minVal, maxVal, rates)) : pendingValue}
                    tooltip="Total project value based on scale, type, and progress."
                    tag={<Pill>{CURRENCY_LABELS[currency].name}</Pill>}
                  />
                  <StatCard
                    label={t("confidence")}
                    value={baseValid ? premium(stageMeta.confidence) : pendingValue}
                    tooltip="Confidence tightens as construction advances."
                    tag={<Pill>Indicative</Pill>}
                  />
                </>
              )}
            </div>

            <div className="mt-4">
              <div className="flex items-center gap-2">
                <Label>{t("signals")}</Label>
                <Info text="Signals are short cues derived from stage, scale, location, and risk analysis." />
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {signals.length ? (
                  signals.map((item) => (
                    <span key={item} className="max-w-[160px] truncate rounded-full border border-[color:var(--line)] bg-[color:var(--card-weak)] px-3 py-1 text-xs font-semibold text-[color:var(--text)]">
                      {item}
                    </span>
                  ))
                ) : (
                  <span className="text-xs font-semibold text-[color:var(--muted)]">{baseValid ? t("pending") : t("awaitingBase")}</span>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <StatCard
                label={t("progressVsIdeal")}
                value={premium(progressVsIdealDisplay)}
                tooltip="Compared against typical progress for the detected stage."
              />
              <StatCard label={t("timelineDrift")} value={premium(driftDisplay)} tooltip="Derived from stage pace vs benchmark." />
            </div>

            <div className="mt-4">
              <div className="flex items-center gap-2">
                <Label>{t("insights")}</Label>
                <Info text="Insights are simplified for non-technical users, based on stage and location." />
              </div>
              <ul className="mt-2 list-none space-y-2 pl-0">
                {insightsDisplay.map((item, i) => (
                  <li key={`insight-${i}`} className="break-words text-[11px] font-semibold leading-snug text-[color:var(--text)]">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4">
              <Label>{t("riskReveal")}</Label>
              <Button
                onClick={runAdvanced}
                disabled={!baseValid || advLoading || paywalled}
                className={`mt-2 w-full ${baseValid && !paywalled ? "" : "opacity-60"}`}
              >
                {advLoading ? "Running" : t("revealRisks")}
              </Button>
            </div>

            <details className="mt-4">
              <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">{t("assumptions")}</summary>
              <ul className="mt-2 list-none space-y-1 pl-0 text-xs font-semibold text-[color:var(--muted)]">
                <li>{t("photoEstimate")}</li>
                <li>{t("indicative")}</li>
                {(base?.notes ?? []).slice(0, 4).map((note, i) => (
                  <li key={`note-${i}`}>{note}</li>
                ))}
              </ul>
            </details>
          </Card>
        </div>
      </main>
    </div>
  );
}

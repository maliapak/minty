// @ts-nocheck
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  setDoc, 
  onSnapshot 
} from 'firebase/firestore';
import {
  Utensils, Coffee, IceCream, Sparkles, ShoppingBag, Plus, Minus, Trash2,
  CheckCircle2, Clock, Printer, QrCode, Settings, Bell, Volume2, VolumeX,
  ChevronRight, ChevronLeft, Send, MessageCircle, CreditCard, Banknote,
  Store, AlertCircle, Copy, Check, RefreshCw, Eye, ChefHat, Star, Info,
  Search, X, Flame, CupSoda, CakeSlice, MapPin, Phone, Edit3, Save,
  Lock, Unlock, Layers, PlusCircle, RotateCcw, Wifi, Leaf, Heart,
  Link2, ExternalLink, Smartphone, Monitor, ShieldCheck, EyeOff
} from 'lucide-react';

// ==========================================
// FIREBASE INITIALIZATION (MANDATORY PATTERN)
// ==========================================
let app, auth, db;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'minty-waffle-cafe-qr';

try {
  const env = (import.meta as any).env;
  const firebaseConfig = env.VITE_FIREBASE_API_KEY
    ? {
        apiKey: env.VITE_FIREBASE_API_KEY,
        authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: env.VITE_FIREBASE_APP_ID,
      }
    : null;
  if (firebaseConfig && Object.keys(firebaseConfig).length > 0) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (err) {
  console.warn('Firebase başlatılamadı, yerel bellek (in-memory) modunda çalışıyor:', err);
}

// ==========================================
// DEFAULT CAFE CONFIGURATION & WAFFLE OPTIONS (MINTY WAFFLE & CAFE)
// ==========================================
const INITIAL_CAFE_SETTINGS = {
  cafeName: "Minty Waffle & Cafe",
  slogan: "Tatlı bir mola, mutlu bir an! • Waffle, Kahve, Çay ve daha fazlası...",
  whatsappNumber: "905551234567",
  googleReviewUrl: "https://g.page/r/minty-waffle-cafe/review",
  wifiPass: "MintyWaffle2026",
  customWaffleBasePrice: 230,
  adminPin: "1234",
  kitchenPin: "2222",
  cashierPin: "3333",
  currency: "TL"
};

const INITIAL_WAFFLE_BUILDER = {
  dough: [
    { id: 'd_kova', name: 'Kova Waffle (Bol Malzemeli)', desc: 'Minty özel kova sunumu, sıcak küp waffle parçaları', price: 0, inStock: true },
    { id: 'd_bardak', name: 'Bardakta Waffle (Pratik Lezzet)', desc: 'Özel Minty bardağında kat kat meyve ve çikolata', price: -30, inStock: true },
    { id: 'd_classic', name: 'Klasik Tabak Belçika Waffle', desc: 'Dışı çıtır, içi yumuşak geleneksel açık waffle', price: 0, inStock: true },
    { id: 'd_crispy', name: 'Ekstra Çıtır Pişirim Kova Waffle', desc: 'Ekstra karamelize ve çıtır dokulu küp waffle', price: 10, inStock: true }
  ],
  baseChocolates: {
    freeLimit: 2,
    extraPrice: 25,
    items: [
      { id: 'c_milk', name: 'Akışkan Sütlü Çikolata', color: '#5c3a21', inStock: true },
      { id: 'c_dark', name: 'Zengin Bitter Çikolata', color: '#2b1810', inStock: true },
      { id: 'c_white', name: 'Beyaz Çikolata Sosu', color: '#f5ebd6', inStock: true },
      { id: 'c_pistachio', name: 'Yoğun Antep Fıstığı Sosu', color: '#6c9a38', inStock: true },
      { id: 'c_lotus', name: 'Lotus Biscoff Sosu', color: '#c67d3b', inStock: true },
      { id: 'c_caramel', name: 'Karamel Sos', color: '#d4882a', inStock: true },
      { id: 'c_raspberry', name: 'Mayhoş Frambuaz Sosu', color: '#c2254c', inStock: true }
    ]
  },
  fruits: {
    freeLimit: 3,
    extraPrice: 20,
    items: [
      { id: 'f_straw', name: 'Taze Çilek', emoji: '🍓', inStock: true },
      { id: 'f_banana', name: 'Yerli Muz', emoji: '🍌', inStock: true },
      { id: 'f_raspberry', name: 'Taze Frambuaz', emoji: '🍒', inStock: true },
      { id: 'f_kiwi', name: 'Kivi Dilimleri', emoji: '🥝', inStock: true },
      { id: 'f_pineapple', name: 'Taze Ananas', emoji: '🍍', inStock: true },
      { id: 'f_blueberry', name: 'Yaban Mersini', emoji: '🫐', inStock: true }
    ]
  },
  toppings: {
    freeLimit: 3,
    extraPrice: 20,
    items: [
      { id: 't_pistachio', name: 'Çifte Kavrulmuş Fıstık Tozu', inStock: true },
      { id: 't_hazelnut_dust', name: 'İnce Çekilmiş Fındık Tozu', inStock: true },
      { id: 't_hazelnut', name: 'Bol Fındık Kırığı', inStock: true },
      { id: 't_white_crisp', name: 'Çıtır Beyaz Pirinç Patlakları', inStock: true },
      { id: 't_choco_crisp', name: 'Çikolatalı Pirinç Patlakları', inStock: true },
      { id: 't_minibon', name: 'Rengarenk Mini Bon Şekerlemeleri', inStock: true },
      { id: 't_chocochips', name: 'Damla Çikolata', inStock: true },
      { id: 't_lotus', name: 'Lotus Bisküvi Kırığı', inStock: true },
      { id: 't_oreo', name: 'Oreo Bisküvi Kırığı', inStock: true }
    ]
  },
  finishes: [
    { id: 's_choco', name: 'Ekstra Sütlü Çikolata Gezdirme', price: 0, inStock: true },
    { id: 's_caramel', name: 'Üst Karamel Sos', price: 0, inStock: true },
    { id: 's_berry', name: 'Üst Frambuaz Sos', price: 0, inStock: true },
    { id: 's_rulo', name: '+1 Çıtır Rulo Gofret (Kornet)', price: 0, inStock: true },
    { id: 'ice_maras', name: '+1 Top Kesme Maraş Dondurması', price: 45, inStock: true },
    { id: 'combo_tea', name: '+ Yanında Demleme Çay Fırsatı', price: 25, inStock: true },
    { id: 'combo_coffee', name: '+ Yanında Özel Kahve Fırsatı', price: 65, inStock: true }
  ]
};

const INITIAL_MENU_ITEMS = [
  // 1. ÖZEL MENÜ KOMBİNASYONLARI (Bardak & Kova Fırsatları - Menü Görselinden Birebir)
  {
    id: 'combo_bardak_cay',
    category: 'combos',
    name: 'Bardakta Waffle + Çay',
    desc: 'Minty özel bardağında taze meyveli, akışkan çikolatalı, çıtır pirinç patlaklı ve rulo gofretli Bardakta Waffle + Taze Demleme Çay fırsatı.',
    price: 200,
    badge: 'Bardak & Çay Fırsatı',
    inStock: true,
    emoji: '🥤',
    defaultChecklist: ['Bardakta Waffle', 'Taze Çilek & Muz', 'Sütlü & Beyaz Çikolata', 'Pirinç Patlakları & Rulo Gofret', '1x Taze Demleme Çay'],
    customOptions: [
      { name: 'Klasik Sütlü Çikolatalı + Demleme Çay', price: 0 },
      { name: 'Lotus & Karamel Soslu + Demleme Çay', price: 0 },
      { name: 'Antep Fıstığı Soslu + Demleme Çay (+20 TL)', price: 20 }
    ]
  },
  {
    id: 'combo_kova_cay',
    category: 'combos',
    name: 'Kova Waffle + Çay',
    desc: 'Bol malzemeli, taze çilek ve muzlu, akışkan çikolata soslu ve fıstık süslemeli doyurucu Kova Waffle + Taze Demleme Çay kombinasyonu.',
    price: 250,
    badge: 'Kova & Çay Fırsatı',
    inStock: true,
    emoji: '🪣',
    defaultChecklist: ['Kova Waffle', 'Taze Çilek & Muz', 'Sütlü & Beyaz Çikolata', 'Çifte Kavrulmuş Fıstık Tozu', '1x Taze Demleme Çay'],
    customOptions: [
      { name: 'Sütlü Çikolata & Fıstıklı Kova + Demleme Çay', price: 0 },
      { name: 'Bitter & Frambuazlı Kova + Demleme Çay', price: 0 },
      { name: 'Lotus Biscoff & Karamelli Kova + Demleme Çay', price: 0 }
    ]
  },
  {
    id: 'combo_kova_kahve',
    category: 'combos',
    name: 'Kova Waffle + Kahve',
    desc: 'Bol malzemeli doyurucu Kova Waffle + Minty fincanında taze çekim Özel Kahve (Latte, Americano, Flat White veya Türk Kahvesi) ikilisi.',
    price: 300,
    badge: 'En Popüler İkili',
    inStock: true,
    emoji: '☕',
    defaultChecklist: ['Kova Waffle', 'Taze Çilek & Muz', 'Belçika Çikolata & Pirinç Patlağı', '1x Minty Özel Kahve'],
    customOptions: [
      { name: 'Kova Waffle + Caffe Latte', price: 0 },
      { name: 'Kova Waffle + Americano / Filtre Kahve', price: 0 },
      { name: 'Kova Waffle + Türk Kahvesi', price: 0 },
      { name: 'Kova Waffle + Iced Latte (Soğuk)', price: 0 }
    ]
  },

  // 2. ŞEFİN İMZALI LEZZETLERİ (Özel Reçeteli Hazır Kombinasyonlar - Menü Görselinden Birebir)
  {
    id: 'sig_lotus_karamel',
    category: 'signature_waffle',
    name: 'Lotus & Karamel',
    desc: 'Lotus Biscoff sosu, karamel sos, ince çekilmiş fındık tozu ve çıtır beyaz pirinç patlakları.',
    price: 250,
    badge: 'Şefin İmzası',
    inStock: true,
    emoji: '🧇',
    defaultChecklist: ['Kova Waffle Tabanı', 'Lotus Biscoff Sosu', 'Karamel Sos', 'İnce Çekilmiş Fındık Tozu', 'Çıtır Beyaz Pirinç Patlakları', 'Lotus Bisküvi']
  },
  {
    id: 'sig_frambuaz_bitter',
    category: 'signature_waffle',
    name: 'Frambuaz Bitter',
    desc: 'Mayhoş frambuaz sosu, zengin bitter çikolata, damla çikolata ve çikolatalı pirinç patlakları.',
    price: 250,
    badge: 'Şefin İmzası',
    inStock: true,
    emoji: '🍒',
    defaultChecklist: ['Kova Waffle Tabanı', 'Mayhoş Frambuaz Sosu', 'Zengin Bitter Çikolata', 'Taze Frambuaz & Çilek', 'Damla Çikolata', 'Çikolatalı Pirinç Patlakları']
  },
  {
    id: 'sig_antep_ruyasi',
    category: 'signature_waffle',
    name: 'Antep Rüyası',
    desc: 'Yoğun Antep fıstığı sosu, akışkan sütlü çikolata, bol fındık ve çifte kavrulmuş fıstık tozu.',
    price: 250,
    badge: 'Çok Satan',
    inStock: true,
    emoji: '💚',
    defaultChecklist: ['Kova Waffle Tabanı', 'Yoğun Antep Fıstığı Sosu', 'Akışkan Sütlü Çikolata', 'Taze Çilek & Muz', 'Bol Fındık', 'Çifte Kavrulmuş Fıstık Tozu']
  },
  {
    id: 'sig_karnaval',
    category: 'signature_waffle',
    name: 'Karnaval Waffle',
    desc: 'Sütlü çikolata, karamel sos, rengarenk mini bon şekerlemeleri ve çikolatalı pirinç patlakları.',
    price: 250,
    badge: 'Renkli Lezzet',
    inStock: true,
    emoji: '🍬',
    defaultChecklist: ['Kova Waffle Tabanı', 'Sütlü Çikolata', 'Karamel Sos', 'Rengarenk Mini Bon Şekerlemeleri', 'Çikolatalı Pirinç Patlakları']
  },

  // 3. SICAK KAHVE & DEMLİK ÇAY
  {
    id: 'h_tea',
    category: 'hot_drinks',
    name: 'Taze Demlik Yaprak Çay',
    desc: 'Geleneksel ince belli bardakta veya büyük fincanda her an taze demlenmiş Rize çayı.',
    price: 40,
    badge: 'Taze Demleme',
    inStock: true,
    emoji: '🍵',
    customOptions: [
      { name: 'İnce Belli Bardak Çay', price: 0 },
      { name: 'Büyük Cam Fincan Çay (+15 TL)', price: 15 }
    ]
  },
  {
    id: 'h_minty_latte',
    category: 'hot_drinks',
    name: 'Minty Caffe Latte',
    desc: 'Özel harman %100 Arabica espresso ve kadifemsi sıcak süt köpüğü ile Minty fincanında.',
    price: 105,
    badge: 'Özel Kahve',
    inStock: true,
    emoji: '☕',
    hasDrinkCustomization: true
  },
  {
    id: 'h_turkish_coffee',
    category: 'hot_drinks',
    name: 'Çifte Kavrulmuş Türk Kahvesi',
    desc: 'Ağır ateşte bol köpüklü pişirilmiş geleneksel Türk kahvesi, su ve ikramlık ile.',
    price: 80,
    badge: '',
    inStock: true,
    emoji: '🫖',
    customOptions: [
      { name: 'Sade', price: 0 },
      { name: 'Orta Şekerli', price: 0 },
      { name: 'Şekerli', price: 0 },
      { name: 'Damla Sakızlı (+10 TL)', price: 10 }
    ]
  },
  {
    id: 'h_flat_white',
    category: 'hot_drinks',
    name: 'Flat White / Cortado',
    desc: 'Çift shot espresso ve ince mikro köpüklü süt ile yoğun kahve lezzeti.',
    price: 110,
    badge: 'Barista Önerisi',
    inStock: true,
    emoji: '☕',
    hasDrinkCustomization: true
  },

  // 4. COOL LIME & FERAHLATICI SOĞUK İÇECEKLER
  {
    id: 'b_cool_lime',
    category: 'cold_drinks',
    name: 'Minty Cool Lime (Fo Lime Özü & Taze Nane)',
    desc: 'Özel Fo Lime aroması, taze nane yaprakları, gerçek lime dilimleri ve kırık buz ile imzamız olan serinletici.',
    price: 115,
    badge: 'Minty İmza',
    inStock: true,
    emoji: '🍋‍🟩',
    hasDrinkCustomization: true
  },
  {
    id: 'b_berry_hibiscus',
    category: 'cold_drinks',
    name: 'Berry Hibiscus Refresher',
    desc: 'Demlenmiş hibiskus çayı, gerçek kırmızı orman meyveleri ve kırık buz.',
    price: 115,
    badge: 'Ferahlatıcı',
    inStock: true,
    emoji: '🌺',
    hasDrinkCustomization: true
  },
  {
    id: 'b_iced_latte',
    category: 'cold_drinks',
    name: 'Iced Caramel / Spanish Latte',
    desc: 'Soğuk süt, buz ve çift shot espresso ile serinletici kahve keyfi.',
    price: 120,
    badge: '',
    inStock: true,
    emoji: '🧋',
    hasDrinkCustomization: true
  },

  // 5. DÜNYA TATLILARI & ATIŞTIRMALIKLAR
  {
    id: 'd_nata_single',
    category: 'desserts',
    name: 'Portekiz Pastel de Nata (Sıcak Sunum)',
    desc: 'Çıtır milföy çanağında karamelize Portekiz krema dolgulu sıcak tart.',
    price: 85,
    badge: 'Sıcak Fırından',
    inStock: true,
    emoji: '🥧',
    customOptions: [
      { name: 'Tarçın & Pudra Şekeri ile (Klasik)', price: 0 },
      { name: 'Sade Sıcak Sunum', price: 0 },
      { name: '+1 Top Kesme Maraş Dondurması ile (+45 TL)', price: 45 }
    ]
  },
  {
    id: 'd_mochi_duo',
    category: 'desserts',
    name: 'Japon Dondurmalı Mochi (2\'li / 3\'lü)',
    desc: 'Pirinç hamuru kaplı gurme dondurma topları (Mango, Çilek, Matcha veya Çikolata).',
    price: 150,
    badge: 'Glutensiz',
    inStock: true,
    emoji: '🍡',
    customOptions: [
      { name: "2'li Mochi: Mango & Çilek", price: 0 },
      { name: "2'li Mochi: Matcha & Çikolata", price: 0 },
      { name: "3'lü Mochi Karışık Tadım Tabağı (+65 TL)", price: 65 }
    ]
  }
];

const CATEGORIES = [
  { id: 'combos', name: "Özel Menü Kombinasyonları", icon: Sparkles },
  { id: 'signature_waffle', name: "Şefin İmzalı Lezzetleri", icon: ChefHat },
  { id: 'custom_waffle', name: "Kendi Waffle'ını Yarat", icon: Flame },
  { id: 'hot_drinks', name: "Özel Kahve & Demlik Çay", icon: Coffee },
  { id: 'cold_drinks', name: "Minty Cool Lime & Soğuklar", icon: CupSoda },
  { id: 'desserts', name: "Dünya Tatlıları", icon: CakeSlice }
];

const TABLES = [
  "Masa 1", "Masa 2", "Masa 3", "Masa 4", "Masa 5",
  "Masa 6", "Masa 7", "Masa 8", "Masa 9", "Masa 10",
  "Masa 11", "Masa 12", "Masa 13", "Masa 14", "Masa 15",
  "Gel-Al (Paket)"
];

// ==========================================
// SOUND GENERATOR (WEB AUDIO API CHIME)
// ==========================================
const playOrderNotificationSound = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const playTone = (freq, startTime, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.3, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    playTone(659.25, now, 0.35);       // E5
    playTone(880.00, now + 0.18, 0.55); // A5
  } catch (e) {
    console.warn("Ses çalınamadı:", e);
  }
};

// ==========================================
// MAIN APPLICATION COMPONENT
// ==========================================
export default function App() {
  // Authentication & Firebase State
  const [user, setUser] = useState(null);
  const [isCloudConnected, setIsCloudConnected] = useState(false);

  // Top Navigation Modes: 'customer' | 'kitchen' | 'cms'
  const [viewMode, setViewMode] = useState('customer');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isLinksModalOpen, setIsLinksModalOpen] = useState(false);
  const [hideStaffTopBar, setHideStaffTopBar] = useState(true);
  const [customDomainInput, setCustomDomainInput] = useState('');

  // Admin CMS PIN Protection State
  const [isCmsUnlocked, setIsCmsUnlocked] = useState(false);
  const [isKitchenUnlocked, setIsKitchenUnlocked] = useState(false);
  const [isCashierUnlocked, setIsCashierUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [cmsSubTab, setCmsSubTab] = useState('menu'); // 'waffle' | 'menu' | 'cafe'

  // Cafe Settings, Waffle Builder Options & Menu State
  const [cafeSettings, setCafeSettings] = useState(INITIAL_CAFE_SETTINGS);
  const [waffleBuilder, setWaffleBuilder] = useState(INITIAL_WAFFLE_BUILDER);
  const [menuItems, setMenuItems] = useState(INITIAL_MENU_ITEMS);

  // New Ingredient / New Menu Item Forms in CMS
  const [newIngredientGroup, setNewIngredientGroup] = useState('fruits');
  const [newIngredientName, setNewIngredientName] = useState('');
  const [newIngredientPrice, setNewIngredientPrice] = useState(0);
  const [newIngredientEmoji, setNewIngredientEmoji] = useState('✨');

  const [newMenuItem, setNewMenuItem] = useState({
    name: '',
    category: 'combos',
    price: 250,
    desc: '',
    badge: 'Yeni',
    emoji: '🧇'
  });

  // Customer Menu Browsing State
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Table & Cart State
  const [selectedTable, setSelectedTable] = useState('Masa 5');
  const [isTableSelectorOpen, setIsTableSelectorOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Masada / Kasada Temassız Kart veya NFC ile Ödeme');
  const [customerName, setCustomerName] = useState('');
  const [generalOrderNote, setGeneralOrderNote] = useState('');

  // Modals State
  const [isWaffleModalOpen, setIsWaffleModalOpen] = useState(false);
  const [customizingItem, setCustomizingItem] = useState(null);
  const [receiptModalOrder, setReceiptModalOrder] = useState(null);
  const [copiedTextToast, setCopiedTextToast] = useState(null);

  // Waffle Builder Customer Selections
  const [waffleStep, setWaffleStep] = useState(1);
  const [waffleDoughId, setWaffleDoughId] = useState('d_kova');
  const [waffleChocolates, setWaffleChocolates] = useState(['c_milk', 'c_pistachio']);
  const [waffleFruits, setWaffleFruits] = useState(['f_straw', 'f_banana']);
  const [waffleToppings, setWaffleToppings] = useState(['t_pistachio', 't_white_crisp']);
  const [waffleFinishes, setWaffleFinishes] = useState(['s_rulo']);
  const [waffleNote, setWaffleNote] = useState('');

  // Item Customization Modal State
  const [drinkSize, setDrinkSize] = useState('Orta Boy (Regular)');
  const [drinkIce, setDrinkIce] = useState('Normal Buzlu');
  const [drinkExtras, setDrinkExtras] = useState([]);
  const [selectedSubOption, setSelectedSubOption] = useState('');
  const [itemCustomNote, setItemCustomNote] = useState('');

  // Live Orders State
  const [orders, setOrders] = useState([
    {
      id: 'ORD-1042',
      orderNumber: 1042,
      table: 'Masa 5',
      customerName: 'Zeynep H.',
      status: 'new',
      createdAt: Date.now() - 1000 * 60 * 3,
      paymentMethod: 'Masada / Kasada Temassız Kart veya NFC ile Ödeme',
      totalAmount: 450,
      generalNote: 'Çaylar taze demlenmiş sıcak gelirse çok seviniriz.',
      checkedSteps: {},
      items: [
        {
          cartId: 'sample-1',
          name: "Kova Waffle + Çay",
          quantity: 1,
          unitPrice: 250,
          isCustomWaffle: false,
          details: [
            "Tercih: Sütlü Çikolata & Fıstıklı Kova + Demleme Çay"
          ],
          checklistItems: [
            "Kova Waffle",
            "Taze Çilek & Muz",
            "Sütlü & Beyaz Çikolata",
            "Çifte Kavrulmuş Fıstık Tozu",
            "1x Taze Demleme Çay"
          ],
          note: "Çikolatası bol olsun lütfen."
        },
        {
          cartId: 'sample-2',
          name: "Bardakta Waffle + Çay",
          quantity: 1,
          unitPrice: 200,
          details: [
            "Tercih: Lotus & Karamel Soslu + Demleme Çay"
          ],
          checklistItems: [
            "Bardakta Waffle",
            "Taze Çilek & Muz",
            "Lotus & Karamel Sos",
            "Pirinç Patlakları & Rulo Gofret",
            "1x Taze Demleme Çay"
          ]
        }
      ]
    }
  ]);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevOrderCountRef = useRef(orders.length);
  const [activeCustomerOrderIds, setActiveCustomerOrderIds] = useState(['ORD-1042']);

  // Parse URL Query Params (`?view=mutfak`, `?view=yonetici`, `?view=menu&masa=5`)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const masaParam = params.get('masa');
      const modeParam = params.get('view') || params.get('mode');
      const cleanCustomerParam = params.get('customerOnly');

      if (masaParam) {
        const formatted = isNaN(masaParam) ? masaParam : `Masa ${masaParam}`;
        setSelectedTable(formatted);
      }

      if (modeParam === 'admin' || modeParam === 'cms' || modeParam === 'yonetici') {
        setViewMode('cms');
        setHideStaffTopBar(false);
      } else if (modeParam === 'kitchen' || modeParam === 'mutfak') {
        setViewMode('kitchen');
      } else if (modeParam === 'kasa' || modeParam === 'cashier' || modeParam === 'pos') {
        setViewMode('cashier');
      } else if (modeParam === 'menu' || modeParam === 'customer') {
        setViewMode('customer');
        // If opened via customer QR link with ?view=menu, hide staff bar automatically
        if (cleanCustomerParam === '1' || modeParam === 'menu') {
          setHideStaffTopBar(true);
        }
      }
    } catch (e) {
      // Ignore URL parsing errors
    }
  }, []);

  // Helper to get active base URL for Links & QR Codes
  const baseAppUrl = useMemo(() => {
    if (customDomainInput && customDomainInput.trim() !== '') {
      return customDomainInput.trim().replace(/\/$/, '');
    }
    if (typeof window !== 'undefined' && window.location.origin && window.location.origin !== 'null') {
      return window.location.origin + window.location.pathname;
    }
    return 'https://mintywaffle.vercel.app';
  }, [customDomainInput]);

  // ==========================================
  // FIREBASE AUTH & REAL-TIME LISTENERS
  // ==========================================
  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.warn("Firebase Auth uyarısı:", err);
        showToast("⚠️ Firebase girişi başarısız: " + (err?.code || err?.message));
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) setIsCloudConnected(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db) return;

    // 1. Listen to Live Orders Collection
    const ordersRef = collection(db, 'artifacts', appId, 'public', 'data', 'cafe_orders');
    const unsubOrders = onSnapshot(
      ordersRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const loadedOrders = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data()
          }));
          loadedOrders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          setOrders(loadedOrders);
        }
      },
      (err) => { console.warn("Sipariş dinleme hatası:", err); showToast("⚠️ Siparişler dinlenemiyor: " + (err?.code || err?.message)); }
    );

    // 2. Listen to Minty Cafe Config, Waffle Builder & Menu
    const configDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'cafe_config', 'minty_v1');
    const unsubConfig = onSnapshot(
      configDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.settings) setCafeSettings(data.settings);
          if (data.waffleBuilder) setWaffleBuilder(data.waffleBuilder);
          if (data.menuItems) setMenuItems(data.menuItems);
        } else {
          // Seed Minty initial data into Firestore so owner can edit immediately
          setDoc(configDocRef, {
            settings: INITIAL_CAFE_SETTINGS,
            waffleBuilder: INITIAL_WAFFLE_BUILDER,
            menuItems: INITIAL_MENU_ITEMS,
            updatedAt: Date.now()
          }).catch(() => {});
        }
      },
      (err) => console.warn("Ayarlar dinleme hatası:", err)
    );

    return () => {
      unsubOrders();
      unsubConfig();
    };
  }, [user]);

  // Play sound chime when new order arrives
  useEffect(() => {
    if (orders.length > prevOrderCountRef.current) {
      if (soundEnabled) {
        playOrderNotificationSound();
      }
    }
    prevOrderCountRef.current = orders.length;
  }, [orders.length, soundEnabled]);

  // ==========================================
  // CLOUD SYNC HELPER FOR CMS CHANGES
  // ==========================================
  const syncAllConfigToCloud = async (newSettings, newBuilder, newMenu, toastMsg = "Değişiklikler kaydedildi ve tüm masalarda güncellendi!") => {
    setCafeSettings(newSettings);
    setWaffleBuilder(newBuilder);
    setMenuItems(newMenu);

    if (user && db) {
      try {
        const configDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'cafe_config', 'minty_v1');
        await setDoc(configDocRef, {
          settings: newSettings,
          waffleBuilder: newBuilder,
          menuItems: newMenu,
          updatedAt: Date.now()
        });
      } catch (e) {
        console.warn("Bulut kayıt hatası:", e);
      }
    }
    if (toastMsg) showToast(toastMsg);
  };

  const handleResetToFactoryDefaults = async () => {
    await syncAllConfigToCloud(
      INITIAL_CAFE_SETTINGS,
      INITIAL_WAFFLE_BUILDER,
      INITIAL_MENU_ITEMS,
      "Menü ve waffle malzemeleri varsayılan fabrika ayarlarına sıfırlandı!"
    );
  };

  // ==========================================
  // CUSTOM WAFFLE LIVE PRICE & CHECKLIST CALCULATION
  // ==========================================
  const customWaffleCalculation = useMemo(() => {
    let price = Number(cafeSettings.customWaffleBasePrice) || 220;
    const breakdown = [];
    const checklist = [];

    // 1. Dough
    const selectedDough = waffleBuilder.dough.find(d => d.id === waffleDoughId && d.inStock) || waffleBuilder.dough[0];
    if (selectedDough) {
      price += Number(selectedDough.price) || 0;
      breakdown.push(`Hamur: ${selectedDough.name}${selectedDough.price > 0 ? ` (+${selectedDough.price}₺)` : ''}`);
      checklist.push(`Hamur: ${selectedDough.name}`);
    }

    // 2. Base Chocolates
    const validChocs = waffleChocolates.filter(id => {
      const found = waffleBuilder.baseChocolates.items.find(i => i.id === id);
      return found && found.inStock;
    });
    const extraChocCount = Math.max(0, validChocs.length - Number(waffleBuilder.baseChocolates.freeLimit));
    const chocExtraCost = extraChocCount * Number(waffleBuilder.baseChocolates.extraPrice);
    price += chocExtraCost;
    const chocNames = validChocs.map(id => {
      const found = waffleBuilder.baseChocolates.items.find(i => i.id === id);
      if (found) checklist.push(`Taban: ${found.name}`);
      return found ? found.name : '';
    }).filter(Boolean);
    if (chocNames.length > 0) {
      breakdown.push(`Taban: ${chocNames.join(', ')}${chocExtraCost > 0 ? ` (+${chocExtraCost}₺)` : ''}`);
    }

    // 3. Fruits
    const validFruits = waffleFruits.filter(id => {
      const found = waffleBuilder.fruits.items.find(i => i.id === id);
      return found && found.inStock;
    });
    const extraFruitCount = Math.max(0, validFruits.length - Number(waffleBuilder.fruits.freeLimit));
    const fruitExtraCost = extraFruitCount * Number(waffleBuilder.fruits.extraPrice);
    price += fruitExtraCost;
    const fruitNames = validFruits.map(id => {
      const found = waffleBuilder.fruits.items.find(i => i.id === id);
      if (found) checklist.push(`Meyve: ${found.name}`);
      return found ? found.name : '';
    }).filter(Boolean);
    if (fruitNames.length > 0) {
      breakdown.push(`Meyveler: ${fruitNames.join(', ')}${fruitExtraCost > 0 ? ` (+${fruitExtraCost}₺)` : ''}`);
    }

    // 4. Toppings
    const validToppings = waffleToppings.filter(id => {
      const found = waffleBuilder.toppings.items.find(i => i.id === id);
      return found && found.inStock;
    });
    const extraTopCount = Math.max(0, validToppings.length - Number(waffleBuilder.toppings.freeLimit));
    const topExtraCost = extraTopCount * Number(waffleBuilder.toppings.extraPrice);
    price += topExtraCost;
    const topNames = validToppings.map(id => {
      const found = waffleBuilder.toppings.items.find(i => i.id === id);
      if (found) checklist.push(`Süs: ${found.name}`);
      return found ? found.name : '';
    }).filter(Boolean);
    if (topNames.length > 0) {
      breakdown.push(`Çerez & Süs: ${topNames.join(', ')}${topExtraCost > 0 ? ` (+${topExtraCost}₺)` : ''}`);
    }

    // 5. Finishes & Ice cream
    const finishNames = [];
    waffleFinishes.forEach(id => {
      const found = waffleBuilder.finishes.find(i => i.id === id && i.inStock);
      if (found) {
        price += Number(found.price) || 0;
        finishNames.push(`${found.name}${found.price > 0 ? ` (+${found.price}₺)` : ''}`);
        checklist.push(`Ekstra/Sos: ${found.name}`);
      }
    });
    if (finishNames.length > 0) {
      breakdown.push(`Üst Sos & Dondurma: ${finishNames.join(', ')}`);
    }

    return { totalPrice: price, breakdown, checklist };
  }, [cafeSettings.customWaffleBasePrice, waffleBuilder, waffleDoughId, waffleChocolates, waffleFruits, waffleToppings, waffleFinishes]);

  // ==========================================
  // HANDLERS: WAFFLE & CART ACTIONS
  // ==========================================
  const toggleMultiSelect = (id, inStock, list, setList) => {
    if (!inStock) return;
    if (list.includes(id)) {
      setList(list.filter(item => item !== id));
    } else {
      setList([...list, id]);
    }
  };

  const handleAddCustomWaffleToCart = () => {
    const newItem = {
      cartId: `waffle-${Date.now()}`,
      name: "Kendi Waffle'ım (Özel Seçim)",
      quantity: 1,
      unitPrice: customWaffleCalculation.totalPrice,
      isCustomWaffle: true,
      details: customWaffleCalculation.breakdown,
      checklistItems: customWaffleCalculation.checklist,
      note: waffleNote.trim()
    };
    setCart(prev => [...prev, newItem]);
    setIsWaffleModalOpen(false);
    setWaffleStep(1);
    setWaffleNote('');
    showToast("Özel Waffle sepetinize eklendi!");
  };

  const openItemClick = (item) => {
    if (!item.inStock) return;
    if (item.hasDrinkCustomization || (item.customOptions && item.customOptions.length > 0)) {
      setCustomizingItem(item);
      setDrinkSize('Orta Boy (Regular)');
      setDrinkIce('Normal Buzlu');
      setDrinkExtras([]);
      setSelectedSubOption(item.customOptions ? item.customOptions[0].name : '');
      setItemCustomNote('');
    } else {
      const newItem = {
        cartId: `item-${Date.now()}-${Math.random()}`,
        name: item.name,
        quantity: 1,
        unitPrice: Number(item.price),
        details: [],
        checklistItems: item.defaultChecklist ? [...item.defaultChecklist] : [item.name],
        note: ''
      };
      setCart(prev => [...prev, newItem]);
      showToast(`${item.name} sepete eklendi!`);
    }
  };

  const handleConfirmCustomizedItem = () => {
    if (!customizingItem) return;
    let unitPrice = Number(customizingItem.price);
    const details = [];
    const checklistItems = [customizingItem.name];

    if (customizingItem.hasDrinkCustomization) {
      if (drinkSize === 'Büyük Boy (Large) (+20₺)') {
        unitPrice += 20;
      }
      details.push(`Boy: ${drinkSize}`);
      checklistItems.push(drinkSize);

      if (customizingItem.category === 'cold_drinks') {
        details.push(`Buz: ${drinkIce}`);
        checklistItems.push(drinkIce);
      }

      drinkExtras.forEach(ext => {
        unitPrice += ext.price;
        details.push(`${ext.name} (+${ext.price}₺)`);
        checklistItems.push(ext.name);
      });
    }

    if (customizingItem.customOptions && selectedSubOption) {
      const foundOpt = customizingItem.customOptions.find(o => o.name === selectedSubOption);
      if (foundOpt) {
        unitPrice += Number(foundOpt.price) || 0;
        details.push(`Tercih: ${foundOpt.name}`);
        checklistItems.push(foundOpt.name);
      }
    }

    const newItem = {
      cartId: `cust-${Date.now()}`,
      name: customizingItem.name,
      quantity: 1,
      unitPrice,
      details,
      checklistItems,
      note: itemCustomNote.trim()
    };

    setCart(prev => [...prev, newItem]);
    setCustomizingItem(null);
    showToast(`${customizingItem.name} sepete eklendi!`);
  };

  const updateCartQuantity = (cartId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.cartId === cartId) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }, [cart]);

  const showToast = (msg) => {
    setCopiedTextToast(msg);
    setTimeout(() => setCopiedTextToast(null), 2800);
  };

  // ==========================================
  // ORDER SUBMISSION (LIVE KITCHEN & WHATSAPP)
  // ==========================================
  const submitOrderToKitchen = async (alsoOpenWhatsapp = false) => {
    if (cart.length === 0) return;

    const nextNumber = orders.length > 0
      ? Math.max(...orders.map(o => o.orderNumber || 1000)) + 1
      : 1043;

    const newOrderObj = {
      orderNumber: nextNumber,
      table: selectedTable,
      customerName: customerName.trim() || 'Misafir',
      status: 'new',
      createdAt: Date.now(),
      paymentMethod,
      totalAmount: cartTotal,
      generalNote: generalOrderNote.trim(),
      checkedSteps: {},
      items: cart
    };

    let createdId = `ORD-${nextNumber}`;

    if (user && db) {
      try {
        const ordersRef = collection(db, 'artifacts', appId, 'public', 'data', 'cafe_orders');
        const docRef = await addDoc(ordersRef, JSON.parse(JSON.stringify(newOrderObj)));
        createdId = docRef.id;
      } catch (e) {
        console.warn("Firestore kayıt hatası, yerel listeye ekleniyor:", e);
        showToast("⚠️ Sipariş buluta kaydedilemedi: " + (e?.code || e?.message || "bilinmeyen hata"));
        setOrders(prev => [{ id: createdId, ...newOrderObj }, ...prev]);
      }
    } else {
      showToast("⚠️ Firebase bağlı değil: sipariş sadece bu cihazda görünür (.env ayarlarını kontrol edin).");
      setOrders(prev => [{ id: createdId, ...newOrderObj }, ...prev]);
    }

    if (soundEnabled) playOrderNotificationSound();
    setActiveCustomerOrderIds(prev => [createdId, ...prev]);

    if (alsoOpenWhatsapp) {
      const text = generatePlainTextReceipt({ id: createdId, ...newOrderObj });
      const cleanPhone = cafeSettings.whatsappNumber.replace(/\D/g, '');
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
      window.open(waUrl, '_blank');
    }

    setCart([]);
    setGeneralOrderNote('');
    setIsCartOpen(false);
    showToast(`Siparişiniz (#${nextNumber}) mutfağa iletildi!`);
  };

  // ==========================================
  // KITCHEN ORDER & CHECKLIST MANAGEMENT
  // ==========================================
  const updateOrderStatus = async (orderId, newStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    if (user && db && !orderId.startsWith('ORD-')) {
      try {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'cafe_orders', orderId);
        await updateDoc(docRef, { status: newStatus });
      } catch (e) {
        console.warn("Durum güncellenemedi:", e);
      }
    }
  };

  const toggleChecklistItem = async (orderId, checkKey) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return;
    const currentChecked = targetOrder.checkedSteps || {};
    const updatedChecked = {
      ...currentChecked,
      [checkKey]: !currentChecked[checkKey]
    };

    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, checkedSteps: updatedChecked } : o));
    if (user && db && !orderId.startsWith('ORD-')) {
      try {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'cafe_orders', orderId);
        await updateDoc(docRef, { checkedSteps: updatedChecked });
      } catch (e) {
        console.warn("Checklist güncellenemedi:", e);
      }
    }
  };

  // ==========================================
  // CMS ACTIONS: WAFFLE INGREDIENTS & MENU ITEMS
  // ==========================================
  const toggleWaffleIngredientStock = (groupKey, itemId) => {
    const updated = { ...waffleBuilder };
    if (groupKey === 'dough' || groupKey === 'finishes') {
      updated[groupKey] = updated[groupKey].map(i =>
        i.id === itemId ? { ...i, inStock: !i.inStock } : i
      );
    } else {
      updated[groupKey] = {
        ...updated[groupKey],
        items: updated[groupKey].items.map(i =>
          i.id === itemId ? { ...i, inStock: !i.inStock } : i
        )
      };
    }
    syncAllConfigToCloud(cafeSettings, updated, menuItems, "Malzeme stok durumu güncellendi!");
  };

  const handleAddNewWaffleIngredient = (e) => {
    e.preventDefault();
    if (!newIngredientName.trim()) return;
    const newId = `ing_${Date.now()}`;
    const updated = { ...waffleBuilder };

    if (newIngredientGroup === 'dough') {
      updated.dough = [
        ...updated.dough,
        { id: newId, name: newIngredientName.trim(), desc: 'Özel Seçim', price: Number(newIngredientPrice) || 0, inStock: true }
      ];
    } else if (newIngredientGroup === 'finishes') {
      updated.finishes = [
        ...updated.finishes,
        { id: newId, name: newIngredientName.trim(), price: Number(newIngredientPrice) || 0, inStock: true }
      ];
    } else if (newIngredientGroup === 'baseChocolates') {
      updated.baseChocolates = {
        ...updated.baseChocolates,
        items: [...updated.baseChocolates.items, { id: newId, name: newIngredientName.trim(), color: '#6b4423', inStock: true }]
      };
    } else if (newIngredientGroup === 'fruits') {
      updated.fruits = {
        ...updated.fruits,
        items: [...updated.fruits.items, { id: newId, name: newIngredientName.trim(), emoji: newIngredientEmoji || '🍓', inStock: true }]
      };
    } else if (newIngredientGroup === 'toppings') {
      updated.toppings = {
        ...updated.toppings,
        items: [...updated.toppings.items, { id: newId, name: newIngredientName.trim(), inStock: true }]
      };
    }

    setNewIngredientName('');
    setNewIngredientPrice(0);
    syncAllConfigToCloud(cafeSettings, updated, menuItems, `"${newIngredientName}" waffle sihirbazına eklendi!`);
  };

  const deleteWaffleIngredient = (groupKey, itemId) => {
    const updated = { ...waffleBuilder };
    if (groupKey === 'dough' || groupKey === 'finishes') {
      updated[groupKey] = updated[groupKey].filter(i => i.id !== itemId);
    } else {
      updated[groupKey] = {
        ...updated[groupKey],
        items: updated[groupKey].items.filter(i => i.id !== itemId)
      };
    }
    syncAllConfigToCloud(cafeSettings, updated, menuItems, "Malzeme silindi.");
  };

  const handleAddNewMenuProduct = (e) => {
    e.preventDefault();
    if (!newMenuItem.name.trim()) return;
    const created = {
      id: `prod_${Date.now()}`,
      name: newMenuItem.name.trim(),
      category: newMenuItem.category,
      price: Number(newMenuItem.price) || 100,
      desc: newMenuItem.desc.trim() || 'Günlük taze hazırlanır.',
      badge: newMenuItem.badge.trim(),
      emoji: newMenuItem.emoji || '🍰',
      inStock: true,
      hasDrinkCustomization: newMenuItem.category === 'cold_drinks' || newMenuItem.category === 'hot_drinks'
    };
    const updatedMenu = [created, ...menuItems];
    setNewMenuItem({ name: '', category: 'desserts', price: 120, desc: '', badge: 'Yeni', emoji: '🍰' });
    syncAllConfigToCloud(cafeSettings, waffleBuilder, updatedMenu, `"${created.name}" menüye eklendi!`);
  };

  const deleteMenuProduct = (itemId) => {
    const updatedMenu = menuItems.filter(m => m.id !== itemId);
    syncAllConfigToCloud(cafeSettings, waffleBuilder, updatedMenu, "Ürün menüden kaldırıldı.");
  };

  // ==========================================
  // 80MM THERMAL PRINTER TEXT FORMATTER
  // ==========================================
  const generatePlainTextReceipt = (order) => {
    const dateStr = new Date(order.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const fullDate = new Date(order.createdAt).toLocaleDateString('tr-TR');
    const divider = "--------------------------------";
    let lines = [];
    lines.push(`*** ${cafeSettings.cafeName.toUpperCase()} ***`);
    lines.push(`SIPARIS NO: #${order.orderNumber} | ${order.table.toUpperCase()}`);
    lines.push(`Tarih: ${fullDate} Saat: ${dateStr}`);
    if (order.customerName) lines.push(`Musteri: ${order.customerName}`);
    lines.push(divider);

    order.items.forEach((item, idx) => {
      lines.push(`${item.quantity}x ${item.name} (${item.unitPrice * item.quantity} TL)`);
      if (item.checklistItems && item.checklistItems.length > 0) {
        item.checklistItems.forEach(chk => {
          lines.push(`  [ ] ${chk}`);
        });
      } else if (item.details && item.details.length > 0) {
        item.details.forEach(det => {
          lines.push(`  - ${det}`);
        });
      }
      if (item.note) {
        lines.push(`  *NOT: ${item.note}`);
      }
      if (idx < order.items.length - 1) lines.push("");
    });

    lines.push(divider);
    if (order.generalNote) {
      lines.push(`GENEL NOT: ${order.generalNote}`);
      lines.push(divider);
    }
    lines.push(`TOPLAM TUTAR: ${order.totalAmount} TL`);
    lines.push(`ODEME: ${order.paymentMethod}`);
    lines.push(`Wi-Fi Sifresi: ${cafeSettings.wifiPass}`);
    lines.push(divider);
    lines.push(`Afiyet Olsun!`);
    return lines.join('\n');
  };

  const copyReceiptForBluetoothPrinter = (order) => {
    const text = generatePlainTextReceipt(order);
    navigator.clipboard?.writeText(text);
    showToast("80mm Fiş metni panoya kopyalandı! (Mobil yazıcıdan direkt yazdırabilirsiniz)");
  };

  // Filtered Menu Items for Customer View
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesCat = activeCategory === 'all' || activeCategory === 'custom_waffle'
        ? true
        : item.category === activeCategory;
      const matchesSearch = searchQuery.trim() === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.desc.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [menuItems, activeCategory, searchQuery]);

  // Customer's active orders for live status banner
  const customerLiveOrders = useMemo(() => {
    return orders.filter(o => activeCustomerOrderIds.includes(o.id) || o.table === selectedTable);
  }, [orders, activeCustomerOrderIds, selectedTable]);

  // Helper vectors for Minty Menu visual cards
  const getComboCardIllustration = (itemId) => {
    if (itemId === 'combo_bardak_cay') {
      return { leftLabel: 'Bardak Waffle', rightLabel: 'Demlik Çay', rightIcon: '🍵' };
    }
    if (itemId === 'combo_kova_cay') {
      return { leftLabel: 'Kova Waffle', rightLabel: 'Demlik Çay', rightIcon: '🍵' };
    }
    if (itemId === 'combo_kova_kahve') {
      return { leftLabel: 'Kova Waffle', rightLabel: 'Minty Kahve', rightIcon: '☕' };
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#F5EFE1] text-[#0F3826] font-sans pb-24 selection:bg-[#0F3826] selection:text-[#F5EFE1]">
      {/* ==========================================
          PRINT STYLES FOR 80MM THERMAL PRINTER (AFANDA 892E)
          ========================================== */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;0,800;0,900;1,600&family=Caveat:wght@600;700&display=swap');
        .font-minty-serif {
          font-family: 'Playfair Display', Georgia, serif;
        }
        .font-minty-script {
          font-family: 'Caveat', cursive;
        }
        @media print {
          @page {
            size: 80mm auto;
            margin: 0mm;
          }
          body * {
            visibility: hidden;
          }
          #thermal-receipt-print-area,
          #thermal-receipt-print-area * {
            visibility: visible;
          }
          #thermal-receipt-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 74mm !important;
            max-width: 74mm !important;
            margin: 0 !important;
            padding: 2mm !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            font-family: 'Courier New', Courier, monospace !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* ==========================================
          TOP 3-WAY MODE SWITCHER BAR (MINTY FOREST GREEN)
          Hidden automatically when customer scans QR (?view=menu) or when toggled
          ========================================== */}
      {!hideStaffTopBar ? (
        <div className="sticky top-0 z-40 bg-[#0A2619] text-[#F5EFE1] px-3 py-2 shadow-md border-b border-[#1E563B] no-print">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#F5EFE1] text-[#0F3826] font-minty-serif font-black text-sm shadow">
                M
              </span>
              <span className="font-bold text-xs sm:text-sm tracking-wide flex items-center gap-1">
                {cafeSettings.cafeName}
                <Leaf className="w-3.5 h-3.5 text-emerald-400" />
              </span>
              {isCloudConnected && (
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Canlı Bulut Senkronize
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              <div className="flex items-center bg-[#0F3826] p-1 rounded-xl border border-[#246345]">
                <button
                  onClick={() => setViewMode('customer')}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    viewMode === 'customer'
                      ? 'bg-[#F5EFE1] text-[#0F3826] shadow-sm'
                      : 'text-emerald-100/80 hover:text-white'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Müşteri Menü</span>
                </button>

                <button
                  onClick={() => setViewMode('kitchen')}
                  className={`relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    viewMode === 'kitchen'
                      ? 'bg-emerald-400 text-[#0A2619] shadow-sm'
                      : 'text-emerald-100/80 hover:text-white'
                  }`}
                >
                  <ChefHat className="w-3.5 h-3.5" />
                  <span>Mutfak & Kasa</span>
                  {orders.filter(o => o.status === 'new').length > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px] font-black animate-pulse">
                      {orders.filter(o => o.status === 'new').length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setViewMode('cms')}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    viewMode === 'cms'
                      ? 'bg-[#D7C4A3] text-[#0A2619] shadow-sm'
                      : 'text-emerald-100/80 hover:text-white'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Yönetici (Fiyat/Menü)</span>
                </button>
              </div>

              {/* NEW: Direct Links & Setup Modal Trigger */}
              <button
                onClick={() => setIsLinksModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#0A2619] text-xs font-black shadow-sm transition whitespace-nowrap"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Linkler & Kurulum</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* TOAST NOTIFICATION */}
      {copiedTextToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#0F3826] text-[#F5EFE1] px-4 py-3 rounded-2xl shadow-2xl border-2 border-[#C8B28B] flex items-center gap-2 text-xs sm:text-sm font-semibold animate-bounce no-print">
          <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
          <span>{copiedTextToast}</span>
        </div>
      )}

      {/* ====================================================================================
          VIEW 1: CUSTOMER MOBILE QR MENU VIEW (MINTY WAFFLE & CAFE POSTER AESTHETIC)
          ==================================================================================== */}
      {viewMode === 'customer' && (
        <div className="max-w-xl mx-auto bg-[#F5EFE1] min-h-screen shadow-2xl border-x border-[#D7C4A3]">
          {/* MINTY POSTER HEADER (CREAM PARCHMENT WITH FOREST GREEN SERIF LOGO & LEAVES) */}
          <div className="relative bg-gradient-to-b from-[#FAF6EC] via-[#F5EFE1] to-[#ECE2CD] text-[#0F3826] pt-5 pb-4 px-4 border-b-2 border-[#C8B28B] overflow-hidden">
            {/* Decorative Corner Botanical Leaves */}
            <div className="absolute -left-4 -top-4 text-[#14452F]/15 pointer-events-none select-none transform -rotate-12">
              <Leaf className="w-24 h-24" />
            </div>
            <div className="absolute -right-4 -top-4 text-[#14452F]/15 pointer-events-none select-none transform rotate-45">
              <Leaf className="w-24 h-24" />
            </div>

            {/* Top Table & Wi-Fi Row */}
            <div className="relative z-10 flex items-center justify-between gap-2 mb-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#0F3826]/10 text-[#0F3826] border border-[#0F3826]/20">
                <Wifi className="w-3 h-3 text-[#14452F]" /> Wi-Fi: <strong>{cafeSettings.wifiPass}</strong>
              </span>

              <button
                onClick={() => setIsTableSelectorOpen(!isTableSelectorOpen)}
                className="bg-[#0F3826] hover:bg-[#164d35] text-[#F5EFE1] px-3.5 py-1.5 rounded-full font-bold text-xs shadow-md border border-[#C8B28B] flex items-center gap-1.5 transition active:scale-95"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-300" />
                <span>{selectedTable}</span>
                <span className="text-[10px] opacity-75">(Değiştir)</span>
              </button>
            </div>

            {/* Table Selector Dropdown */}
            {isTableSelectorOpen && (
              <div className="relative z-20 my-3 p-3 rounded-2xl bg-[#0F3826] text-[#F5EFE1] border border-[#C8B28B] shadow-xl animate-fadeIn">
                <p className="text-xs text-emerald-200 mb-2 font-semibold">Masanızı veya Sipariş Tipini Seçin:</p>
                <div className="grid grid-cols-4 gap-1.5 max-h-44 overflow-y-auto pr-1">
                  {TABLES.map(tbl => (
                    <button
                      key={tbl}
                      onClick={() => {
                        setSelectedTable(tbl);
                        setIsTableSelectorOpen(false);
                      }}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold transition ${
                        selectedTable === tbl
                          ? 'bg-[#F5EFE1] text-[#0F3826] shadow'
                          : 'bg-white/10 text-[#F5EFE1] hover:bg-white/20'
                      }`}
                    >
                      {tbl}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Center Minty Brand Typography (Matching Menu Image) */}
            <div className="relative z-10 text-center my-2">
              <div className="flex items-center justify-center gap-3">
                <div className="hidden sm:block text-left font-minty-script text-lg leading-tight text-[#2C1E18] -rotate-6">
                  Tatlı bir mola,<br />mutlu bir an! ♡
                </div>

                <div className="px-2">
                  <div className="relative inline-block">
                    <h1 className="font-minty-serif text-5xl sm:text-6xl font-black tracking-tight text-[#0F3826] leading-none">
                      Minty
                    </h1>
                    {/* Mint Leaf Accent over the 'i' */}
                    <Leaf className="w-5 h-5 text-[#1B5E3F] fill-[#1B5E3F] absolute -top-2 left-[31%] transform -rotate-12" />
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-1.5">
                    <span className="h-[1px] w-6 bg-[#0F3826]/40" />
                    <span className="text-[11px] sm:text-xs font-serif tracking-[0.22em] uppercase font-bold text-[#0F3826]">
                      WAFFLE & CAFE MENU
                    </span>
                    <span className="h-[1px] w-6 bg-[#0F3826]/40" />
                  </div>
                </div>

                <div className="hidden sm:block text-right font-minty-script text-lg leading-tight text-[#2C1E18] rotate-6">
                  Waffle, Kahve, Çay<br />ve daha fazlası... ♡
                </div>
              </div>

              {/* Mobile Script Tagline */}
              <p className="sm:hidden font-minty-script text-lg text-[#2C1E18] mt-1">
                Tatlı bir mola, mutlu bir an! ♡ Waffle, Kahve, Çay...
              </p>

              {/* 4 Icon Features Bar (Taze Waffle | Özel Kahve | Demlik Çay | Doğal Malzemeler) */}
              <div className="mt-3 pt-2.5 border-t border-[#C8B28B]/80 grid grid-cols-4 gap-1 text-[10px] sm:text-[11px] font-bold text-[#0F3826]">
                <div className="flex items-center justify-center gap-1 border-r border-[#C8B28B]">
                  <span>🧇</span>
                  <span className="leading-tight text-left">Taze<br />Waffle</span>
                </div>
                <div className="flex items-center justify-center gap-1 border-r border-[#C8B28B]">
                  <span>☕</span>
                  <span className="leading-tight text-left">Özel<br />Kahve</span>
                </div>
                <div className="flex items-center justify-center gap-1 border-r border-[#C8B28B]">
                  <span>🍵</span>
                  <span className="leading-tight text-left">Demlik<br />Çay</span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <Leaf className="w-3.5 h-3.5 text-[#1B5E3F] shrink-0" />
                  <span className="leading-tight text-left">Doğal<br />Malzemeler</span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Customer Order Status Tracker */}
          {customerLiveOrders.length > 0 && (
            <div className="mx-4 mt-4 bg-[#FAF6EC] rounded-2xl p-3.5 shadow-sm border-2 border-[#0F3826]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#0F3826] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                  Canlı Sipariş Durumu ({selectedTable})
                </span>
                <span className="text-[11px] text-[#0F3826] font-bold">
                  Sipariş #{customerLiveOrders[0].orderNumber}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center mt-2">
                <div className={`p-2 rounded-xl text-xs font-bold border ${
                  customerLiveOrders[0].status === 'new'
                    ? 'bg-[#0F3826] border-[#0F3826] text-[#F5EFE1]'
                    : 'bg-white/70 border-[#C8B28B] text-stone-400'
                }`}>
                  1. Alındı 🔔
                </div>
                <div className={`p-2 rounded-xl text-xs font-bold border ${
                  customerLiveOrders[0].status === 'preparing'
                    ? 'bg-[#1B5E3F] border-[#0F3826] text-[#F5EFE1] shadow-sm'
                    : 'bg-white/70 border-[#C8B28B] text-stone-400'
                }`}>
                  2. Hazırlanıyor 🧇
                </div>
                <div className={`p-2 rounded-xl text-xs font-bold border ${
                  customerLiveOrders[0].status === 'completed'
                    ? 'bg-emerald-600 border-emerald-700 text-white shadow-sm'
                    : 'bg-white/70 border-[#C8B28B] text-stone-400'
                }`}>
                  3. Servis Edildi ✨
                </div>
              </div>
            </div>
          )}

          {/* Horizontal Category Filter Pills */}
          <div className="px-3 py-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar sticky top-11 bg-[#F5EFE1]/95 backdrop-blur-md z-20 border-b border-[#D7C4A3]">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 border ${
                activeCategory === 'all'
                  ? 'bg-[#0F3826] text-[#F5EFE1] border-[#0F3826] shadow'
                  : 'bg-[#FAF6EC] text-[#0F3826] border-[#C8B28B]'
              }`}
            >
              🌿 Tüm Menü
            </button>
            {CATEGORIES.map(cat => {
              const IconComp = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    if (cat.id === 'custom_waffle') {
                      setWaffleStep(1);
                      setIsWaffleModalOpen(true);
                    } else {
                      setActiveCategory(cat.id);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 border ${
                    isActive
                      ? 'bg-[#0F3826] text-[#F5EFE1] border-[#0F3826] shadow'
                      : 'bg-[#FAF6EC] text-[#0F3826] border-[#C8B28B] hover:border-[#0F3826]'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="px-4 pt-3">
            <div className="relative">
              <Search className="w-4 h-4 text-[#0F3826]/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Bardakta Waffle, Kova Waffle, Antep Rüyası, Karnaval, Kahve ara..."
                className="w-full pl-10 pr-9 py-2 bg-[#FAF6EC] rounded-full text-xs border border-[#C8B28B] text-[#0F3826] placeholder-[#0F3826]/50 focus:outline-none focus:border-[#0F3826] shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0F3826]/60"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* ==========================================================
              SECTION 1: ÖZEL MENÜ KOMBİNASYONLARI (BARDAK & KOVA FIRSATLARI)
              Matches the top dark green banner & 3 arch cards in uploaded image
              ========================================================== */}
          {(activeCategory === 'all' || activeCategory === 'combos') && (
            <div className="mx-3 mt-4 rounded-3xl bg-[#0F3826] p-3.5 sm:p-4 text-[#F5EFE1] shadow-xl border-2 border-[#1B5E3F]">
              {/* Banner Header */}
              <div className="flex flex-col sm:flex-row items-center justify-between border-b border-[#C8B28B]/30 pb-3 mb-4 gap-2 text-center sm:text-left">
                <div className="flex items-center gap-2">
                  <Leaf className="w-5 h-5 text-[#C8B28B] hidden sm:block" />
                  <div>
                    <h2 className="font-minty-serif text-xl sm:text-2xl font-extrabold tracking-wide text-[#F5EFE1]">
                      ÖZEL MENÜ KOMBİNASYONLARI
                    </h2>
                    <p className="text-xs text-[#C8B28B] tracking-widest uppercase font-semibold">
                      — Bardak & Kova Fırsatları —
                    </p>
                  </div>
                </div>
                <div className="text-[10px] uppercase tracking-wider text-[#D7C4A3] border-l border-[#C8B28B]/40 pl-3 hidden sm:block leading-tight">
                  DAHA FAZLA LEZZET<br />DAHA FAZLA MUTLULUK
                </div>
              </div>

              {/* 3 Poster-Style Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {filteredItems
                  .filter(i => i.category === 'combos')
                  .map(item => {
                    const comboVisual = getComboCardIllustration(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => openItemClick(item)}
                        className={`group rounded-2xl bg-[#F5EFE1] text-[#0F3826] border-2 border-[#C8B28B] overflow-hidden shadow-md flex flex-col justify-between transition ${
                          item.inStock
                            ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-xl'
                            : 'opacity-60 cursor-not-allowed'
                        }`}
                      >
                        {/* Top Visual Area */}
                        <div className="relative bg-gradient-to-b from-[#1B5E3F] to-[#0F3826] p-3 text-center text-[#F5EFE1] border-b-2 border-[#C8B28B]">
                          {item.badge && (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#F5EFE1] text-[#0F3826] mb-1">
                              {item.badge}
                            </span>
                          )}
                          <div className="my-1 flex items-center justify-center gap-2 text-3xl sm:text-4xl select-none">
                            <span>{item.emoji || '🧇'}</span>
                            {comboVisual && (
                              <>
                                <span className="text-lg font-black text-[#C8B28B]">+</span>
                                <span>{comboVisual.rightIcon}</span>
                              </>
                            )}
                          </div>
                          <span className="text-[10px] text-[#D7C4A3] font-minty-script text-sm">
                            minty özel sunum ♡
                          </span>
                        </div>

                        {/* Cream Body */}
                        <div className="p-3 text-center flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="font-minty-serif font-black text-sm sm:text-base uppercase tracking-tight text-[#0F3826] leading-snug">
                              {item.name}
                            </h3>
                            <p className="text-[11px] text-[#2C1E18]/80 mt-1 line-clamp-3 leading-relaxed">
                              {item.desc}
                            </p>
                          </div>

                          {/* Sketch Icon Row + Forest Green Price Pill */}
                          <div className="mt-3 pt-2 border-t border-[#C8B28B]/60">
                            <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#0F3826] mb-2">
                              <span>🌿 🧇</span>
                              <span>+</span>
                              <span>{item.id.includes('kahve') ? '☕' : '🍵'} 🌿</span>
                            </div>
                            <div className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 px-4 rounded-full bg-[#0F3826] group-hover:bg-[#1B5E3F] text-[#F5EFE1] font-minty-serif font-extrabold text-sm sm:text-base shadow border border-[#C8B28B] transition">
                              <span>{item.price} {cafeSettings.currency}</span>
                              <Plus className="w-4 h-4 text-emerald-300" />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ==========================================================
              SECTION 2: ŞEFİN İMZALI LEZZETLERİ (ÖZEL REÇETELİ HAZIR KOMBİNASYONLAR)
              Matches the bottom dark green section & 4 cards in uploaded image
              ========================================================== */}
          {(activeCategory === 'all' || activeCategory === 'signature_waffle') && (
            <div className="mx-3 mt-4 rounded-3xl bg-[#0F3826] p-3.5 sm:p-4 text-[#F5EFE1] shadow-xl border-2 border-[#1B5E3F]">
              {/* Section Banner */}
              <div className="flex flex-wrap items-center justify-between border-b border-[#C8B28B]/30 pb-3 mb-4 gap-2">
                <div className="flex items-center gap-2.5">
                  <ChefHat className="w-7 h-7 text-[#C8B28B] shrink-0" />
                  <div>
                    <h2 className="font-minty-serif text-xl sm:text-2xl font-extrabold tracking-wide text-[#F5EFE1] leading-none">
                      ŞEFİN İMZALI LEZZETLERİ
                    </h2>
                    <p className="text-xs text-[#D7C4A3] mt-1">
                      Özel Reçeteli Hazır Kombinasyonlar
                    </p>
                  </div>
                </div>
                <Leaf className="w-6 h-6 text-[#C8B28B]/70 hidden sm:block" />
              </div>

              {/* 2x2 or 4-Column Signature Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredItems
                  .filter(i => i.category === 'signature_waffle')
                  .map(item => (
                    <div
                      key={item.id}
                      onClick={() => openItemClick(item)}
                      className={`group rounded-2xl bg-[#F5EFE1] text-[#0F3826] border-2 border-[#C8B28B] p-3.5 shadow-md flex flex-col justify-between transition ${
                        item.inStock
                          ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-xl'
                          : 'opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-12 rounded-2xl bg-[#0F3826] text-[#F5EFE1] flex items-center justify-center text-2xl shrink-0 border border-[#C8B28B] shadow-sm">
                              {item.emoji || '🧇'}
                            </div>
                            <div>
                              <h3 className="font-minty-serif font-black text-base text-[#0F3826] leading-tight flex items-center gap-1">
                                <span>{item.name}</span>
                              </h3>
                              {item.badge && (
                                <span className="inline-block mt-0.5 px-2 py-0.2 rounded-full text-[10px] font-bold bg-[#0F3826]/10 text-[#0F3826]">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                          </div>
                          <Leaf className="w-4 h-4 text-[#1B5E3F] shrink-0 mt-1" />
                        </div>

                        <p className="text-xs text-[#2C1E18]/85 mt-2.5 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-[#C8B28B]/60 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#1B5E3F]">
                          {item.inStock ? 'Sıcak Kova Sunum' : 'Tükendi'}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#0F3826] group-hover:bg-[#1B5E3F] text-[#F5EFE1] font-minty-serif font-extrabold text-sm border border-[#C8B28B] shadow">
                          <span>{item.price} {cafeSettings.currency}</span>
                          <Plus className="w-3.5 h-3.5 text-emerald-300" />
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ==========================================================
              SECTION 3: KENDİ WAFFLE'INI ADIM ADIM YARAT BANNER
              ========================================================== */}
          <div className="px-3 mt-4">
            <div
              onClick={() => {
                setWaffleStep(1);
                setIsWaffleModalOpen(true);
              }}
              className="cursor-pointer group relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0F3826] via-[#1B5E3F] to-[#14452F] p-5 text-[#F5EFE1] shadow-xl border-2 border-[#C8B28B] transition-all hover:shadow-2xl active:scale-[0.99]"
            >
              <div className="relative z-10 flex items-center justify-between gap-3">
                <div>
                  <span className="inline-flex items-center gap-1 bg-[#F5EFE1] text-[#0F3826] text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full mb-2">
                    <Sparkles className="w-3 h-3 text-[#1B5E3F]" /> Minty Waffle Sihirbazı
                  </span>
                  <h2 className="font-minty-serif text-xl sm:text-2xl font-black leading-tight text-[#F5EFE1]">
                    Kendi Kova veya Bardak Waffle'ını Yarat!
                  </h2>
                  <p className="text-xs text-[#D7C4A3] mt-1 leading-relaxed">
                    İlk {waffleBuilder.baseChocolates.freeLimit} çikolata sosu, {waffleBuilder.fruits.freeLimit} taze meyve ve {waffleBuilder.toppings.freeLimit} pirinç patlağı/fıstık süslemesi fiyata dahil!
                  </p>
                  <div className="mt-3 inline-flex items-center gap-2 bg-[#F5EFE1] text-[#0F3826] px-4 py-2 rounded-full font-extrabold text-xs shadow-md border border-[#C8B28B]">
                    <span>Adım Adım Tasarla ({cafeSettings.customWaffleBasePrice} {cafeSettings.currency})</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-5xl sm:text-6xl select-none transform group-hover:scale-110 transition-transform shrink-0">
                  🪣🧇
                </div>
              </div>
            </div>
          </div>

          {/* ==========================================================
              SECTION 4: ÖZEL KAHVE, DEMLİK ÇAY, COOL LIME & TATLILAR
              ========================================================== */}
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#C8B28B] pb-2">
              <h3 className="font-minty-serif font-extrabold text-base text-[#0F3826] flex items-center gap-1.5">
                <Leaf className="w-4 h-4 text-[#1B5E3F]" />
                <span>
                  {activeCategory === 'all'
                    ? 'Özel Kahve, Demlik Çay & Tatlılar'
                    : CATEGORIES.find(c => c.id === activeCategory)?.name}
                </span>
              </h3>
              <span className="text-xs font-bold text-[#1B5E3F]">Doğal & Taze</span>
            </div>

            {filteredItems
              .filter(item =>
                activeCategory === 'all'
                  ? item.category !== 'combos' && item.category !== 'signature_waffle'
                  : item.category === activeCategory
              )
              .map(item => (
                <div
                  key={item.id}
                  onClick={() => openItemClick(item)}
                  className={`bg-[#FAF6EC] rounded-2xl p-3.5 shadow-sm border-2 border-[#C8B28B] flex items-center justify-between gap-3 transition ${
                    item.inStock
                      ? 'cursor-pointer hover:border-[#0F3826] active:scale-[0.99]'
                      : 'opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-[#0F3826] text-[#F5EFE1] border border-[#C8B28B] flex items-center justify-center text-2xl shrink-0 shadow-sm">
                      {item.emoji || '☕'}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h4 className="font-minty-serif font-extrabold text-sm sm:text-base text-[#0F3826]">
                          {item.name}
                        </h4>
                        {item.badge && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-[#0F3826]/10 text-[#0F3826] rounded-full">
                            {item.badge}
                          </span>
                        )}
                        {!item.inStock && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-700 rounded-full">
                            Tükendi
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#2C1E18]/80 mt-1 line-clamp-2 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <span className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#0F3826] text-[#F5EFE1] font-minty-serif font-extrabold text-xs sm:text-sm border border-[#C8B28B] shadow">
                      <span>{item.price} {cafeSettings.currency}</span>
                      <Plus className="w-3.5 h-3.5 text-emerald-300" />
                    </span>
                  </div>
                </div>
              ))}
          </div>

          {/* MINTY POSTER FOOTER BAR (Matching Bottom of Menu Image) */}
          <div className="mx-3 mt-4 mb-6 rounded-3xl bg-[#0F3826] text-[#F5EFE1] p-4 border-2 border-[#1B5E3F] flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-[#D7C4A3]">
              <span className="flex items-center gap-1"><Leaf className="w-3.5 h-3.5 text-emerald-400" /> Doğal Malzemeler</span>
              <span>•</span>
              <span>♡ Taze Meyveler</span>
              <span>•</span>
              <span>☕ Kaliteli Kahve</span>
              <span>•</span>
              <span>🧇 Eşsiz Lezzetler</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="font-minty-script text-xl text-[#F5EFE1]">
                Tatlı bir mola, mutlu bir an! ♡
              </div>
              <button
                onClick={() => {
                  setHideStaffTopBar(false);
                  setIsLinksModalOpen(true);
                }}
                title="Personel ve Link Yönetimi"
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-[#D7C4A3]/60 hover:text-white transition"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Floating Bottom Cart Bar */}
          {cart.length > 0 && (
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-30 no-print">
              <button
                onClick={() => setIsCartOpen(true)}
                className="w-full bg-[#0F3826] text-[#F5EFE1] p-4 rounded-2xl shadow-2xl border-2 border-[#C8B28B] flex items-center justify-between hover:bg-[#14452F] transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#F5EFE1] text-[#0F3826] font-extrabold flex items-center justify-center text-sm">
                    {cart.reduce((s, i) => s + i.quantity, 0)}
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-emerald-300 font-semibold">{selectedTable} Sipariş Sepeti</p>
                    <p className="text-sm font-bold">Siparişi Tamamla & Mutfağa Gönder</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 font-minty-serif font-black text-lg text-[#F5EFE1]">
                  <span>{cartTotal} {cafeSettings.currency}</span>
                  <ChevronRight className="w-5 h-5 text-emerald-300" />
                </div>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ====================================================================================
          VIEW 2: LIVE KITCHEN & POS ORDER PANEL
          ==================================================================================== */}
      {(viewMode === 'kitchen' || viewMode === 'cashier') && !(viewMode === 'kitchen' ? isKitchenUnlocked : isCashierUnlocked) && (
        <div className="max-w-md mx-auto mt-10 p-4 no-print">
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-stone-200 text-center">
            <Lock className="w-7 h-7 mx-auto mb-3 text-amber-800" />
            <h2 className="text-xl font-black text-stone-900">{viewMode === 'kitchen' ? 'Mutfak Girişi' : 'Kasa Girişi'}</h2>
            <p className="text-xs text-stone-500 mt-1">PIN kodunu girin.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const expected = viewMode === 'kitchen' ? (cafeSettings.kitchenPin || '2222') : (cafeSettings.cashierPin || '3333');
                if (pinInput === expected) {
                  if (viewMode === 'kitchen') setIsKitchenUnlocked(true); else setIsCashierUnlocked(true);
                  setPinError(''); setPinInput('');
                } else { setPinError('Hatalı PIN kodu!'); }
              }}
              className="mt-5 space-y-3"
            >
              <input type="password" inputMode="numeric" value={pinInput} onChange={(e) => setPinInput(e.target.value)}
                className="w-full text-center tracking-[0.5em] text-2xl font-bold border border-stone-300 rounded-xl p-3" placeholder="••••" />
              {pinError && <div className="text-xs text-red-600 font-semibold">{pinError}</div>}
              <button type="submit" className="w-full bg-[#0F3826] text-white font-bold rounded-xl p-3">Giriş</button>
            </form>
          </div>
        </div>
      )}

      {((viewMode === 'kitchen' && isKitchenUnlocked) || (viewMode === 'cashier' && isCashierUnlocked)) && (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 no-print">
          {/* Kitchen Header */}
          <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-stone-200/80 mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-stone-900">
                  {viewMode === 'kitchen' ? 'Mutfak Sipariş Ekranı' : 'Kasa Sipariş Ekranı'}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Anlık Akış
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                {viewMode === 'kitchen' ? 'Masalardan gelen siparişleri sesli bildirimle takip edin ve hazırlarken malzemelere tik atın.' : 'Gelen siparişleri, tutarları ve ödeme yöntemlerini takip edin, 80mm fiş yazdırın.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setSoundEnabled(!soundEnabled);
                  if (!soundEnabled) playOrderNotificationSound();
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
                  soundEnabled
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-stone-100 border-stone-200 text-stone-500'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-600" /> : <VolumeX className="w-4 h-4" />}
                <span>{soundEnabled ? 'Sesli Zil Açık' : 'Ses Kapalı'}</span>
              </button>

            </div>
          </div>

          {/* LIVE ORDERS KANBAN BOARD */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[
              { key: 'new', title: 'Yeni Gelen Siparişler', badgeColor: 'bg-rose-500 text-white', borderColor: 'border-rose-300' },
              { key: 'preparing', title: 'Hazırlananlar (Tezgahta)', badgeColor: 'bg-amber-500 text-stone-950', borderColor: 'border-amber-300' },
              { key: 'completed', title: 'Servis Edildi / Tamamlandı', badgeColor: 'bg-emerald-600 text-white', borderColor: 'border-emerald-300' }
            ].map(column => {
              const colOrders = orders.filter(o => o.status === column.key);
              return (
                <div key={column.key} className="bg-stone-100/90 rounded-3xl p-4 border border-stone-200/80 flex flex-col">
                  <div className="flex items-center justify-between mb-4 px-1">
                    <h2 className="font-extrabold text-sm uppercase tracking-wider text-stone-800">
                      {column.title}
                    </h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${column.badgeColor}`}>
                      {colOrders.length}
                    </span>
                  </div>

                  {colOrders.length === 0 ? (
                    <div className="py-12 text-center text-stone-400 text-xs">
                      Bu aşamada sipariş bulunmuyor.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {colOrders.map(order => (
                        <div
                          key={order.id}
                          className={`bg-white rounded-2xl p-4 shadow-sm border-2 ${column.borderColor} transition`}
                        >
                          {/* Order Card Top */}
                          <div className="flex items-start justify-between gap-2 pb-3 border-b border-stone-100">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-1 rounded-lg bg-[#1F140E] text-amber-400 font-black text-sm">
                                  {order.table}
                                </span>
                                <span className="font-bold text-xs text-stone-500">
                                  #{order.orderNumber}
                                </span>
                              </div>
                              <p className="text-xs text-stone-500 mt-1">
                                Müşteri: <strong className="text-stone-800">{order.customerName}</strong> •{' '}
                                {new Date(order.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            {viewMode === 'cashier' && (
                            <div className="text-right">
                              <span className="text-base font-black text-emerald-700">
                                {order.totalAmount} {cafeSettings.currency}
                              </span>
                              <p className="text-[10px] text-stone-500 font-medium max-w-[140px]">
                                {order.paymentMethod}
                              </p>
                            </div>
                            )}
                          </div>

                          {/* Order Items & Interactive Kitchen Checklist */}
                          <div className="py-3 space-y-3">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="bg-amber-50/50 rounded-xl p-2.5 border border-amber-200/60">
                                <div className="flex items-center justify-between font-bold text-xs text-stone-900">
                                  <span>{item.quantity}x {item.name}</span>
                                  <span>{item.unitPrice * item.quantity} ₺</span>
                                </div>

                                {item.checklistItems && item.checklistItems.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    <p className="text-[10px] font-bold uppercase text-amber-800">
                                      Hazırlık Kontrol Listesi (Dokun & İşaretle):
                                    </p>
                                    <div className="grid grid-cols-1 gap-1">
                                      {item.checklistItems.map((chk, cIdx) => {
                                        const checkKey = `${idx}-${cIdx}`;
                                        const isChecked = !!(order.checkedSteps && order.checkedSteps[checkKey]);
                                        return (
                                          <label
                                            key={checkKey}
                                            onClick={() => toggleChecklistItem(order.id, checkKey)}
                                            className={`flex items-center gap-2 px-2 py-1 rounded-lg text-xs cursor-pointer select-none transition ${
                                              isChecked
                                                ? 'bg-emerald-100/70 text-emerald-900 line-through opacity-75'
                                                : 'bg-white text-stone-800 hover:bg-amber-100/50'
                                            }`}
                                          >
                                            <input
                                              type="checkbox"
                                              checked={isChecked}
                                              onChange={() => {}}
                                              className="rounded text-emerald-600 focus:ring-0"
                                            />
                                            <span className="font-medium">{chk}</span>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {item.note && (
                                  <div className="mt-2 text-[11px] bg-rose-50 text-rose-800 px-2 py-1 rounded-lg font-semibold border border-rose-200">
                                    📌 Ürün Notu: {item.note}
                                  </div>
                                )}
                              </div>
                            ))}

                            {order.generalNote && (
                              <div className="p-2 rounded-xl bg-amber-100/80 text-amber-950 text-xs font-semibold">
                                💬 Masa Notu: {order.generalNote}
                              </div>
                            )}
                          </div>

                          {/* Action Buttons (Print 80mm & Change Status) */}
                          <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
                            {viewMode === 'cashier' ? (
                            <button
                              onClick={() => setReceiptModalOrder(order)}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition shadow-sm"
                            >
                              <Printer className="w-3.5 h-3.5 text-amber-400" />
                              <span>80mm Fiş Yazdır</span>
                            </button>
                            ) : <span />}

                            <div className="flex items-center gap-1.5">
                              {order.status === 'new' && (
                                <button
                                  onClick={() => updateOrderStatus(order.id, 'preparing')}
                                  className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#1F140E] text-xs font-extrabold transition"
                                >
                                  Hazırlamaya Başla →
                                </button>
                              )}
                              {order.status === 'preparing' && (
                                <button
                                  onClick={() => updateOrderStatus(order.id, 'completed')}
                                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold transition"
                                >
                                  Servis Edildi ✓
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ====================================================================================
          VIEW 3: SELF-SERVICE ADMIN CMS PANEL (PIN PROTECTED)
          ==================================================================================== */}
      {viewMode === 'cms' && (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 no-print">
          {!isCmsUnlocked ? (
            /* PIN LOGIN CARD */
            <div className="max-w-md mx-auto mt-10 bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-stone-200 text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-black text-stone-900">Yönetici Menü & Fiyat Paneli</h2>
              <p className="text-xs text-stone-500 mt-1">
                Fiyatları, waffle malzemelerini ve stok durumunu düzenlemek için yönetici PIN kodunu girin. (Varsayılan PIN: <strong>1234</strong>)
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (pinInput === (cafeSettings.adminPin || '1234')) {
                    setIsCmsUnlocked(true);
                    setPinError('');
                  } else {
                    setPinError('Hatalı PIN kodu! Varsayılan PIN: 1234');
                  }
                }}
                className="mt-5 space-y-3"
              >
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="PIN Kodu (1234)"
                  className="w-full text-center tracking-widest text-lg font-black py-3 rounded-2xl border-2 border-stone-300 focus:border-amber-500 focus:outline-none"
                />
                {pinError && <p className="text-xs text-rose-600 font-bold">{pinError}</p>}

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-[#1F140E] text-amber-400 font-black text-xs shadow hover:bg-stone-800 transition"
                >
                  PIN ile Giriş Yap
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPinInput('1234');
                    setIsCmsUnlocked(true);
                  }}
                  className="w-full py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Demo İçin Tek Tıkla Kilidi Aç (1234)</span>
                </button>
              </form>
            </div>
          ) : (
            /* UNLOCKED SELF-SERVICE CMS DASHBOARD */
            <div className="space-y-6">
              {/* CMS Header & Sub-Tabs */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-stone-200 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full mb-1">
                    <Unlock className="w-3 h-3" /> Yönetici Modu Aktif (Kodsuz Yönetim)
                  </span>
                  <h1 className="text-xl sm:text-2xl font-black text-stone-900">
                    Menü, Waffle Malzemesi & Fiyat Yönetimi
                  </h1>
                  <p className="text-xs text-stone-500">
                    Burada yaptığınız her değişiklik (fiyat, yeni ürün, "Tükendi" butonu) anında tüm masalardaki QR menüde güncellenir.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex bg-stone-100 p-1 rounded-2xl">
                    <button
                      onClick={() => setCmsSubTab('waffle')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${
                        cmsSubTab === 'waffle' ? 'bg-[#1F140E] text-amber-400 shadow' : 'text-stone-600'
                      }`}
                    >
                      🧇 Waffle Sihirbazı & Malzemeler
                    </button>
                    <button
                      onClick={() => setCmsSubTab('menu')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${
                        cmsSubTab === 'menu' ? 'bg-[#1F140E] text-amber-400 shadow' : 'text-stone-600'
                      }`}
                    >
                      🍰 Menü Ürünleri & Yeni Ekle
                    </button>
                    <button
                      onClick={() => setCmsSubTab('cafe')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${
                        cmsSubTab === 'cafe' ? 'bg-[#1F140E] text-amber-400 shadow' : 'text-stone-600'
                      }`}
                    >
                      ⚙️ Kafe, Wi-Fi & Fiş QR Ayarları
                    </button>
                  </div>

                  <button
                    onClick={handleResetToFactoryDefaults}
                    title="Varsayılan Menüye Sıfırla"
                    className="p-2.5 rounded-xl border border-stone-300 text-stone-600 hover:bg-stone-100 text-xs font-bold flex items-center gap-1"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span className="hidden sm:inline">Varsayılana Sıfırla</span>
                  </button>
                </div>
              </div>

              {/* ==========================================
                  CMS SUB-TAB 1: WAFFLE BUILDER & INGREDIENTS
                  ========================================== */}
              {cmsSubTab === 'waffle' && (
                <div className="space-y-6">
                  {/* Top Pricing & Limits Card */}
                  <div className="bg-white rounded-3xl p-5 shadow-sm border border-stone-200">
                    <h3 className="font-black text-base text-stone-900 mb-4 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>Waffle Taban Fiyatı, Ücretsiz Limitler & Ekstra Ücretler</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200">
                        <label className="block text-[11px] font-extrabold text-amber-950 mb-1">
                          Kendi Waffle'ını Yarat Taban Fiyatı (₺)
                        </label>
                        <input
                          type="number"
                          value={cafeSettings.customWaffleBasePrice}
                          onChange={(e) => {
                            const updated = { ...cafeSettings, customWaffleBasePrice: Number(e.target.value) };
                            setCafeSettings(updated);
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-amber-400 bg-white font-black text-sm"
                        />
                      </div>

                      <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
                        <label className="block text-[11px] font-bold text-stone-700 mb-1">
                          Taban Çikolata: Ücretsiz Limit / Ekstra (₺)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={waffleBuilder.baseChocolates.freeLimit}
                            onChange={(e) => setWaffleBuilder({
                              ...waffleBuilder,
                              baseChocolates: { ...waffleBuilder.baseChocolates, freeLimit: Number(e.target.value) }
                            })}
                            className="w-16 px-2.5 py-2 rounded-xl border border-stone-300 bg-white font-bold text-xs text-center"
                            title="Ücretsiz Seçim Adedi"
                          />
                          <span className="text-xs text-stone-500">Adet / +</span>
                          <input
                            type="number"
                            value={waffleBuilder.baseChocolates.extraPrice}
                            onChange={(e) => setWaffleBuilder({
                              ...waffleBuilder,
                              baseChocolates: { ...waffleBuilder.baseChocolates, extraPrice: Number(e.target.value) }
                            })}
                            className="w-20 px-2.5 py-2 rounded-xl border border-stone-300 bg-white font-bold text-xs"
                          />
                          <span className="text-xs font-bold">₺</span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
                        <label className="block text-[11px] font-bold text-stone-700 mb-1">
                          Meyveler: Ücretsiz Limit / Ekstra (₺)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={waffleBuilder.fruits.freeLimit}
                            onChange={(e) => setWaffleBuilder({
                              ...waffleBuilder,
                              fruits: { ...waffleBuilder.fruits, freeLimit: Number(e.target.value) }
                            })}
                            className="w-16 px-2.5 py-2 rounded-xl border border-stone-300 bg-white font-bold text-xs text-center"
                          />
                          <span className="text-xs text-stone-500">Adet / +</span>
                          <input
                            type="number"
                            value={waffleBuilder.fruits.extraPrice}
                            onChange={(e) => setWaffleBuilder({
                              ...waffleBuilder,
                              fruits: { ...waffleBuilder.fruits, extraPrice: Number(e.target.value) }
                            })}
                            className="w-20 px-2.5 py-2 rounded-xl border border-stone-300 bg-white font-bold text-xs"
                          />
                          <span className="text-xs font-bold">₺</span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
                        <label className="block text-[11px] font-bold text-stone-700 mb-1">
                          Çerez & Süs: Ücretsiz Limit / Ekstra (₺)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={waffleBuilder.toppings.freeLimit}
                            onChange={(e) => setWaffleBuilder({
                              ...waffleBuilder,
                              toppings: { ...waffleBuilder.toppings, freeLimit: Number(e.target.value) }
                            })}
                            className="w-16 px-2.5 py-2 rounded-xl border border-stone-300 bg-white font-bold text-xs text-center"
                          />
                          <span className="text-xs text-stone-500">Adet / +</span>
                          <input
                            type="number"
                            value={waffleBuilder.toppings.extraPrice}
                            onChange={(e) => setWaffleBuilder({
                              ...waffleBuilder,
                              toppings: { ...waffleBuilder.toppings, extraPrice: Number(e.target.value) }
                            })}
                            className="w-20 px-2.5 py-2 rounded-xl border border-stone-300 bg-white font-bold text-xs"
                          />
                          <span className="text-xs font-bold">₺</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => syncAllConfigToCloud(cafeSettings, waffleBuilder, menuItems)}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-2 shadow"
                      >
                        <Save className="w-4 h-4" />
                        <span>Waffle Fiyat & Limitlerini Kaydet</span>
                      </button>
                    </div>
                  </div>

                  {/* Add New Waffle Ingredient Form */}
                  <form
                    onSubmit={handleAddNewWaffleIngredient}
                    className="bg-white rounded-3xl p-5 shadow-sm border border-stone-200 flex flex-wrap items-end gap-3"
                  >
                    <div className="w-full sm:w-auto">
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">Malzeme Grubu</label>
                      <select
                        value={newIngredientGroup}
                        onChange={(e) => setNewIngredientGroup(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold bg-stone-50"
                      >
                        <option value="dough">1. Hamur & Pişirme</option>
                        <option value="baseChocolates">2. Taban Çikolatası</option>
                        <option value="fruits">3. Taze Meyveler</option>
                        <option value="toppings">4. Çerez & Süslemeler</option>
                        <option value="finishes">5. Üst Sos & Dondurma</option>
                      </select>
                    </div>

                    <div className="flex-1 min-w-[180px]">
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">Yeni Malzeme Adı</label>
                      <input
                        type="text"
                        value={newIngredientName}
                        onChange={(e) => setNewIngredientName(e.target.value)}
                        placeholder="Örn: İncir Dilimleri, Kavrulmuş Susam, Karadut Dondurma..."
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                      />
                    </div>

                    {newIngredientGroup === 'fruits' && (
                      <div className="w-20">
                        <label className="block text-[11px] font-bold text-stone-600 mb-1">Emoji</label>
                        <input
                          type="text"
                          value={newIngredientEmoji}
                          onChange={(e) => setNewIngredientEmoji(e.target.value)}
                          className="w-full px-2 py-2 rounded-xl border border-stone-300 text-xs text-center"
                        />
                      </div>
                    )}

                    {(newIngredientGroup === 'dough' || newIngredientGroup === 'finishes') && (
                      <div className="w-28">
                        <label className="block text-[11px] font-bold text-stone-600 mb-1">Ek Ücret (₺)</label>
                        <input
                          type="number"
                          value={newIngredientPrice}
                          onChange={(e) => setNewIngredientPrice(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold"
                        />
                      </div>
                    )}

                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-[#1F140E] text-amber-400 font-extrabold text-xs flex items-center gap-1.5 h-[36px]"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Malzeme Ekle</span>
                    </button>
                  </form>

                  {/* Ingredient Stock & Price Lists */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {/* Group: Base Chocolates */}
                    <div className="bg-white rounded-3xl p-4 shadow-sm border border-stone-200">
                      <h4 className="font-black text-xs uppercase tracking-wider text-stone-700 mb-3">
                        2. Taban Çikolataları ({waffleBuilder.baseChocolates.items.length})
                      </h4>
                      <div className="space-y-2">
                        {waffleBuilder.baseChocolates.items.map(item => (
                          <div key={item.id} className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-200/70">
                            <span className={`text-xs font-bold ${!item.inStock ? 'line-through text-stone-400' : 'text-stone-800'}`}>
                              {item.name}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => toggleWaffleIngredientStock('baseChocolates', item.id)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition ${
                                  item.inStock ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {item.inStock ? 'Stokta' : 'Tükendi'}
                              </button>
                              <button
                                onClick={() => deleteWaffleIngredient('baseChocolates', item.id)}
                                className="p-1 text-stone-400 hover:text-rose-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Group: Fresh Fruits */}
                    <div className="bg-white rounded-3xl p-4 shadow-sm border border-stone-200">
                      <h4 className="font-black text-xs uppercase tracking-wider text-stone-700 mb-3">
                        3. Taze Meyveler ({waffleBuilder.fruits.items.length})
                      </h4>
                      <div className="space-y-2">
                        {waffleBuilder.fruits.items.map(item => (
                          <div key={item.id} className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-200/70">
                            <span className={`text-xs font-bold ${!item.inStock ? 'line-through text-stone-400' : 'text-stone-800'}`}>
                              {item.emoji} {item.name}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => toggleWaffleIngredientStock('fruits', item.id)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition ${
                                  item.inStock ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {item.inStock ? 'Stokta' : 'Tükendi'}
                              </button>
                              <button
                                onClick={() => deleteWaffleIngredient('fruits', item.id)}
                                className="p-1 text-stone-400 hover:text-rose-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Group: Toppings & Nuts */}
                    <div className="bg-white rounded-3xl p-4 shadow-sm border border-stone-200">
                      <h4 className="font-black text-xs uppercase tracking-wider text-stone-700 mb-3">
                        4. Çerez & Süslemeler ({waffleBuilder.toppings.items.length})
                      </h4>
                      <div className="space-y-2">
                        {waffleBuilder.toppings.items.map(item => (
                          <div key={item.id} className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-200/70">
                            <span className={`text-xs font-bold ${!item.inStock ? 'line-through text-stone-400' : 'text-stone-800'}`}>
                              {item.name}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => toggleWaffleIngredientStock('toppings', item.id)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition ${
                                  item.inStock ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {item.inStock ? 'Stokta' : 'Tükendi'}
                              </button>
                              <button
                                onClick={() => deleteWaffleIngredient('toppings', item.id)}
                                className="p-1 text-stone-400 hover:text-rose-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Group: Doughs */}
                    <div className="bg-white rounded-3xl p-4 shadow-sm border border-stone-200">
                      <h4 className="font-black text-xs uppercase tracking-wider text-stone-700 mb-3">
                        1. Hamur Seçenekleri ({waffleBuilder.dough.length})
                      </h4>
                      <div className="space-y-2">
                        {waffleBuilder.dough.map((item, idx) => (
                          <div key={item.id} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-stone-50 border border-stone-200/70">
                            <span className={`text-xs font-bold flex-1 ${!item.inStock ? 'line-through text-stone-400' : 'text-stone-800'}`}>
                              {item.name}
                            </span>
                            <input
                              type="number"
                              value={item.price}
                              onChange={(e) => {
                                const updated = { ...waffleBuilder };
                                updated.dough[idx].price = Number(e.target.value);
                                setWaffleBuilder(updated);
                              }}
                              onBlur={() => syncAllConfigToCloud(cafeSettings, waffleBuilder, menuItems, null)}
                              className="w-14 px-1.5 py-1 rounded border border-stone-300 text-xs font-bold text-right bg-white"
                            />
                            <span className="text-[10px] font-bold">₺</span>
                            <button
                              onClick={() => toggleWaffleIngredientStock('dough', item.id)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-extrabold ${
                                item.inStock ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {item.inStock ? 'Açık' : 'Tükendi'}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Group: Top Sauces & Ice Cream */}
                    <div className="bg-white rounded-3xl p-4 shadow-sm border border-stone-200 md:col-span-2">
                      <h4 className="font-black text-xs uppercase tracking-wider text-stone-700 mb-3">
                        5. Üst Soslar & Maraş Dondurması ({waffleBuilder.finishes.length})
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {waffleBuilder.finishes.map((item, idx) => (
                          <div key={item.id} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-stone-50 border border-stone-200/70">
                            <span className={`text-xs font-bold flex-1 ${!item.inStock ? 'line-through text-stone-400' : 'text-stone-800'}`}>
                              {item.name}
                            </span>
                            <input
                              type="number"
                              value={item.price}
                              onChange={(e) => {
                                const updated = { ...waffleBuilder };
                                updated.finishes[idx].price = Number(e.target.value);
                                setWaffleBuilder(updated);
                              }}
                              onBlur={() => syncAllConfigToCloud(cafeSettings, waffleBuilder, menuItems, null)}
                              className="w-16 px-2 py-1 rounded border border-stone-300 text-xs font-bold text-right bg-white"
                            />
                            <span className="text-[10px] font-bold">₺</span>
                            <button
                              onClick={() => toggleWaffleIngredientStock('finishes', item.id)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold ${
                                item.inStock ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {item.inStock ? 'Stokta' : 'Tükendi'}
                            </button>
                            <button
                              onClick={() => deleteWaffleIngredient('finishes', item.id)}
                              className="p-1 text-stone-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ==========================================
                  CMS SUB-TAB 2: MENU ITEMS & ADD NEW PRODUCT
                  ========================================== */}
              {cmsSubTab === 'menu' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Add New Product Form */}
                  <form
                    onSubmit={handleAddNewMenuProduct}
                    className="bg-white rounded-3xl p-5 shadow-sm border border-stone-200 h-fit space-y-3"
                  >
                    <h3 className="font-black text-base text-stone-900 flex items-center gap-2">
                      <PlusCircle className="w-4 h-4 text-amber-600" />
                      <span>Menüye Yeni Ürün Ekle</span>
                    </h3>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Ürün Adı</label>
                      <input
                        type="text"
                        required
                        value={newMenuItem.name}
                        onChange={(e) => setNewMenuItem({ ...newMenuItem, name: e.target.value })}
                        placeholder="Örn: Tiramisu, Matcha Latte..."
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-semibold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">Kategori</label>
                        <select
                          value={newMenuItem.category}
                          onChange={(e) => setNewMenuItem({ ...newMenuItem, category: e.target.value })}
                          className="w-full px-2.5 py-2 rounded-xl border border-stone-300 text-xs font-bold bg-stone-50"
                        >
                          <option value="combos">Özel Menü Kombinasyonları (Bardak/Kova)</option>
                          <option value="signature_waffle">Şefin İmzalı Lezzetleri</option>
                          <option value="hot_drinks">Özel Kahve & Demlik Çay</option>
                          <option value="cold_drinks">Cool Lime & Soğuklar</option>
                          <option value="desserts">Dünya Tatlıları</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">Fiyat (TL)</label>
                        <input
                          type="number"
                          required
                          value={newMenuItem.price}
                          onChange={(e) => setNewMenuItem({ ...newMenuItem, price: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">İkon / Emoji</label>
                        <input
                          type="text"
                          value={newMenuItem.emoji}
                          onChange={(e) => setNewMenuItem({ ...newMenuItem, emoji: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">Etiket (İsteğe Bağlı)</label>
                        <input
                          type="text"
                          value={newMenuItem.badge}
                          onChange={(e) => setNewMenuItem({ ...newMenuItem, badge: e.target.value })}
                          placeholder="Yeni / Popüler"
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Ürün Açıklaması</label>
                      <textarea
                        rows={2}
                        value={newMenuItem.desc}
                        onChange={(e) => setNewMenuItem({ ...newMenuItem, desc: e.target.value })}
                        placeholder="İçindekiler ve sunum detayı..."
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-[#1F140E] text-amber-400 font-black text-xs shadow hover:bg-stone-800 transition"
                    >
                      + Ürünü Menüye Ekle
                    </button>
                  </form>

                  {/* Existing Menu Products List */}
                  <div className="lg:col-span-2 bg-white rounded-3xl p-5 shadow-sm border border-stone-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-black text-base text-stone-900">
                        Mevcut Menü Ürünleri ({menuItems.length})
                      </h3>
                      <button
                        onClick={() => syncAllConfigToCloud(cafeSettings, waffleBuilder, menuItems)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                      >
                        <Save className="w-3.5 h-3.5" /> Tüm Fiyatları Kaydet
                      </button>
                    </div>

                    <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                      {menuItems.map((item, idx) => (
                        <div
                          key={item.id}
                          className="p-3 rounded-2xl border border-stone-200 bg-stone-50/60 flex flex-wrap items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5 flex-1 min-w-[200px]">
                            <span className="text-2xl">{item.emoji}</span>
                            <div className="flex-1">
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => {
                                  const updated = [...menuItems];
                                  updated[idx] = { ...item, name: e.target.value };
                                  setMenuItems(updated);
                                }}
                                className="font-bold text-xs text-stone-900 bg-transparent border-b border-transparent focus:border-amber-500 focus:bg-white px-1 py-0.5 rounded w-full"
                              />
                              <input
                                type="text"
                                value={item.desc}
                                onChange={(e) => {
                                  const updated = [...menuItems];
                                  updated[idx] = { ...item, desc: e.target.value };
                                  setMenuItems(updated);
                                }}
                                className="text-[11px] text-stone-500 bg-transparent border-b border-transparent focus:border-amber-500 focus:bg-white px-1 py-0.5 rounded w-full mt-0.5"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={item.price}
                                onChange={(e) => {
                                  const updated = [...menuItems];
                                  updated[idx] = { ...item, price: Number(e.target.value) };
                                  setMenuItems(updated);
                                }}
                                className="w-20 px-2.5 py-1.5 rounded-xl border border-stone-300 text-xs font-black text-right bg-white"
                              />
                              <span className="text-xs font-bold text-stone-600">₺</span>
                            </div>

                            <button
                              onClick={() => {
                                const updated = [...menuItems];
                                updated[idx] = { ...item, inStock: !item.inStock };
                                syncAllConfigToCloud(cafeSettings, waffleBuilder, updated, "Stok durumu güncellendi!");
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${
                                item.inStock ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {item.inStock ? 'Stokta' : 'Tükendi'}
                            </button>

                            <button
                              onClick={() => deleteMenuProduct(item.id)}
                              className="p-1.5 text-stone-400 hover:text-rose-600"
                              title="Ürünü Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ==========================================
                  CMS SUB-TAB 3: CAFE, WI-FI & RECEIPT QR SETTINGS
                  ========================================== */}
              {cmsSubTab === 'cafe' && (
                <div className="max-w-2xl bg-white rounded-3xl p-6 shadow-sm border border-stone-200 space-y-4">
                  <h3 className="font-black text-base text-stone-900">
                    Kafe Bilgileri, Wi-Fi & 80mm Fiş Altı Google Yorum QR Ayarları
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Kafe Adı</label>
                      <input
                        type="text"
                        value={cafeSettings.cafeName}
                        onChange={(e) => setCafeSettings({ ...cafeSettings, cafeName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Müşteri Wi-Fi Şifresi</label>
                      <input
                        type="text"
                        value={cafeSettings.wifiPass}
                        onChange={(e) => setCafeSettings({ ...cafeSettings, wifiPass: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Alt Başlık / Slogan</label>
                    <input
                      type="text"
                      value={cafeSettings.slogan}
                      onChange={(e) => setCafeSettings({ ...cafeSettings, slogan: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">WhatsApp Sipariş Numarası</label>
                      <input
                        type="text"
                        value={cafeSettings.whatsappNumber}
                        onChange={(e) => setCafeSettings({ ...cafeSettings, whatsappNumber: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Yönetici PIN Kodu</label>
                      <input
                        type="text"
                        value={cafeSettings.adminPin}
                        onChange={(e) => setCafeSettings({ ...cafeSettings, adminPin: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Mutfak PIN Kodu</label>
                      <input
                        type="text"
                        value={cafeSettings.kitchenPin || '2222'}
                        onChange={(e) => setCafeSettings({ ...cafeSettings, kitchenPin: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Kasa PIN Kodu</label>
                      <input
                        type="text"
                        value={cafeSettings.cashierPin || '3333'}
                        onChange={(e) => setCafeSettings({ ...cafeSettings, cashierPin: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      80mm Fiş Altı Google İşletme Yorum Linki (Otomatik QR Koda Dönüşür)
                    </label>
                    <input
                      type="text"
                      value={cafeSettings.googleReviewUrl}
                      onChange={(e) => setCafeSettings({ ...cafeSettings, googleReviewUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                    />
                  </div>

                  <button
                    onClick={() => syncAllConfigToCloud(cafeSettings, waffleBuilder, menuItems)}
                    className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow"
                  >
                    <Save className="w-4 h-4" />
                    <span>Kafe Ayarlarını Kaydet & Yayınla</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ====================================================================================
          MODAL 1: INTERACTIVE 5-STEP CUSTOM WAFFLE BUILDER ("KENDİ WAFFLE'INI YARAT")
          ==================================================================================== */}
      {isWaffleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 no-print">
          <div className="bg-[#F5EFE1] w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border-2 border-[#C8B28B] animate-slideUp">
            {/* Modal Header */}
            <div className="bg-[#0F3826] text-[#F5EFE1] p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-emerald-300 font-bold">
                  Adım {waffleStep} / 5 • Minty Waffle Atölyesi
                </span>
                <h3 className="font-minty-serif text-lg font-black text-[#F5EFE1]">
                  Kendi Kova / Bardak Waffle'ını Yarat 🧇
                </h3>
              </div>
              <button
                onClick={() => setIsWaffleModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[#F5EFE1] hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step Progress Bar */}
            <div className="grid grid-cols-5 gap-1 p-2 bg-[#0A2619]">
              {[
                { s: 1, label: '1. Kova/Bardak' },
                { s: 2, label: '2. Soslar' },
                { s: 3, label: '3. Meyveler' },
                { s: 4, label: '4. Patlak/Fıstık' },
                { s: 5, label: '5. Ekstralar' }
              ].map(st => (
                <button
                  key={st.s}
                  onClick={() => setWaffleStep(st.s)}
                  className={`py-1.5 rounded-lg text-[10px] font-bold transition ${
                    waffleStep === st.s
                      ? 'bg-[#F5EFE1] text-[#0F3826]'
                      : waffleStep > st.s
                      ? 'bg-emerald-800/60 text-emerald-200'
                      : 'bg-white/5 text-stone-400'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* Modal Step Content */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              {/* STEP 1: DOUGH / SUNUM TİPİ */}
              {waffleStep === 1 && (
                <div>
                  <h4 className="font-extrabold text-sm text-[#0F3826] mb-1">
                    1. Sunum & Hamur Tercihiniz (Kova / Bardak / Tabak)
                  </h4>
                  <p className="text-xs text-stone-600 mb-3">
                    Waffle'ınızı Kova'da, Bardak'ta veya Klasik Tabakta seçebilirsiniz.
                  </p>
                  <div className="space-y-2.5">
                    {waffleBuilder.dough.map(d => {
                      const selected = waffleDoughId === d.id;
                      return (
                        <div
                          key={d.id}
                          onClick={() => d.inStock && setWaffleDoughId(d.id)}
                          className={`p-3.5 rounded-2xl border-2 transition flex items-center justify-between ${
                            !d.inStock
                              ? 'opacity-50 bg-stone-100 border-stone-200 cursor-not-allowed'
                              : selected
                              ? 'border-[#0F3826] bg-emerald-950/10 cursor-pointer'
                              : 'border-[#C8B28B] bg-white hover:border-[#0F3826] cursor-pointer'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-sm text-[#0F3826]">{d.name}</p>
                              {!d.inStock && (
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-700 rounded-full">
                                  Tükendi
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-stone-600">{d.desc}</p>
                          </div>
                          <span className="text-xs font-extrabold text-[#0F3826] shrink-0 ml-2">
                            {d.price === 0 ? 'Standart' : d.price > 0 ? `+${d.price} TL` : `${d.price} TL`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 2: BASE CHOCOLATES */}
              {waffleStep === 2 && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-extrabold text-sm text-stone-900">
                      2. Taban Çikolatası & Krema Seçimi
                    </h4>
                    <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                      İlk {waffleBuilder.baseChocolates.freeLimit} Seçim Ücretsiz
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mb-3">
                    Ekstra her çikolata seçimi +{waffleBuilder.baseChocolates.extraPrice}₺ olarak eklenir.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {waffleBuilder.baseChocolates.items.map(choc => {
                      const isSel = waffleChocolates.includes(choc.id) && choc.inStock;
                      return (
                        <div
                          key={choc.id}
                          onClick={() => toggleMultiSelect(choc.id, choc.inStock, waffleChocolates, setWaffleChocolates)}
                          className={`p-3 rounded-2xl border-2 flex items-center gap-3 transition ${
                            !choc.inStock
                              ? 'opacity-50 bg-stone-100 border-stone-200 cursor-not-allowed'
                              : isSel
                              ? 'border-amber-500 bg-amber-50 cursor-pointer'
                              : 'border-stone-200 bg-white cursor-pointer'
                          }`}
                        >
                          <span
                            className="w-6 h-6 rounded-full border border-black/20 shrink-0"
                            style={{ backgroundColor: choc.color || '#5c3a21' }}
                          />
                          <div className="flex-1">
                            <span className="text-xs font-bold text-stone-900 block">{choc.name}</span>
                            {!choc.inStock && <span className="text-[10px] font-bold text-rose-600">Tükendi</span>}
                          </div>
                          {isSel && <Check className="w-4 h-4 text-amber-600 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 3: FRESH FRUITS */}
              {waffleStep === 3 && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-extrabold text-sm text-stone-900">
                      3. Taze Meyvelerini Seç
                    </h4>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      İlk {waffleBuilder.fruits.freeLimit} Meyve Ücretsiz
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mb-3">
                    İlk {waffleBuilder.fruits.freeLimit} meyve fiyata dahil, ekstra meyve +{waffleBuilder.fruits.extraPrice}₺.
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {waffleBuilder.fruits.items.map(fr => {
                      const isSel = waffleFruits.includes(fr.id) && fr.inStock;
                      return (
                        <div
                          key={fr.id}
                          onClick={() => toggleMultiSelect(fr.id, fr.inStock, waffleFruits, setWaffleFruits)}
                          className={`p-3 rounded-2xl border-2 flex items-center gap-2.5 transition ${
                            !fr.inStock
                              ? 'opacity-50 bg-stone-100 border-stone-200 cursor-not-allowed'
                              : isSel
                              ? 'border-emerald-500 bg-emerald-50/60 cursor-pointer'
                              : 'border-stone-200 bg-white cursor-pointer'
                          }`}
                        >
                          <span className="text-2xl">{fr.emoji || '🍓'}</span>
                          <div className="flex-1">
                            <span className="text-xs font-bold text-stone-900 block">{fr.name}</span>
                            {!fr.inStock && <span className="text-[10px] font-bold text-rose-600">Tükendi</span>}
                          </div>
                          {isSel && <Check className="w-4 h-4 text-emerald-600" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 4: TOPPINGS & NUTS */}
              {waffleStep === 4 && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-extrabold text-sm text-stone-900">
                      4. Çerez, Bisküvi & Süslemeler
                    </h4>
                    <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                      İlk {waffleBuilder.toppings.freeLimit} Seçim Ücretsiz
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mb-3">
                    Çıtırlık katacak kuruyemiş ve bisküviler (Ekstra seçim +{waffleBuilder.toppings.extraPrice}₺).
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {waffleBuilder.toppings.items.map(top => {
                      const isSel = waffleToppings.includes(top.id) && top.inStock;
                      return (
                        <div
                          key={top.id}
                          onClick={() => toggleMultiSelect(top.id, top.inStock, waffleToppings, setWaffleToppings)}
                          className={`p-3 rounded-2xl border-2 flex items-center justify-between transition ${
                            !top.inStock
                              ? 'opacity-50 bg-stone-100 border-stone-200 cursor-not-allowed'
                              : isSel
                              ? 'border-amber-500 bg-amber-50 cursor-pointer'
                              : 'border-stone-200 bg-white cursor-pointer'
                          }`}
                        >
                          <div>
                            <span className="text-xs font-bold text-stone-800 block">{top.name}</span>
                            {!top.inStock && <span className="text-[10px] font-bold text-rose-600">Tükendi</span>}
                          </div>
                          {isSel && <Check className="w-4 h-4 text-amber-600 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 5: FINISHES, ICE CREAM & NOTE */}
              {waffleStep === 5 && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-extrabold text-sm text-stone-900 mb-1">
                      5. Üst Soslar & Kesme Maraş Dondurması
                    </h4>
                    <p className="text-xs text-stone-500 mb-3">
                      Waffle'ınızı taçlandıracak son dokunuşları seçin.
                    </p>
                    <div className="space-y-2">
                      {waffleBuilder.finishes.map(fin => {
                        const isSel = waffleFinishes.includes(fin.id) && fin.inStock;
                        return (
                          <div
                            key={fin.id}
                            onClick={() => toggleMultiSelect(fin.id, fin.inStock, waffleFinishes, setWaffleFinishes)}
                            className={`p-3 rounded-2xl border-2 flex items-center justify-between transition ${
                              !fin.inStock
                                ? 'opacity-50 bg-stone-100 border-stone-200 cursor-not-allowed'
                                : isSel
                                ? 'border-amber-500 bg-amber-50 cursor-pointer'
                                : 'border-stone-200 bg-white cursor-pointer'
                            }`}
                          >
                            <div>
                              <span className="text-xs font-bold text-stone-900">{fin.name}</span>
                              {!fin.inStock && <span className="ml-2 text-[10px] font-bold text-rose-600">(Tükendi)</span>}
                            </div>
                            <span className="text-xs font-extrabold text-amber-800">
                              {fin.price === 0 ? 'Ücretsiz' : `+${fin.price} ₺`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      Ustaya Özel Notunuz (İsteğe Bağlı)
                    </label>
                    <input
                      type="text"
                      value={waffleNote}
                      onChange={(e) => setWaffleNote(e.target.value)}
                      placeholder="Örn: Çikolatası bol olsun, dondurma ayrı kapta gelsin..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-300 text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Live Summary Box inside Builder */}
              <div className="bg-amber-100/70 rounded-2xl p-3 border border-amber-300/80 text-xs space-y-1">
                <p className="font-extrabold text-amber-950">Seçimlerinizin Özeti:</p>
                {customWaffleCalculation.breakdown.map((line, i) => (
                  <p key={i} className="text-stone-700">• {line}</p>
                ))}
              </div>
            </div>

            {/* Modal Footer Navigation */}
            <div className="p-4 bg-white border-t border-[#C8B28B] flex items-center justify-between gap-3">
              {waffleStep > 1 ? (
                <button
                  onClick={() => setWaffleStep(waffleStep - 1)}
                  className="px-4 py-3 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Geri
                </button>
              ) : (
                <div />
              )}

              {waffleStep < 5 ? (
                <button
                  onClick={() => setWaffleStep(waffleStep + 1)}
                  className="flex-1 py-3.5 px-5 rounded-xl bg-[#0F3826] text-[#F5EFE1] font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg"
                >
                  <span>Sonraki Adım ({customWaffleCalculation.totalPrice} TL)</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleAddCustomWaffleToCart}
                  className="flex-1 py-3.5 px-5 rounded-xl bg-[#1B5E3F] hover:bg-[#0F3826] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Waffle'ı Sepete Ekle ({customWaffleCalculation.totalPrice} TL)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================================
          MODAL 2: BEVERAGE / DESSERT CUSTOMIZATION MODAL
          ==================================================================================== */}
      {customizingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 no-print">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl animate-slideUp">
            <div className="flex items-start justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{customizingItem.emoji}</span>
                <div>
                  <h3 className="font-black text-base text-stone-900">{customizingItem.name}</h3>
                  <p className="text-xs text-amber-800 font-bold">{customizingItem.price} ₺</p>
                </div>
              </div>
              <button
                onClick={() => setCustomizingItem(null)}
                className="p-1.5 rounded-full bg-stone-100 text-stone-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {customizingItem.hasDrinkCustomization && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-extrabold text-stone-800 mb-1.5">Boy Seçimi</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Orta Boy (Regular)', 'Büyük Boy (Large) (+20₺)'].map(sz => (
                      <button
                        key={sz}
                        onClick={() => setDrinkSize(sz)}
                        className={`p-2.5 rounded-xl text-xs font-bold border-2 transition ${
                          drinkSize === sz ? 'border-amber-500 bg-amber-50 text-amber-950' : 'border-stone-200 text-stone-700'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                {customizingItem.category === 'cold_drinks' && (
                  <div>
                    <label className="block text-xs font-extrabold text-stone-800 mb-1.5">Buz Oranı Seçimi</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Normal Buzlu', 'Az Buzlu', 'Bol Buzlu'].map(ice => (
                        <button
                          key={ice}
                          onClick={() => setDrinkIce(ice)}
                          className={`p-2 rounded-xl text-xs font-bold border transition ${
                            drinkIce === ice ? 'border-amber-500 bg-amber-50 text-amber-950' : 'border-stone-200 text-stone-600'
                          }`}
                        >
                          {ice}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-extrabold text-stone-800 mb-1.5">Ekstra Seçenekler</label>
                  <div className="space-y-1.5">
                    {[
                      { name: 'Ekstra Fo Lime Özü & Taze Nane', price: 15 },
                      { name: 'Yulaf Sütü / Badem Sütü Tercihi', price: 25 },
                      { name: 'Ekstra Espresso Shot', price: 25 },
                      { name: 'Vanilya / Karamel Şurubu', price: 15 }
                    ].map(ext => {
                      const isAdded = drinkExtras.some(e => e.name === ext.name);
                      return (
                        <div
                          key={ext.name}
                          onClick={() => {
                            if (isAdded) {
                              setDrinkExtras(drinkExtras.filter(e => e.name !== ext.name));
                            } else {
                              setDrinkExtras([...drinkExtras, ext]);
                            }
                          }}
                          className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between cursor-pointer ${
                            isAdded ? 'border-amber-500 bg-amber-50' : 'border-stone-200'
                          }`}
                        >
                          <span>{ext.name}</span>
                          <span className="font-bold text-amber-800">+{ext.price} ₺</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {customizingItem.customOptions && (
              <div>
                <label className="block text-xs font-extrabold text-stone-800 mb-1.5">Sunum / Tat Tercihiniz</label>
                <div className="space-y-2">
                  {customizingItem.customOptions.map(opt => (
                    <button
                      key={opt.name}
                      onClick={() => setSelectedSubOption(opt.name)}
                      className={`w-full p-3 rounded-xl text-xs font-bold border-2 flex items-center justify-between ${
                        selectedSubOption === opt.name ? 'border-amber-500 bg-amber-50' : 'border-stone-200'
                      }`}
                    >
                      <span>{opt.name}</span>
                      <span>{opt.price > 0 ? `+${opt.price} ₺` : 'Ücretsiz'}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Notunuz (İsteğe Bağlı)</label>
              <input
                type="text"
                value={itemCustomNote}
                onChange={(e) => setItemCustomNote(e.target.value)}
                placeholder="Örn: Çok sıcak olmasın, tarçını bol olsun..."
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
              />
            </div>

            <button
              onClick={handleConfirmCustomizedItem}
              className="w-full py-3.5 rounded-2xl bg-[#1F140E] text-amber-400 font-black text-xs shadow-lg hover:bg-stone-800 transition"
            >
              Sepete Ekle
            </button>
          </div>
        </div>
      )}

      {/* ====================================================================================
          MODAL 3: CART & CHECKOUT DRAWER
          ==================================================================================== */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 no-print">
          <div className="bg-[#FAF6F0] w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="bg-[#1F140E] text-white p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">
                  {selectedTable} • Sipariş Özeti
                </span>
                <h3 className="text-lg font-black">Sepetiniz ({cart.length} Kalem)</h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {cart.map(item => (
                <div key={item.cartId} className="bg-white p-3.5 rounded-2xl shadow-sm border border-stone-200/80">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-extrabold text-sm text-stone-900">{item.name}</h4>
                      {item.details && item.details.length > 0 && (
                        <ul className="mt-1 space-y-0.5 text-[11px] text-stone-600">
                          {item.details.map((d, idx) => (
                            <li key={idx}>• {d}</li>
                          ))}
                        </ul>
                      )}
                      {item.note && (
                        <p className="text-[11px] text-amber-800 font-semibold mt-1">Not: {item.note}</p>
                      )}
                    </div>
                    <span className="font-black text-sm text-amber-900 shrink-0">
                      {item.unitPrice * item.quantity} ₺
                    </span>
                  </div>

                  <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => updateCartQuantity(item.cartId, -1)}
                      className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center text-stone-700"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-bold w-5 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateCartQuantity(item.cartId, 1)}
                      className="w-7 h-7 rounded-lg bg-amber-500 text-[#1F140E] flex items-center justify-center"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Customer Info & Payment Preference */}
              <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">Masa / Konum</label>
                    <select
                      value={selectedTable}
                      onChange={(e) => setSelectedTable(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold bg-amber-50/50"
                    >
                      {TABLES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">İsminiz (İsteğe Bağlı)</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Örn: Ahmet"
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1.5">Ödeme Tercihiniz</label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {[
                      { id: 'Masada / Kasada Temassız Kart veya NFC ile Ödeme', icon: CreditCard },
                      { id: 'Masada / Kasada Nakit Ödeme', icon: Banknote }
                    ].map(pm => {
                      const PIcon = pm.icon;
                      return (
                        <button
                          key={pm.id}
                          onClick={() => setPaymentMethod(pm.id)}
                          className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition ${
                            paymentMethod === pm.id
                              ? 'border-amber-500 bg-amber-50 text-amber-950'
                              : 'border-stone-200 text-stone-600'
                          }`}
                        >
                          <PIcon className="w-4 h-4 text-amber-600 shrink-0" />
                          <span className="text-left">{pm.id}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">Genel Sipariş Notu</label>
                  <input
                    type="text"
                    value={generalOrderNote}
                    onChange={(e) => setGeneralOrderNote(e.target.value)}
                    placeholder="Örn: Kahveler waffle ile aynı anda gelsin..."
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Checkout Submit Buttons */}
            <div className="p-4 bg-white border-t border-stone-200 space-y-2">
              <div className="flex items-center justify-between text-base font-black text-stone-900 mb-2">
                <span>Toplam Tutar ({selectedTable})</span>
                <span className="text-xl text-amber-800">{cartTotal} {cafeSettings.currency}</span>
              </div>

              <button
                onClick={() => submitOrderToKitchen(false)}
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg transition"
              >
                <Send className="w-4 h-4" />
                <span>Siparişi Doğrudan Mutfağa Gönder</span>
              </button>

              <button
                onClick={() => submitOrderToKitchen(true)}
                className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Mutfağa Kaydet + WhatsApp Fişi Olarak Gönder</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================================
          MODAL 4: TABLE QR CODES GENERATOR MODAL
          ==================================================================================== */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-3xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200 mb-4">
              <div>
                <h3 className="text-lg font-black text-stone-900">Masa QR Kod Üretici (Masa 1 - 15)</h3>
                <p className="text-xs text-stone-500">
                  Müşteri masadaki QR kodu okuttuğunda üstteki yönetici barı gizlenir ve otomatik olarak o masa (`?view=menu&masa=Masa%205`) seçilir.
                </p>
              </div>
              <button
                onClick={() => setIsQrModalOpen(false)}
                className="p-2 rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {TABLES.map(tbl => {
                const fullTableUrl = `${baseAppUrl}?view=menu&masa=${encodeURIComponent(tbl)}`;
                const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(fullTableUrl)}`;
                return (
                  <div key={tbl} className="border-2 border-[#C8B28B] rounded-2xl p-3.5 text-center flex flex-col items-center bg-[#F5EFE1]">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#0F3826]">
                      {cafeSettings.cafeName}
                    </span>
                    <span className="text-sm font-minty-serif font-black text-[#0F3826] mt-0.5 mb-2">
                      {tbl}
                    </span>
                    <img
                      src={qrImgUrl}
                      alt={tbl}
                      className="w-28 h-28 rounded-xl border border-[#C8B28B] bg-white p-1.5"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(fullTableUrl);
                        showToast(`${tbl} QR Menü linki kopyalandı!`);
                      }}
                      className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0F3826] text-[#F5EFE1] text-[10px] font-bold"
                    >
                      <Copy className="w-3 h-3" /> Linki Kopyala
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================================
          MODAL 4B: DEDICATED LIVE LINKS & MULTI-DEVICE SETUP CENTER
          ==================================================================================== */}
      {isLinksModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border-2 border-[#0F3826]">
            <div className="flex items-start justify-between pb-4 border-b border-stone-200 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#0F3826] text-[#F5EFE1] flex items-center justify-center shrink-0">
                  <Link2 className="w-6 h-6 text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-stone-900">
                    Minty Waffle & Cafe — Canlı Sistem Linkleri
                  </h3>
                  <p className="text-xs text-stone-500">
                    Müşteri Masaları, Mutfak/Kasa Tableti ve Yönetici Telefonu için özel bağlantılarınız:
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsLinksModalOpen(false)}
                className="p-2 rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Optional Custom Domain Input */}
            <div className="mb-5 p-3.5 rounded-2xl bg-[#F5EFE1] border border-[#C8B28B]">
              <label className="block text-xs font-extrabold text-[#0F3826] mb-1">
                Sistemi Yayınladığınız Ana Adres (Vercel / Netlify veya Kendi Alan Adınız):
              </label>
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                <input
                  type="text"
                  value={customDomainInput}
                  onChange={(e) => setCustomDomainInput(e.target.value)}
                  placeholder={baseAppUrl}
                  className="flex-1 px-3 py-2 rounded-xl border border-[#C8B28B] bg-white text-xs font-mono text-[#0F3826]"
                />
                <span className="text-[11px] text-[#1B5E3F] font-semibold">
                  Linkler ve QR kodlar otomatik bu adrese göre üretilir.
                </span>
              </div>
            </div>

            {/* 3 DISTINCT SYSTEM LINKS */}
            <div className="space-y-4">
              {/* 1. CUSTOMER QR MENU LINK */}
              <div className="p-4 rounded-2xl border-2 border-emerald-600/30 bg-emerald-50/40">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-[#0F3826]" />
                    <span className="font-black text-sm text-[#0F3826]">
                      1. Müşteri Masa QR Menü Linki (Üst Bar Gizli)
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#0F3826] text-[#F5EFE1]">
                    Masalardaki QR Kodlar İçin
                  </span>
                </div>
                <p className="text-xs text-stone-600 mb-3">
                  Müşteri bu linke girdiğinde <strong>Yönetici ve Mutfak sekmelerini görmez</strong>. Doğrudan seçili masanın menüsü açılır.
                </p>
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                  <code className="flex-1 px-3 py-2.5 rounded-xl bg-white border border-stone-300 text-xs font-mono text-stone-800 break-all">
                    {`${baseAppUrl}?view=menu&masa=${encodeURIComponent(selectedTable)}`}
                  </code>
                  <button
                    onClick={() => {
                      const url = `${baseAppUrl}?view=menu&masa=${encodeURIComponent(selectedTable)}`;
                      navigator.clipboard?.writeText(url);
                      showToast("Müşteri QR Menü linki kopyalandı!");
                    }}
                    className="px-3.5 py-2.5 rounded-xl bg-[#0F3826] hover:bg-[#1B5E3F] text-[#F5EFE1] text-xs font-bold flex items-center gap-1.5 shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" /> Kopyala
                  </button>
                  <button
                    onClick={() => {
                      setViewMode('customer');
                      setHideStaffTopBar(true);
                      setIsLinksModalOpen(false);
                      showToast("Müşteri QR görünümü açıldı (Üst bar gizlendi)");
                    }}
                    className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shrink-0"
                  >
                    <Eye className="w-3.5 h-3.5" /> Şimdi Test Et
                  </button>
                </div>
              </div>

              {/* 2. KITCHEN & POS LIVE ORDERS LINK */}
              <div className="p-4 rounded-2xl border-2 border-amber-500/40 bg-amber-50/40">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-5 h-5 text-amber-800" />
                    <span className="font-black text-sm text-stone-900">
                      2. Mutfak & Kasa Canlı Sipariş Ekranı Linki
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-stone-950">
                    Kasa Bilgisayarı / Mutfak Tableti İçin
                  </span>
                </div>
                <p className="text-xs text-stone-600 mb-3">
                  Mutfaktaki tablette veya kasadaki telefonda/bilgisayarda açık bırakacağınız linktir. Sipariş geldiği an sesli zil çalar ve 80mm fiş yazdırır.
                </p>
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                  <code className="flex-1 px-3 py-2.5 rounded-xl bg-white border border-stone-300 text-xs font-mono text-stone-800 break-all">
                    {`${baseAppUrl}?view=mutfak`}
                  </code>
                  <button
                    onClick={() => {
                      const url = `${baseAppUrl}?view=mutfak`;
                      navigator.clipboard?.writeText(url);
                      showToast("Mutfak & Kasa linki kopyalandı!");
                    }}
                    className="px-3.5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-bold flex items-center gap-1.5 shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" /> Kopyala
                  </button>
                  <button
                    onClick={() => {
                      setViewMode('kitchen');
                      setIsLinksModalOpen(false);
                    }}
                    className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black flex items-center gap-1.5 shrink-0"
                  >
                    <ChefHat className="w-3.5 h-3.5" /> Mutfağı Aç
                  </button>
                </div>
              </div>

              {/* 3. ADMIN CMS (PRICE & STOCK) LINK */}
              <div className="p-4 rounded-2xl border-2 border-stone-300 bg-stone-50">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-stone-800" />
                    <span className="font-black text-sm text-stone-900">
                      3. Yönetici (Fiyat, Ürün & Stok Düzenleme) Linki
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-stone-800 text-white">
                    Sadece İşletme Sahibi İçin
                  </span>
                </div>
                <p className="text-xs text-stone-600 mb-3">
                  Kendi iPhone/Android telefonunuzdan istediğiniz an girip fiyatları güncelleyebileceğiniz, biten meyve/sosları "Tükendi" yapabileceğiniz şifreli panel linkidir.
                </p>
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                  <code className="flex-1 px-3 py-2.5 rounded-xl bg-white border border-stone-300 text-xs font-mono text-stone-800 break-all">
                    {`${baseAppUrl}?view=yonetici`}
                  </code>
                  <button
                    onClick={() => {
                      const url = `${baseAppUrl}?view=yonetici`;
                      navigator.clipboard?.writeText(url);
                      showToast("Yönetici Paneli linki kopyalandı!");
                    }}
                    className="px-3.5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center gap-1.5 shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" /> Kopyala
                  </button>
                  <button
                    onClick={() => {
                      setViewMode('cms');
                      setIsLinksModalOpen(false);
                    }}
                    className="px-3.5 py-2.5 rounded-xl bg-[#0F3826] hover:bg-[#1B5E3F] text-[#F5EFE1] text-xs font-bold flex items-center gap-1.5 shrink-0"
                  >
                    <Settings className="w-3.5 h-3.5" /> Yöneticiyi Aç
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={() => {
                  setIsLinksModalOpen(false);
                  setIsQrModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-[#0F3826] text-[#F5EFE1] text-xs font-bold flex items-center gap-2"
              >
                <QrCode className="w-4 h-4 text-emerald-300" />
                <span>Tüm Masaların (1-15) QR Kodlarını Gör & Yazdır</span>
              </button>

              <button
                onClick={() => setIsLinksModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================================
          MODAL 5: 80MM THERMAL PRINTER RECEIPT PREVIEW (AFANDA 892E / POS READY)
          ==================================================================================== */}
      {receiptModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-stone-900 rounded-3xl p-4 sm:p-6 max-w-md w-full shadow-2xl border border-stone-700 my-8">
            <div className="flex items-center justify-between text-white mb-4 no-print">
              <div>
                <h3 className="font-bold text-sm text-amber-400">80mm Termal Yazıcı Fiş Önizleme</h3>
                <p className="text-[11px] text-stone-400">Afanda 892E & 80mm POS Yazıcılarla Tam Uyumlu Keskin Kontrast</p>
              </div>
              <button
                onClick={() => setReceiptModalOrder(null)}
                className="p-1.5 rounded-full bg-stone-800 text-stone-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ACTUAL 80MM PRINTABLE PAPER AREA */}
            <div className="flex justify-center bg-stone-800 p-4 rounded-2xl overflow-y-auto max-h-[65vh]">
              <div
                id="thermal-receipt-print-area"
                className="bg-white text-black w-[300px] p-4 shadow-md font-mono text-[12px] leading-snug"
              >
                {/* Receipt Header */}
                <div className="text-center border-b-2 border-dashed border-black pb-2 mb-2">
                  <div className="font-black text-base tracking-tight uppercase">
                    {cafeSettings.cafeName}
                  </div>
                  <div className="text-[10px] mt-0.5 font-bold">MUTFAK HAZIRLIK & ADİSYON FİŞİ</div>
                  <div className="mt-2 inline-block border-2 border-black px-3 py-1 font-black text-sm">
                    {receiptModalOrder.table.toUpperCase()} | #{receiptModalOrder.orderNumber}
                  </div>
                  <div className="text-[10px] mt-1 font-semibold">
                    Tarih: {new Date(receiptModalOrder.createdAt).toLocaleDateString('tr-TR')}{' '}
                    Saat: {new Date(receiptModalOrder.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {receiptModalOrder.customerName && (
                    <div className="text-[11px] font-bold">Müşteri: {receiptModalOrder.customerName}</div>
                  )}
                </div>

                {/* Receipt Items with Kitchen Checkboxes [ ] */}
                <div className="space-y-2.5 border-b-2 border-dashed border-black pb-3 mb-2">
                  {receiptModalOrder.items.map((item, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between font-black text-[12px]">
                        <span>{item.quantity}x {item.name}</span>
                        <span>{item.unitPrice * item.quantity} TL</span>
                      </div>

                      {/* Checklist items with [ ] for kitchen staff */}
                      {item.checklistItems && item.checklistItems.length > 0 && (
                        <div className="mt-1 pl-1 space-y-0.5 text-[11px]">
                          {item.checklistItems.map((chk, cIdx) => (
                            <div key={cIdx} className="flex items-start gap-1.5 font-semibold">
                              <span className="font-black">[ ]</span>
                              <span>{chk}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {item.note && (
                        <div className="mt-1 font-bold text-[11px] border border-black p-1">
                          *NOT: {item.note}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {receiptModalOrder.generalNote && (
                  <div className="border-b-2 border-dashed border-black pb-2 mb-2 font-bold text-[11px]">
                    MASA NOTU: {receiptModalOrder.generalNote}
                  </div>
                )}

                {/* Totals & Wi-Fi */}
                <div className="border-b-2 border-dashed border-black pb-2 mb-2">
                  <div className="flex justify-between font-black text-sm">
                    <span>TOPLAM:</span>
                    <span>{receiptModalOrder.totalAmount} TL</span>
                  </div>
                  <div className="text-[10px] mt-0.5 font-bold">
                    ÖDEME: {receiptModalOrder.paymentMethod}
                  </div>
                  <div className="text-[10px] mt-1 font-bold">
                    Wi-Fi Şifresi: {cafeSettings.wifiPass}
                  </div>
                </div>

                {/* Bottom Google Review QR Code */}
                <div className="text-center pt-1">
                  <div className="text-[10px] font-black mb-0.5">
                    LEZZETLERİMİZİ BEĞENDİNİZ Mİ?
                  </div>
                  <div className="text-[9px] font-semibold mb-1.5">
                    Google'da bizi değerlendirmek için okutun:
                  </div>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(cafeSettings.googleReviewUrl)}`}
                    alt="Google Review QR"
                    className="w-24 h-24 mx-auto border-2 border-black p-1 bg-white"
                  />
                  <div className="text-[10px] font-black mt-2">
                    Afiyet Olsun! Yine Bekleriz.
                  </div>
                </div>
              </div>
            </div>

            {/* Printer Modal Action Buttons */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 no-print">
              <button
                onClick={() => window.print()}
                className="py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#1F140E] font-black text-xs flex items-center justify-center gap-2 shadow"
              >
                <Printer className="w-4 h-4" />
                <span>Doğrudan Yazdır (80mm)</span>
              </button>

              <button
                onClick={() => copyReceiptForBluetoothPrinter(receiptModalOrder)}
                className="py-3 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 border border-stone-600"
              >
                <Copy className="w-4 h-4" />
                <span>Metin Kopyala (Mobil Yazıcı)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
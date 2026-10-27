# Minty Waffle & Cafe – QR Menü ve Sipariş Sistemi

## Kurulum
1. https://console.firebase.google.com adresinde proje açın.
2. **Authentication → Sign-in method → Anonymous** seçeneğini etkinleştirin.
3. **Firestore Database** oluşturun, ardından `firestore.rules` içeriğini Rules sekmesine yapıştırıp yayınlayın.
4. Proje ayarlarından bir **Web uygulaması** ekleyin; verilen değerleri `.env.example` dosyasını `.env` olarak kopyalayıp doldurun.
5. `npm install` ve `npm run dev` ile deneyin; `npm run build` ile `dist/` klasörünü üretin.
6. `dist/` klasörünü Firebase Hosting, Vercel veya Netlify'a yükleyin (HTTPS gerekir).

## Adresler
- Müşteri menüsü: `https://SITENIZ/?view=menu&masa=5`  (her masa için masa numarasını değiştirip QR üretin)
- Mutfak ekranı: `https://SITENIZ/?view=mutfak`
- Yönetim paneli: `https://SITENIZ/?view=yonetici`

## Güvenlik notları (yayına almadan önce)
- Yönetici PIN'i (varsayılan 1234) ayarlar belgesinde saklanıyor; bu belge tüm müşterilere okunabilir. PIN'i değiştirseniz de gerçek bir koruma değildir.
- Gerçek koruma için personel girişini Firebase e-posta/şifre ile yapıp kuralları `request.auth.token.email` ile kısıtlamak gerekir.

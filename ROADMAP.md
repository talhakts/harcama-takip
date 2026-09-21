# React Native (Expo) + SQLite Harcama & Bütçe Takipçisi
## Antigravity + Gemini Flash Uygulama Geliştirme Rehberi

Bu rehber, **Antigravity** ortamında **Gemini Flash** ajanını kullanarak sıfırdan üretime hazır, offline-first (çevrimdışı öncelikli) bir mobil harcama takip uygulaması inşa etmek için hazırlanmıştır.

---

## 1. Hedef Proje Klasör Mimarisi

Expo Router (file-based routing) ve ayrık katmanlı mimari (Separation of Concerns) esas alınmıştır:

```text
expense-tracker/
├── app/                      # Expo Router sayfaları (Ekranlar & Rotalar)
│   ├── (tabs)/               # Tab Bar navigasyonu
│   │   ├── _layout.tsx       # Sekme çubuğu yapılandırması & ikonlar
│   │   ├── index.tsx         # Dashboard (Özet, Bakiye, Son İşlemler)
│   │   ├── analytics.tsx     # Grafikler & Kategori Dağılımları
│   │   └── budgets.tsx       # Kategori Bütçe Limitleri & Uyarılar
│   ├── modal.tsx             # Hızlı İşlem Ekleme Ekranı (Gelir / Gider)
│   └── _layout.tsx           # Kök Stack ve Tema Sağlayıcı (Provider)
├── src/
│   ├── components/           # Yeniden kullanılabilir UI bileşenleri
│   │   ├── SummaryCard.tsx   # Gelir/Gider/Kalan bakiye kartı
│   │   ├── TransactionItem.tsx # Tekil harcama satır kartı
│   │   ├── CategoryBadge.tsx # Kategori rozet ve ikonları
│   │   └── ExpenseChart.tsx  # Pasta / Çubuk grafik bileşeni
│   ├── db/                   # SQLite Veritabanı Katmanı
│   │   ├── schema.ts         # Tablo şemaları ve migration fonksiyonları
│   │   └── database.ts       # Veritabanı bağlantı yönetimi
│   ├── services/             # İş Mantığı & Veri Servisleri
│   │   ├── transactionService.ts # CRUD: İşlem ekle, sil, listele
│   │   └── budgetService.ts      # Bütçe hedefi hesaplama servisleri
│   ├── types/                # TypeScript Tip Tanımlamaları
│   │   └── index.ts          # Transaction, Category, Budget tipleri
│   ├── utils/                # Yardımcı Fonksiyonlar
│   │   ├── formatters.ts     # Para birimi (TRY) ve tarih formatlayıcılar
│   │   └── constants.ts      # Sabit kategoriler, renkler, ikon adları
│   └── hooks/                # Özel React Kancaları
│       └── useTransactions.ts# Veritabanı state yönetimi & reaktivite
├── package.json
├── tsconfig.json
└── app.json
```

---

## 2. Adım Adım Antigravity Prompt Akışı

Her adımı Antigravity komut satırına/sohbetine sırayla vererek Gemini Flash'ın odaklı, hatasız ve modüler çalışmasını sağlayabilirsiniz.

---

### Adım 1: Proje Kurulumu ve Bağımlılıklar

> **Prompt 1:**
> ```text
> Yeni bir Expo projesini TypeScript ve Expo Router şablonuyla kur. Ardından projeye expo-sqlite, @expo/vector-icons ve react-native-gifted-charts paketlerini ekle. Proje klasör yapısını şu şekilde düzenle:
> - app/(tabs)
> - src/components
> - src/db
> - src/services
> - src/types
> - src/utils
> - src/hooks
> Kurulum adımlarını tamamlayıp temel tsconfig yapılandırmasını doğrula.
> ```

---

### Adım 2: TypeScript Modelleri ve Tip Tanımları

> **Prompt 2:**
> ```text
> `src/types/index.ts` dosyasını oluştur. Uygulamada kullanılacak şu tipleri tanımla:
> 1. TransactionType: 'expense' | 'income'
> 2. CategoryId: 'food' | 'transport' | 'bills' | 'entertainment' | 'shopping' | 'salary' | 'other'
> 3. Category: id, name (Türkçe), icon (Ionicons adı), color (Hex kod)
> 4. Transaction: id (string/number), amount (number - kuruş değil TL ondalıklı), type (TransactionType), categoryId, note, date (ISO string), createdAt
> 5. BudgetLimit: categoryId, monthlyLimit (number), currentSpent (number)
> 
> Ayrıca `src/utils/constants.ts` dosyasında varsayılan 7 ana kategoriyi renk ve ikon eşleştirmeleriyle birlikte export et.
> ```

---

### Adım 3: SQLite Veritabanı ve Servis Katmanı

> **Prompt 3:**
> ```text
> Modern `expo-sqlite` (useSQLiteContext / openDatabaseAsync) API'sini kullanarak yerel depolama katmanını oluştur:
> 1. `src/db/schema.ts`: 'transactions' ve 'budgets' tablolarını oluşturan `initializeDatabase` fonksiyonunu yaz. Gerekli indexleri (date, categoryId) ekle.
> 2. `src/services/transactionService.ts`:
>    - `addTransaction(transaction)`: Yeni kayıt ekler.
>    - `getTransactions(limit, offset)`: Tarihe göre azalan sırada getirir.
>    - `getMonthlySummary(year, month)`: İlgili ayın toplam gelir, gider ve kategori bazlı toplamlarını hesaplar.
>    - `deleteTransaction(id)`: Kaydı siler.
> SQL sorgularında parametrik yapı kullan ve hata yakalama (try/catch) mekanizmalarını kur.
> ```

---

### Adım 4: Veri Formatlama ve State Hook'u

> **Prompt 4:**
> ```text
> 1. `src/utils/formatters.ts` dosyasında Türk Lirası (`₺1.250,50`) formatlayıcı ve kullanıcı dostu tarih formatlayıcı fonksiyonları (`Intl.DateTimeFormat` kullanarak) yaz.
> 2. `src/hooks/useTransactions.ts` adında bir Custom Hook yaz. Bu hook:
>    - Veritabanından işlemleri çeksin,
>    - Yeni işlem eklendiğinde veya silindiğinde listeyi ve aylık özeti otomatik güncellesin (optimistic update veya re-fetch),
>    - Yüklenme (loading) ve hata (error) durumlarını yönetsin.
> ```

---

### Adım 5: Alt Navigasyon (Tabs) ve Dashboard Ekranı

> **Prompt 5:**
> ```text
> 1. `app/(tabs)/_layout.tsx` dosyasında 3 sekmeli bir alt menü kur:
>    - Genel Bakış (Dashboard) -> home ikonu
>    - Analiz (Analytics) -> pie-chart ikonu
>    - Bütçe (Budgets) -> wallet ikonu
> 2. `src/components/SummaryCard.tsx`: Toplam Bakiye, Aylık Gelir ve Aylık Gideri gösteren modern, köşeleri yuvarlatılmış kart bileşenini yaz.
> 3. `src/components/TransactionItem.tsx`: Kategori ikonu, harcama notu, tarih ve sağ tarafta renkli (+ Yeşil, - Kırmızı) tutarı gösteren satır bileşenini yaz.
> 4. `app/(tabs)/index.tsx`: Yukarıdaki bileşenleri `useTransactions` hook'una bağla. Üstte SummaryCard, altta son 10 harcamanın listesi ve sağ altta Floating Action Button (FAB - İşlem Ekle modalını açan buton) yer alsın.
> ```

---

### Adım 6: İşlem Ekleme Modalı (Form & Validasyon)

> **Prompt 6:**
> ```text
> `app/modal.tsx` dosyasında yukarıdan açılan (presentation: 'modal') işlem ekleme ekranını oluştur:
> - Gelir / Gider seçimi için iki parçalı buton (Segmented Control).
> - Tutar girişi (Büyük fontlu, sadece sayı ve virgül/nokta kabul eden decimal klavye).
> - Yatay kaydırılabilir (Horizontal Scroll) kategori seçim listesi.
> - Opsiyonel açıklama/not alanı.
> - Tarih seçimi (Varsayılan olarak bugün).
> - "Kaydet" butonu: Form doğrulaması yap (tutar 0 veya boş olamaz), veritabanına ekle, listeyi yenile ve modalı kapat.
> ```

---

### Adım 7: Analiz ve Grafik Ekranı

> **Prompt 7:**
> ```text
> `app/(tabs)/analytics.tsx` ekranını `react-native-gifted-charts` ile geliştir:
> - Seçili ayın kategori bazlı gider dağılımını gösteren modern bir Donut/Pie Chart ekle.
> - Grafiğin ortasında toplam harcanan tutar yazsın.
> - Grafiğin altında en çok harcama yapılan kategorileri yüzdelik oranları ve renkleriyle listeleyen gösterge (Legend) alanı oluştur.
> - Eğer ilgili ayda henüz harcama yoksa kullanıcıya şık bir "Kayıt Yok" (Empty State) mesajı göster.
> ```

---

### Adım 8: Bütçe Limiti & Eşik Uyarıları

> **Prompt 8:**
> ```text
> `app/(tabs)/budgets.tsx` ekranında bütçe kontrolü modülünü kur:
> - Kullanıcı kategorilere aylık tavan limit belirleyebilsin (Örn: Restoran: 4.000 TL).
> - Her kategori için bir ilerleme çubuğu (Progress Bar) göster:
>   * Harcama <%80 ise Yeşil,
>   * %80 - %100 arası ise Turuncu / Uyarı,
>   * %100 aşıldıysa Kırmızı ve "Limit Aşıldı" rozeti.
> SQLite üzerinden ilgili ayın kategori harcaması ile tanımlanan bütçeyi karşılaştıran hesaplama fonksiyonunu bağla.
> ```

---

## 3. Gemini Flash ile Geliştirme Yaparken İpuçları

1. **Adım Sırasını Bozmayın:** Önce veritabanı ve tipler (`types` & `db`), ardından servisler (`services`), en son arayüz (`components` & `app`) katmanını kodlatın. Bu sıra Flash'ın eksik referans üretmesini engeller.
2. **Terminal Hatalarını Aynen İletin:** Antigravity terminalinde bir TypeScript veya paket derleme hatası alırsanız prompt açıp yalnızca şunu yazın:
   > *"Şu terminal hatasını aldım: `[Hata metnini yapıştırın]`. İlgili dosyadaki sorunu gider."*
3. **Kuruş Hesaplamalarına Dikkat:** Tutar kontrollerinde JavaScript `Number()` yerine tam sayı veya `Math.round(val * 100) / 100` dönüşümünü utils fonksiyonlarında zorunlu kılın.
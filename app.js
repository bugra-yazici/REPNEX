const API_URL = "http://localhost:5099/api";
let userWorkoutsCache = [];
let currentFilter = 'all';
let searchQuery = '';
let selectedRoutineDays = 4; // Varsayılan 4 gün

// --- ÇEREZ (COOKIE) YARDIMCI FONKSİYONLARI ---
function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

// Sayfa yüklendiğinde çerez onay kontrolü
window.addEventListener('DOMContentLoaded', () => {
    const consent = getCookie("repnex_cookie_consent");
    if (!consent) {
        const banner = document.getElementById('cookieConsentBanner');
        if (banner) banner.style.display = 'block';
    }
});

function acceptCookies() {
    setCookie("repnex_cookie_consent", "accepted", 365);
    const banner = document.getElementById('cookieConsentBanner');
    if (banner) banner.style.display = 'none';
}

function rejectCookies() {
    setCookie("repnex_cookie_consent", "rejected", 365);
    const banner = document.getElementById('cookieConsentBanner');
    if (banner) banner.style.display = 'none';
}

// --- EGZERSİZ KATALOĞU ---
const EXERCISE_CATALOG = {
    Push: [
        { name: "Incline Dumbbell Press", muscle: "Üst Göğüs", equip: "Dumbbell", desc: "30-45 derece eğimli sehpada dambılları yukarı itin. Üst göğüs liflerini hedefler." },
        { name: "Barbell Bench Press", muscle: "Orta Göğüs", equip: "Barbell", desc: "Düz sehpada barı göğüs ucuna kontrollü indirip yukarı itin. Temel kütle hareketidir." },
        { name: "Cable Chest Fly (Kablo Açış)", muscle: "İç & Dış Göğüs", equip: "Kablo", desc: "Kolları bükük tutarak elleri önde birleştirin, tepe noktada göğsü sıkın." },
        { name: "Chest Dips", muscle: "Alt Göğüs & Triceps", equip: "Vücut Ağırlığı", desc: "Gövdeyi 30 derece öne eğerek inip çıkın. Alt göğüs çizgisi için idealdir." },
        { name: "Machine Chest Press", muscle: "Göğüs (İzole)", equip: "Makine", desc: "Sabit yörüngede tükenişe gitmek için güvenli göğüs itiş makinesi." },
        { name: "Overhead Barbell Press (OHP)", muscle: "Ön & Yan Omuz", equip: "Barbell", desc: "Ayakta dik durarak barı başın üzerine itin. Omuz çatısını genişletir." },
        { name: "Seated Dumbbell Shoulder Press", muscle: "Ön & Yan Omuz", equip: "Dumbbell", desc: "Dambılları kulak hizasından yukarı itin. Doğal açıda serbest itiş sağlar." },
        { name: "Dumbbell Lateral Raise", muscle: "Yan Omuz (Genişlik)", equip: "Dumbbell", desc: "Dambılları dirsekleri hafif bükerek yana kaldırın. Geniş omuz görüntüsü verir." },
        { name: "Triceps Rope Pushdown", muscle: "Triceps Dış Baş", equip: "Kablo", desc: "Halatı aşağı iterken en altta bilekleri dışa açın." },
        { name: "Skull Crusher (Lying Ext.)", muscle: "Triceps Uzun Baş", equip: "EZ-Bar", desc: "Barı alına doğru kontrollü indirip dirsekleri bozmadan yukarı itin." }
    ],
    Pull: [
        { name: "Lat Pulldown (Geniş Tutuş)", muscle: "Kanat (Lat)", equip: "Makine", desc: "Barı göğsün üstüne çekin, dirsekleri aşağıya odaklayın. Sırtı genişletir." },
        { name: "Barbell Bent-Over Row", muscle: "Orta Sırt & Trapez", equip: "Barbell", desc: "Belinizi 45 derece eğik tutarak barı karnınıza çekin. Sırt kalınlığı sağlar." },
        { name: "Seated Cable Row", muscle: "Orta Sırt", equip: "Kablo", desc: "Kabloyu karnınıza çekerken kürek kemiklerini birbirine sıkıştırın." },
        { name: "Single Arm Dumbbell Row", muscle: "Tek Kol Kanat", equip: "Dumbbell", desc: "Sehpaya tek dizinizi koyup dambılı kalçaya doğru çekin." },
        { name: "Pull-Up (Barfiks)", muscle: "Kanat & Sırt", equip: "Vücut Ağırlığı", desc: "Vücut ağırlığını göğüs bara yaklaşana kadar yukarı çekin." },
        { name: "Face Pull", muscle: "Arka Omuz & Rotatör", equip: "Kablo (Halat)", desc: "Halatı göz hizanıza çekerken dirsekleri dışa açın. Omuz sağlığı için şarttır." },
        { name: "Barbell / Dumbbell Shrug", muscle: "Trapez", equip: "Serbest Ağırlık", desc: "Omuzları kulaklara doğru düz kaldırıp 1 saniye sıkıştırın." },
        { name: "Barbell Biceps Curl", muscle: "Biceps (Pazu)", equip: "Barbell", desc: "Dirsekleri sabitleyerek barı çeneye kıvırın. Pazu kütlesinin temelidir." },
        { name: "Hammer Curl", muscle: "Brachialis & Ön Kol", equip: "Dumbbell", desc: "Avuçlar birbirine bakacak şekilde dambılları kaldırın. Kolu kalınlaştırır." },
        { name: "Incline Dumbbell Curl", muscle: "Biceps Tepe", equip: "Dumbbell", desc: "Eğimli sehpada kollar gerideyken curl yapın. Pazu tepesini inşa eder." }
    ],
    Legs: [
        { name: "Barbell Back Squat", muscle: "Tüm Bacak & Kalça", equip: "Barbell", desc: "Kalçayı geriye vererek çömelin. Bacak kütlesi ve genel kuvvetin temelidir." },
        { name: "Leg Press", muscle: "Ön Bacak (Quads)", equip: "Makine", desc: "Ayakları omuz genişliğinde koyup ağırlığı kontrollü itin." },
        { name: "Romanian Deadlift (RDL)", muscle: "Arka Bacak & Kalça", equip: "Barbell", desc: "Kalçayı geriye iterek barı kaval kemiğine kadar indirin. Hamstringi esnetir." },
        { name: "Lying Leg Curl", muscle: "Arka Bacak (İzole)", equip: "Makine", desc: "Yüzüstü yatarak topukları kalçaya çekin. Saf arka bacak izolasyonudur." },
        { name: "Standing Calf Raise", muscle: "Kalf (Baldır)", equip: "Makine", desc: "Parmak ucuna kalkıp baldırı sıkın, aşağı inerken tam esnetin." },
        { name: "Bulgarian Split Squat", muscle: "Kalça & Bacak", equip: "Dumbbell", desc: "Tek bacak sehpada derin çöküş ile denge ve kalça gelişimi sağlar." }
    ],
    Shoulders: [
        { name: "Overhead Barbell Press (OHP)", muscle: "Ön & Yan Omuz", equip: "Barbell", desc: "Ayakta dik durarak barı başın üzerine itin. Omuz çatısını genişletir." },
        { name: "Seated Dumbbell Shoulder Press", muscle: "Ön & Yan Omuz", equip: "Dumbbell", desc: "Dambılları kulak hizasından yukarı itin. Doğal açıda serbest itiş sağlar." },
        { name: "Dumbbell Lateral Raise", muscle: "Yan Omuz (Genişlik)", equip: "Dumbbell", desc: "Dambılları dirsekleri hafif bükerek yana kaldırın. Geniş omuz görüntüsü verir." },
        { name: "Face Pull", muscle: "Arka Omuz & Rotatör", equip: "Kablo (Halat)", desc: "Halatı göz hizanıza çekerken dirsekleri dışa açın. Omuz sağlığı için şarttır." },
        { name: "Reverse Pec Deck (Ters Kelebek)", muscle: "Arka Omuz", equip: "Makine", desc: "Kolları geriye doğru açarak arka omuz başını izole edin." }
    ],
    Arms: [
        { name: "Barbell Biceps Curl", muscle: "Biceps (Pazu)", equip: "Barbell", desc: "Dirsekleri sabitleyerek barı çeneye kıvırın. Pazu kütlesinin temelidir." },
        { name: "Incline Dumbbell Curl", muscle: "Biceps Tepe", equip: "Dumbbell", desc: "Eğimli sehpada kollar gerideyken curl yapın. Pazu tepesini inşa eder." },
        { name: "Hammer Curl", muscle: "Brachialis & Ön Kol", equip: "Dumbbell", desc: "Avuçlar birbirine bakacak şekilde dambılları kaldırın. Kolu kalınlaştırır." },
        { name: "Triceps Rope Pushdown", muscle: "Triceps Dış Baş", equip: "Kablo", desc: "Halatı aşağı iterken en altta bilekleri dışa açın." },
        { name: "Skull Crusher (Lying Ext.)", muscle: "Triceps Uzun Baş", equip: "EZ-Bar", desc: "Barı alına doğru kontrollü indirip dirsekleri bozmadan yukarı itin." }
    ],
    Upper: [
        { name: "Incline Bench Press", muscle: "Göğüs & Omuz", equip: "Barbell", desc: "Eğimli sehpada barı kontrollü iterek üst gövde zincirini devreye sokun." },
        { name: "Pull-Up (Barfiks)", muscle: "Kanat & Sırt", equip: "Vücut Ağırlığı", desc: "Vücut ağırlığını göğüs bara yaklaşana kadar yukarı çekin." },
        { name: "Dumbbell Shoulder Press", muscle: "Omuz", equip: "Dumbbell", desc: "Dambılları baş üzerine iterek deltoid kaslarını tam çalıştırın." },
        { name: "Overhead Barbell Press (OHP)", muscle: "Ön & Yan Omuz", equip: "Barbell", desc: "Ayakta dik durarak barı başın üzerine itin. Omuz çatısını genişletir." },
        { name: "Barbell Bench Press", muscle: "Orta Göğüs", equip: "Barbell", desc: "Düz sehpada barı göğüs ucuna kontrollü indirip yukarı itin." },
        { name: "Barbell Bent-Over Row", muscle: "Orta Sırt & Trapez", equip: "Barbell", desc: "Belinizi 45 derece eğik tutarak barı karnınıza çekin." },
        { name: "Hammer Curl", muscle: "Brachialis & Ön Kol", equip: "Dumbbell", desc: "Avuçlar birbirine bakacak şekilde dambılları kaldırın." },
        { name: "Skull Crusher (Lying Ext.)", muscle: "Triceps Uzun Baş", equip: "EZ-Bar", desc: "Barı alına doğru kontrollü indirip dirsekleri bozmadan yukarı itin." }
    ],
    Cardio: [
        { name: "Eğimli Yürüyüş (Incline Treadmill)", muscle: "Kardiyo & Yağ Yakımı", equip: "Koşu Bandı", desc: "Koşu bandını %8-%12 eğime alıp 5-6 km/s hızla yürüyün." },
        { name: "Koşu (Treadmill Running)", muscle: "Kardiyo & Kondisyon", equip: "Koşu Bandı", desc: "Yüksek tempoda koşarak kardiyovasküler kapasiteyi artırın." },
        { name: "Sabit Bisiklet (Stationary Bike)", muscle: "Kardiyo & Dayanıklılık", equip: "Kondisyon Bisikleti", desc: "Direnç seviyesini artırıp nabzı yüksek tutun." },
        { name: "Kürek Makinesi (Rowing)", muscle: "Tüm Vücut Kardiyo", equip: "Kürek", desc: "Vücuttaki kasların %85'ini aynı anda çalıştırır." }
    ]
};

// --- HEDEF VE GÜN SAYISINA GÖRE PROGRAM VERİTABANI ---
const PROGRAM_DATABASE = {
    "Güç & Powerlifting": {
        3: {
            title: "3 Günlük Temel Kuvvet (SBD Bloğu)",
            desc: "Bileşik kaldırmalarda (Squat, Bench, Deadlift) maksimum sinirsel adaptasyon ve saf kuvvet artışı.",
            days: [
                {
                    dayName: "1. Gün: Bench Press & Üst İtiş",
                    split: "Push",
                    exercises: [
                        { name: "Barbell Bench Press", sets: 5, reps: "3-5", rest: "3-4 dk", rpe: "8.5-9" },
                        { name: "Overhead Barbell Press (OHP)", sets: 4, reps: "5", rest: "2-3 dk", rpe: "8" },
                        { name: "Chest Dips", sets: 3, reps: "6-8", rest: "2 dk", rpe: "8" },
                        { name: "Skull Crusher (Lying Ext.)", sets: 3, reps: "8", rest: "90 sn", rpe: "8" }
                    ]
                },
                {
                    dayName: "2. Gün: Squat & Alt Vücut",
                    split: "Legs",
                    exercises: [
                        { name: "Barbell Back Squat", sets: 5, reps: "3-5", rest: "3-4 dk", rpe: "8.5-9" },
                        { name: "Romanian Deadlift (RDL)", sets: 4, reps: "5", rest: "3 dk", rpe: "8" },
                        { name: "Leg Press", sets: 3, reps: "6-8", rest: "2 dk", rpe: "8" },
                        { name: "Standing Calf Raise", sets: 4, reps: "10", rest: "90 sn", rpe: "8.5" }
                    ]
                },
                {
                    dayName: "3. Gün: Çekiş & Sırt Kalınlığı",
                    split: "Pull",
                    exercises: [
                        { name: "Barbell Bent-Over Row", sets: 5, reps: "5", rest: "3 dk", rpe: "8.5" },
                        { name: "Pull-Up (Barfiks)", sets: 4, reps: "5-6", rest: "2-3 dk", rpe: "8.5" },
                        { name: "Single Arm Dumbbell Row", sets: 3, reps: "6-8", rest: "2 dk", rpe: "8" },
                        { name: "Barbell Biceps Curl", sets: 3, reps: "6-8", rest: "90 sn", rpe: "8" }
                    ]
                }
            ]
        },
        4: {
            title: "4 Günlük Ağır / Hafif Kuvvet (Upper-Lower Split)",
            desc: "Haftalık ikişer kez üst ve alt gövdeyi çalışarak teknik hakimiyeti ve bar hızını artırır.",
            days: [
                {
                    dayName: "1. Gün: Üst Gövde (Ağır İtiş & Çekiş)",
                    split: "Push",
                    exercises: [
                        { name: "Barbell Bench Press", sets: 5, reps: "3-5", rest: "3 dk", rpe: "8.5-9" },
                        { name: "Barbell Bent-Over Row", sets: 4, reps: "5", rest: "2-3 dk", rpe: "8" },
                        { name: "Overhead Barbell Press (OHP)", sets: 4, reps: "5", rest: "2 dk", rpe: "8" },
                        { name: "Barbell Biceps Curl", sets: 3, reps: "6-8", rest: "90 sn", rpe: "8" }
                    ]
                },
                {
                    dayName: "2. Gün: Alt Gövde (Ağır Squat Odaklı)",
                    split: "Legs",
                    exercises: [
                        { name: "Barbell Back Squat", sets: 5, reps: "3-5", rest: "3-4 dk", rpe: "9" },
                        { name: "Romanian Deadlift (RDL)", sets: 4, reps: "6", rest: "2-3 dk", rpe: "8" },
                        { name: "Leg Press", sets: 3, reps: "8", rest: "2 dk", rpe: "8" }
                    ]
                },
                {
                    dayName: "3. Gün: Üst Gövde (Hacim & Destek)",
                    split: "Push",
                    exercises: [
                        { name: "Incline Dumbbell Press", sets: 4, reps: "6-8", rest: "2 dk", rpe: "8" },
                        { name: "Lat Pulldown (Geniş Tutuş)", sets: 4, reps: "6-8", rest: "2 dk", rpe: "8" },
                        { name: "Dumbbell Lateral Raise", sets: 4, reps: "10-12", rest: "90 sn", rpe: "8.5" },
                        { name: "Triceps Rope Pushdown", sets: 3, reps: "8-10", rest: "90 sn", rpe: "8.5" }
                    ]
                },
                {
                    dayName: "4. Gün: Alt Gövde (Hamstring & Kalça)",
                    split: "Legs",
                    exercises: [
                        { name: "Romanian Deadlift (RDL)", sets: 4, reps: "5-6", rest: "3 dk", rpe: "8.5" },
                        { name: "Leg Press", sets: 4, reps: "8", rest: "2 dk", rpe: "8" },
                        { name: "Lying Leg Curl", sets: 4, reps: "8-10", rest: "90 sn", rpe: "8" }
                    ]
                }
            ]
        },
        5: {
            title: "5 Günlük İleri Düzey Kuvvet Protokolü",
            desc: "Her güne tek bir büyük kaldırışın yerleştirildiği, yüksek frekanslı güç artış rutini.",
            days: [
                {
                    dayName: "1. Gün: Saf Bench Press Kuvveti",
                    split: "Push",
                    exercises: [
                        { name: "Barbell Bench Press", sets: 5, reps: "3", rest: "3-4 dk", rpe: "9" },
                        { name: "Incline Dumbbell Press", sets: 3, reps: "6", rest: "2 dk", rpe: "8" },
                        { name: "Chest Dips", sets: 3, reps: "6", rest: "2 dk", rpe: "8" }
                    ]
                },
                {
                    dayName: "2. Gün: Saf Squat Kuvveti",
                    split: "Legs",
                    exercises: [
                        { name: "Barbell Back Squat", sets: 5, reps: "3", rest: "4 dk", rpe: "9" },
                        { name: "Leg Press", sets: 3, reps: "6", rest: "2 dk", rpe: "8" },
                        { name: "Standing Calf Raise", sets: 4, reps: "10", rest: "90 sn", rpe: "8" }
                    ]
                },
                {
                    dayName: "3. Gün: Omuz İtişi & Triceps",
                    split: "Shoulders",
                    exercises: [
                        { name: "Overhead Barbell Press (OHP)", sets: 5, reps: "4", rest: "3 dk", rpe: "8.5" },
                        { name: "Dumbbell Lateral Raise", sets: 4, reps: "8-10", rest: "90 sn", rpe: "8" },
                        { name: "Skull Crusher (Lying Ext.)", sets: 4, reps: "6-8", rest: "90 sn", rpe: "8" }
                    ]
                },
                {
                    dayName: "4. Gün: Sırt & Destek",
                    split: "Pull",
                    exercises: [
                        { name: "Barbell Bent-Over Row", sets: 5, reps: "5", rest: "3 dk", rpe: "8.5" },
                        { name: "Romanian Deadlift (RDL)", sets: 4, reps: "5", rest: "3 dk", rpe: "8.5" },
                        { name: "Pull-Up (Barfiks)", sets: 3, reps: "5", rest: "2 dk", rpe: "8" }
                    ]
                },
                {
                    dayName: "5. Gün: Kol & Tamamlama",
                    split: "Arms",
                    exercises: [
                        { name: "Barbell Biceps Curl", sets: 4, reps: "6", rest: "90 sn", rpe: "8" },
                        { name: "Triceps Rope Pushdown", sets: 4, reps: "8", rest: "90 sn", rpe: "8" },
                        { name: "Hammer Curl", sets: 3, reps: "8", rest: "90 sn", rpe: "8" }
                    ]
                }
            ]
        }
    },
    "Hipertrofi (Kas Kazanımı)": {
        3: {
            title: "3 Günlük Tüm Vücut (Full-Body Hipertrofi)",
            desc: "Her seansta tüm kas liflerini 8-12 tekrar aralığında uyararak yüksek frekansta büyüme sağlar.",
            days: [
                {
                    dayName: "1. Gün: Full Body - A",
                    split: "Push",
                    exercises: [
                        { name: "Barbell Bench Press", sets: 4, reps: "8-10", rest: "2 dk", rpe: "8.5" },
                        { name: "Lat Pulldown (Geniş Tutuş)", sets: 4, reps: "10-12", rest: "90 sn", rpe: "8.5" },
                        { name: "Barbell Back Squat", sets: 4, reps: "8-10", rest: "2.5 dk", rpe: "8" },
                        { name: "Dumbbell Lateral Raise", sets: 3, reps: "12-15", rest: "60 sn", rpe: "9" }
                    ]
                },
                {
                    dayName: "2. Gün: Full Body - B",
                    split: "Pull",
                    exercises: [
                        { name: "Incline Dumbbell Press", sets: 4, reps: "8-10", rest: "2 dk", rpe: "8.5" },
                        { name: "Barbell Bent-Over Row", sets: 4, reps: "8-10", rest: "2 dk", rpe: "8" },
                        { name: "Romanian Deadlift (RDL)", sets: 4, reps: "10-12", rest: "2 dk", rpe: "8" },
                        { name: "Barbell Biceps Curl", sets: 3, reps: "10-12", rest: "60 sn", rpe: "9" }
                    ]
                },
                {
                    dayName: "3. Gün: Full Body - C",
                    split: "Legs",
                    exercises: [
                        { name: "Leg Press", sets: 4, reps: "10-12", rest: "2 dk", rpe: "8.5" },
                        { name: "Overhead Barbell Press (OHP)", sets: 4, reps: "8-10", rest: "2 dk", rpe: "8" },
                        { name: "Seated Cable Row", sets: 4, reps: "10-12", rest: "90 sn", rpe: "8.5" },
                        { name: "Triceps Rope Pushdown", sets: 3, reps: "12-15", rest: "60 sn", rpe: "9" }
                    ]
                }
            ]
        },
        4: {
            title: "4 Günlük Klasik Hipertrofi (Push-Pull-Legs-Upper)",
            desc: "Kas gruplarını ayırarak her bölgeye daha yüksek set sayısı ve tükeniş (failure) imkânı sunar.",
            days: [
                {
                    dayName: "1. Gün: İtiş (Göğüs & Triceps)",
                    split: "Push",
                    exercises: [
                        { name: "Incline Dumbbell Press", sets: 4, reps: "8-10", rest: "2 dk", rpe: "8.5" },
                        { name: "Barbell Bench Press", sets: 3, reps: "10", rest: "2 dk", rpe: "8" },
                        { name: "Cable Chest Fly (Kablo Açış)", sets: 3, reps: "12-15", rest: "60 sn", rpe: "9" },
                        { name: "Triceps Rope Pushdown", sets: 4, reps: "10-12", rest: "60 sn", rpe: "9" }
                    ]
                },
                {
                    dayName: "2. Gün: Çekiş (Sırt & Biceps)",
                    split: "Pull",
                    exercises: [
                        { name: "Lat Pulldown (Geniş Tutuş)", sets: 4, reps: "10-12", rest: "90 sn", rpe: "8.5" },
                        { name: "Barbell Bent-Over Row", sets: 4, reps: "8-10", rest: "2 dk", rpe: "8" },
                        { name: "Face Pull", sets: 3, reps: "15", rest: "60 sn", rpe: "8.5" },
                        { name: "Barbell Biceps Curl", sets: 4, reps: "10-12", rest: "60 sn", rpe: "9" }
                    ]
                },
                {
                    dayName: "3. Gün: Bacak & Kalf",
                    split: "Legs",
                    exercises: [
                        { name: "Barbell Back Squat", sets: 4, reps: "8-10", rest: "2.5 dk", rpe: "8.5" },
                        { name: "Romanian Deadlift (RDL)", sets: 3, reps: "10-12", rest: "2 dk", rpe: "8" },
                        { name: "Leg Press", sets: 3, reps: "12", rest: "90 sn", rpe: "8.5" },
                        { name: "Standing Calf Raise", sets: 4, reps: "15", rest: "60 sn", rpe: "9" }
                    ]
                },
                {
                    dayName: "4. Gün: Omuz & Kol Odaklı",
                    split: "Shoulders",
                    exercises: [
                        { name: "Seated Dumbbell Shoulder Press", sets: 4, reps: "8-10", rest: "2 dk", rpe: "8.5" },
                        { name: "Dumbbell Lateral Raise", sets: 4, reps: "12-15", rest: "60 sn", rpe: "9" },
                        { name: "Hammer Curl", sets: 3, reps: "10-12", rest: "60 sn", rpe: "9" },
                        { name: "Skull Crusher (Lying Ext.)", sets: 3, reps: "10-12", rest: "60 sn", rpe: "9" }
                    ]
                }
            ]
        },
        5: {
            title: "5 Günlük İleri Seviye Bölgesel Hipertrofi Split",
            desc: "Her güne tek bir büyük kas grubu; maksimum pompa, yüksek izolasyon ve failure setleri.",
            days: [
                {
                    dayName: "1. Gün: Göğüs",
                    split: "Push",
                    exercises: [
                        { name: "Incline Dumbbell Press", sets: 4, reps: "8-10", rest: "2 dk", rpe: "8.5" },
                        { name: "Barbell Bench Press", sets: 4, reps: "8-10", rest: "2 dk", rpe: "8.5" },
                        { name: "Cable Chest Fly (Kablo Açış)", sets: 4, reps: "12-15", rest: "60 sn", rpe: "9" },
                        { name: "Chest Dips", sets: 3, reps: "10-12", rest: "90 sn", rpe: "9.5" }
                    ]
                },
                {
                    dayName: "2. Gün: Sırt",
                    split: "Pull",
                    exercises: [
                        { name: "Lat Pulldown (Geniş Tutuş)", sets: 4, reps: "10-12", rest: "90 sn", rpe: "8.5" },
                        { name: "Barbell Bent-Over Row", sets: 4, reps: "8-10", rest: "2 dk", rpe: "8.5" },
                        { name: "Seated Cable Row", sets: 3, reps: "10-12", rest: "90 sn", rpe: "8" },
                        { name: "Single Arm Dumbbell Row", sets: 3, reps: "10-12", rest: "90 sn", rpe: "8.5" }
                    ]
                },
                {
                    dayName: "3. Gün: Bacak",
                    split: "Legs",
                    exercises: [
                        { name: "Barbell Back Squat", sets: 4, reps: "8-10", rest: "2.5 dk", rpe: "8.5" },
                        { name: "Romanian Deadlift (RDL)", sets: 4, reps: "10", rest: "2 dk", rpe: "8" },
                        { name: "Leg Press", sets: 3, reps: "12-15", rest: "90 sn", rpe: "9" },
                        { name: "Standing Calf Raise", sets: 4, reps: "15", rest: "60 sn", rpe: "9" }
                    ]
                },
                {
                    dayName: "4. Gün: Omuz (Deltoid Kütlesi)",
                    split: "Shoulders",
                    exercises: [
                        { name: "Overhead Barbell Press (OHP)", sets: 4, reps: "8-10", rest: "2 dk", rpe: "8.5" },
                        { name: "Dumbbell Lateral Raise", sets: 5, reps: "12-15", rest: "45 sn", rpe: "9.5" },
                        { name: "Face Pull", sets: 4, reps: "15", rest: "60 sn", rpe: "9" },
                        { name: "Reverse Pec Deck (Ters Kelebek)", sets: 3, reps: "12-15", rest: "60 sn", rpe: "9" }
                    ]
                },
                {
                    dayName: "5. Gün: Kol (Arm Day)",
                    split: "Arms",
                    exercises: [
                        { name: "Barbell Biceps Curl", sets: 4, reps: "10", rest: "60 sn", rpe: "9" },
                        { name: "Triceps Rope Pushdown", sets: 4, reps: "10-12", rest: "60 sn", rpe: "9" },
                        { name: "Incline Dumbbell Curl", sets: 3, reps: "10-12", rest: "60 sn", rpe: "9" },
                        { name: "Skull Crusher (Lying Ext.)", sets: 3, reps: "10-12", rest: "60 sn", rpe: "9" }
                    ]
                }
            ]
        }
    },
    "Definasyon & Yağ Yakımı": {
        3: {
            title: "3 Günlük Yoğun Definasyon & Kardiyo",
            desc: "Kısa dinlenmelerle metabolik tempoyu yükseltip kas kütlesini koruyan kompakt program.",
            days: [
                {
                    dayName: "1. Gün: Üst Gövde & Eğimli Yürüyüş",
                    split: "Push",
                    exercises: [
                        { name: "Incline Dumbbell Press", sets: 4, reps: "12-15", rest: "60 sn", rpe: "8.5" },
                        { name: "Lat Pulldown (Geniş Tutuş)", sets: 4, reps: "12-15", rest: "60 sn", rpe: "8.5" },
                        { name: "Dumbbell Lateral Raise", sets: 4, reps: "15", rest: "45 sn", rpe: "9" },
                        { name: "Eğimli Yürüyüş (Incline Treadmill)", sets: 1, reps: "25", rest: "-", rpe: "8" }
                    ]
                },
                {
                    dayName: "2. Gün: Bacak & Core",
                    split: "Legs",
                    exercises: [
                        { name: "Leg Press", sets: 4, reps: "12-15", rest: "60 sn", rpe: "8.5" },
                        { name: "Romanian Deadlift (RDL)", sets: 4, reps: "12", rest: "60 sn", rpe: "8" },
                        { name: "Lying Leg Curl", sets: 3, reps: "15", rest: "45 sn", rpe: "9" }
                    ]
                },
                {
                    dayName: "3. Gün: Tüm Vücut & Kondisyon",
                    split: "Pull",
                    exercises: [
                        { name: "Barbell Bent-Over Row", sets: 4, reps: "12", rest: "60 sn", rpe: "8" },
                        { name: "Barbell Bench Press", sets: 3, reps: "12", rest: "60 sn", rpe: "8" },
                        { name: "Kürek Makinesi (Rowing)", sets: 1, reps: "20", rest: "-", rpe: "8.5" }
                    ]
                }
            ]
        },
        4: {
            title: "4 Günlük Hacimli Yağ Yakım Protokolü",
            desc: "Bölgesel kas uyarımı ve antrenman sonu nabız arttırıcı kardiyo blokları.",
            days: [
                {
                    dayName: "1. Gün: Göğüs, Omuz & Kardiyo",
                    split: "Push",
                    exercises: [
                        { name: "Barbell Bench Press", sets: 4, reps: "10-12", rest: "60 sn", rpe: "8" },
                        { name: "Dumbbell Lateral Raise", sets: 4, reps: "15", rest: "45 sn", rpe: "8.5" },
                        { name: "Eğimli Yürüyüş (Incline Treadmill)", sets: 1, reps: "20", rest: "-", rpe: "8" }
                    ]
                },
                {
                    dayName: "2. Gün: Sırt & Kol",
                    split: "Pull",
                    exercises: [
                        { name: "Lat Pulldown (Geniş Tutuş)", sets: 4, reps: "12", rest: "60 sn", rpe: "8" },
                        { name: "Barbell Biceps Curl", sets: 3, reps: "12", rest: "45 sn", rpe: "8.5" },
                        { name: "Triceps Rope Pushdown", sets: 3, reps: "12", rest: "45 sn", rpe: "8.5" }
                    ]
                },
                {
                    dayName: "3. Gün: Bacak & Kalça",
                    split: "Legs",
                    exercises: [
                        { name: "Leg Press", sets: 4, reps: "15", rest: "60 sn", rpe: "8.5" },
                        { name: "Romanian Deadlift (RDL)", sets: 3, reps: "12", rest: "60 sn", rpe: "8" },
                        { name: "Standing Calf Raise", sets: 4, reps: "15", rest: "45 sn", rpe: "8.5" }
                    ]
                },
                {
                    dayName: "4. Gün: Saf Kondisyon & Dayanıklılık",
                    split: "Cardio",
                    exercises: [
                        { name: "Koşu (Treadmill Running)", sets: 1, reps: "20", rest: "-", rpe: "8.5" },
                        { name: "Kürek Makinesi (Rowing)", sets: 1, reps: "15", rest: "-", rpe: "8" }
                    ]
                }
            ]
        },
        5: {
            title: "5 Günlük Yoğun Definasyon & HIIT",
            desc: "Yüksek frekansta kalori harcaması sağlayan, aktif toparlanma destekli definasyon.",
            days: [
                {
                    dayName: "1. Gün: Göğüs & Kardiyo",
                    split: "Push",
                    exercises: [
                        { name: "Incline Dumbbell Press", sets: 4, reps: "12", rest: "60 sn", rpe: "8.5" },
                        { name: "Cable Chest Fly (Kablo Açış)", sets: 3, reps: "15", rest: "45 sn", rpe: "8.5" },
                        { name: "Eğimli Yürüyüş (Incline Treadmill)", sets: 1, reps: "25", rest: "-", rpe: "8" }
                    ]
                },
                {
                    dayName: "2. Gün: Sırt & Core",
                    split: "Pull",
                    exercises: [
                        { name: "Lat Pulldown (Geniş Tutuş)", sets: 4, reps: "12", rest: "60 sn", rpe: "8" },
                        { name: "Seated Cable Row", sets: 4, reps: "12", rest: "60 sn", rpe: "8" }
                    ]
                },
                {
                    dayName: "3. Gün: Bacak",
                    split: "Legs",
                    exercises: [
                        { name: "Leg Press", sets: 4, reps: "15", rest: "60 sn", rpe: "8.5" },
                        { name: "Romanian Deadlift (RDL)", sets: 3, reps: "12", rest: "60 sn", rpe: "8" }
                    ]
                },
                {
                    dayName: "4. Gün: Omuz & Kollar",
                    split: "Shoulders",
                    exercises: [
                        { name: "Dumbbell Lateral Raise", sets: 4, reps: "15", rest: "45 sn", rpe: "8.5" },
                        { name: "Barbell Biceps Curl", sets: 3, reps: "12", rest: "45 sn", rpe: "8.5" },
                        { name: "Triceps Rope Pushdown", sets: 3, reps: "12", rest: "45 sn", rpe: "8.5" }
                    ]
                },
                {
                    dayName: "5. Gün: Saf Kardiyo & Dayanıklılık",
                    split: "Cardio",
                    exercises: [
                        { name: "Kürek Makinesi (Rowing)", sets: 1, reps: "20", rest: "-", rpe: "8.5" },
                        { name: "Sabit Bisiklet (Stationary Bike)", sets: 1, reps: "20", rest: "-", rpe: "8" }
                    ]
                }
            ]
        }
    },
    "Fonksiyonel Fitness": {
        3: {
            title: "3 Günlük Fonksiyonel Full-Body",
            desc: "Denge, esneklik ve bileşik hareketlerle genel vücut sağlığını koruma.",
            days: [
                {
                    dayName: "1. Gün: Kuvvet & Denge",
                    split: "Upper",
                    exercises: [
                        { name: "Barbell Back Squat", sets: 3, reps: "10", rest: "90 sn", rpe: "7.5" },
                        { name: "Barbell Bench Press", sets: 3, reps: "10", rest: "90 sn", rpe: "7.5" },
                        { name: "Lat Pulldown (Geniş Tutuş)", sets: 3, reps: "10", rest: "90 sn", rpe: "7.5" }
                    ]
                },
                {
                    dayName: "2. Gün: Kondisyon & Postür",
                    split: "Cardio",
                    exercises: [
                        { name: "Kürek Makinesi (Rowing)", sets: 1, reps: "20", rest: "-", rpe: "7.5" },
                        { name: "Face Pull", sets: 3, reps: "15", rest: "60 sn", rpe: "8" }
                    ]
                },
                {
                    dayName: "3. Gün: Dayanıklılık & Esneklik",
                    split: "Legs",
                    exercises: [
                        { name: "Romanian Deadlift (RDL)", sets: 3, reps: "10", rest: "90 sn", rpe: "7.5" },
                        { name: "Overhead Barbell Press (OHP)", sets: 3, reps: "10", rest: "90 sn", rpe: "7.5" },
                        { name: "Eğimli Yürüyüş (Incline Treadmill)", sets: 1, reps: "20", rest: "-", rpe: "7.5" }
                    ]
                }
            ]
        },
        4: {
            title: "4 Günlük Dengeli Fitness & Mobilite",
            desc: "Haftalık 2 kuvvet, 2 kondisyon seansıyla kalp-damar ve kas dengesini koruma.",
            days: [
                {
                    dayName: "1. Gün: Üst Vücut Kuvvet",
                    split: "Push",
                    exercises: [
                        { name: "Barbell Bench Press", sets: 3, reps: "10", rest: "90 sn", rpe: "8" },
                        { name: "Lat Pulldown (Geniş Tutuş)", sets: 3, reps: "10", rest: "90 sn", rpe: "8" },
                        { name: "Dumbbell Lateral Raise", sets: 3, reps: "12", rest: "60 sn", rpe: "8" }
                    ]
                },
                {
                    dayName: "2. Gün: Alt Vücut & Core",
                    split: "Legs",
                    exercises: [
                        { name: "Barbell Back Squat", sets: 3, reps: "10", rest: "2 dk", rpe: "8" },
                        { name: "Romanian Deadlift (RDL)", sets: 3, reps: "10", rest: "90 sn", rpe: "8" }
                    ]
                },
                {
                    dayName: "3. Gün: Kardiyovasküler Kapasite",
                    split: "Cardio",
                    exercises: [
                        { name: "Sabit Bisiklet (Stationary Bike)", sets: 1, reps: "25", rest: "-", rpe: "8" },
                        { name: "Face Pull", sets: 3, reps: "15", rest: "60 sn", rpe: "8" }
                    ]
                },
                {
                    dayName: "4. Gün: Tüm Vücut Dayanıklılık",
                    split: "Upper",
                    exercises: [
                        { name: "Leg Press", sets: 3, reps: "12", rest: "90 sn", rpe: "8" },
                        { name: "Seated Cable Row", sets: 3, reps: "12", rest: "90 sn", rpe: "8" }
                    ]
                }
            ]
        },
        5: {
            title: "5 Günlük Aktif Yaşam & Fonksiyonel Ritim",
            desc: "Aşırı yıpratmadan haftanın 5 gününe yayılan hareket ve zindelik protokolü.",
            days: [
                {
                    dayName: "1. Gün: İtiş Hareketleri",
                    split: "Push",
                    exercises: [
                        { name: "Incline Dumbbell Press", sets: 3, reps: "10", rest: "90 sn", rpe: "7.5" },
                        { name: "Dumbbell Lateral Raise", sets: 3, reps: "12", rest: "60 sn", rpe: "7.5" }
                    ]
                },
                {
                    dayName: "2. Gün: Çekiş & Sırt",
                    split: "Pull",
                    exercises: [
                        { name: "Lat Pulldown (Geniş Tutuş)", sets: 3, reps: "10", rest: "90 sn", rpe: "7.5" },
                        { name: "Face Pull", sets: 3, reps: "15", rest: "60 sn", rpe: "7.5" }
                    ]
                },
                {
                    dayName: "3. Gün: Bacak & Kalça",
                    split: "Legs",
                    exercises: [
                        { name: "Leg Press", sets: 3, rubs: "12", reps: "12", rest: "90 sn", rpe: "7.5" },
                        { name: "Standing Calf Raise", sets: 3, reps: "15", rest: "60 sn", rpe: "7.5" }
                    ]
                },
                {
                    dayName: "4. Gün: Kardiyo - Bisiklet",
                    split: "Cardio",
                    exercises: [
                        { name: "Sabit Bisiklet (Stationary Bike)", sets: 1, reps: "30", rest: "-", rpe: "7.5" }
                    ]
                },
                {
                    dayName: "5. Gün: Kardiyo - Eğimli Yürüyüş",
                    split: "Cardio",
                    exercises: [
                        { name: "Eğimli Yürüyüş (Incline Treadmill)", sets: 1, reps: "30", rest: "-", rpe: "7.5" }
                    ]
                }
            ]
        }
    }
};

document.getElementById('date').valueAsDate = new Date();

function getSession() {
    const data = localStorage.getItem('repnex_session');
    return data ? JSON.parse(data) : null;
}

function setSession(user) {
    localStorage.setItem('repnex_session', JSON.stringify(user));
    updateNavbar();
}

function clearSession() {
    localStorage.removeItem('repnex_session');
    updateNavbar();
    navigateTo('landing');
}

function handleLogoClick() {
    const user = getSession();
    if (user) {
        navigateTo('dashboard');
    } else {
        navigateTo('landing');
    }
}

function navigateTo(viewName, authSubTab = 'login') {
    const user = getSession();

    if (user && viewName === 'landing') {
        viewName = 'dashboard';
    }

    document.querySelectorAll('.page-view').forEach(el => el.classList.remove('active'));

    if (viewName === 'landing') {
        document.getElementById('viewLanding').classList.add('active');
    } else if (viewName === 'auth') {
        document.getElementById('viewAuth').classList.add('active');
        switchAuthTab(authSubTab);
    } else if (viewName === 'dashboard') {
        if (!user) {
            navigateTo('auth', 'login');
            return;
        }
        document.getElementById('dashUserName').innerText = user.fullName.toUpperCase();
        document.getElementById('viewDashboard').classList.add('active');
        switchDashboardTab('workouts');
        fetchWorkoutsFromDB();
        loadAthleteProfile();
    }
}

function updateNavbar() {
    const user = getSession();
    const navActions = document.getElementById('navActions');

    if (user) {
        navActions.innerHTML = `
            <button class="btn-outline" onclick="navigateTo('dashboard')">Panelim</button>
            <button class="btn-outline" style="border-color: var(--danger); color: var(--danger);" onclick="clearSession()">Çıkış Yap</button>
        `;
    } else {
        navActions.innerHTML = `
            <button class="btn-outline" onclick="navigateTo('auth', 'login')">Giriş Yap</button>
            <button class="btn-lime" onclick="navigateTo('auth', 'register')">Kayıt Ol</button>
        `;
    }
}

function switchAuthTab(tab) {
    const errorBox = document.getElementById('authError');
    errorBox.style.display = 'none';

    if (tab === 'login') {
        document.getElementById('tabLogin').classList.add('active');
        document.getElementById('tabRegister').classList.remove('active');
        document.getElementById('formLogin').classList.add('active');
        document.getElementById('formRegister').classList.remove('active');
    } else {
        document.getElementById('tabRegister').classList.add('active');
        document.getElementById('tabLogin').classList.remove('active');
        document.getElementById('formRegister').classList.add('active');
        document.getElementById('formLogin').classList.remove('active');
    }
}

// 1. Kayıt
document.getElementById('formRegister').addEventListener('submit', async function(e) {
    e.preventDefault();
    const errorBox = document.getElementById('authError');
    errorBox.style.display = 'none';

    const payload = {
        fullName: document.getElementById('regName').value.trim(),
        email: document.getElementById('regEmail').value.trim(),
        password: document.getElementById('regPassword').value
    };

    try {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Kayıt başarısız!');

        setSession({ userId: data.userId, fullName: data.fullName, email: data.email });
        navigateTo('dashboard');
    } catch (err) {
        errorBox.innerText = err.message;
        errorBox.style.display = 'block';
    }
});

// 2. Giriş
document.getElementById('formLogin').addEventListener('submit', async function(e) {
    e.preventDefault();
    const errorBox = document.getElementById('authError');
    errorBox.style.display = 'none';

    const payload = {
        email: document.getElementById('loginEmail').value.trim(),
        password: document.getElementById('loginPassword').value
    };

    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Giriş yapılamadı!');

        setSession({ userId: data.userId, fullName: data.fullName, email: data.email });
        navigateTo('dashboard');
    } catch (err) {
        errorBox.innerText = err.message;
        errorBox.style.display = 'block';
    }
});

// 3. Antrenmanları Getir
async function fetchWorkoutsFromDB() {
    const user = getSession();
    if (!user) return;

    try {
        const res = await fetch(`${API_URL}/workouts/user/${user.userId}`);
        if (!res.ok) throw new Error('Veriler çekilemedi.');
        userWorkoutsCache = await res.json();
        renderDashboardFeed();
    } catch (err) {
        console.error("Hata:", err);
    }
}

// Haftalık Zaman Fonksiyonları
function getMonday(d) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
}

function getWeekKey(d) {
    const mon = getMonday(d);
    return mon.toISOString().split('T')[0];
}

function formatWeekRange(mondayDateStr) {
    const mon = new Date(mondayDateStr);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);

    const opt = { day: 'numeric', month: 'short' };
    return `${mon.toLocaleDateString('tr-TR', opt)} - ${sun.toLocaleDateString('tr-TR', opt)} ${sun.getFullYear()}`;
}

function handleWorkoutSearch() {
    searchQuery = document.getElementById('workoutSearchInput').value.trim().toLowerCase();
    renderDashboardFeed();
}

function filterWorkouts(split) {
    currentFilter = split;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    renderDashboardFeed();
}

// Dinamik Form
function onProgramChange() {
    const split = document.getElementById('split').value;
    const exerciseSelect = document.getElementById('exerciseSelect');
    const weightFields = document.getElementById('weightWorkoutFields');
    const cardioFields = document.getElementById('cardioWorkoutFields');
    const modalTitle = document.getElementById('modalTitleText');

    const list = EXERCISE_CATALOG[split] || [];
    exerciseSelect.innerHTML = '';
    list.forEach(ex => {
        const opt = document.createElement('option');
        opt.value = ex.name;
        opt.innerText = `${ex.name} (${ex.muscle} • ${ex.equip})`;
        opt.dataset.muscle = ex.muscle;
        opt.dataset.equip = ex.equip;
        opt.dataset.desc = ex.desc;
        exerciseSelect.appendChild(opt);
    });

    updateExerciseDescription();

    if (split === 'Cardio') {
        weightFields.style.display = 'none';
        cardioFields.style.display = 'grid';
        modalTitle.innerText = 'Yeni Kardiyo Seansı Ekle';
        document.getElementById('cardioDuration').required = true;
        document.getElementById('sets').required = false;
        document.getElementById('reps').required = false;
        document.getElementById('weight').required = false;
    } else {
        weightFields.style.display = 'grid';
        cardioFields.style.display = 'none';
        modalTitle.innerText = 'Yeni Ağırlık Seti Ekle';
        document.getElementById('cardioDuration').required = false;
        document.getElementById('sets').required = true;
        document.getElementById('reps').required = true;
        document.getElementById('weight').required = true;
    }
}

function updateExerciseDescription() {
    const exerciseSelect = document.getElementById('exerciseSelect');
    const descBox = document.getElementById('exerciseDescText');
    if (!exerciseSelect || exerciseSelect.selectedIndex < 0) return;

    const selectedOption = exerciseSelect.options[exerciseSelect.selectedIndex];
    const desc = selectedOption.dataset.desc || "Açıklama bulunmuyor.";
    descBox.innerText = desc;
}

function findExerciseDescription(exName) {
    for (const splitKey in EXERCISE_CATALOG) {
        const found = EXERCISE_CATALOG[splitKey].find(e => e.name.toLowerCase() === exName.toLowerCase());
        if (found) return found.desc;
    }
    return "Antrenman hareketi dökümü.";
}

function findSplitForExercise(exName, defaultSplit = 'Push') {
    if (EXERCISE_CATALOG[defaultSplit] && EXERCISE_CATALOG[defaultSplit].some(e => e.name.toLowerCase() === exName.toLowerCase())) {
        return defaultSplit;
    }
    for (const splitKey in EXERCISE_CATALOG) {
        if (EXERCISE_CATALOG[splitKey].some(e => e.name.toLowerCase() === exName.toLowerCase())) {
            return splitKey;
        }
    }
    return defaultSplit;
}

// --- ANA RENDER: SEANS FEED ---
function renderDashboardFeed() {
    const feedContainer = document.getElementById('sessionFeed');
    const emptyMessage = document.getElementById('emptyMessage');
    const muscleBarsContainer = document.getElementById('muscleBarsContainer');

    const currentMondayStr = getWeekKey(new Date());
    const currentMonday = new Date(currentMondayStr);
    const currentSunday = new Date(currentMonday);
    currentSunday.setDate(currentMonday.getDate() + 6);
    currentSunday.setHours(23, 59, 59, 999);

    document.getElementById('dashWeekRangeText').innerText = `Bu Hafta: ${formatWeekRange(currentMondayStr)}`;

    const thisWeekWorkouts = userWorkoutsCache.filter(w => {
        if (!w.workoutDate) return false;
        const d = new Date(w.workoutDate);
        return d >= currentMonday && d <= currentSunday;
    });

    const thisWeekDays = new Set(thisWeekWorkouts.map(w => w.workoutDate.split('T')[0]));
    document.getElementById('statWeeklyWorkouts').innerText = `${thisWeekDays.size} Gün`;

    let peakWeight = 0;
    let peakExercise = 'Bu Hafta Henüz Yok';
    thisWeekWorkouts.forEach(w => {
        if (w.split !== 'Cardio' && w.weight > peakWeight) {
            peakWeight = w.weight;
            peakExercise = w.exerciseName;
        }
    });
    document.getElementById('statPeakWeight').innerText = `${peakWeight} kg`;
    document.getElementById('statPeakExercise').innerText = peakWeight > 0 ? peakExercise : 'Bu Hafta Kaldırış Yok';

    const thisWeekSetsSum = thisWeekWorkouts.reduce((acc, w) => acc + (w.sets || 1), 0);
    const thisWeekFailureCount = thisWeekWorkouts.filter(w => w.setType === 'Failure').length;
    document.getElementById('statTotalSets').innerText = thisWeekSetsSum;
    document.getElementById('statFailureCount').innerText = `${thisWeekFailureCount} Tükeniş (Failure)`;

    const thisWeekRpes = thisWeekWorkouts.filter(w => w.rpe).map(w => w.rpe);
    const thisWeekAvgRpe = thisWeekRpes.length > 0 ? (thisWeekRpes.reduce((a,b)=>a+b, 0)/thisWeekRpes.length).toFixed(1) : '-';
    document.getElementById('statAvgRpe').innerText = thisWeekAvgRpe !== '-' ? `@${thisWeekAvgRpe}` : '-';

    const muscleCounts = {};
    thisWeekWorkouts.forEach(w => {
        const m = w.muscleGroup || 'Diğer';
        muscleCounts[m] = (muscleCounts[m] || 0) + (w.sets || 1);
    });

    muscleBarsContainer.innerHTML = '';
    document.getElementById('breakdownTotalSets').innerText = `Toplam ${thisWeekSetsSum} Aktivite`;
    const sortedMuscles = Object.keys(muscleCounts).sort((a,b) => muscleCounts[b] - muscleCounts[a]);

    if (sortedMuscles.length === 0) {
        muscleBarsContainer.innerHTML = '<span style="color:var(--text-muted); font-size:0.8rem;">Bu hafta henüz kayıt yok.</span>';
    } else {
        sortedMuscles.forEach(muscle => {
            const chip = document.createElement('div');
            chip.className = 'muscle-chip';
            chip.innerHTML = `
                <span class="muscle-chip-name">${muscle}</span>
                <span class="muscle-chip-count">${muscleCounts[muscle]} Kayıt</span>
            `;
            muscleBarsContainer.appendChild(chip);
        });
    }

    let filteredThisWeek = thisWeekWorkouts;
    if (currentFilter !== 'all') {
        filteredThisWeek = filteredThisWeek.filter(w => w.split === currentFilter);
    }
    if (searchQuery) {
        filteredThisWeek = filteredThisWeek.filter(w => 
            w.exerciseName.toLowerCase().includes(searchQuery) || 
            (w.muscleGroup && w.muscleGroup.toLowerCase().includes(searchQuery))
        );
    }

    if (filteredThisWeek.length === 0) {
        feedContainer.innerHTML = '';
        emptyMessage.style.display = 'block';
        return;
    }
    emptyMessage.style.display = 'none';

    const dayGroups = {};
    filteredThisWeek.forEach(item => {
        const dateKey = item.workoutDate ? item.workoutDate.split('T')[0] : 'Tarihsiz';

        if (!dayGroups[dateKey]) {
            dayGroups[dateKey] = {
                date: dateKey,
                splits: new Set(),
                exercises: {}
            };
        }

        dayGroups[dateKey].splits.add(item.split);

        const exName = item.exerciseName.trim();
        if (!dayGroups[dateKey].exercises[exName]) {
            dayGroups[dateKey].exercises[exName] = {
                split: item.split,
                muscleGroup: item.muscleGroup,
                equipment: item.equipment,
                sets: []
            };
        }

        dayGroups[dateKey].exercises[exName].sets.push(item);
    });

    const sortedDayKeys = Object.keys(dayGroups).sort().reverse();
    feedContainer.innerHTML = '';

    sortedDayKeys.forEach(dateKey => {
        const daySession = dayGroups[dateKey];
        const sessionCard = document.createElement('div');
        sessionCard.className = 'session-card';

        const exCount = Object.keys(daySession.exercises).length;

        let formattedDate = dateKey;
        try {
            const d = new Date(dateKey);
            formattedDate = d.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        } catch(e) {}

        const splitBadgesHtml = Array.from(daySession.splits)
            .map(s => `<span class="badge-split">${s}</span>`)
            .join(' ');

        let exercisesHtml = '';

        Object.keys(daySession.exercises).forEach(exName => {
            const exData = daySession.exercises[exName];
            const turkishDesc = findExerciseDescription(exName);

            let setRowsHtml = '';
            exData.sets.forEach((set, idx) => {
                const rpeVal = set.rpe ? `@${set.rpe} Efor` : '-';

                let detailText = '';
                let valueText = '';

                if (set.split === 'Cardio' || set.setType === 'Cardio') {
                    detailText = `${set.reps} Dakika Süre <span class="badge-cardio">KARDİYO</span>`;
                    valueText = `%${set.weight} Eğim/Direnç`;
                } else {
                    const failureBadge = set.setType === 'Failure' ? `<span class="badge-failure">FAILURE</span>` : '';
                    detailText = `${set.sets} set &times; ${set.reps} tekrar ${failureBadge}`;
                    valueText = `${set.weight} kg`;
                }

                setRowsHtml += `
                    <div class="set-row">
                        <span class="set-idx">#${idx + 1}</span>
                        <span class="set-detail">${detailText}</span>
                        <span class="set-weight">${valueText}</span>
                        <span class="set-rpe">${rpeVal}</span>
                        <button class="btn-delete-row" title="Kaydı Sil" onclick="deleteWorkoutFromDB(${set.workoutId})">&times;</button>
                    </div>
                `;
            });

            exercisesHtml += `
                <div class="exercise-group">
                    <div class="exercise-group-header">
                        <div>
                            <div class="exercise-title" title="${turkishDesc}">
                                ${exName} <small style="font-size:0.75rem; color:var(--text-muted);">ℹ️</small>
                            </div>
                            <span class="exercise-sub">${exData.split} &bull; ${exData.muscleGroup} &bull; ${exData.equipment}</span>
                        </div>
                        <span class="set-idx">${exData.sets.length} Kayıt</span>
                    </div>
                    <div class="set-rows-grid">
                        ${setRowsHtml}
                    </div>
                </div>
            `;
        });

        sessionCard.innerHTML = `
            <div class="session-top">
                <div class="session-meta-left">
                    ${splitBadgesHtml}
                    <span class="session-date">${formattedDate}</span>
                </div>
                <span class="session-summary-pill">${exCount} Farklı Hareket</span>
            </div>
            ${exercisesHtml}
        `;

        feedContainer.appendChild(sessionCard);
    });
}

// --- PROGRAM YÖNETİMİ ---
function setRoutineDays(days) {
    selectedRoutineDays = days;
    document.querySelectorAll('.freq-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`freqBtn${days}`).classList.add('active');
    renderCleanRoutine();
}

function onRoutineFilterChange() {
    renderCleanRoutine();
}

function renderCleanRoutine() {
    const goalSelect = document.getElementById('routineGoalSelect');
    const selectedGoal = goalSelect ? goalSelect.value : "Hipertrofi (Kas Kazanımı)";
    const days = selectedRoutineDays;

    const goalData = PROGRAM_DATABASE[selectedGoal] || PROGRAM_DATABASE["Hipertrofi (Kas Kazanımı)"];
    const programData = goalData[days] || goalData[4];

    document.getElementById('routineHeadingTitle').innerText = programData.title;
    document.getElementById('routineHeadingDesc').innerText = programData.desc;

    const container = document.getElementById('routineDaysContainer');
    container.innerHTML = '';

    programData.days.forEach(day => {
        const dayBlock = document.createElement('div');
        dayBlock.className = 'routine-day-block';

        let rowsHtml = '';
        day.exercises.forEach((ex, idx) => {
            const exDataJson = JSON.stringify({
                split: day.split,
                name: ex.name,
                sets: ex.sets,
                reps: ex.reps,
                rpe: ex.rpe
            }).replace(/"/g, '&quot;');

            rowsHtml += `
                <tr>
                    <td style="width: 50px;"><span class="order-badge">${idx + 1}</span></td>
                    <td><strong style="color:#fff;">${ex.name}</strong></td>
                    <td style="color:var(--accent-lime); font-weight:800;">${ex.sets} Set</td>
                    <td style="color:#cbd5e1; font-weight:700;">${ex.reps}</td>
                    <td style="color:var(--text-muted);">${ex.rest}</td>
                    <td style="color:var(--text-muted); font-weight:700;">@${ex.rpe}</td>
                    <td style="text-align: right;">
                        <button class="btn-add-from-routine" onclick="quickFillWorkoutAuto('${exDataJson}')">
                            + Ekle
                        </button>
                    </td>
                </tr>
            `;
        });

        dayBlock.innerHTML = `
            <div class="routine-day-header">
                <div class="routine-day-title">
                    <span>${day.dayName}</span>
                    <span class="badge-split">${day.split}</span>
                </div>
                <span style="font-size:0.8rem; color:var(--text-muted);">${day.exercises.length} Sıralı Egzersiz</span>
            </div>
            <div class="table-responsive">
                <table class="routine-table">
                    <thead>
                        <tr>
                            <th>Sıra</th>
                            <th>Hareket Adı</th>
                            <th>Hedef Set</th>
                            <th>Hedef Tekrar</th>
                            <th>Dinlenme</th>
                            <th>Hedef RPE</th>
                            <th style="text-align: right;">Hızlı Kaydet</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
            </div>
        `;

        container.appendChild(dayBlock);
    });
}

function quickFillWorkoutAuto(jsonStr) {
    const data = JSON.parse(jsonStr.replace(/&quot;/g, '"'));
    
    openModal();

    const correctSplit = findSplitForExercise(data.name, data.split);

    const splitSelect = document.getElementById('split');
    if (splitSelect) {
        splitSelect.value = correctSplit;
        onProgramChange();
    }

    const exerciseSelect = document.getElementById('exerciseSelect');
    if (exerciseSelect) {
        exerciseSelect.value = data.name;
        updateExerciseDescription();
    }

    const setsInput = document.getElementById('sets');
    if (setsInput && data.sets) {
        setsInput.value = data.sets;
    }

    let parsedReps = 10;
    if (data.reps) {
        const match = data.reps.toString().match(/\d+/g);
        if (match && match.length > 0) {
            parsedReps = parseInt(match[match.length - 1]);
        }
    }

    if (correctSplit === 'Cardio') {
        const durInput = document.getElementById('cardioDuration');
        const incInput = document.getElementById('cardioIncline');
        if (durInput) durInput.value = parsedReps || 20;
        if (incInput) incInput.value = 8;
    } else {
        const repsInput = document.getElementById('reps');
        if (repsInput) repsInput.value = parsedReps;
    }

    if (data.rpe) {
        const rpeMatch = data.rpe.toString().match(/[\d.]+/g);
        if (rpeMatch && rpeMatch.length > 0) {
            const rpeInput = document.getElementById('rpe');
            if (rpeInput) rpeInput.value = parseFloat(rpeMatch[0]);
        }
    }

    setTimeout(() => {
        const weightInput = document.getElementById('weight');
        if (weightInput && correctSplit !== 'Cardio') {
            weightInput.focus();
        }
    }, 150);
}

// 4. Set / Kardiyo Ekle
document.getElementById('workoutForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const user = getSession();
    if (!user) return;

    const split = document.getElementById('split').value;
    const exerciseSelect = document.getElementById('exerciseSelect');
    const selectedOption = exerciseSelect.options[exerciseSelect.selectedIndex];

    const exerciseName = selectedOption.value;
    const muscleGroup = selectedOption.dataset.muscle || 'Genel';
    const equipment = selectedOption.dataset.equip || 'Ekipman';

    let sets = 1;
    let reps = 0;
    let weight = 0;
    let setType = 'Normal';

    if (split === 'Cardio') {
        setType = 'Cardio';
        sets = 1;
        reps = parseInt(document.getElementById('cardioDuration').value) || 0;
        weight = parseFloat(document.getElementById('cardioIncline').value) || 0;
    } else {
        setType = document.getElementById('setType').value;
        sets = parseInt(document.getElementById('sets').value) || 1;
        reps = parseInt(document.getElementById('reps').value) || 0;
        weight = parseFloat(document.getElementById('weight').value) || 0;
    }

    const payload = {
        userId: user.userId,
        workoutDate: document.getElementById('date').value,
        split: split,
        muscleGroup: muscleGroup,
        equipment: equipment,
        exerciseName: exerciseName,
        setType: setType,
        sets: sets,
        reps: reps,
        weight: weight,
        rpe: document.getElementById('rpe').value ? parseFloat(document.getElementById('rpe').value) : null
    };

    try {
        const res = await fetch(`${API_URL}/workouts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error('Kayıt başarısız!');

        closeModal();
        fetchWorkoutsFromDB();

        document.getElementById('sets').value = '';
        document.getElementById('reps').value = '';
        document.getElementById('weight').value = '';
        document.getElementById('cardioDuration').value = '';
        document.getElementById('cardioIncline').value = '';
        document.getElementById('rpe').value = '';
    } catch (err) {
        alert('Hata: ' + err.message);
    }
});

// 5. Set Sil
async function deleteWorkoutFromDB(workoutId) {
    if (!confirm("Bu kaydı silmek istediğine emin misin?")) return;

    try {
        const res = await fetch(`${API_URL}/workouts/${workoutId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Silinemedi!');
        fetchWorkoutsFromDB();
    } catch (err) {
        alert('Hata: ' + err.message);
    }
}

function openModal() { 
    document.getElementById('modalOverlay').style.display = 'flex'; 
    onProgramChange();
}
function closeModal() { document.getElementById('modalOverlay').style.display = 'none'; }
function handleOverlayClick(e) { if (e.target.id === 'modalOverlay') closeModal(); }

// --- DASHBOARD SEKME GEÇİŞİ ---
function switchDashboardTab(tabName) {
    const workoutsSec = document.getElementById('dashSectionWorkouts');
    const routineSec = document.getElementById('dashSectionRoutine');
    const profileSec = document.getElementById('dashSectionProfile');

    const tabWorkoutsBtn = document.getElementById('tabWorkoutsBtn');
    const tabRoutineBtn = document.getElementById('tabRoutineBtn');
    const tabProfileBtn = document.getElementById('tabProfileBtn');
    const addSetBtnTop = document.getElementById('addSetBtnTop');

    workoutsSec.classList.remove('active');
    routineSec.classList.remove('active');
    profileSec.classList.remove('active');
    tabWorkoutsBtn.classList.remove('active');
    tabRoutineBtn.classList.remove('active');
    tabProfileBtn.classList.remove('active');

    if (tabName === 'workouts') {
        workoutsSec.classList.add('active');
        tabWorkoutsBtn.classList.add('active');
        addSetBtnTop.style.display = 'inline-block';
    } else if (tabName === 'routine') {
        routineSec.classList.add('active');
        tabRoutineBtn.classList.add('active');
        addSetBtnTop.style.display = 'inline-block';
        renderCleanRoutine();
    } else {
        profileSec.classList.add('active');
        tabProfileBtn.classList.add('active');
        addSetBtnTop.style.display = 'none';
        loadAthleteProfile();
        renderWeeklyArchive();
    }
}

// Profil İşlemleri
async function loadAthleteProfile() {
    const user = getSession();
    if (!user) return;

    try {
        const res = await fetch(`${API_URL}/auth/profile/${user.userId}`);
        if (!res.ok) throw new Error("Profil alınamadı");
        const data = await res.json();

        document.getElementById('profFullName').value = data.fullName || '';
        document.getElementById('profEmail').value = data.email || '';
        document.getElementById('profPhone').value = data.phone || '';
        document.getElementById('profAge').value = data.age || '';
        document.getElementById('profHeight').value = data.height || '';
        document.getElementById('profWeight').value = data.weight || '';
        
        if (data.goal) {
            document.getElementById('profGoal').value = data.goal;
            const routineGoalSelect = document.getElementById('routineGoalSelect');
            if (routineGoalSelect) routineGoalSelect.value = data.goal;
        }

        document.getElementById('profileSummaryName').innerText = data.fullName;
        document.getElementById('profileAvatarLetter').innerText = data.fullName.charAt(0).toUpperCase();
        document.getElementById('profileGoalBadge').innerText = data.goal || 'Hipertrofi Odaklı';

        calculateBMI(data.height, data.weight);
        renderCleanRoutine();
    } catch (err) {
        console.error("Profil yüklenirken hata:", err);
    }
}

function calculateBMI(heightCm, weightKg) {
    const bmiValEl = document.getElementById('profileBmiVal');
    const bmiStatusEl = document.getElementById('profileBmiStatus');

    if (!heightCm || !weightKg) {
        bmiValEl.innerText = '--';
        bmiStatusEl.innerText = '--';
        return;
    }

    const hInMeter = heightCm / 100;
    const bmi = (weightKg / (hInMeter * hInMeter)).toFixed(1);
    bmiValEl.innerText = bmi;

    if (bmi < 18.5) {
        bmiStatusEl.innerText = 'Zayıf';
        bmiStatusEl.style.color = '#38bdf8';
    } else if (bmi < 25) {
        bmiStatusEl.innerText = 'İdeal / Fit';
        bmiStatusEl.style.color = 'var(--accent-lime)';
    } else if (bmi < 30) {
        bmiStatusEl.innerText = 'Kaslı / Kilolu';
        bmiStatusEl.style.color = '#f59e0b';
    } else {
        bmiStatusEl.innerText = 'Ağır Siklet';
        bmiStatusEl.style.color = 'var(--danger)';
    }
}

// Arşiv Grafiği
function renderWeeklyArchive() {
    const chartContainer = document.getElementById('weeklyBarChart');
    const listContainer = document.getElementById('pastWeeksList');

    chartContainer.innerHTML = '';
    listContainer.innerHTML = '';

    if (userWorkoutsCache.length === 0) {
        chartContainer.innerHTML = '<span style="color:var(--text-muted); font-size:0.85rem; padding: 20px;">Henüz kaydedilmiş hafta bulunmuyor.</span>';
        listContainer.innerHTML = '<span style="color:var(--text-muted); font-size:0.85rem;">Henüz kaydedilmiş hafta bulunmuyor.</span>';
        return;
    }

    const weekGroups = {};
    userWorkoutsCache.forEach(w => {
        if (!w.workoutDate) return;
        const wKey = getWeekKey(w.workoutDate);
        if (!weekGroups[wKey]) {
            weekGroups[wKey] = [];
        }
        weekGroups[wKey].push(w);
    });

    const sortedWeeks = Object.keys(weekGroups).sort();
    const currentWeekKey = getWeekKey(new Date());

    let maxSetsInAWeek = 1;
    const weeklySummary = sortedWeeks.map(wKey => {
        const items = weekGroups[wKey];
        const totalSets = items.reduce((acc, i) => acc + (i.sets || 1), 0);
        if (totalSets > maxSetsInAWeek) maxSetsInAWeek = totalSets;

        const daysSet = new Set(items.map(i => i.workoutDate.split('T')[0]));
        let peakW = 0;
        let peakEx = '';
        let failures = 0;
        items.forEach(i => {
            if (i.split !== 'Cardio' && i.weight > peakW) {
                peakW = i.weight;
                peakEx = i.exerciseName;
            }
            if (i.setType === 'Failure') failures++;
        });

        return {
            key: wKey,
            label: formatWeekRange(wKey),
            isCurrent: wKey === currentWeekKey,
            totalSets: totalSets,
            workoutDays: daysSet.size,
            peakWeight: peakW,
            peakExercise: peakEx,
            failures: failures
        };
    });

    weeklySummary.forEach(w => {
        const col = document.createElement('div');
        col.className = 'chart-col';
        const heightPct = Math.max(12, Math.round((w.totalSets / maxSetsInAWeek) * 100));

        col.innerHTML = `
            <span class="chart-val">${w.totalSets}</span>
            <div class="chart-bar-wrap">
                <div class="chart-bar-fill" style="height: ${heightPct}%; ${w.isCurrent ? 'background: #fff;' : ''}"></div>
            </div>
            <span class="chart-lbl">${w.isCurrent ? 'Bu Hafta' : w.label.split(' - ')[0]}</span>
        `;
        chartContainer.appendChild(col);
    });

    const reversedWeeks = [...weeklySummary].reverse();
    reversedWeeks.forEach(w => {
        const card = document.createElement('div');
        card.className = 'past-week-card';
        card.innerHTML = `
            <div class="past-week-title">
                <span class="past-week-name">${w.label}</span>
                <span class="past-week-badge">${w.isCurrent ? 'DEVAM EDİYOR' : 'TAMAMLANDI'}</span>
            </div>
            <div class="past-week-stats">
                <div class="past-week-stat-item">
                    İdman Günü
                    <strong>${w.workoutDays} Gün</strong>
                </div>
                <div class="past-week-stat-item">
                    Toplam Hacim
                    <strong>${w.totalSets} Set/Seans</strong>
                </div>
                <div class="past-week-stat-item">
                    Bu Haftanın Zirvesi
                    <strong style="color:var(--accent-lime);">${w.peakWeight} kg</strong>
                </div>
                <div class="past-week-stat-item">
                    Tükeniş
                    <strong style="color:var(--danger);">${w.failures} Fail</strong>
                </div>
            </div>
        `;
        listContainer.appendChild(card);
    });
}

// 6. Profil Güncelleme
document.getElementById('athleteProfileForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const user = getSession();
    if (!user) return;

    const newGoal = document.getElementById('profGoal').value;

    const payload = {
        fullName: document.getElementById('profFullName').value.trim(),
        phone: document.getElementById('profPhone').value.trim(),
        age: document.getElementById('profAge').value ? parseInt(document.getElementById('profAge').value) : null,
        height: document.getElementById('profHeight').value ? parseFloat(document.getElementById('profHeight').value) : null,
        weight: document.getElementById('profWeight').value ? parseFloat(document.getElementById('profWeight').value) : null,
        goal: newGoal
    };

    try {
        const res = await fetch(`${API_URL}/auth/profile/${user.userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("Güncelleme başarısız!");
        const updated = await res.json();

        user.fullName = updated.fullName;
        setSession(user);
        document.getElementById('dashUserName').innerText = updated.fullName.toUpperCase();
        
        loadAthleteProfile();
        alert('Profil bilgilerin ve antrenman hedefin başarıyla güncellendi!');
    } catch (err) {
        alert('Hata: ' + err.message);
    }
});

updateNavbar();
if (getSession()) {
    navigateTo('dashboard');
} else {
    navigateTo('landing');
}
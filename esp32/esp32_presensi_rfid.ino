/**
 * ============================================
 * SISTEM PRESENSI IoT - KODE ESP32
 * ============================================
 * 
 * Komponen yang dibutuhkan:
 * - ESP32 DevKit V1
 * - RFID Reader MFRC522
 * - Buzzer aktif
 * - LED RGB atau 2 LED (Hijau & Merah)
 * - LCD I2C 16x2 (opsional)
 * 
 * Wiring MFRC522 ke ESP32:
 * - SDA  -> GPIO 5
 * - SCK  -> GPIO 18
 * - MOSI -> GPIO 23
 * - MISO -> GPIO 19
 * - RST  -> GPIO 22
 * - 3.3V -> 3.3V
 * - GND  -> GND
 * 
 * Wiring Buzzer & LED:
 * - Buzzer -> GPIO 2
 * - LED Hijau -> GPIO 4
 * - LED Merah -> GPIO 15
 * 
 * Wiring LCD I2C (opsional):
 * - SDA -> GPIO 21
 * - SCL -> GPIO 22
 * - VCC -> 5V
 * - GND -> GND
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <SPI.h>
#include <MFRC522.h>

// Uncomment baris berikut jika menggunakan LCD I2C
// #include <LiquidCrystal_I2C.h>

// ============================================
// KONFIGURASI - SESUAIKAN DENGAN KEBUTUHAN
// ============================================

// WiFi Configuration
const char* WIFI_SSID = "NAMA_WIFI_ANDA";         // Ganti dengan nama WiFi Anda
const char* WIFI_PASSWORD = "PASSWORD_WIFI_ANDA"; // Ganti dengan password WiFi

// Server Configuration
const char* SERVER_URL = "http://192.168.1.100:5000/api/iot/scan"; // Ganti dengan IP server
const char* DEVICE_ID = "GATE1";                                    // ID perangkat

// Pin Configuration - MFRC522
#define SS_PIN     5      // SDA / SS
#define RST_PIN    22     // RST
#define SCK_PIN    18     // SCK
#define MOSI_PIN   23     // MOSI
#define MISO_PIN   19     // MISO

// Pin Configuration - Output
#define BUZZER_PIN    2   // Buzzer
#define LED_GREEN_PIN 4   // LED Hijau (sukses)
#define LED_RED_PIN   15  // LED Merah (error)

// Timing Configuration
#define SCAN_DELAY     2000   // Delay antar scan (ms)
#define WIFI_TIMEOUT   20000  // Timeout koneksi WiFi (ms)
#define HTTP_TIMEOUT   10000  // Timeout HTTP request (ms)

// ============================================
// INISIALISASI OBJEK
// ============================================

MFRC522 rfid(SS_PIN, RST_PIN);
MFRC522::MIFARE_Key key;

// Uncomment jika menggunakan LCD I2C (alamat 0x27 atau 0x3F)
// LiquidCrystal_I2C lcd(0x27, 16, 2);

// ============================================
// VARIABEL GLOBAL
// ============================================

String lastUID = "";
unsigned long lastScanTime = 0;
bool wifiConnected = false;

// ============================================
// SETUP
// ============================================

void setup() {
    // Inisialisasi Serial
    Serial.begin(115200);
    delay(1000);
    
    Serial.println();
    Serial.println("========================================");
    Serial.println("   SISTEM PRESENSI IoT - ESP32");
    Serial.println("========================================");
    
    // Inisialisasi pin output
    pinMode(BUZZER_PIN, OUTPUT);
    pinMode(LED_GREEN_PIN, OUTPUT);
    pinMode(LED_RED_PIN, OUTPUT);
    
    // Matikan semua output
    digitalWrite(BUZZER_PIN, LOW);
    digitalWrite(LED_GREEN_PIN, LOW);
    digitalWrite(LED_RED_PIN, LOW);
    
    // Inisialisasi LCD (jika digunakan)
    // lcd.init();
    // lcd.backlight();
    // lcd.clear();
    // lcd.print("Sistem Presensi");
    // lcd.setCursor(0, 1);
    // lcd.print("Inisialisasi...");
    
    // Inisialisasi SPI dan RFID
    SPI.begin(SCK_PIN, MISO_PIN, MOSI_PIN, SS_PIN);
    rfid.PCD_Init();
    
    // Cek RFID reader
    byte version = rfid.PCD_ReadRegister(rfid.VersionReg);
    if (version == 0x00 || version == 0xFF) {
        Serial.println("❌ RFID Reader tidak terdeteksi!");
        errorBeep(3);
        while (1) {
            digitalWrite(LED_RED_PIN, HIGH);
            delay(500);
            digitalWrite(LED_RED_PIN, LOW);
            delay(500);
        }
    }
    Serial.print("✅ RFID Reader terdeteksi. Versi: 0x");
    Serial.println(version, HEX);
    
    // Inisialisasi MIFARE Key
    for (byte i = 0; i < 6; i++) {
        key.keyByte[i] = 0xFF;
    }
    
    // Koneksi WiFi
    connectWiFi();
    
    // Indikator siap
    if (wifiConnected) {
        successBeep();
        Serial.println();
        Serial.println("✅ Sistem siap! Silakan tempelkan kartu...");
        Serial.println("----------------------------------------");
        
        // lcd.clear();
        // lcd.print("Sistem Siap");
        // lcd.setCursor(0, 1);
        // lcd.print("Tempelkan Kartu");
    }
}

// ============================================
// LOOP UTAMA
// ============================================

void loop() {
    // Cek koneksi WiFi
    if (WiFi.status() != WL_CONNECTED) {
        wifiConnected = false;
        digitalWrite(LED_RED_PIN, HIGH);
        connectWiFi();
        return;
    }
    
    // LED hijau menyala = sistem siap
    digitalWrite(LED_GREEN_PIN, HIGH);
    digitalWrite(LED_RED_PIN, LOW);
    
    // Cek apakah ada kartu baru
    if (!rfid.PICC_IsNewCardPresent()) {
        return;
    }
    
    // Baca UID kartu
    if (!rfid.PICC_ReadCardSerial()) {
        return;
    }
    
    // Ambil UID sebagai string hexadecimal
    String uid = getCardUID();
    
    // Cegah double-scan (kartu yang sama dalam waktu singkat)
    if (uid == lastUID && (millis() - lastScanTime) < SCAN_DELAY) {
        rfid.PICC_HaltA();
        rfid.PCD_StopCrypto1();
        return;
    }
    
    // Simpan scan terakhir
    lastUID = uid;
    lastScanTime = millis();
    
    Serial.println();
    Serial.print("📶 Kartu terdeteksi: ");
    Serial.println(uid);
    
    // lcd.clear();
    // lcd.print("Memproses...");
    // lcd.setCursor(0, 1);
    // lcd.print(uid);
    
    // Kirim ke server
    sendToServer(uid);
    
    // Hentikan komunikasi dengan kartu
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
    
    Serial.println("----------------------------------------");
}

// ============================================
// FUNGSI: Koneksi WiFi
// ============================================

void connectWiFi() {
    Serial.println();
    Serial.print("📡 Menghubungkan ke WiFi: ");
    Serial.println(WIFI_SSID);
    
    // lcd.clear();
    // lcd.print("Connecting WiFi");
    // lcd.setCursor(0, 1);
    // lcd.print(WIFI_SSID);
    
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    
    unsigned long startTime = millis();
    int dots = 0;
    
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
        dots++;
        
        // Blink LED merah saat connecting
        digitalWrite(LED_RED_PIN, dots % 2 == 0 ? HIGH : LOW);
        
        // Timeout check
        if (millis() - startTime > WIFI_TIMEOUT) {
            Serial.println();
            Serial.println("❌ Gagal terhubung ke WiFi!");
            errorBeep(3);
            
            // lcd.clear();
            // lcd.print("WiFi GAGAL!");
            // lcd.setCursor(0, 1);
            // lcd.print("Restart...");
            
            delay(5000);
            ESP.restart();
        }
    }
    
    wifiConnected = true;
    digitalWrite(LED_RED_PIN, LOW);
    
    Serial.println();
    Serial.println("✅ WiFi terhubung!");
    Serial.print("   IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("   RSSI: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
}

// ============================================
// FUNGSI: Mendapatkan UID Kartu
// ============================================

String getCardUID() {
    String uid = "";
    for (byte i = 0; i < rfid.uid.size; i++) {
        if (rfid.uid.uidByte[i] < 0x10) {
            uid += "0";
        }
        uid += String(rfid.uid.uidByte[i], HEX);
    }
    uid.toUpperCase();
    return uid;
}

// ============================================
// FUNGSI: Kirim Data ke Server
// ============================================

void sendToServer(String uid) {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("❌ WiFi tidak terhubung!");
        errorBeep(2);
        return;
    }
    
    HTTPClient http;
    http.begin(SERVER_URL);
    http.addHeader("Content-Type", "application/json");
    http.setTimeout(HTTP_TIMEOUT);
    
    // Buat JSON payload
    StaticJsonDocument<200> jsonDoc;
    jsonDoc["rfid_uid"] = uid;
    jsonDoc["device_id"] = DEVICE_ID;
    
    String jsonString;
    serializeJson(jsonDoc, jsonString);
    
    Serial.print("📤 Mengirim ke server: ");
    Serial.println(jsonString);
    
    // Kirim POST request
    int httpCode = http.POST(jsonString);
    
    if (httpCode > 0) {
        String response = http.getString();
        Serial.print("📥 Response (");
        Serial.print(httpCode);
        Serial.print("): ");
        Serial.println(response);
        
        // Parse response JSON
        StaticJsonDocument<512> responseDoc;
        DeserializationError error = deserializeJson(responseDoc, response);
        
        if (!error) {
            bool success = responseDoc["success"];
            
            if (success) {
                // SUKSES
                const char* action = responseDoc["action"];
                const char* message = responseDoc["message"];
                const char* memberName = responseDoc["data"]["member"]["name"];
                
                Serial.println();
                Serial.print("✅ ");
                Serial.println(message);
                
                if (strcmp(action, "clock_in") == 0) {
                    // Clock In
                    const char* status = responseDoc["data"]["status"];
                    const char* time = responseDoc["data"]["time"];
                    
                    Serial.print("   Waktu Masuk: ");
                    Serial.println(time);
                    Serial.print("   Status: ");
                    Serial.println(status);
                    
                    // lcd.clear();
                    // lcd.print("MASUK - ");
                    // lcd.print(strcmp(status, "LATE") == 0 ? "TELAT" : "TEPAT");
                    // lcd.setCursor(0, 1);
                    // lcd.print(memberName);
                    
                    if (strcmp(status, "LATE") == 0) {
                        // Terlambat - buzzer panjang
                        lateBeep();
                    } else {
                        // Tepat waktu
                        successBeep();
                    }
                    
                } else if (strcmp(action, "clock_out") == 0) {
                    // Clock Out
                    const char* time = responseDoc["data"]["time"];
                    
                    Serial.print("   Waktu Pulang: ");
                    Serial.println(time);
                    
                    // lcd.clear();
                    // lcd.print("PULANG");
                    // lcd.setCursor(0, 1);
                    // lcd.print(memberName);
                    
                    successBeep();
                    successBeep();
                }
                
            } else {
                // GAGAL
                const char* errorCode = responseDoc["error"];
                const char* errorMessage = responseDoc["message"];
                
                Serial.println();
                Serial.print("❌ Error: ");
                Serial.println(errorMessage);
                
                // lcd.clear();
                // lcd.print("GAGAL!");
                // lcd.setCursor(0, 1);
                
                if (strcmp(errorCode, "CARD_NOT_FOUND") == 0) {
                    // lcd.print("Kartu Tdk Dikenal");
                    errorBeep(3);
                } else if (strcmp(errorCode, "CARD_INACTIVE") == 0) {
                    // lcd.print("Kartu Nonaktif");
                    errorBeep(2);
                } else if (strcmp(errorCode, "CARD_NOT_PAIRED") == 0) {
                    // lcd.print("Kartu Blm Diatur");
                    errorBeep(2);
                } else if (strcmp(errorCode, "ALREADY_COMPLETED") == 0) {
                    // lcd.print("Sudah Lengkap");
                    warningBeep();
                } else {
                    // lcd.print("Error");
                    errorBeep(1);
                }
            }
        } else {
            Serial.println("❌ Error parsing JSON response");
            errorBeep(1);
        }
        
    } else {
        Serial.print("❌ HTTP Error: ");
        Serial.println(http.errorToString(httpCode));
        
        // lcd.clear();
        // lcd.print("Server Error!");
        // lcd.setCursor(0, 1);
        // lcd.print("Coba lagi...");
        
        errorBeep(3);
    }
    
    http.end();
    
    // Delay sebelum kembali ke mode standby
    delay(2000);
    
    // lcd.clear();
    // lcd.print("Sistem Siap");
    // lcd.setCursor(0, 1);
    // lcd.print("Tempelkan Kartu");
}

// ============================================
// FUNGSI: Buzzer & LED Feedback
// ============================================

// Beep sukses - 1 beep pendek
void successBeep() {
    digitalWrite(LED_GREEN_PIN, HIGH);
    digitalWrite(BUZZER_PIN, HIGH);
    delay(100);
    digitalWrite(BUZZER_PIN, LOW);
    delay(100);
}

// Beep terlambat - 1 beep panjang
void lateBeep() {
    digitalWrite(LED_GREEN_PIN, HIGH);
    digitalWrite(LED_RED_PIN, HIGH);
    digitalWrite(BUZZER_PIN, HIGH);
    delay(500);
    digitalWrite(BUZZER_PIN, LOW);
    digitalWrite(LED_RED_PIN, LOW);
    delay(200);
}

// Beep warning - 2 beep cepat
void warningBeep() {
    for (int i = 0; i < 2; i++) {
        digitalWrite(LED_RED_PIN, HIGH);
        digitalWrite(BUZZER_PIN, HIGH);
        delay(100);
        digitalWrite(BUZZER_PIN, LOW);
        digitalWrite(LED_RED_PIN, LOW);
        delay(100);
    }
}

// Beep error - n beep berulang
void errorBeep(int count) {
    for (int i = 0; i < count; i++) {
        digitalWrite(LED_RED_PIN, HIGH);
        digitalWrite(BUZZER_PIN, HIGH);
        delay(200);
        digitalWrite(BUZZER_PIN, LOW);
        digitalWrite(LED_RED_PIN, LOW);
        delay(200);
    }
}

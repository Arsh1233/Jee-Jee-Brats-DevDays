/*
 * ⚡ PowerPilot — ESP8266 NodeMCU Relay + LED Controller
 * 
 * Circuit:
 *   NodeMCU D1 (GPIO5)  → Relay IN
 *   NodeMCU D2 (GPIO4)  → LED Anode (+) → 220Ω → GND
 *   NodeMCU Vin         → Relay VCC
 *   NodeMCU GND         → Relay GND
 *
 * Endpoints:
 *   GET /on    → Turns relay ON + LED ON
 *   GET /off   → Turns relay OFF + LED OFF
 *   GET /status → Returns current state as JSON
 *   GET /toggle → Toggles current state
 *
 * Usage in PowerPilot App:
 *   Protocol: HTTP
 *   Turn ON URL:  http://<ESP_IP>/on
 *   Turn OFF URL: http://<ESP_IP>/off
 */

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>

// ─── WiFi Credentials ──────────────────────────────────────────
// ⚠️  CHANGE THESE to your WiFi network name and password
const char* ssid     = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";

// ─── Pin Definitions ───────────────────────────────────────────
#define RELAY_PIN  D1   // GPIO5 — Relay IN
#define LED_PIN    D2   // GPIO4 — Status LED

// ─── State ─────────────────────────────────────────────────────
bool deviceOn = false;

// ─── Web Server on port 80 ─────────────────────────────────────
ESP8266WebServer server(80);

// ── CORS headers (allow PowerPilot backend to call) ────────────
void setCORSHeaders() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

// ── Turn ON ────────────────────────────────────────────────────
void handleOn() {
  deviceOn = true;
  digitalWrite(RELAY_PIN, HIGH);  // Relay ON  (active HIGH)
  digitalWrite(LED_PIN, HIGH);    // LED ON
  
  setCORSHeaders();
  server.send(200, "application/json", 
    "{\"status\":\"on\",\"relay\":true,\"led\":true,\"device\":\"PowerPilot-ESP8266\"}");
  
  Serial.println("✅ RELAY ON  | LED ON");
}

// ── Turn OFF ───────────────────────────────────────────────────
void handleOff() {
  deviceOn = false;
  digitalWrite(RELAY_PIN, LOW);   // Relay OFF
  digitalWrite(LED_PIN, LOW);     // LED OFF
  
  setCORSHeaders();
  server.send(200, "application/json", 
    "{\"status\":\"off\",\"relay\":false,\"led\":false,\"device\":\"PowerPilot-ESP8266\"}");
  
  Serial.println("🔴 RELAY OFF | LED OFF");
}

// ── Toggle ─────────────────────────────────────────────────────
void handleToggle() {
  if (deviceOn) {
    handleOff();
  } else {
    handleOn();
  }
}

// ── Status ─────────────────────────────────────────────────────
void handleStatus() {
  setCORSHeaders();
  String json = "{\"status\":\"";
  json += deviceOn ? "on" : "off";
  json += "\",\"relay\":";
  json += deviceOn ? "true" : "false";
  json += ",\"led\":";
  json += deviceOn ? "true" : "false";
  json += ",\"device\":\"PowerPilot-ESP8266\"";
  json += ",\"ip\":\"";
  json += WiFi.localIP().toString();
  json += "\",\"rssi\":";
  json += WiFi.RSSI();
  json += ",\"uptime\":";
  json += millis() / 1000;
  json += "}";
  
  server.send(200, "application/json", json);
}

// ── Root page (simple web UI for manual testing) ───────────────
void handleRoot() {
  setCORSHeaders();
  String html = "<!DOCTYPE html><html><head>";
  html += "<meta name='viewport' content='width=device-width,initial-scale=1'>";
  html += "<title>PowerPilot ESP8266</title>";
  html += "<style>";
  html += "body{font-family:system-ui;background:#0b2a52;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0}";
  html += "h1{font-size:24px;margin-bottom:8px}";
  html += "p{color:rgba(255,255,255,0.6);margin-bottom:32px}";
  html += ".btn{display:inline-block;padding:16px 48px;border-radius:14px;font-size:18px;font-weight:700;border:none;cursor:pointer;margin:8px;text-decoration:none;color:#fff}";
  html += ".on{background:#2e7d32}.off{background:#c62828}.toggle{background:#1565c0}";
  html += ".status{margin-top:24px;padding:16px 24px;background:rgba(255,255,255,0.1);border-radius:12px;font-size:14px}";
  html += "</style></head><body>";
  html += "<h1>⚡ PowerPilot ESP8266</h1>";
  html += "<p>Relay + LED Controller</p>";
  html += "<div>";
  html += "<a class='btn on' href='/on'>TURN ON</a>";
  html += "<a class='btn off' href='/off'>TURN OFF</a>";
  html += "<a class='btn toggle' href='/toggle'>TOGGLE</a>";
  html += "</div>";
  html += "<div class='status'>";
  html += "State: <b>" + String(deviceOn ? "🟢 ON" : "🔴 OFF") + "</b>";
  html += " &nbsp;|&nbsp; IP: <b>" + WiFi.localIP().toString() + "</b>";
  html += " &nbsp;|&nbsp; RSSI: " + String(WiFi.RSSI()) + " dBm";
  html += "</div>";
  html += "</body></html>";
  
  server.send(200, "text/html", html);
}

// ── CORS preflight ─────────────────────────────────────────────
void handleOptions() {
  setCORSHeaders();
  server.send(204);
}

void setup() {
  Serial.begin(115200);
  Serial.println("\n\n");
  Serial.println("============================================");
  Serial.println("  ⚡ PowerPilot ESP8266 — Starting...");
  Serial.println("============================================");
  
  // Initialize pins
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);  // Start with relay OFF
  digitalWrite(LED_PIN, LOW);    // Start with LED OFF
  
  // Connect to WiFi
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  
  // Blink LED while connecting
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 60) {
    delay(500);
    Serial.print(".");
    digitalWrite(LED_PIN, !digitalRead(LED_PIN));  // Blink LED
    attempts++;
  }
  
  digitalWrite(LED_PIN, LOW);  // LED off after connected
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi Connected!");
    Serial.print("📡 IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.println("============================================");
    Serial.println("  Endpoints:");
    Serial.println("    GET /on     → Turn Relay + LED ON");
    Serial.println("    GET /off    → Turn Relay + LED OFF");
    Serial.println("    GET /toggle → Toggle state");
    Serial.println("    GET /status → JSON status");
    Serial.println("============================================");
    Serial.println("");
    Serial.println("  In PowerPilot App:");
    Serial.print("    ON URL:  http://");
    Serial.print(WiFi.localIP());
    Serial.println("/on");
    Serial.print("    OFF URL: http://");
    Serial.print(WiFi.localIP());
    Serial.println("/off");
    Serial.println("============================================");
    
    // Quick LED flash to confirm connection
    for (int i = 0; i < 3; i++) {
      digitalWrite(LED_PIN, HIGH); delay(100);
      digitalWrite(LED_PIN, LOW);  delay(100);
    }
  } else {
    Serial.println("\n❌ WiFi Connection FAILED!");
    Serial.println("Check ssid/password and try again.");
    // Rapid blink to indicate error
    while (true) {
      digitalWrite(LED_PIN, HIGH); delay(100);
      digitalWrite(LED_PIN, LOW);  delay(100);
    }
  }
  
  // Setup HTTP routes
  server.on("/",       HTTP_GET,     handleRoot);
  server.on("/on",     HTTP_GET,     handleOn);
  server.on("/on",     HTTP_POST,    handleOn);
  server.on("/off",    HTTP_GET,     handleOff);
  server.on("/off",    HTTP_POST,    handleOff);
  server.on("/toggle", HTTP_GET,     handleToggle);
  server.on("/toggle", HTTP_POST,    handleToggle);
  server.on("/status", HTTP_GET,     handleStatus);
  server.on("/on",     HTTP_OPTIONS, handleOptions);
  server.on("/off",    HTTP_OPTIONS, handleOptions);
  server.on("/toggle", HTTP_OPTIONS, handleOptions);
  server.on("/status", HTTP_OPTIONS, handleOptions);
  
  server.begin();
  Serial.println("🌐 HTTP Server started on port 80");
}

void loop() {
  server.handleClient();
}

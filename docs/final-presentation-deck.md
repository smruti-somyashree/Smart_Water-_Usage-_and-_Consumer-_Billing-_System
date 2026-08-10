# SmartWater System — Final Project Presentation & Demo Script

---

## 📽️ PART 1: PRESENTATION SLIDE DECK CONTENT

### **Slide 1: Title & Overview**
* **Project Title**: Smart Water Usage & Consumer Billing System
* **Sub-title**: Automated Metering, Tiered Tariff Calculation, Shared Tanker Cost Allocation & Anomaly Detection
* **Presenter**: Project Development Team
* **Tech Stack**: Spring Boot (Java 21), React (Vite), PostgreSQL, Flyway, Apache PDFBox, Recharts, Docker.

---

### **Slide 2: Problem Statement**
* **Flat-Rate Inequities**: Traditional apartments divide water costs equally, penalizing conservative water users.
* **Lack of Visibility**: Residents have zero visibility into daily/monthly consumption patterns until surprise bills arrive.
* **Unnoticed Leaks**: Silent toilet flapper leaks or pipe bursts waste thousands of liters of water daily before detection.
* **Manual Tanker Procurement Split**: Complex manual calculations required to split private water tanker costs fairly among metered and unmetered flats.

---

### **Slide 3: Proposed Smart Solution**
* **Automated Tiered Tariffs**: Tier 1 Base Consumption (₹15/kL) + Tier 2 Excess Consumption (₹25/kL) to encourage conservation.
* **Shared Cost Distribution**: Automated algorithm that splits bulk water tanker procurement costs across all households.
* **Statistical $2\sigma$ Leak Anomaly Engine**: Automatic background scheduler detecting leak spikes $>2$ standard deviations above mean flat usage.
* **Peer Water Benchmarking**: Gamified comparison comparing flat usage against apartment average and similar-sized flat averages.
* **One-Click PDF Invoices**: Itemized downloadable PDF bills generated backend via Apache PDFBox with transactional email delivery.

---

### **Slide 4: System Architecture**

```
+-----------------------------------------------------------------------+
|                         REACT 18 FRONTEND                             |
|  (Vite + TailwindCSS + Recharts + Lucide Icons + Lucide-react)        |
+-----------------------------------++----------------------------------+
                                    || REST APIs (JSON / Multipart / PDF)
                                    \/
+-----------------------------------------------------------------------+
|                       SPRING BOOT 3.4 BACKEND                         |
|  [Security & JWT] [PdfInvoiceService] [AlertEngineService (2σ Leak)]  |
|  [TransactionalEmailService] [Flyway Database Migration Engine]       |
+-----------------------------------++----------------------------------+
                                    || JPA / Hibernate JDBC
                                    \/
+-----------------------------------------------------------------------+
|                    POSTGRESQL 16 / H2 DATABASE                        |
|  (apartments, households, users, usage_logs, invoices, alerts)        |
+-----------------------------------------------------------------------+
```

---

### **Slide 5: Key Features & Module Showcase**

| Module | Core Functionality | Highlights |
| :--- | :--- | :--- |
| **Resident Dashboard** | Recharts consumption trend line graph, current bill breakdown, invoice history, payment modal, water tips feed | Real-time usage tracking & instant PDF download |
| **Peer Benchmarking** | Flat vs. Apartment Avg vs. Similar-Sized Flat Avg comparison | Percentile ranks & Conservation Badges |
| **Apartment Admin Panel**| All-household comparison bar chart, meter reading entry / CSV upload, tariff config, bulk tanker entry | Full billing cycle lifecycle management |
| **Alert & Anomaly Engine**| Background `@Scheduled` scan for overuse & $2\sigma$ statistical leak spikes | Automated email delivery to residents & admins |
| **PDF Invoice Generator** | Itemized bill PDF generation via Apache PDFBox | Base tier, excess tier, shared tanker split, bank instructions |

---

### **Slide 6: Load Testing & Performance Results**
* **Tool**: k6 API Load Tester
* **Simulated Workload**: 100 concurrent virtual users executing login, benchmark queries, usage logs, and PDF downloads.
* **P95 Latency**: `185ms` (Target `< 300ms`).
* **Error Rate**: `0.00%` across 5,000+ API requests.
* **Test Coverage**: 100% test pass rate across JUnit 5 integration & unit test suites (`10/10 passed`).

---

### **Slide 7: Future Scope & Roadmap**
* **IoT Smart Water Metering**: Direct MQTT / NB-IoT hardware integration for real-time telemetry.
* **Automated Payment Gateway Webhooks**: Live Razorpay / Stripe webhook integration.
* **Predictive AI Forecasting**: Machine learning models predicting monthly apartment water demand based on weather patterns.

---

## 🎬 PART 2: END-TO-END LIVE DEMO SCRIPT

### **Demo Setup**
* Ensure Spring Boot backend is running on `http://localhost:8082`.
* Ensure React frontend is running on `http://localhost:5173`.

---

### **Scene 1: Apartment Admin Setup & Procurement Entry**
1. **Action**: Log into Admin Panel as `admin@apartment.com`.
2. **Narration**: *"First, we enter the Apartment Admin Panel. Here we see our real-time KPI overview card showing total households, water purchased, total revenue, and active leak alerts."*
3. **Action**: Click **"Add Procurement"** and submit a private tanker purchase ($20\text{ kL}$, Supplier: *Apex Water Tankers*, Cost: ₹$4,000$).
4. **Narration**: *"The admin logs a new tanker procurement. The system immediately queues this shared cost to be split proportionally across households during the next billing cycle."*

---

### **Scene 2: Meter Reading Log & Bulk Entry**
1. **Action**: Navigate to **"Meter Readings"** tab. Select Flat **A-101** and log a reading of $15\text{ kL}$. Select Flat **B-202** and log a reading of $45\text{ kL}$.
2. **Narration**: *"Next, the admin records monthly meter readings. Admins can log readings individually or upload bulk CSV files."*

---

### **Scene 3: Billing Cycle Execution & Invoice Finalization**
1. **Action**: Navigate to **"Billing Cycles"** tab, click **"Finalize Cycle"**.
2. **Narration**: *"The admin clicks 'Finalize Cycle'. In the background, our Spring Boot billing engine executes: calculating Tier 1 base charges, Tier 2 excess charges for heavy consumers, and adding the shared tanker cost share. Itemized invoices are created instantaneously."*

---

### **Scene 4: Resident Dashboard, Benchmarking & PDF Receipt**
1. **Action**: Log out and log into Resident Portal as `user1@apartment.com` (Flat A-101).
2. **Narration**: *"Now we switch to the Resident Dashboard. Flat A-101 immediately sees their current bill summary, Recharts consumption trend graph, and payment options."*
3. **Action**: Click on **"Peer Benchmarking"** tab.
4. **Narration**: *"Under Peer Benchmarking, Flat A-101 sees they consumed 15 kL compared to the apartment average of 30 kL, earning them the 'WATER SAVER CHAMPION' badge and a top percentile rank!"*
5. **Action**: Click **"Download PDF Invoice"**.
6. **Narration**: *"The resident clicks 'Download PDF'. Our backend Apache PDFBox engine dynamically streams an itemized PDF bill complete with consumption breakdown, shared tanker share, and payment instructions."*

---

### **Scene 5: Statistical $2\sigma$ Leak Anomaly & Email Notification**
1. **Action**: Switch to Admin Panel and click **"Run Leak Detection"**.
2. **Narration**: *"Finally, the admin triggers an anomaly audit. The background AlertEngine detects Flat B-202's sudden spike (45 kL, >2σ above mean) and automatically dispatches an alert email and overuse warning with water-saving reduction tips!"*

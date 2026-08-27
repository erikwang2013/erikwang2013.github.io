/* 中英文切换：data-i18n 键 → EN 文案；ZH 文案首载时从 DOM 原文抓取，避免双份维护。 */
(() => {
  const EN = {
    /* nav */
    'nav-skills': 'Core Skills',
    'nav-strengths': 'Strengths',
    'nav-experience': 'Experience',
    'nav-projects': 'Projects',
    'nav-education': 'Education',
    /* hero */
    'hero-role': 'Full-Stack Engineer · 12+ yrs of large-scale architecture & high-concurrency services',
    'tag-intent': 'Job Preference: Shenzhen / Hong Kong / Global Remote',
    'tag-stack': 'Full-Stack / PHP / Go',
    'tag-age': '37 years old (b. Sep 1989)',
    'tag-loc': "Based in Gushu, Bao'an, Shenzhen",
    'blog-label': 'Blog: ',
    'github-label': 'GitHub: ',
    'dl-color': 'Download Color CV',
    'dl-bw': 'Download B/W CV',
    /* skills */
    'skill-sec': 'Core Skills',
    'skill-lang': 'Programming Languages',
    'chip-php': 'PHP (Proficient)',
    'chip-go': 'Go (Skilled)',
    'chip-py': 'Python (Skilled)',
    'chip-vue': 'Vue (Skilled)',
    'chip-js': 'JavaScript (Skilled)',
    'chip-flutter': 'Flutter (Skilled)',
    'skill-framework': 'Frameworks (PHP/Go)',
    'skill-db': 'Databases & Middleware',
    'skill-ops': 'DevOps & Tools',
    /* strengths */
    'str-sec': 'Key Strengths',
    'str-arch': 'Large-Scale Architecture',
    'str-arch-d': 'Microservice decomposition for high concurrency, service governance, database tuning — sustaining 99.99% availability.',
    'str-biz': 'Business-Technology Integration',
    'str-biz-d': 'Delivering complex business systems: cloud resource orchestration, payment & billing, real-time order matching.',
    'str-team': 'Team Leadership & Efficiency',
    'str-team-d': 'Cross-stack collaboration (PHP/Go/Java/Frontend); established coding standards & CI/CD to lift delivery quality.',
    'str-learn': 'Continuous Learning & Innovation',
    'str-learn-d': 'Quickly adopts Rust & HarmonyOS; built AI coding assistants that cut repetitive work.',
    /* experience */
    'exp-sec': 'Work Experience',
    'exp1-co': 'Shenzhen Xinglianyun Technology Co., Ltd.',
    'exp1-role': 'PHP Developer',
    'exp1-p1': 'Led microservice decomposition of an IDC cloud management platform (5 core domains: API-Gateway, Middleware, Business, File, Log) on Webman+Swoole with Consul.',
    'exp1-p2': 'Implemented full cloud-VM lifecycle management, bandwidth/traffic metering, order payment, SSH key management; automated monthly billing via Redis queues + Crontab, sustaining tens of millions of API calls.',
    'exp1-p3': 'Designed end-to-end security (JWT, RBAC, rate limiting, audit logging) ensuring multi-tenant data isolation.',
    'exp1-p4': 'Integrated AWS API Gateway + Nginx same-origin deployment; authored architecture documentation.',
    'exp2-co': 'Shiyuan Culture Development (Shenzhen) Co., Ltd.',
    'exp2-role': 'Full-Stack Developer',
    'exp2-p1': 'Owned a visitor admin system with 100k+ daily visits, 10k daily orders and ¥100M+ revenue. Migrated from Slim to Webman with RabbitMQ async decoupling — core API latency down ~35%.',
    'exp2-p2': 'Built reusable admin scaffolding enabling rapid project rollout across regions.',
    'exp2-p3': 'Independently delivered Go (Beego/Gin), Java and Vue projects — proven cross-stack delivery.',
    'exp3-co': 'Shenzhen Maikailai Technology Co., Ltd.',
    'exp3-role': 'Full-Stack Developer',
    'exp3-p1': 'Built a mini-program mall on Beego, integrating WeChat Pay V2/V3, courier APIs and Jushuitan ERP with real-time order sync.',
    'exp3-p2': 'Integrated ad-data attribution for Tencent Ads, Douyin and JD; optimized the private-domain traffic console, lifting marketing conversion ~20%.',
    'exp4-co': 'Shenzhen Yongda Electronic Information Co., Ltd.',
    'exp4-role': 'PHP Developer',
    'exp4-p1': 'Built a railway-bureau remote monitoring & virus-scanning system on Yii2 + Swoole with real-time device status reporting and command dispatch.',
    'exp4-p2': 'Set up an Elasticsearch + Filebeat log platform processing tens of millions of device logs; produced security audit reports.',
    'exp5-co': 'Shenzhen Qianhai BitSpace Technology Co., Ltd.',
    'exp5-role': 'Team Lead',
    'exp5-p1': 'Led a 9-person mixed team (Java/PHP/Frontend) on a crypto exchange & light wallet: 300k users, 100k DAU.',
    'exp5-p2': 'Led the order-matching engine, deposit/withdrawal and OTC modules; gRPC to blockchain nodes with eventual consistency.',
    'exp6-co': 'Shenzhen Zhiru Technology Co., Ltd.',
    'exp6-role': 'Team Lead',
    'exp6-p1': 'Led teams building custom management systems, corporate portals and B2C e-commerce platforms.',
    'exp6-p2': 'Stack: PHP / MySQL / JavaScript / ThinkPHP / Yii / WordPress / Nginx / Ecshop / EeMall.',
    /* projects */
    'proj-sec': 'Projects',
    'projlogi-title': 'Integrated Global Logistics — One-Stop Global Tracking',
    'projlogi-c6': '209 Carriers',
    'projlogi-p1': 'One-stop global logistics tracking: the global-logistics facade aggregates 209 carrier PHP adapters — one entry point to query shipments worldwide.',
    'projlogi-p2': 'Admin console (PHP webman + Flutter) hosts the management plane and query worker pool with task dispatch and rate limiting.',
    'projlogi-p3': 'e-cat high-frequency gateway (resident Rust process) absorbs query traffic on a Kratos-style framework core.',
    'projlogi-scale': '209 carrier adapters · dual client (PHP webman + Flutter) · Rust high-frequency gateway · open source',
    'projsoc-title': 'Multi-Language Social Platform',
    'projsoc-c1': 'Feed Community',
    'projsoc-c2': 'IM',
    'projsoc-c3': 'Live / Voice',
    'projsoc-c4': 'Virtual Economy',
    'projsoc-c5': 'Multi-Language i18n',
    'projsoc-p1': 'A multi-language social platform combining feed community + IM + live/voice + virtual economy.',
    'projsoc-p2': 'Real-time interaction via IM and live/voice rooms; virtual economy (tips / gifts / coins) closes the loop.',
    'projsoc-p3': 'Site-wide i18n for a global audience.',
    'projsoc-scale': 'Community · IM · live/voice · virtual economy · multi-language',
    'projecat-title': 'e-cat — Rust Microservice Framework',
    'projecat-c2': 'Kratos v3 Parity',
    'projecat-c4': 'CLI Toolchain',
    'projecat-c5': 'Maintained',
    'projecat-p1': 'A Rust microservice framework modeled on go-kratos/kratos v3: API-first developer experience + pluggable component architecture.',
    'projecat-p2': 'Unified HTTP/gRPC middleware abstraction plus a complete CLI toolchain — Kratos developers can onboard seamlessly.',
    'projecat-p3': 'Harnesses Rust type safety, zero-cost abstraction and extreme performance.',
    'projecat-scale': 'API-first · pluggable components · unified HTTP/gRPC middleware · CLI toolchain · actively maintained',
    'projbee-title': 'bee-rust — Production-Grade Rust Web Framework',
    'projbee-c2': 'Beego-Inspired',
    'projbee-c3': 'trait + macro',
    'projbee-c4': 'Type System',
    'projbee-c5': 'Maintained',
    'projbee-p1': 'A production-grade Rust web framework whose design philosophy derives from Go\'s Beego framework.',
    'projbee-p2': 'Re-expresses Beego\'s design using idiomatic Rust — traits, macros and the type system.',
    'projbee-p3': 'Designed for production environments and actively maintained.',
    'projbee-scale': 'Rust · production-grade web framework · Beego-inspired · actively maintained',
    'projads-title': 'Multi-Platform Ad Management System',
    'projads-c1': '29 Ad Platforms',
    'projads-p1': 'Delivery: OAuth account authorization; unified cross-platform management of campaigns / ad groups / creatives.',
    'projads-p2': 'Reporting: cross-platform metric aggregation, CSV / Excel / PDF export, 5-model cross-platform attribution.',
    'projads-p3': 'Smart delivery: auto-bidding, budget alerts, delivery calendar (Gantt), creative library.',
    'projads-p4': 'Alerting: alert rule engine, multi-channel push, scheduled auto-sync.',
    'projads-p5': 'Multi-client: Web admin (Vue 3), Flutter PC / Mobile, HarmonyOS.',
    'projads-p6': 'Reliability: circuit breaking / degradation / timeout, three-tier cache, high-concurrency tuning, 22 security measures.',
    'projads-p7': 'i18n: 12-language docs, bilingual UI.',
    'projads-scale': '29 ad platforms (16 CN + 13 global) · delivery · cross-platform reports · smart bidding · alerting · multi-client',
    'proj2-title': 'Global Cloud Resource Trading Platform',
    'proj2-p1': 'Modular monolith + event-driven; 15 business domains vertically sliced; Provider plugin system unifies first-party/third-party onboarding.',
    'proj2-p2': '14-layer global middleware (WAF, AES-256-GCM transport encryption, field-level encryption, Hashids, JWT, rate limiting, audit…).',
    'proj2-p3': 'Event-driven pipeline + exponential-backoff retry + overrun alerting; Snowflake IDs, read/write splitting + multi-level cache + ES 3-layer encryption, zero-downtime key rotation.',
    'proj2-p4': '190+ RESTful/GraphQL endpoints, Flutter client + HarmonyOS scaffold; Docker Compose, GitHub Actions CI/CD, k6 load tests, 295 endpoint tests, Sentry, feature flags, multi-language i18n.',
    'proj2-p5': 'Published 7 open-source PHP packages (JWT, Snowflake, Hashids, crypto, CAPTCHA, etc.).',
    'proj2-scale': '91 commits · 46 tables · 15 modules · 190+ APIs · 295+ tests',
    'proj3-title': 'Cross-Border E-Commerce Platform',
    'proj3-c1': 'B2C / B2B / Multi-Vendor',
    'proj3-p1': 'Distributed keys (Snowflake) + Hashids; 12-layer middleware + 31 attack detectors + 3-layer encryption.',
    'proj3-p2': 'High concurrency: Redis token-bucket limiting, randomized TTL anti-avalanche, circuit breaking, read/write splitting.',
    'proj3-p3': 'Cross-border compliance: HS codes + tariff rule engine + VAT/IOSS calculation + 10 compliance labels.',
    'proj3-p4': 'Supply-chain risk: supplier rating, purchase review, QC gates, immutable inventory ledger; side-channel rules engine + KYC + GDPR/CCPA.',
    'proj3-scale': '315 PHP files · 70 tables · 71 APIs · Flutter 5 platforms + HarmonyOS · 5-language i18n',
    'proj4-title': 'Enterprise Full-Stack ERP System',
    'proj4-c1': '9 Microservices',
    'proj4-p1': '9 microservices (Core/OMS/WMS/TMS/Finance/CRM/HR/Manufacturing/Project), 21 Protobuf contracts, 7 gRPC streams.',
    'proj4-p2': '8-layer defense (WAF, rate limiting, JWT, RBAC, CSRF, audit, field encryption).',
    'proj4-p3': 'Flutter PC console with 50+ pages + mobile H5 sharing 100% core code; custom approval-flow engine (Snowflake IDs across order → fulfillment → payables/receivables).',
    'proj4-p4': '105 PHPUnit tests (533 assertions), PHPStan Level 5, PHP-CS-Fixer.',
    'proj4-scale': '9 microservices · 99 controllers · 138 models · 122 tables · ~73,800 lines PHP+Dart · 12 Docker containers',
    'proj5-title': 'Global Game Aggregation Platform',
    'proj5-c4': 'Alipay / WeChat Pay',
    'proj5-p1': 'Multi-currency top-ups (Stripe/PayPal/Alipay/WeChat), platform-coin to game-coin exchange, withdrawal review & auto-payout; dual webman apps (admin+service) + 2 WebSocket services (leaderboard/chat).',
    'proj5-p2': 'Fund safety: bcmath precision, optimistic locking (version CAS), idempotent payment callbacks, frozen balances + ledger audit.',
    'proj5-p3': 'Two-layer encryption (AES-256-CBC transport + AES-128-ECB field-level); custom SecurityGuard (30 attack detectors).',
    'proj5-p4': 'Per-game-currency FX rates + platform spread; 3-tier KYC + withdrawal tiers; membership levels/achievements/coupons/rebates; ClickHouse OLAP operational snapshots.',
    'proj5-scale': '200+ APIs · 43 tables · 50 models · four storage engines in concert',
    'proj6-title': 'Smart Property Management Platform',
    'proj6-c2': 'HarmonyOS Native App',
    'proj6-p1': '34 business modules, multi-community management, three clients (Flutter Web admin, owner app, native HarmonyOS app).',
    'proj6-p2': '18-layer defense in depth (custom WAF, JWT+RefreshToken, RBAC, field encryption, Hashids, CSP/HSTS…).',
    'proj6-p3': 'Performance: Workerman resident + OPcache, Redis cache + ES async indexing, Snowflake IDs; WeChat/Alipay payments, Prometheus monitoring, Excel import/export, i18n.',
    'proj6-p4': '133 PHPUnit tests, PHPStan, CI, MIT open-source v1.0.0.',
    'proj6-scale': '34 modules · 65 tables · 180+ APIs · three clients · Docker Compose 5 services',
    'proj7-title': 'Appointment Service Management Platform',
    'proj7-c1': 'WeChat Mini-Program',
    'proj7-p1': 'WeChat mini-program + Flutter app + Flutter Web admin with client/stylist switching; dual-service architecture (API + admin separate), custom WebSocket push (JWT auth), ES Scout driven.',
    'proj7-p2': 'Multi-store/multi-stylist/multi-slot booking (off-peak & early-bird discounts), order state machine, dual payment channels, stylist scheduling/clock-in/exams/earnings, coupons/membership/points, queue calling (Redis + Bluetooth printing), LBS nearby stores.',
    'proj7-p3': '31 attack detectors, AES-256-CBC dual keys, JWT (Access+Refresh), path-level RBAC, 5-failure lockout, Hashids, image + slider CAPTCHA.',
    'proj7-p4': 'Custom 7 Composer packages (snowflake, hashids, jwt-webman, encryption, scout, security, poster).',
    'proj7-scale': '104 controllers · 58 models · 55 tables · 242 API routes · 80+ tests',
    'proj10-title': 'ESP32-S3 Multi-Sensor Smart Control Panel',
    'proj10-c2': 'Arduino Framework',
    'proj10-c9': 'DHT Temp & Humidity',
    'proj10-p1': 'Six peripherals (LED, touch switch, light sensor, thermistor, DHT, MFRC522); web control and MQTT remote control in parallel.',
    'proj10-p2': 'Unified command entry: HTTP GET routes and MQTT downlink commands map to a shared handleCommand(); consistent dual-channel behavior, new controls need a single mapping.',
    'proj10-p3': 'Shared state outlet collectStatusJson(): web template rendering and MQTT reporting use one data source; esp32/status full snapshot every 5s + instant delta reports, esp32/event card-swipes published in milliseconds.',
    'proj10-p4': 'Reliability: 5s auto-reconnect, first-connect failure never blocks boot (HTTP always available), MAC-derived client IDs prevent device collisions, invalid JSON/unknown commands safely ignored.',
    'proj10-p5': 'Non-blocking: all sensors polled debounced via millis(); each peripheral has its own .h driver — adding one takes three steps (toggle, driver, command mapping).',
    'proj10-scale': '6 peripherals · dual channel (HTTP + MQTT) · 3 MQTT topics',
    /* education */
    'edu-sec': 'Education & Training',
    'edu1-h': 'Shenzhen Public Welfare Vocational Training',
    'edu1-p': 'IoT Technology & Applications',
    'edu2-p': 'HarmonyOS Native Development · HarmonyOS Fundamentals certified',
    'edu3-h': 'Shenzhen University',
    'edu3-p': 'Business Administration · Bachelor’s (part-time)',
    'edu4-h': 'Tarena Technology',
    'edu4-p': 'PHP Web Development · NTC Professional Certification',
    'edu5-h': 'Ruyang No.2 Senior High School',
    'edu5-p': 'Senior High School',
    /* footer */
    'footer-resume': 'CV page',
    'footer-top': 'Back to top',
  };

  const EN_TITLE = 'Wang Kexun · Full-Stack Engineer · PHP / Go';
  const EN_DESC = 'Wang Kexun, senior full-stack engineer (PHP/Go), 10+ years in large-scale architecture and high-concurrency services. Seeking opportunities in Shenzhen / Hong Kong.';

  const ZH = {};
  const zhTitle = document.title;
  const zhDesc = document.querySelector('meta[name="description"]').content;
  document.querySelectorAll('[data-i18n]').forEach((el) => { ZH[el.dataset.i18n] = el.textContent; });

  const KEY = 'resume-lang';
  const btn = document.getElementById('lang-toggle');
  const meta = document.querySelector('meta[name="description"]');

  function apply(lang) {
    const en = lang === 'en';
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const t = EN[el.dataset.i18n];
      el.textContent = en ? (t || el.textContent) : (ZH[el.dataset.i18n] || el.textContent);
    });
    document.title = en ? EN_TITLE : zhTitle;
    meta.content = en ? EN_DESC : zhDesc;
    document.documentElement.lang = en ? 'en' : 'zh-CN';
    btn.textContent = en ? '中文' : 'EN';
    btn.setAttribute('aria-label', en ? '切换为中文' : 'Switch to English');
    localStorage.setItem(KEY, lang);
  }

  let current = localStorage.getItem(KEY) === 'en' ? 'en' : 'zh';
  btn.addEventListener('click', () => { current = current === 'zh' ? 'en' : 'zh'; apply(current); });
  apply(current);
})();

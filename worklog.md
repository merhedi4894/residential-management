---
Task ID: 6
Agent: Main Agent
Task: সেটআপ পেজ ত্রুটি ঠিক করা — "অ্যাকাউন্ট তৈরি করতে সমস্যা হয়েছে"

Work Log:
- সমস্যা বিশ্লেষণ: login page এর handleSetup এ fetch থ্রো করছিল (catch block থেকে error message আসছিল)
- কারণ: Turso database তে User table না থাকলে Prisma query fail হতো, আর API response JSON না হলে res.json() থ্রো করতো
- src/lib/db-init.ts তৈরি: @libsql/client ব্যবহার করে runtime এ সব টেবিল তৈরি করে (Prisma bypass)
- src/app/api/auth/init/route.ts আপডেট: ensureTablesExist() কল যোগ, error logging উন্নত, isSetup: true সেট
- src/app/api/auth/login/route.ts আপডেট: ensureTablesExist() কল যোগ
- src/app/login/page.tsx আপডেট: res.json() failure handling যোগ, non-JSON response handle
- src/lib/db.ts আপডেট: TURSO_AUTH_TOKEN separate env var support, connection logging
- scripts/sync-db.js তৈরি: build-time schema sync utility
- package.json আপডেট: build script এ sync-db.js যোগ

Stage Summary:
- সমস্যার মূল কারণ: ডাটাবেস টেবিল না থাকলে Prisma query fail → API JSON response return না করতো → client catch block execute
- সমাধান: @libsql/client দিয়ে runtime এ টেবিল তৈরি (ensureTablesExist), client-side error handling উন্নত
- লাইভ সাইট ভেরিফাই: needsInit: false — ডাটাবেসে ইতিমধ্যে একটি ইউজার আছে
- GitHub এ push সম্পন্ন, Vercel তে auto-deploy হয়েছে

---
Task ID: 5
Agent: Main Agent
Task: আবাসিক ম্যানেজমেন্ট সিস্টেম — বিভিন্ন ফিচার আপডেট

Work Log:
- Prisma schema আপডেট: VacateRecord model যোগ, User.isSetup field যোগ, Tenant/Room তে vacateRecords relation যোগ
- Turso DB তে VacateRecord টেবিল তৈরি এবং User টেবিলে isSetup column যোগ
- /api/vacate/route.ts তৈরি — POST endpoint for vacate with inventory editing, VacateRecord তৈরি, inventory disconnect
- /api/auth/setup/route.ts তৈরি — POST endpoint for security setup (username, password, security question change)
- /api/auth/login/route.ts আপডেট — needsSetup flag response
- /api/auth/me/route.ts আপডেট — needsSetup flag response
- /api/room-wise-data/route.ts আপডেট — vacateRecords include with inventory snapshots
- src/middleware.ts আপডেট — /setup path allowed without auth
- src/app/login/page.tsx রিডিজাইন — login এর পর needsSetup চেক, setup redirect flow
- src/app/setup/page.tsx তৈরি — প্রথমবার লগইনের পর security setup page
- src/app/page.tsx বড় পরিবর্তন:
  - Header: শিরোনাম "অফিস আবাসিক ম্যানেজমেন্ট সিস্টেম" → "আবাসিক ম্যানেজমেন্ট"
  - Header: subtitle মুছে ফেলা
  - Header: username display "Admin" দেখানো
  - Footer যোগ (Md. Mehedi Hasan, Caretaker, EGB PLC.)
  - InventoryTab (মালামাল খোঁজ) সম্পূর্ণ মুছে ফেলা
  - OverviewTab সম্পূর্ণ রিরাইট: searchType toggle মুছে ফেলা, ভাড়াটে ও মালামাল একইসাথে দেখানো
  - OverviewTab তে vacate button যোগ "রুম ছেড়ে দিন"
  - OverviewTab তে vacate dialog: inventory editing সহ vacate confirm
  - OverviewTab তে previous tenants pagination (৫ জন প্রতি পেজ)
  - OverviewTab তে previous tenant expandable — vacate record inventory snapshot দেখানো
  - TenantsTab তে re-rent: আগের tenant এর inventory auto-load আগেই কাজ করে (existing feature, preserved)

Stage Summary:
- ১১টি task সম্পূর্ণভাবে বাস্তবায় হয়েছে
- নতুন API routes: /api/vacate, /api/auth/setup
- নতুন page: /setup
- VacateRecord model ও Turso table তৈরি
- OverviewTab এ ভাড়াটে তালিকা + মালামাল তালিকা একসাথে দেখানো
- Vacate flow: inventory edit → vacate confirm → VacateRecord creation → inventory disconnect
- Previous tenant expansion: vacate record inventory snapshot display
- Pagination: পূর্বের ভাড়াটে ৫ জন প্রতি পেজ
- Login redirect to setup if needsSetup=true
- Header: সংক্ষিপ্ত শিরোনাম, Admin display
- Inventory tab সম্পূর্ণভাবে মুছে ফেলা
- Footer যোগ
- Build pass, server running

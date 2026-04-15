---
Task ID: 1
Agent: Main Agent
Task: অফিস আবাসিক ম্যানেজমেন্ট সিস্টেম তৈরি

Work Log:
- Prisma schema তৈরি: Building, Floor, Room, Tenant, Inventory, TroubleReport models
- Database push সফল হয়েছে (SQLite)
- API Routes তৈরি: /api/buildings, /api/rooms, /api/tenants, /api/inventory, /api/troubles
- সম্পূর্ণ UI তৈরি (2441 lines): 4টি ট্যাব সহ Dashboard
- বিল্ডিং ও রুম ম্যানেজমেন্ট, ভাড়াটে ম্যানেজমেন্ট, মালামাল খোঁজ, ট্রাবল রিপোর্ট
- Dev server সফলভাবে চলছে (200 OK)

Stage Summary:
- সম্পূর্ণ Next.js 16 অ্যাপ্লিকেশন তৈরি হয়েছে
- সব API route কাজ করছে
- Bengali (বাংলা) UI সহ responsive design
- shadcn/ui components ব্যবহার করা হয়েছে

---
Task ID: 2
Agent: Main Agent
Task: রুমভিত্তিক সার্চ সিস্টেম — ভাড়াটে ও মালামাল আলাদাভাবে সার্চ, এডিট, ডিলিট

Work Log:
- নতুন API endpoint `/api/room-wise-data` তৈরি: roomId দিয়ে current + previous tenants এবং inventory আলাদাভাবে রিটার্ন করে
- Tenants API `/api/tenants` PATCH endpoint আপডেট: `action: "updateInfo"` দিয়ে ভাড়াটে নাম/ফোন এডিট সমর্থন যোগ করা হয়েছে
- OverviewTab সম্পূর্ণ রিরাইট: পুরনো collapsible tree view বদলে নতুন search-based view
- বিল্ডিং → রুম সিলেক্ট ক্যাসকেড (তলা অনুসারে গ্রুপ করা)
- দুইটি সার্চ টাইপ: "ভাড়াটে তালিকা" এবং "মালামাল তালিকা" আলাদা বাটন
- ভাড়াটে সার্চ: বর্তমান ভাড়াটে + পূর্বের ভাড়াটেগণ আলাদাভাবে দেখায় (এডিট/ডিলিট সহ)
- মালামাল সার্চ: বর্তমান মালামাল + পূর্বের মালামাল আলাদাভাবে দেখায় (এডিট/ডিলিট/যোগ সহ)
- ট্যাব লেবেল আপডেট: "বিল্ডিং অনুসারে" → "রুমভিত্তিক সার্চ"
- SelectGroup/SelectLabel import যোগ করা হয়েছে
- বিল্ড সফল, API টেস্ট পাস

Stage Summary:
- `/api/room-wise-data` API তৈরি ও টেস্টেড
- OverviewTab সম্পূর্ণ নতুন ডিজাইনে রিরাইট
- ভাড়াটে এবং মালামাল আলাদাভাবে সার্চ, এডিট, ডিলিট সুবিধা যোগ
- বিল্ড সফল (Next.js 16 build pass)

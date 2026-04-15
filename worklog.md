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

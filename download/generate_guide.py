import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, ListFlowable, ListItem, KeepTogether,
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# ─── Register Fonts ───────────────────────────────────────────────
pdfmetrics.registerFont(TTFont('FreeSans', '/usr/share/fonts/truetype/freefont/FreeSans.ttf'))
pdfmetrics.registerFont(TTFont('FreeSansBd', '/usr/share/fonts/truetype/freefont/FreeSansBold.ttf'))
pdfmetrics.registerFont(TTFont('FreeSansOb', '/usr/share/fonts/truetype/freefont/FreeSansOblique.ttf'))
pdfmetrics.registerFont(TTFont('FreeSansBdOb', '/usr/share/fonts/truetype/freefont/FreeSansBoldOblique.ttf'))

from reportlab.pdfbase.pdfmetrics import registerFontFamily
registerFontFamily('FreeSans', normal='FreeSans', bold='FreeSansBd', italic='FreeSansOb', boldItalic='FreeSansBdOb')

# ─── Colors ────────────────────────────────────────────────────────
PRIMARY = HexColor('#059669')
PRIMARY_DARK = HexColor('#047857')
PRIMARY_LIGHT = HexColor('#D1FAE5')
ACCENT = HexColor('#2563EB')
DARK = HexColor('#1E293B')
MUTED = HexColor('#64748B')
LIGHT_BG = HexColor('#F8FAFC')
BORDER = HexColor('#E2E8F0')
CODE_BG = HexColor('#F1F5F9')
WARN = HexColor('#D97706')
WARN_BG = HexColor('#FFFBEB')

# ─── Styles ────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

s_title = ParagraphStyle('BnTitle', parent=styles['Title'], fontName='FreeSansBd', fontSize=26, leading=34, textColor=DARK, spaceAfter=4*mm)
s_subtitle = ParagraphStyle('BnSub', parent=styles['Normal'], fontName='FreeSans', fontSize=12, leading=18, textColor=MUTED, spaceAfter=8*mm)
s_h1 = ParagraphStyle('BnH1', parent=styles['Heading1'], fontName='FreeSansBd', fontSize=18, leading=26, textColor=PRIMARY_DARK, spaceBefore=10*mm, spaceAfter=4*mm)
s_h2 = ParagraphStyle('BnH2', parent=styles['Heading2'], fontName='FreeSansBd', fontSize=14, leading=20, textColor=DARK, spaceBefore=6*mm, spaceAfter=3*mm)
s_body = ParagraphStyle('BnBody', parent=styles['Normal'], fontName='FreeSans', fontSize=10.5, leading=17, textColor=DARK, alignment=TA_JUSTIFY, spaceAfter=3*mm)
s_code = ParagraphStyle('BnCode', parent=styles['Normal'], fontName='FreeSans', fontSize=9, leading=14, textColor=HexColor('#334155'), backColor=CODE_BG, borderWidth=1, borderColor=BORDER, borderPadding=6, leftIndent=8*mm, rightIndent=4*mm, spaceAfter=3*mm)
s_codeblock = ParagraphStyle('CodeBlock', parent=s_code, backColor=HexColor('#1E293B'), textColor=HexColor('#E2E8F0'))
s_warning = ParagraphStyle('BnWarn', parent=s_body, fontName='FreeSans', backColor=WARN_BG, borderWidth=1, borderColor=HexColor('#FDE68A'), borderPadding=8, leftIndent=4*mm, rightIndent=4*mm, spaceAfter=3*mm)
s_note = ParagraphStyle('BnNote', parent=s_body, fontName='FreeSans', backColor=PRIMARY_LIGHT, borderWidth=1, borderColor=HexColor('#A7F3D0'), borderPadding=8, leftIndent=4*mm, rightIndent=4*mm, spaceAfter=3*mm)
s_bullet = ParagraphStyle('BnBullet', parent=s_body, fontName='FreeSans', bulletIndent=6*mm, leftIndent=12*mm, spaceAfter=2*mm)
s_step = ParagraphStyle('BnStep', parent=s_body, fontName='FreeSansBd', fontSize=11, leading=17, textColor=PRIMARY_DARK, spaceBefore=3*mm, spaceAfter=2*mm)
s_table_head = ParagraphStyle('TblHead', parent=styles['Normal'], fontName='FreeSansBd', fontSize=9.5, leading=14, textColor=white, alignment=TA_CENTER)
s_table_cell = ParagraphStyle('TblCell', parent=styles['Normal'], fontName='FreeSans', fontSize=9, leading=14, textColor=DARK)
s_table_code = ParagraphStyle('TblCode', parent=s_table_cell, fontName='FreeSans', fontSize=8.5, leading=13, textColor=HexColor('#475569'))

# ─── Helpers ───────────────────────────────────────────────────────
def heading1(text):
    return KeepTogether([
        HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceAfter=2*mm),
        Paragraph(text, s_h1),
    ])

def heading2(text):
    return Paragraph(text, s_h2)

def body(text):
    return Paragraph(text, s_body)

def code(text):
    return Paragraph(text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;'), s_code)

def warning(text):
    return Paragraph(text, s_warning)

def note(text):
    return Paragraph(text, s_note)

def step(num, text):
    return Paragraph(f"ধাপ {num}: {text}", s_step)

def bullet(text):
    return Paragraph(f"\u2022 {text}", s_bullet)

def spacer(h=4):
    return Spacer(1, h*mm)

# ─── Build Document ───────────────────────────────────────────────
OUTPUT = "/home/z/my-project/download/turso-vercel-deployment-guide.pdf"
os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)

doc = SimpleDocTemplate(
    OUTPUT,
    pagesize=A4,
    topMargin=20*mm, bottomMargin=20*mm,
    leftMargin=22*mm, rightMargin=22*mm,
)

story = []

# ═══════════════ COVER PAGE ═══════════════════════════════════════
story.append(Spacer(1, 50*mm))
story.append(Paragraph("Turso + Vercel", ParagraphStyle('CoverBig', parent=s_title, fontSize=38, leading=46, alignment=TA_CENTER)))
story.append(Paragraph("Deployment Guide", ParagraphStyle('CoverBig2', parent=s_title, fontSize=30, leading=38, alignment=TA_CENTER, textColor=PRIMARY)))
story.append(Spacer(1, 12*mm))
story.append(HRFlowable(width="40%", thickness=2, color=PRIMARY, spaceAfter=8*mm))
story.append(Paragraph("Office Residential Management System", ParagraphStyle('CoverSub', parent=s_subtitle, fontSize=14, alignment=TA_CENTER, textColor=DARK)))
story.append(Paragraph("Step-by-step deployment instructions for Turso database and Vercel hosting", ParagraphStyle('CoverDesc', parent=s_subtitle, fontSize=11, alignment=TA_CENTER)))
story.append(Spacer(1, 30*mm))

info_data = [
    [Paragraph('<b>Project</b>', s_table_cell), Paragraph('Office Residential Management System', s_table_cell)],
    [Paragraph('<b>Database</b>', s_table_cell), Paragraph('Turso (libSQL / SQLite)', s_table_cell)],
    [Paragraph('<b>Hosting</b>', s_table_cell), Paragraph('Vercel', s_table_cell)],
    [Paragraph('<b>Framework</b>', s_table_cell), Paragraph('Next.js 16 + Prisma + shadcn/ui', s_table_cell)],
    [Paragraph('<b>Language</b>', s_table_cell), Paragraph('TypeScript + Bengali UI', s_table_cell)],
]
info_table = Table(info_data, colWidths=[35*mm, 90*mm])
info_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (0,-1), PRIMARY_LIGHT),
    ('GRID', (0,0), (-1,-1), 0.5, BORDER),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ('TOPPADDING', (0,0), (-1,-1), 6),
    ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ('LEFTPADDING', (0,0), (-1,-1), 8),
    ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ('ALIGN', (0,0), (0,-1), 'RIGHT'),
]))
story.append(info_table)
story.append(PageBreak())

# ═══════════════ OVERVIEW ═════════════════════════════════════════
story.append(heading1("প্রস্তাবনা"))
story.append(body("এই গাইডে আপনার <b>Office Residential Management System</b> প্রজেক্টটি Turso ডাটাবেজ এবং Vercel হোস্টিং-এ ডিপ্লয় করার সম্পূর্ণ প্রক্রিয়া ধাপে ধাপে বর্ণনা করা হয়েছে। Turso হলো একটি serverless SQLite-compatible ডাটাবেজ যা edge computing-এর জন্য ডিজাইন করা হয়েছে। এটি SQLite-এর সম্পূর্ণ ফিচার প্রদান করে এবং Prisma ORM-এর সাথে সহজেই ইন্টিগ্রেট হয়। Vercel হলো জনপ্রিয় serverless deployment প্ল্যাটফর্ম যা Next.js প্রজেক্টের জন্য সবচেয়ে উপযুক্ত।"))
story.append(body("ডিপ্লয়মেন্ট প্রক্রিয়াটি মোট ৬টি প্রধান ধাপে বিভক্ত। প্রতিটি ধাপে ক্লিয়ার কমান্ড এবং স্ক্রিনশট বর্ণনা দেওয়া হয়েছে যাতে আপনি সহজেই অনুসরণ করতে পারেন। পুরো প্রক্রিয়াটি সম্পন্ন করতে আনুমানিক ৩০-৪৫ মিনিট সময় লাগতে পারে।"))
story.append(warning("<b>প্রয়োজনীয়তা:</b> আপনার কম্পিউটারে Node.js 18+ এবং Git ইনস্টল থাকতে হবে। এছাড়া Turso এবং Vercel-এর ফ্রি অ্যাকাউন্ট প্রয়োজন হবে।"))
story.append(spacer(4))

story.append(heading2("কী কী পরিবর্তন করা হয়েছে"))
story.append(body("প্রজেক্টটি Turso + Vercel deploy-এর জন্য ইতিমধ্যে নিম্নলিখিত পরিবর্তনসমূহ করা হয়েছে:"))

changes_data = [
    [Paragraph('<b>ফাইল</b>', s_table_head), Paragraph('<b>পরিবর্তন</b>', s_table_head), Paragraph('<b>বিবরণ</b>', s_table_head)],
    [Paragraph('src/lib/db.ts', s_table_code), Paragraph('Turso adapter যোগ', s_table_cell), Paragraph('@prisma/adapter-libsql দিয়ে Turso কানেকশন সাপোর্ট', s_table_cell)],
    [Paragraph('prisma/schema.prisma', s_table_code), Paragraph('directUrl কনফিগ', s_table_cell), Paragraph('DATABASE_URL ও DIRECT_URL দুটোই সাপোর্ট', s_table_cell)],
    [Paragraph('package.json', s_table_code), Paragraph('postinstall স্ক্রিপ্ট', s_table_cell), Paragraph('npm install-এ স্বয়ংক্রিয়ভাবে prisma generate হবে', s_table_cell)],
    [Paragraph('.env.example', s_table_code), Paragraph('Turso variables', s_table_cell), Paragraph('DATABASE_URL, TURSO_AUTH_TOKEN, DIRECT_URL', s_table_cell)],
    [Paragraph('next.config.ts', s_table_code), Paragraph('Vercel compatible', s_table_cell), Paragraph('output: standalone সরানো হয়েছে', s_table_cell)],
    [Paragraph('API routes', s_table_code), Paragraph('secure cookie', s_table_cell), Paragraph('Production-এ secure: true (HTTPS)', s_table_cell)],
]
chg_table = Table(changes_data, colWidths=[35*mm, 32*mm, 88*mm])
chg_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), PRIMARY),
    ('TEXTCOLOR', (0,0), (-1,0), white),
    ('GRID', (0,0), (-1,-1), 0.5, BORDER),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ('TOPPADDING', (0,0), (-1,-1), 5),
    ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ('LEFTPADDING', (0,0), (-1,-1), 6),
    ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ('ROWBACKGROUNDS', (0,1), (-1,-1), [white, LIGHT_BG]),
]))
story.append(chg_table)

# ═══════════════ STEP 1: GITHUB ═════════════════════════════════
story.append(heading1("ধাপ ১: GitHub-এ প্রজেক্ট আপলোড করুন"))
story.append(step("1.1", "GitHub-এ নতুন Repository তৈরি করুন"))
story.append(bullet("https://github.com/new-এ যান"))
story.append(bullet("Repository name দিন (যেমন: <b>residential-management</b>)"))
story.append(bullet("<b>Private</b> সিলেক্ট করুন (রিকমেন্ডেড)"))
story.append(bullet("<b>README, .gitignore, License</b> আনচেক করুন"))
story.append(bullet("<b>Create repository</b> ক্লিক করুন"))

story.append(step("1.2", "লোকাল প্রজেক্টে Git ইনিশিয়ালাইজ করুন"))
story.append(body("আপনার প্রজেক্ট ফোল্ডারে টার্মিনাল খুলে নিচের কমান্ডগুলো রান করুন:"))
story.append(code("git init"))
story.append(code("git add ."))
story.append(code("git commit -m \"Initial commit\""))
story.append(code('git remote add origin https://github.com/YOUR_USERNAME/residential-management.git'))
story.append(code("git branch -M main"))
story.append(code("git push -u origin main"))
story.append(note("<b>গুরুত্বপূর্ণ:</b> .env ফাইল .gitignore-এ আছে তাই এটি GitHub-এ আপলোড হবে না। আপনার ডাটাবেজ ক্রেডেনশিয়াল নিরাপদ থাকবে।"))

# ═══════════════ STEP 2: TURSO ══════════════════════════════════
story.append(heading1("ধাপ ২: Turso ডাটাবেজ সেটআপ করুন"))
story.append(step("2.1", "Turso CLI ইনস্টল করুন"))
story.append(body("Turso ডাটাবেজ তৈরি ও ম্যানেজ করতে Turso CLI প্রয়োজন। টার্মিনালে নিচের কমান্ড রান করুন:"))
story.append(code("curl -sSfL https://get.tur.so/install.sh | bash"))
story.append(body("Windows ব্যবহারকারীরা:"))
story.append(code("powershell -c \"irm https://get.tur.so/install.ps1 | iex\""))
story.append(warning("ইনস্টলেশনের পর টার্মিনাল রিস্টার্ট করুন যাতে <b>turso</b> কমান্ড কাজ করে।"))

story.append(step("2.2", "Turso-এ লগইন করুন"))
story.append(code("turso auth login"))
story.append(body("এটি আপনার ব্রাউজারে Turso লগইন পেজ খুলবে। GitHub অ্যাকাউন্ট দিয়ে লগইন করুন (সবচেয়ে সহজ)।"))

story.append(step("2.3", "ডাটাবেজ তৈরি করুন"))
story.append(code("turso db create residential-db --location sinh"))
story.append(body("এখানে <b>--location sinh</b> হলো Singapore region (বাংলাদেশের কাছাকাছি)। অন্য অপশন: <b>sin</b> (Singapore), <b>ams</b> (Amsterdam), <b>fra</b> (Frankfurt)। প্রজেক্টের ইউজারদের কাছে যত কাছে হবে রেসপন্স তত ফাস্ট হবে।"))

story.append(step("2.4", "Auth Token তৈরি করুন"))
story.append(code("turso db tokens create residential-db"))
story.append(body("এটি একটি লং স্ট্রিং (auth token) আউটপুট দেবে। এটি কপি করে সেভ রাখুন কারণ এটি Vercel-এ Environment Variable হিসেবে ব্যবহার হবে।"))
story.append(warning("এই token কখনো GitHub বা অন্য কোথাও পাবলিক করবেন না!"))

story.append(step("2.5", "Schema Push করুন"))
story.append(body("আপনার প্রজেক্ট ফোল্ডারে .env ফাইলে Turso credentials সেট করুন (সাময়িকভাবে):"))
story.append(code('DATABASE_URL="libsql://residential-db-YOUR_ORG.turso.io"'))
story.append(code('DIRECT_URL="libsql://residential-db-YOUR_ORG.turso.io"'))
story.append(code('TURSO_AUTH_TOKEN="your-auth-token-here"'))
story.append(spacer(2))
story.append(body("তারপর নিচের কমান্ড রান করুন:"))
story.append(code("npx prisma db push"))
story.append(body("এটি আপনার Prisma schema অনুযায়ী Turso ডাটাবেজে সব টেবিল তৈরি করবে। সফল হলে নিচের মতো মেসেজ দেখাবে:"))
story.append(code("Your database is now in sync with your Prisma schema."))

story.append(step("2.6", "Connection URL সংগ্রহ করুন"))
story.append(body("আপনার ডাটাবেজের URL দেখতে:"))
story.append(code("turso db show residential-db --url"))
story.append(body("আউটপুট হবে: <b>libsql://residential-db-YOUR_ORG.turso.io</b>"))
story.append(body("এই URL, Auth Token, এবং Direct URL তিনটিই Vercel-এ প্রয়োজন হবে।"))

# ═══════════════ STEP 3: VERCEL ═════════════════════════════════
story.append(heading1("ধাপ ৩: Vercel-এ ডিপ্লয় করুন"))
story.append(step("3.1", "Vercel-এ লগইন করুন"))
story.append(body("https://vercel.com-এ যান এবং GitHub দিয়ে Sign Up করুন (অথবা লগইন করুন)। Vercel-এর ফ্রি প্ল্যানেই এই প্রজেক্ট রান করবে।"))

story.append(step("3.2", "নতুন প্রজেক্ট তৈরি করুন"))
story.append(bullet("Vercel Dashboard-এ <b>Add New Project</b> ক্লিক করুন"))
story.append(bullet("GitHub ইন্টিগ্রেশন অথুরাইজ করুন"))
story.append(bullet("আপনার <b>residential-management</b> repository সিলেক্ট করুন"))
story.append(bullet("<b>Import</b> ক্লিক করুন"))

story.append(step("3.3", "Environment Variables সেট করুন"))
story.append(body("Configure Project পেজে <b>Environment Variables</b> সেকশনে নিচের ৩টি variable যোগ করুন:"))

env_data = [
    [Paragraph('<b>Variable Name</b>', s_table_head), Paragraph('<b>Value (Example)</b>', s_table_head), Paragraph('<b>বিবরণ</b>', s_table_head)],
    [Paragraph('DATABASE_URL', s_table_code), Paragraph('libsql://residential-db-org.turso.io', s_table_code), Paragraph('Turso database URL', s_table_cell)],
    [Paragraph('TURSO_AUTH_TOKEN', s_table_code), Paragraph('eyJhbGciOiJIUz...(long string)', s_table_code), Paragraph('Turso auth token', s_table_cell)],
    [Paragraph('DIRECT_URL', s_table_code), Paragraph('libsql://residential-db-org.turso.io', s_table_code), Paragraph('Same as DATABASE_URL', s_table_cell)],
]
env_table = Table(env_data, colWidths=[38*mm, 60*mm, 57*mm])
env_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), ACCENT),
    ('TEXTCOLOR', (0,0), (-1,0), white),
    ('GRID', (0,0), (-1,-1), 0.5, BORDER),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ('TOPPADDING', (0,0), (-1,-1), 5),
    ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ('LEFTPADDING', (0,0), (-1,-1), 6),
    ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ('ROWBACKGROUNDS', (0,1), (-1,-1), [white, LIGHT_BG]),
]))
story.append(env_table)
story.append(warning("<b>সতর্কতা:</b> DIRECT_URL ও DATABASE_URL একই হবে Turso-এর ক্ষেত্রে। উভয় ক্ষেত্রে libsql:// URL ব্যবহার করুন, file:// না।"))

story.append(step("3.4", "ডিপ্লয় করুন"))
story.append(bullet("Framework Preset হিসেবে <b>Next.js</b> স্বয়ংক্রিয়ভাবে ডিটেক্ট হবে"))
story.append(bullet("Build Command: <b>npx prisma generate &amp;&amp; next build</b> (ডিফল্ট)"))
story.append(bullet("Output Directory: <b>.next</b> (ডিফল্ট)"))
story.append(bullet("Node.js Version: <b>18.x</b> বা তার বেশি"))
story.append(bullet("<b>Deploy</b> বাটনে ক্লিক করুন"))
story.append(spacer(2))
story.append(body("ডিপ্লয় সম্পন্ন হতে ২-৩ মিনিট সময় লাগবে। সফল হলে আপনি একটি live URL পাবেন:"))
story.append(code("https://residential-management.vercel.app"))

# ═══════════════ STEP 4: INITIAL SETUP ══════════════════════════
story.append(heading1("ধাপ ৪: প্রথম অ্যাডমিন ইউজার তৈরি করুন"))
story.append(body("ডিপ্লয় সম্পন্ন হলে আপনার সাইটে কোনো ইউজার থাকবে না। প্রথমবার সাইটে ঢুকলে একটি Setup পেজ দেখাবে যেখানে অ্যাডমিন ইউজার তৈরি করতে হবে:"))
story.append(bullet("আপনার Vercel URL-এ যান"))
story.append(bullet("Login পেজে স্বয়ংক্রিয়ভাবে Setup ফর্ম দেখাবে"))
story.append(bullet("Username, Password, Security Question, Answer দিন"))
story.append(bullet("<b>Admin তৈরি করুন</b> বাটনে ক্লিক করুন"))
story.append(note("এই Setup শুধুমাত্র প্রথমবার দেখাবে। এরপর সাধারণ লগইন পেজ থাকবে। Security Question ও Answer পাসওয়ার্ড রিকভারি-র জন্য ব্যবহৃত হবে।"))

# ═══════════════ STEP 5: CUSTOM DOMAIN (OPTIONAL) ═════════════
story.append(heading1("ধাপ ৫: কাস্টম ডোমেইন সেটআপ (ঐচ্ছিক)"))
story.append(body("আপনি চাইলে নিজস্ব ডোমেইন (যেমন: admin.yoursite.com) ব্যবহার করতে পারেন:"))
story.append(bullet("Vercel Dashboard > Project > Settings > Domains-এ যান"))
story.append(bullet("আপনার ডোমেইন যোগ করুন (যেমন: <b>admin.yoursite.com</b>)"))
story.append(bullet("DNS provider (Namecheap, GoDaddy ইত্যাদি) থেকে CNAME record যোগ করুন"))
story.append(bullet("CNAME: <b>admin</b> -> <b>cname.vercel-dns.com</b>"))
story.append(bullet("SSL সার্টিফিকেট স্বয়ংক্রিয়ভাবে ইনস্টল হবে"))
story.append(note("কাস্টম ডোমেইন ছাড়াও Vercel-এর ফ্রি সাবডোমেইন ব্যবহার করা যায়।"))

# ═══════════════ TROUBLESHOOTING ════════════════════════════════
story.append(heading1("সমস্যা সমাধান (Troubleshooting)"))

story.append(heading2("সমস্যা ১: Build ফেইল হচ্ছে"))
story.append(body("Vercel-এ build ফেইল হলে নিচের বিষয়গুলো চেক করুন:"))
story.append(bullet("Build Log চেক করুন: Vercel Dashboard > Deployments > সর্বশেষ deployment > Build Logs"))
story.append(bullet("<b>prisma generate</b> error হলে: package.json-এ postinstall script আছে কিনা দেখুন"))
story.append(bullet("TypeScript error হলে: tsconfig.json-এ <b>skipLibCheck: true</b> যোগ করুন"))

story.append(heading2("সমস্যা ২: ডাটাবেজ কানেকশন ত্রুটি"))
story.append(body("সাইট লোড হলে কিন্তু ডেটা আসে না:"))
story.append(bullet("Environment Variables সঠিকভাবে সেট হয়েছে কিনা দেখুন"))
story.append(bullet("DATABASE_URL <b>libsql://</b> দিয়ে শুরু হচ্ছে কিনা নিশ্চিত করুন"))
story.append(bullet("TURSO_AUTH_TOKEN সঠিক কপি করা হয়েছে কিনা চেক করুন"))
story.append(bullet("Turso DB status দেখুন: <b>turso db show residential-db</b>"))
story.append(bullet("Vercel-এ রিডিপ্লয় করুন (Environment variable পরিবর্তনের পর রিডিপ্লয় দরকার)"))

story.append(heading2("সমস্যা ৩: Prisma Migration Error"))
story.append(body("নতুন model যোগ করার পর:"))
story.append(bullet("লোকালে: <b>npx prisma db push</b> (schema push)"))
story.append(bullet("Turso-এ: <b>npx prisma db push</b> (.env-এ Turso credentials সেট করে)"))
story.append(bullet("Vercel-এ: কোড push করলে স্বয়ংক্রিয় রিডিপ্লয় হবে"))
story.append(note("Prisma migrate নয়, সবসময় <b>prisma db push</b> ব্যবহার করুন। Turso-এ prisma migrate সম্পূর্ণভাবে সাপোর্ট করে না।"))

story.append(heading2("সমস্যা ৪: Login/Session সমস্যা"))
story.append(body("ডিপ্লয়ড সাইটে লগইন করতে সমস্যা হলে:"))
story.append(bullet("Cookie secure flag: Production-এ HTTPS আবশ্যক। Vercel স্বয়ংক্রিয় HTTPS দেয়"))
story.append(bullet("Browser console চেক করুন (F12 > Application > Cookies)"))
story.append(bullet("session_token cookie set হচ্ছে কিনা দেখুন"))
story.append(bullet("ক্লিয়ার ব্রাউজার cache এবং cookies, তারপর আবার চেষ্টা করুন"))

# ═══════════════ SUMMARY ════════════════════════════════════════
story.append(heading1("সারসংক্ষেপ"))
story.append(body("সম্পূর্ণ ডিপ্লয়মেন্ট প্রক্রিয়াটি সংক্ষেপে:"))

summary_data = [
    [Paragraph('<b>ধাপ</b>', s_table_head), Paragraph('<b>কাজ</b>', s_table_head), Paragraph('<b>সময়</b>', s_table_head)],
    [Paragraph('1', s_table_cell), Paragraph('GitHub-এ প্রজেক্ট আপলোড', s_table_cell), Paragraph('5-10 মি.', s_table_cell)],
    [Paragraph('2', s_table_cell), Paragraph('Turso ডাটাবেজ তৈরি ও কনফিগার', s_table_cell), Paragraph('10-15 মি.', s_table_cell)],
    [Paragraph('3', s_table_cell), Paragraph('Vercel-এ ডিপ্লয়', s_table_cell), Paragraph('5-10 মি.', s_table_cell)],
    [Paragraph('4', s_table_cell), Paragraph('অ্যাডমিন ইউজার তৈরি', s_table_cell), Paragraph('2-3 মি.', s_table_cell)],
    [Paragraph('5', s_table_cell), Paragraph('কাস্টম ডোমেইন (ঐচ্ছিক)', s_table_cell), Paragraph('5-10 মি.', s_table_cell)],
]
sum_table = Table(summary_data, colWidths=[20*mm, 95*mm, 40*mm])
sum_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), PRIMARY),
    ('TEXTCOLOR', (0,0), (-1,0), white),
    ('GRID', (0,0), (-1,-1), 0.5, BORDER),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ('TOPPADDING', (0,0), (-1,-1), 5),
    ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ('LEFTPADDING', (0,0), (-1,-1), 8),
    ('ALIGN', (0,0), (0,-1), 'CENTER'),
    ('ALIGN', (2,0), (2,-1), 'CENTER'),
    ('ROWBACKGROUNDS', (0,1), (-1,-1), [white, LIGHT_BG]),
]))
story.append(sum_table)
story.append(spacer(6))

story.append(heading2("গুরুত্বপূর্ণ কমান্ডস রেফারেন্স"))

cmd_data = [
    [Paragraph('<b>কমান্ড</b>', s_table_head), Paragraph('<b>বিবরণ</b>', s_table_head)],
    [Paragraph('turso db create NAME --location sin', s_table_code), Paragraph('নতুন ডাটাবেজ তৈরি', s_table_cell)],
    [Paragraph('turso db tokens create NAME', s_table_code), Paragraph('Auth token তৈরি', s_table_cell)],
    [Paragraph('turso db show NAME --url', s_table_code), Paragraph('ডাটাবেজ URL দেখুন', s_table_cell)],
    [Paragraph('turso db shell NAME', s_table_code), Paragraph('ডাটাবেজে SQL রান করুন', s_table_cell)],
    [Paragraph('npx prisma db push', s_table_code), Paragraph('Schema ডাটাবেজে পুশ করুন', s_table_cell)],
    [Paragraph('npx prisma generate', s_table_code), Paragraph('Prisma Client জেনারেট করুন', s_table_cell)],
    [Paragraph('npx prisma studio', s_table_code), Paragraph('ডাটাবেজ GUI দেখুন', s_table_cell)],
    [Paragraph('vercel --prod', s_table_code), Paragraph('CLI দিয়ে ডিপ্লয় করুন', s_table_cell)],
    [Paragraph('vercel env ls', s_table_code), Paragraph('Environment variables দেখুন', s_table_cell)],
]
cmd_table = Table(cmd_data, colWidths=[72*mm, 83*mm])
cmd_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), DARK),
    ('TEXTCOLOR', (0,0), (-1,0), white),
    ('GRID', (0,0), (-1,-1), 0.5, BORDER),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ('TOPPADDING', (0,0), (-1,-1), 4),
    ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ('LEFTPADDING', (0,0), (-1,-1), 6),
    ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ('ROWBACKGROUNDS', (0,1), (-1,-1), [white, LIGHT_BG]),
]))
story.append(cmd_table)

story.append(spacer(8))
story.append(HRFlowable(width="100%", thickness=1, color=BORDER))
story.append(spacer(2))
story.append(Paragraph("Office Residential Management System - Turso + Vercel Deployment Guide", ParagraphStyle('Footer', parent=s_body, fontSize=8, textColor=MUTED, alignment=TA_CENTER)))

# ─── Build ───────────────────────────────────────────────────────
doc.build(story)
print(f"PDF saved to: {OUTPUT}")

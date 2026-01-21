
# 🍯 Honeybees Daycare – Daily Reports

A professional, mobile-friendly web application for home daycares to track daily routines and send beautiful HTML reports to parents via Gmail.

## 🚀 Quick Start (Local Development)

1.  **Environment Variables**: Ensure you have your Google Gemini API Key.
2.  **Install Dependencies**: The app uses ESM imports and Supabase.
3.  **Run**: Open `index.html` in any modern web browser.

## ☁️ Cloud Syncing (Multi-Device Setup)

To use the app on your iPhone, Tablet, and Laptop simultaneously, you must configure Supabase:

1.  **Create a Supabase Account**: [Supabase.com](https://supabase.com).
2.  **SQL Setup**: Go to the **SQL Editor** in Supabase and paste the following entire block:

```sql
-- Create Honeybees Tables
CREATE TABLE IF NOT EXISTS children (id TEXT PRIMARY KEY, "firstName" TEXT, "lastName" TEXT, nickname TEXT, dob DATE, classroom TEXT, allergies TEXT, "dietaryNotes" TEXT, "napNotes" TEXT, "emergencyNotes" TEXT, active BOOLEAN DEFAULT true, "parentIds" JSONB DEFAULT '[]', "dailyMedications" JSONB DEFAULT '[]');
CREATE TABLE IF NOT EXISTS parents (id TEXT PRIMARY KEY, "fullName" TEXT, email TEXT, phone TEXT, relationship TEXT, "preferredLanguage" TEXT, "receivesEmail" BOOLEAN DEFAULT true);
CREATE TABLE IF NOT EXISTS daily_logs (id TEXT PRIMARY KEY, "childId" TEXT, date DATE, "arrivalTime" TEXT, "departureTime" TEXT, "overallMood" TEXT, "teacherNotes" TEXT, "suppliesNeeded" TEXT, meals JSONB DEFAULT '[]', bottles JSONB DEFAULT '[]', naps JSONB DEFAULT '[]', diapers JSONB DEFAULT '[]', activities JSONB DEFAULT '[]', medications JSONB DEFAULT '[]', incidents JSONB DEFAULT '[]', status TEXT, "isPresent" BOOLEAN DEFAULT false, "includeTrends" BOOLEAN DEFAULT false);
CREATE TABLE IF NOT EXISTS send_logs (id TEXT PRIMARY KEY, "dailyLogId" TEXT, "sentTo" JSONB, subject TEXT, "sentAt" TIMESTAMP WITH TIME ZONE, status TEXT);
CREATE TABLE IF NOT EXISTS app_settings (id TEXT PRIMARY KEY, data JSONB NOT NULL);
CREATE TABLE IF NOT EXISTS holidays (id TEXT PRIMARY KEY, name TEXT, date DATE, type TEXT, notes TEXT);

-- Enable Realtime (This allows devices to "talk" to each other instantly)
-- Using FOR ALL TABLES is the easiest way to ensure everything stays in sync.
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR ALL TABLES;

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE send_logs ENABLE ROW LEVEL SECURITY;

-- Create Open Policies (Allows your devices to access data via the Anon Key)
DO $$ 
DECLARE
    t text;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Public Access" ON %I', t);
        EXECUTE format('CREATE POLICY "Public Access" ON %I FOR ALL USING (true) WITH CHECK (true)', t);
    END LOOP;
END $$;
```

3.  **Config**: Update `store.ts` with your **Supabase URL** and **Anon Key**. Once deployed, any setting you change on one device (like the password or daycare name) will automatically appear on all others!

## 📧 One-Click Gmail Sending
1. Create a free account at [EmailJS.com](https://www.emailjs.com/).
2. Connect Gmail Service and set Template subject to `{{subject}}` and body to `{{{html_message}}}`.


# 🍯 Honeybees Daycare – Daily Reports

## ☁️ Cloud Syncing (Multi-Device Setup)

To fix the "Relation does not exist" error and enable instant syncing across all your devices, run this **Final Setup Script** in your Supabase SQL Editor:

```sql
-- 1. Create Tables
CREATE TABLE IF NOT EXISTS children (id TEXT PRIMARY KEY, "firstName" TEXT, "lastName" TEXT, nickname TEXT, dob DATE, classroom TEXT, allergies TEXT, "dietaryNotes" TEXT, "napNotes" TEXT, "emergencyNotes" TEXT, active BOOLEAN DEFAULT true, "parentIds" JSONB DEFAULT '[]', "dailyMedications" JSONB DEFAULT '[]');
CREATE TABLE IF NOT EXISTS parents (id TEXT PRIMARY KEY, "fullName" TEXT, email TEXT, phone TEXT, relationship TEXT, "preferredLanguage" TEXT, "receivesEmail" BOOLEAN DEFAULT true);
CREATE TABLE IF NOT EXISTS daily_logs (id TEXT PRIMARY KEY, "childId" TEXT, date DATE, "arrivalTime" TEXT, "departureTime" TEXT, "overallMood" TEXT, "teacherNotes" TEXT, "suppliesNeeded" TEXT, meals JSONB DEFAULT '[]', bottles JSONB DEFAULT '[]', naps JSONB DEFAULT '[]', diapers JSONB DEFAULT '[]', activities JSONB DEFAULT '[]', medications JSONB DEFAULT '[]', incidents JSONB DEFAULT '[]', status TEXT, "isPresent" BOOLEAN DEFAULT false, "includeTrends" BOOLEAN DEFAULT false);
CREATE TABLE IF NOT EXISTS send_logs (id TEXT PRIMARY KEY, "dailyLogId" TEXT, "sentTo" JSONB, subject TEXT, "sentAt" TIMESTAMP WITH TIME ZONE, status TEXT);
CREATE TABLE IF NOT EXISTS app_settings (id TEXT PRIMARY KEY, data JSONB NOT NULL);
CREATE TABLE IF NOT EXISTS holidays (id TEXT PRIMARY KEY, name TEXT, date DATE, type TEXT, notes TEXT);

-- 2. Enable Realtime Publication (Crucial for multi-device)
-- This tells Supabase to "Watch" these tables
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR ALL TABLES;

-- 3. Enable REPLICA IDENTITY (Allows sending the ACTUAL changes to other devices)
ALTER TABLE children REPLICA IDENTITY FULL;
ALTER TABLE parents REPLICA IDENTITY FULL;
ALTER TABLE daily_logs REPLICA IDENTITY FULL;
ALTER TABLE app_settings REPLICA IDENTITY FULL;
ALTER TABLE holidays REPLICA IDENTITY FULL;
ALTER TABLE send_logs REPLICA IDENTITY FULL;

-- 4. Open Access Policies (Security)
DO $$ 
DECLARE
    t text;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' 
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('DROP POLICY IF EXISTS "Public Access" ON %I', t);
        EXECUTE format('CREATE POLICY "Public Access" ON %I FOR ALL USING (true) WITH CHECK (true)', t);
    END LOOP;
END $$;
```

## 🛠 Database Migration (If you already have tables)

If you have already created your database and just need to add the **DOB** and **Classroom** fields without deleting your current children, run this:

```sql
-- Run this if you are upgrading from an older version
ALTER TABLE children ADD COLUMN IF NOT EXISTS dob DATE;
ALTER TABLE children ADD COLUMN IF NOT EXISTS classroom TEXT;

-- Optional: Set a default classroom for existing children
UPDATE children SET classroom = 'Toddlers' WHERE classroom IS NULL;
```


# 🍯 Honeybees Daycare – Daily Reports

A professional, mobile-friendly web application for home daycares to track daily routines and send beautiful HTML reports to parents via Gmail.

## 🚀 Quick Start (Local Development)

1.  **Environment Variables**: Ensure you have your Google Gemini API Key.
2.  **Install Dependencies**: The app uses ESM imports and Supabase.
3.  **Run**: Open `index.html` in any modern web browser.

## ☁️ Cloud Syncing (Multi-Device)

To use the app on your iPhone, Tablet, and Laptop simultaneously:

1.  **Create a Supabase Account**: [Supabase.com](https://supabase.com).
2.  **SQL Setup**: Go to the "SQL Editor" in Supabase and paste the following:

```sql
-- Create Honeybees Tables
CREATE TABLE children (
  id TEXT PRIMARY KEY,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  nickname TEXT,
  dob DATE NOT NULL,
  classroom TEXT,
  allergies TEXT,
  "dietaryNotes" TEXT,
  "napNotes" TEXT,
  "emergencyNotes" TEXT,
  active BOOLEAN DEFAULT true,
  "parentIds" JSONB DEFAULT '[]',
  "dailyMedications" JSONB DEFAULT '[]'
);

CREATE TABLE parents (
  id TEXT PRIMARY KEY,
  "fullName" TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  relationship TEXT,
  "preferredLanguage" TEXT,
  "receivesEmail" BOOLEAN DEFAULT true
);

CREATE TABLE daily_logs (
  id TEXT PRIMARY KEY,
  "childId" TEXT NOT NULL,
  date DATE NOT NULL,
  "arrivalTime" TEXT,
  "departureTime" TEXT,
  "overallMood" TEXT,
  "teacherNotes" TEXT,
  "suppliesNeeded" TEXT,
  meals JSONB DEFAULT '[]',
  bottles JSONB DEFAULT '[]',
  naps JSONB DEFAULT '[]',
  diapers JSONB DEFAULT '[]',
  activities JSONB DEFAULT '[]',
  medications JSONB DEFAULT '[]',
  incidents JSONB DEFAULT '[]',
  status TEXT
);

CREATE TABLE send_logs (
  id TEXT PRIMARY KEY,
  "dailyLogId" TEXT,
  "sentTo" JSONB,
  subject TEXT,
  "sentAt" TIMESTAMP WITH TIME ZONE,
  status TEXT
);

CREATE TABLE app_settings (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL
);

-- Enable Realtime
alter publication supabase_realtime add table children;
alter publication supabase_realtime add table parents;
alter publication supabase_realtime add table daily_logs;
alter publication supabase_realtime add table send_logs;
alter publication supabase_realtime add table app_settings;
```

3.  **Config**: In the Honeybees **Settings** page, enter your Supabase URL and Anon Key. Your data will now sync automatically!

## 📧 One-Click Gmail Sending

1.  Create a free account at [EmailJS.com](https://www.emailjs.com/).
2.  **Connect Gmail Service**.
3.  **Template**: Set subject to `{{subject}}` and body (HTML mode) to `{{{html_message}}}`.
4.  **Save Keys**: Paste your keys in the Honeybees Settings page.

## 🛠 Tech Stack
*   **React 19** & **Tailwind CSS**
*   **Supabase** (Cloud Database & Auth)
*   **Google Gemini AI** (Professional Summaries)
*   **EmailJS** (Direct Sending)

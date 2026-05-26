       1 -This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/ap
          -i-reference/cli/create-next-app).
        1 +# VoltVocal
        2                                                                                                                                     3 -## Getting Started
        3 +A field estimating SaaS for electrical contractors. Walk a job site, speak your observations, and get a structured,        
          +exportable estimate in seconds — powered by AI.                                                                            
        4  
        5 -First, run the development server:                                                                                         
        5 +**Workflow:** Record → Transcribe → Estimate → Export PDF                                                                  
        6
        7 +---                                                                                                                        
        8 +                                                                                                                           
        9 +## Features                                                                                                                
       10 +                                                                                                                           
       11 +- **Voice recording** — capture job site observations hands-free via browser microphone                                    
       12 +- **AI transcription** — Groq Whisper converts audio to text accurately                                                    
       13 +- **Smart estimation** — Llama 3.3-70b extracts line items, quantities, unit prices, and totals from natural speech        
       14 +- **Inline editing** — adjust any line item before saving                                                                  
       15 +- **Price list** — maintain a custom catalog of your common materials and labor rates                                      
       16 +- **PDF export** — generate a professional estimate PDF with your company name                                             
       17 +- **Saved estimates** — persist and retrieve past estimates via Supabase                                                   
       18 +- **PWA** — installable as a mobile app, works offline                                                                     
       19 +                                                                                                                           
       20 +---                                                                                                                        
       21 +                                                                                                                           
       22 +## Tech Stack                                                                                                              
       23 +                                                                                                                           
       24 +| Layer | Technology |                                                                                                     
       25 +|-------|------------|                                                                                                     
       26 +| Framework | Next.js 16 (App Router, Server Actions) |                                                                    
       27 +| Language | TypeScript |                                                                                                  
       28 +| Styling | Tailwind CSS 4 |                                                                                               
       29 +| AI — Transcription | Groq Whisper |                                                                                      
       30 +| AI — Estimation | Groq `llama-3.3-70b-versatile` |                                                                       
       31 +| Database | Supabase (PostgreSQL) |                                                                                       
       32 +| PDF | jsPDF + jspdf-autotable |                                                                                          
       33 +| PWA | next-pwa |                                                                                                         
       34 +                                                                                                                           
       35 +---                                                                                                                        
       36 +                                                                                                                           
       37 +## Prerequisites                                                                                                           
       38 +                                                                                                                           
       39 +- Node.js 18+                                                                                                              
       40 +- A [Groq](https://console.groq.com) account (free tier available)
       41 +- A [Supabase](https://supabase.com) project                                                                               
       42 +                                                                                                                           
       43 +---                                                                                                                        
       44 +                                                                                                                           
       45 +## Setup                                                                                                                   
       46 +                                                                                                                           
       47 +### 1. Install dependencies                                                                                                
       48 +                                                                                                                           
       49  ```bash
       50 +npm install                                                                                                                
       51 +```                                                                                                                        
       52 +                                                                                                                           
       53 +### 2. Configure environment variables                                                                                     
       54 +                                                                                                                           
       55 +Copy `.env.example` to `.env.local` and fill in your values:                                                               
       56 +                                                                                                                           
       57 +```bash                                                                                                                    
       58 +cp .env.example .env.local                                                                                                 
       59 +```                                                                                                                        
       60 +                                                                                                                           
       61 +```env                                                                                                                     
       62 +# Required                                                                                                                 
       63 +GROQ_API_KEY=your_groq_api_key                                                                                             
       64 +                                                                                                                           
       65 +SUPABASE_URL=https://your-project.supabase.co                                                                              
       66 +SUPABASE_SERVICE_ROLE_KEY=your_service_role_key                                                                            
       67 +                                                                                                                           
       68 +# Optional                                                                                                                 
       69 +GROQ_MODEL=llama-3.3-70b-versatile        # default                                                                        
       70 +MAX_AUDIO_BYTES=26214400                   # default 25 MB, max 50 MB                                                      
       71 +NEXT_PUBLIC_COMPANY_NAME=Your Company Name # appears on exported PDFs                                                      
       72 +```                                                                                                                        
       73 +                                                                                                                           
       74 +> **Note:** `SUPABASE_SERVICE_ROLE_KEY` is a privileged key — it is server-only and never exposed to the client.           
       75 +                                                                                                                           
       76 +### 3. Set up Supabase tables                                                                                              
       77 +                                                                                                                           
       78 +In your Supabase project, create the following tables:                                                                     
       79 +                                                                                                                           
       80 +**`estimates`**                                                                                                            
       81 +| Column | Type | Notes |                                                                                                  
       82 +|--------|------|-------|                                                                                                  
       83 +| id | uuid | primary key, default `gen_random_uuid()` |                                                                   
       84 +| created_at | timestamptz | default `now()` |                                                                             
       85 +| total | numeric | |                                                                                                      
       86 +| notes | text | |                                                                                                         
       87 +| transcript | text | |                                                                                                    
       88 +| line_items | jsonb | |                                                                                                   
       89 +                                                                                                                           
       90 +**`price_list`**                                                                                                           
       91 +| Column | Type | Notes |                                                                                                  
       92 +|--------|------|-------|                                                                                                  
       93 +| id | uuid | primary key, default `gen_random_uuid()` |                                                                   
       94 +| created_at | timestamptz | default `now()` |                                                                             
       95 +| name | text | |                                                                                                          
       96 +| unit | text | |                                                                                                          
       97 +| unit_price | numeric | |                                                                                                 
       98 +                                                                                                                           
       99 +**`contractor_profile`**                                                                                                   
      100 +| Column | Type | Notes |                                                                                                  
      101 +|--------|------|-------|                                                                                                  
      102 +| id | uuid | primary key |                                                                                                
      103 +| company_name | text | |                                                                                                  
      104 +| license_number | text | |                                                                                                
      105 +| phone | text | |                                                                                                         
      106 +| email | text | |                                                                                                         
      107 +                                                                                                                           
      108 +### 4. Run the development server                                                                                          
      109 +                                                                                                                           
      110 +```bash                                                                                                                    
      111  npm run dev
        9 -# or                                                                                                                       
       10 -yarn dev                                                                                                                   
       11 -# or                                                                                                                       
       12 -pnpm dev                                                                                                                   
       13 -# or                                                                                                                       
       14 -bun dev                                                                                                                    
      112  ```
      113
       17 -Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.                                   
      114 +Open [http://localhost:3000](http://localhost:3000) in your browser.                                                       
      115
       19 -You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.                    
      116 +---                                                                                                                        
      117
       21 -This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatic       
          -ally optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.                                     
      118 +## Usage                                                                                                                   
      119
       23 -## Learn More                                                                                                              
      120 +1. **Record** — tap the microphone button and describe the job (e.g., *"3 duplex outlets at $85 each, 2 hours labor        
          +at $95 an hour, one panel upgrade $450"*)                                                                                  
      121 +2. **Review** — the AI parses your speech into a line-item table with quantities, unit prices, and a total                 
      122 +3. **Edit** — adjust any field inline if needed                                                                            
      123 +4. **Save or Export** — save the estimate to your history or download a PDF                                                
      124
       25 -To learn more about Next.js, take a look at the following resources:                                                       
      125 +---                                                                                                                        
      126
       27 -- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.                                 
       28 -- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.                                             
      127 +## Project Structure                                                                                                       
      128
       30 -You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributio       
          -ns are welcome!                                                                                                            
      129 +```                                                                                                                        
      130 +src/                                                                                                                       
      131 +├── app/                                                                                                                   
      132 +│   ├── dashboard/                                                                                                         
      133 +│   │   ├── page.tsx          # Main estimator UI                                                                          
      134 +│   │   ├── prices/page.tsx   # Price list management                                                                      
      135 +│   │   └── settings/page.tsx # Contractor profile & settings                                                              
      136 +│   └── actions/                                                                                                           
      137 +│       ├── estimate-actions.ts  # Transcribe, generate, save, delete                                                      
      138 +│       ├── price-actions.ts     # CRUD for price list                                                                     
      139 +│       └── settings-actions.ts  # Contractor profile                                                                      
      140 +├── components/                                                                                                            
      141 +│   ├── estimate-recorder.tsx    # Recording UI + waveform                                                                 
      142 +│   ├── estimate-table.tsx       # Editable line-item table                                                                
      143 +│   ├── saved-estimates.tsx      # Estimate history                                                                        
      144 +│   └── install-prompt.tsx       # PWA install prompt                                                                      
      145 +├── lib/                                                                                                                   
      146 +│   ├── audio-validation.ts      # File size + MIME validation                                                             
      147 +│   ├── estimate-pdf.ts          # PDF generation                                                                          
      148 +│   ├── sanitize-ai-text.ts      # Input/output sanitization                                                               
      149 +│   └── server/                                                                                                            
      150 +│       ├── groq-estimate.ts     # Groq API (Whisper + Llama)                                                              
      151 +│       ├── supabase.ts          # Supabase client                                                                         
      152 +│       └── rate-limit.ts        # IP-based rate limiting                                                                  
      153 +└── types/                                                                                                                 
      154 +    ├── estimate.ts              # EstimateLineItem, EstimateResult                                                        
      155 +    └── price.ts                 # PriceItem                                                                               
      156 +```                                                                                                                        
      157
       32 -## Deploy on Vercel                                                                                                        
      158 +---                                                                                                                        
      159
       34 -The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default       
          --template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.j       
          -s.                                                                                                                         
      160 +## Scripts                                                                                                                 
      161
       36 -Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) fo       
          -r more details.                                                                                                            
      162 +```bash                                                                                                                    
      163 +npm run dev    # Development server (Webpack)                                                                              
      164 +npm run build  # Production build                                                                                          
      165 +npm run start  # Production server                                                                                         
      166 +npm run lint   # ESLint                                                                                                    
      167 +```                                                                                                                        
      168 +                                                                                                                           
      169 +---                                                                                                                        
      170 +                                                                                                                           
      171 +## Security                                                                                                                
      172 +                                                                                                                           
      173 +- All AI and database calls run exclusively in Server Actions — no API keys are ever sent to the client                    
      174 +- Audio uploads are validated for MIME type and size before processing                                                     
      175 +- AI responses are sanitized before storage or display                                                                     
      176 +- Security headers configured: HSTS, `X-Frame-Options`, Content Security Policy                                            
      177 +- IP-based rate limiting on transcription and estimate generation endpoints                                                
      178 +                                                                                                                           
      179 +---                                                                                                                        
      180 +                                                                                                                           
      181 +## Deployment                                                                                                              
      182 +                                                                                                                           
      183 +The app can be deployed to any platform that supports Next.js (Vercel, Railway, Render, self-hosted).                      
      184 +                                                                                                                           
      185 +Set all environment variables from `.env.example` in your hosting platform's dashboard before deploying.                   
      186 +                                                                                                                           
      187 +```bash                                                                                                                    
      188 +npm run build                                                                                                              
      189 +npm run start                                                                                                              
      190 +``` 

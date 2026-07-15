# Whisney Morala — Portfolio Site

A single-page professional portfolio built to highlight customer service experience, administrative support, AI automation, and Make.com / Airtable skills.

## Features

- Hero introduction with photo and contact links
- Career objective / about section
- Skills grid: Customer Service, Administrative Support, AI Automation, Make.com & Airtable
- Work experience & training timeline
- Education
- Certifications gallery with click-to-enlarge view
- Contact section with email
- Fully responsive, limited/professional color palette, no build step required

## File Structure

- `index.html` — page markup and content
- `styles.css` — all styling (design tokens at the top of the file)
- `script.js` — mobile nav toggle and certificate lightbox
- `images/` — profile photo and certification images

## Editing content

All text content lives directly in `index.html`. Update the relevant section (About, Skills, Experience, Education, Certifications, Contact) and save — no build step is needed.

To change colors, edit the CSS variables at the top of `styles.css` under `:root`.

## Deploy to Vercel (1 minute)

1. Go to vercel.com
2. Click "Add New" → "Project"
3. Click "Import Git Repository"
4. Paste: https://github.com/whisneymorala-rgb/student-dashboard
5. Click "Import", then "Deploy" — no environment variables or configuration needed
6. Your portfolio is live!

You can also deploy to GitHub Pages, Netlify, or any static host since this is a plain HTML/CSS/JS site.

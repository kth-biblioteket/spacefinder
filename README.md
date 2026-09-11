# KTH Bibliotekets studieplatsväljare

Project: KTH Library Space Finder & Admin Dashboard

Objective: Build a full-stack React web application. It needs two parts: 

1. A public-facing "Space Finder" for students to filter study spaces.

2. A protected "Admin Dashboard" (CMS) for library staff to manage the spaces.

Tech Stack & Backend:

- Use Supabase for the database and image storage. 

- Create a "Spaces" table in Supabase.

Design System & Branding (Strict KTH Profile):

- Typography: 'Figtree' (import from Google Fonts).

- Colors: KTH Navy (#000061) for primary text/headers. KTH Blue (#1954a6) for active states/buttons. Backgrounds: Light Gray/Sand (#F5F5F5), Cards/Sidebar White (#FFFFFF). NO ORANGE.

- Iconography: Use 'lucide-react' icons. They must be clean and minimalist. 

PART 1: PUBLIC SPACE FINDER (Student View)

- Layout: Left sidebar for filters, right main area for a vertical list of Space Cards. (Mobile: filters in a bottom sheet).

- Sidebar Filters (Left Column):

  1. Sökfält: Text input with a Search icon. Placeholder: "Sök på lokal...".

  2. Filter Group "Jag vill arbeta" (Style as large clickable list items):

     - Options: "Enskilt, i avskildhet", "Där andra studerar", "Med vänner", "Med ett grupparbete".

  3. Filter Group "Ljudnivå" (Style as pill-shaped toggle buttons with icons):

     - Options: [VolumeX] "Tyst", [Volume1] "Samtalston", [Volume2] "Ljudligt".

  4. Filter Group "Utrustning" (Style as pill-shaped toggle buttons with icons):

     - Options: [Sliders] "Höj- och sänkbara bord", [Desktop] "Datorer", [Tv] "Skärm", [Edit] "Whiteboard", [Columns] "Studiebås", [Armchair] "Höj- och sänkbara stolar".

  5. Filter Group "Faciliteter" (Style as pill-shaped toggle buttons with icons):

     - Options: [Utensils] "Mat tillåten", [Sun] "Dagsljus", [Printer] "Skrivare", [Accessibility] "Toalett".

Pill Button Styling (TU Delft Style):

- Unselected state: Light gray background, dark text/icon.

- Selected state: KTH Blue (#1954a6) background, white text/icon.

Main Area (Space Cards List):

- Display spaces as a vertical list of horizontal cards.

- Card Closed State (Left to right): Title, Category tag. Below the title, display a neat, horizontal row of the SAME Lucide icons used in the filters representing the active equipment, facilities, and noise level. On the far right: An image thumbnail (approx 25% width).

- Image Logic: If the space has an image URL from the database, display it. If NOT, display a stylish placeholder: a KTH Navy (#000061) background with a white "Book" or "Library" Lucide icon centered in it.

- Interaction (Accordion): Clicking anywhere on a card smoothly expands it downwards to reveal the full description text.

- Filtering: Instant dynamic filtering based on sidebar selections.

PART 2: ADMIN DASHBOARD (Staff View)

- Create a separate route (e.g., /admin) for this view.

- Layout: A clean table or list showing all existing spaces with "Add New Space", "Edit", and "Delete" features.

- Space Form (Add/Edit Modal or Page):

  - Text inputs: Name, Category, Description.

  - Multi-select/Checkboxes for: Intent ("Jag vill arbeta"), Noise Level, Equipment ("Utrustning"), and Facilities ("Faciliteter").

  - Image Upload: A file upload component saving to Supabase Storage.

Initial Data Seed:

Seed the database with these exact examples so the public view works immediately:

1. Name: "Norra galleriet", Category: "Tyst zon", Intent: ["Enskilt, i avskildhet"], Noise: "Tyst", Equipment: ["Höj- och sänkbara bord", "Studiebås"], Facilities: ["Dagsljus"], Description: "Helt tyst läsesal på plan 3 med avskärmade studieplatser för maximalt fokus."

2. Name: "Bibliotekshallen", Category: "Öppen studieyta", Intent: ["Där andra studerar", "Med vänner"], Noise: "Ljudligt", Equipment: ["Höj- och sänkbara stolar"], Facilities: ["Mat tillåten", "Dagsljus", "Toalett"], Description: "Den stora öppna hallen på entréplan. Livlig miljö som passar för lättare studier och möten."

3. Name: "Datorsal Maxwell", Category: "Datorsal / Övningssal", Intent: ["Enskilt, i avskildhet"], Noise: "Samtalston", Equipment: ["Datorer"], Facilities: ["Skrivare"], Description: "Datorsal utrustad med stationära datorer för enskilt arbete."

Language: 

All UI text in both the public view and the admin dashboard MUST be in Swedish.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a2ff8471-0d85-4601-9583-abc6695c0807).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

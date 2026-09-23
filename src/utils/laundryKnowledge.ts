// Built-in expert laundry knowledge engine for Sparkle Spins Laundry Co.
// Provides immediate, high-quality laundry care & operational guidance even if external APIs are temporarily unavailable.

export function getExpertLaundryResponse(query: string): string {
  const q = query.toLowerCase();

  // 1. Coffee / Tea stains
  if (q.includes("coffee") || q.includes("tea")) {
    return `☕ **How to Remove Coffee & Tea Stains:**

1. **Act Quickly:** Blot (do not rub!) excess liquid immediately with a clean microfiber cloth or paper towel.
2. **Cold Water Flush:** Run cold water through the *back* of the stain so it pushes the coffee out of the fabric fibers.
3. **Mild Solution:** Mix 1 tbsp liquid detergent with 1 tbsp white vinegar in 2 cups of cool water. Dab gently onto the stain.
4. **Soak & Wash:** Let sit for 10–15 minutes, rinse, and wash with your regular laundry cycle.
5. **Sparkle Spins Tip:** For delicate silks or wool blends, let us handle it with our gentle specialized dry cleaning!`;
  }

  // 2. Grease / Cooking Oil / Butter
  if (q.includes("grease") || q.includes("oil") || q.includes("butter") || q.includes("fat")) {
    return `🍳 **Treating Grease & Oil Stains:**

1. **Blot Excess:** Gently dab away excess grease with a dry tissue.
2. **Dish Soap Pre-treatment:** Apply a few drops of grease-cutting liquid dish soap directly to the dry stain.
3. **Gentle Rub:** Work it in with your fingertips or a soft toothbrush for 2 minutes.
4. **Warm Rinse:** Rinse with warm water, then wash on the highest temperature safe for the garment label.
5. **Air Dry First:** Always check the stain before machine drying; dryer heat permanently bakes in oil residue!`;
  }

  // 3. Blood / Protein stains
  if (q.includes("blood")) {
    return `🩸 **Removing Blood Stains:**

1. **Cold Water ONLY:** Never use warm or hot water, as heat coagulates protein and sets blood permanently into fibers.
2. **Rinse & Flush:** Hold the fabric under brisk, cold running water from the reverse side.
3. **Hydrogen Peroxide (for whites/light fabrics):** Dab 3% hydrogen peroxide or a salt-water paste onto the stain.
4. **Soak:** Soak in cold water with enzymatic detergent for 30 minutes before laundering.`;
  }

  // 4. Wine / Juice / Berry stains
  if (q.includes("wine") || q.includes("juice") || q.includes("berry") || q.includes("beet")) {
    return `🍷 **Red Wine & Fruit Juice Stain Treatment:**

1. **Blot Immediately:** Never rub! Press clean paper towels firmly against the stain.
2. **Salt or Club Soda:** Sprinkle table salt or pour club soda over the fresh stain to absorb the pigment.
3. **Oxygen Bleach Soak:** Soak the garment in cool water with oxygen-based bleach (safe for colors) for 1 hour.
4. **Wash as Normal:** Launder in standard cycle. If stubborn, Sparkle Spins professional stain treatment will lift it completely!`;
  }

  // 5. Ink / Pen / Marker
  if (q.includes("ink") || q.includes("pen") || q.includes("marker")) {
    return `🖊️ **Removing Ink & Pen Marks:**

1. **Isolate the Stain:** Place a clean towel behind the stained fabric to prevent ink bleeding through.
2. **Rubbing Alcohol / Hand Sanitizer:** Dab isopropyl alcohol or clear hand sanitizer directly on the ink using a cotton ball.
3. **Blot Continuously:** As the ink dissolves, blot with fresh cotton pads until no more ink transfers.
4. **Launder:** Wash in warm water with standard detergent.`;
  }

  // 6. Sweat / Collar Rings / Yellowing
  if (q.includes("sweat") || q.includes("yellow") || q.includes("collar") || q.includes("deodorant") || q.includes("armpit")) {
    return `👕 **Tackling Collar Rings & Sweat Yellowing:**

1. **Paste Formula:** Mix 4 tbsp baking soda + 2 tbsp hydrogen peroxide + 1 tbsp warm water into a smooth paste.
2. **Apply & Rest:** Spread generously along the collar or underarms. Allow to sit for 30–45 minutes.
3. **Gentle Scrub:** Use a soft-bristle brush before placing in the washing machine.
4. **Oxygen Boost:** Add an oxygen-brightener to the wash cycle for sparkling crisp whites!`;
  }

  // 7. Medical Scrubs / Lab Coats / Hospital Linens
  if (q.includes("scrub") || q.includes("hospital") || q.includes("lab coat") || q.includes("clinic") || q.includes("doctor") || q.includes("nurse")) {
    return `🏥 **Sanitizing Medical Scrubs & Lab Coats (Tumutumu Healthcare Staff):**

1. **Separate Wash:** Always wash medical garments separately from household clothing.
2. **Sanitizing Temperature:** Wash in hot water (minimum 60°C / 140°F) using heavy-duty disinfectant detergent.
3. **Steam Sanitization:** High-temperature steam pressing eliminates remaining pathogens and leaves scrubs crisp and professional.
4. **Sparkle Spins Service:** We offer dedicated medical wash cycles with hygienic packaging for staff at PCEA Tumutumu Hospital and local clinics!`;
  }

  // 8. Silk / Wool / Cashmere / Delicates
  if (q.includes("silk") || q.includes("wool") || q.includes("cashmere") || q.includes("delicate") || q.includes("suit") || q.includes("dry clean")) {
    return `✨ **Caring for Silks, Wools & Delicates:**

1. **Check Care Labels:** Look for "Dry Clean Only". Never machine-wash structured suits or pure cashmere.
2. **Cold Hand-Wash:** If hand-washable, use lukewarm water and a pH-neutral wool/silk detergent.
3. **No Wringing:** Gently press excess water between two clean dry towels.
4. **Dry Flat:** Reshape woolens and dry flat away from direct sunlight and artificial heaters.
5. **Sparkle Spins Dry Cleaning:** We provide gentle, eco-safe dry cleaning and steam pressing tailored for delicate garments!`;
  }

  // 9. Duvets / Comforters / Bedding / Heavy Blankets
  if (q.includes("duvet") || q.includes("blanket") || q.includes("comforter") || q.includes("bedding") || q.includes("curtain")) {
    return `🛏️ **Duvet & Heavy Bedding Care:**

1. **Space is Key:** Bulky duvets need extra drum space to circulate and rinse properly without leaving detergent streaks.
2. **Dryer Balls:** Use wool dryer balls on low-to-medium heat to redistribute down/feather filling and prevent clumping.
3. **Sparkle Spins Bulk Care:** Schedule a pickup and we will wash, deep-sanitize, thoroughly dry, and fold your bulky duvets & curtains in our commercial-grade machines!`;
  }

  // 10. Shoes / Sneakers
  if (q.includes("shoe") || q.includes("sneaker") || q.includes("kicks") || q.includes("canvas")) {
    return `👟 **Sneaker & Footwear Revitalization:**

1. **Laces & Insoles:** Remove laces and insoles to soak separately in warm soapy water.
2. **Dry Brush First:** Knock off loose dirt and dust before applying any liquids.
3. **Soft Foam Cleaning:** Use a dedicated sneaker cleaner or mild dish soap foam with a medium-soft brush.
4. **Air Dry Naturally:** Never put shoes in the dryer; the intense heat will melt adhesives and warp soles!`;
  }

  // 11. Pickup & Delivery Service Areas (Tumutumu, Karatina, Mathira)
  if (q.includes("pickup") || q.includes("delivery") || q.includes("tumutumu") || q.includes("karatina") || q.includes("area") || q.includes("where") || q.includes("mathira") || q.includes("location") || q.includes("hours")) {
    return `📍 **Sparkle Spins Pickup & Delivery Details:**

• **Service Coverage:** PCEA Tumutumu Hospital & residences, Karatina CBD / Town, Mathira West/East, and surrounding institutions.
• **Doorstep Pickup:** Free scheduled collection right at your door or workstation.
• **Turnaround Time:** Standard turnaround is **24 to 48 hours**. Express same-day/next-day options available.
• **Scheduling:** You can book your pickup instantly using the booking form right on this page!
• **Payment:** Pay seamlessly upon delivery via M-Pesa or Cash.`;
  }

  // 12. Turnaround time
  if (q.includes("time") || q.includes("how long") || q.includes("turnaround") || q.includes("fast") || q.includes("duration") || q.includes("express")) {
    return `⏱️ **Turnaround Time at Sparkle Spins:**

• **Standard Wash & Fold:** 24 – 48 Hours
• **Dry Cleaning & Steam Press:** 48 Hours
• **Bulky Duvets & Blankets:** 48 Hours
• **Express Rush Service:** Same-day / 24-hour turnaround available upon request during booking!

Our rider will collect your items and notify you with itemized details before delivering freshly packed garments!`;
  }

  // 13. Pricing / Cost / Rates
  if (q.includes("price") || q.includes("cost") || q.includes("rate") || q.includes("how much") || q.includes("ksh") || q.includes("charge")) {
    return `💰 **Sparkle Spins Transparent Pricing (KSh):**

• **Wash & Fold (Standard):** KSh 150 / kg
• **Wash & Iron:** KSh 200 / kg
• **Dry Cleaning (Suits & Blazers):** KSh 450 – KSh 600 / piece
• **Duvets & Comforters:** KSh 500 – KSh 900 / piece
• **Steam Press Only:** KSh 70 – KSh 100 / piece
• **Shoe Revitalization:** KSh 350 / pair

*All orders include free doorstep pickup & delivery in our operational zones!*`;
  }

  // Default friendly assistant response
  return `✨ **Sparkle AI Laundry Specialist:**

I can assist you with:
• **Stain Solutions:** Advice for coffee, grease, ink, blood, wine, makeup, and sweat rings.
• **Fabric Guidance:** Washing instructions for cottons, wool, silk, medical scrubs, and duvets.
• **Pickup & Delivery:** Free doorstep service in **Tumutumu Hospital**, **Karatina Town**, and Mathira.
• **Booking:** Schedule your laundry collection anytime using the form on this page.

What specific laundry or fabric question can I help you with today? 😊`;
}

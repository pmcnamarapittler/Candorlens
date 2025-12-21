# CandorLens Dark Pattern Taxonomy (Skeleton)

## Overview
A structured classification system for dark patterns across multiple UI categories.
This file is currently the skeleton and will be filled in during Phase 1.2.

---

## Categories
1. Nagging
2. Obstruction
3. Sneaking
4. Interface Interference
5. Forced Action
6. Social Proof
7. Urgency
8. Scarcity

---

## Category Definitions (Empty — to be populated in Phase 1.2)

### 1. Nagging

**Description**  
Patterns that repeatedly interrupt, pressure, or pester the user into taking an action (upgrade, enable something, finish signup, etc.), often at the expense of their focus and autonomy.

**Related labels (from labels.json)**  
- nagging-modal  
- persistent-prompt  
- repeated-interruption  
- forced-reminder  

---

#### NAG-01 — Repeated Interruptions

- **What it is**  
  The interface shows the *same* popup, banner, or interstitial multiple times during a single session or across many sessions, even after the user has clearly dismissed it.

- **User harm**  
  - Creates frustration and decision fatigue  
  - Makes it harder to complete the original task  
  - Trains users to click through dialogs without reading

- **Detection signals**  
  - Same modal appears after the user has:
    - Pressed “No thanks” or “Maybe later”
    - Already taken the suggested action or rejected it  
  - Popup blocks primary content until dismissed  
  - Dismiss button is present, but the state is not remembered

- **Example UX cues**  
  - “Are you *sure* you don’t want to turn on notifications?” shown every time the user opens the app  
  - Newsletter signup overlay that appears on every page view despite being closed

- **Severity**: Medium  
- **Prevalence**: Common  

---

#### NAG-02 — Persistent Upgrade Prompts

- **What it is**  
  Constant reminders to upgrade to a paid plan or higher tier, shown in multiple locations (banners, modals, inline cards) even when the user has consciously chosen to stay on the free plan.

- **User harm**  
  - Creates ongoing pressure to spend  
  - Crowds out useful or neutral information  
  - Can obscure the value of the free tier

- **Detection signals**  
  - Fixed bars or banners like “Upgrade to Pro” pinned to the top or sidebar on most screens  
  - Upsell modals triggered frequently by normal actions (“You’re missing out! Upgrade now”)  
  - Free-tier features deliberately cluttered with upgrade CTAs

- **Example UX cues**  
  - “You’re *so close* to unlocking Pro!” messages on every dashboard visit  
  - Lock icons all over the UI with “Upgrade” tooltips constantly in view

- **Severity**: Medium  
- **Prevalence**: Very Common  

---

#### NAG-03 — Rating / Review Harassment

- **What it is**  
  Repeated prompts to rate the app, leave a review, or give feedback, especially when it interrupts critical tasks and appears even after the user has said “Not now” or similar.

- **User harm**  
  - Breaks task flow  
  - Pressures users into giving feedback they don’t want to give  
  - Can bias ratings if only “happy path” moments trigger the prompt

- **Detection signals**  
  - “Enjoying our app? Rate us 5 stars!” shown frequently  
  - No clear way to permanently dismiss (“Never ask again”)  
  - Prompt appears at random/unhelpful times (e.g., mid-checkout, mid-form)

- **Example UX cues**  
  - Rating sheet on every 2–3 app launches  
  - In-product widget that only asks satisfied users for public reviews

- **Severity**: Low–Medium  
- **Prevalence**: Very Common  

---

#### NAG-04 — Reminder Overload (Notifications / Email)

- **What it is**  
  Excessive reminders via email, SMS, or in-app notifications designed to push the user back into a funnel (checkout, upgrade, enable feature), often after the user has shown disinterest.

- **User harm**  
  - Inbox fatigue and notification overload  
  - Anxiety or guilt (“You’re missing out!”)  
  - Can feel like spam or harassment

- **Detection signals**  
  - Multiple reminder messages over a short period for the same action (e.g., abandoned cart, trial ending)  
  - Emotional or guilt-inducing language:
    - “We’re disappointed you haven’t finished…”
    - “Don’t let this opportunity slip away”  
  - No obvious controls to reduce reminder frequency

- **Example UX cues**  
  - Daily emails about an abandoned cart from the same merchant  
  - Repeated push notifications about a “limited-time” trial ending

- **Severity**: Medium  
- **Prevalence**: Common  

## 2. Obstruction  
Deliberate friction added to delay, confuse, or derail users from completing an action they intend (usually canceling, opting out, deleting data, or declining an unwanted feature).

**Related labels (from labels.json)**  
- multi-step-cancel  
- hidden-opt-out  
- confirm-shaming  
- preselected-options  
- misdirect-buttons  
- forced-navigation  
- delay-tactic  
- data-wall

---

### OBS-01 — Multi-Step Cancellation Maze

**What it is**  
Canceling, closing an account, or unsubscribing requires an excessive number of steps, pages, confirmations, or misleading detours.

**User harm**  
- Prolongs time spent  
- Increases frustration and abandonment  
- Causes users to unknowingly stay subscribed  

**Detection signals**  
- More than 3 steps required to complete cancellation  
- Repeated “Are you sure?” screens  
- Hidden or deprioritized cancel button (small, low-contrast)  
- Detours to FAQ pages, “offers,” or retention chats  

**Examples**  
- Subscription services requiring 5–7 pages to cancel  
- Streaming platforms forcing users to chat with a rep to cancel  

**Severity:** High  
**Prevalence:** Very Common  

---

### OBS-02 — Hidden Opt-Out (Buried Choices)

**What it is**  
Important opt-out actions are hidden behind menus, toggles, or visual tricks that make declining far harder than accepting.

**User harm**  
- Users unknowingly agree to tracking, subscriptions, or upsells  
- Loss of control over data or behavior  
- Feels deceptive  

**Detection signals**  
- Opt-out is:
  - in grey-on-grey text  
  - behind multiple dropdowns  
  - inside a settings menu unrelated to the original flow  
- Opt-in is large, bright, and front-and-center  

**Examples**  
- Cookie banners where “Reject All” is hidden in a deep submenu  
- Email opt-outs buried in multiple pages  

**Severity:** High  
**Prevalence:** Widespread in EU/US sites  

---

### OBS-03 — Confirmshaming (Emotion Manipulation)

**What it is**  
Decline/opt-out choices are worded to shame or guilt the user into compliance.

**User harm**  
- Emotional manipulation  
- Loss of autonomy  
- Negative psychological pressure  

**Detection signals**  
- Decline button text like:
  - “No thanks, I hate saving money”  
  - “Not today, I like missing out”  
  - “I prefer to stay uninformed”  

**Examples**  
- Newsletter popups using guilt phrases  
- Upsell modals using shaming decline options  

**Severity:** Medium  
**Prevalence:** Extremely Common  

---

### OBS-04 — Forced Navigation Detours

**What it is**  
Users trying to take an action (e.g., disable tracking, close an account) are redirected to irrelevant pages, FAQs, or product tours before they’re allowed to continue.

**User harm**  
- Wastes time  
- Creates confusion  
- Delays or discourages the intended action  

**Detection signals**  
- Clicking “Cancel Subscription” takes the user to:
  - a pricing comparison page  
  - a “how to use the product better” guide  
  - a special offer detour  
- Forward navigation required before returning to cancellation flow  

**Examples**  
- “Before you cancel, please review this video!”  
- Forced walkthroughs that block the path to opt out  

**Severity:** High  
**Prevalence:** Common  

---

### OBS-05 — Preselected/Forced Defaults

**What it is**  
Choices that benefit the company are automatically enabled or preselected, making the user responsible for undoing the action.

**User harm**  
- User agrees to settings they didn’t choose  
- Harder to maintain privacy or control  
- Increases accidental purchases or signups  

**Detection signals**  
- Toggles ON by default (tracking, email notifications, auto-renew)  
- Checkboxes in signup forms pre-checked for marketing  
- “Best deal” or “recommended” overrides chosen option  

**Examples**  
- Auto-renewal silently toggled on  
- Amazon adding products to Subscribe & Save by default  

**Severity:** Medium  
**Prevalence:** Very Common  

---

### OBS-06 — Slow-Down Tactics (Artificial Delay)

**What it is**  
The interface artificially slows down or adds wait timers to stop users from completing actions like canceling or opting out.

**User harm**  
- Adds frustration  
- Increases likelihood of abandoning the action  

**Detection signals**  
- Loading spinners that appear only when opting out  
- Mandatory countdown timers before decline is allowed  
- “Processing…” delays that are suspiciously consistent  

**Example cues**  
- “This may take several minutes…” used only for cancellation  
- Slow-loading pages linking to account deletion  

**Severity:** Medium  
**Prevalence:** Uncommon but impactful  

---

### OBS-07 — Data Walls (Blocked Until Personal Info Provided)

**What it is**  
Users are prevented from accessing content until they provide unnecessary personal data (email, phone number, or consent).

**User harm**  
- Privacy erosion  
- Forced data sharing  
- Users cannot evaluate product before surrendering information  

**Detection signals**  
- Page grayed out until email entered  
- “Continue with Email” required just to browse  
- No guest checkout available  

**Examples**  
- “Enter email to continue” before viewing pricing  
- Modal that blocks all content behind a signup wall  

**Severity:** High  
**Prevalence:** Rising rapidly  

---

### OBS-08 — Unnecessarily Complex Navigation (Intentional Confusion)

**What it is**  
Interface is structured in a way that makes it hard to find the desired path, especially for actions the company wants to discourage.

**User harm**  
- Users waste time  
- Increased error rate  
- Forces decisions under frustration  

**Detection signals**  
- Critical actions placed in non-intuitive pages  
- Poor labeling that obscures meaning (“Manage Experience Settings”)  
- Buttons positioned inconsistently from screen to screen  

**Examples**  
- “Delete Account” found under 6 submenus  
- Sections labeled in vague corporate jargon  

**Severity:** Medium  
**Prevalence:** Common  

## 3. Sneaking  
Patterns that hide information, bury consequences, or disguise actions to manipulate user choices.

**Related labels**  
- hidden-fees  
- drip-pricing  
- disguised-ads  
- disguised-buttons  
- auto-add-cart  
- ghost-charges  
- sneaky-emails  
- masked-choices  

---

### SNK-01 — Hidden Fees (Price Hiding)

**What it is**  
The true cost is concealed until the final step (or even after payment).

**User harm**  
- Users pay more than expected  
- Creates distrust  
- Inflates perceived value early, then switches  

**Detection signals**  
- Fees added at the last step (service fee, processing fee, donation fee)  
- “$0.00” displayed until checkout  
- Lack of fee transparency on early pages  

**Examples**  
- Ticketing sites adding $40+ fees at checkout  
- Hotels adding “resort fees” only at payment  

**Severity:** High  
**Prevalence:** Extremely Common  

---

### SNK-02 — Drip Pricing (Fragmented Disclosure)

**What it is**  
Price is revealed piece-by-piece across steps instead of upfront.

**User harm**  
- Users commit to flow before knowing full cost  
- Harder to comparison-shop  
- Psychological trap: “I’m already this far…”  

**Detection signals**  
- Add-on fees shown one screen at a time  
- “Starting at $5/mo” but real price requires add-ons  
- Upsells presented as required  

**Examples**  
- Airline seat selection fees revealed only after choosing a flight  
- SaaS tools requiring paid add-ons to unlock essential features  

**Severity:** High  
**Prevalence:** Widespread globally  

---

### SNK-03 — Disguised Ads (Ad = UI Element)

**What it is**  
Ads are made to look like normal interface elements or search results.

**User harm**  
- Users click unintentionally  
- Exposure to scams  
- Confusion about what is paid vs. organic  

**Detection signals**  
- Ads styled identically to search results  
- “Recommended result” that’s actually sponsored  
- Alignment, font, color matching organic items  

**Examples**  
- Google “Ad” links disguised as top search results  
- App store pages blending ads into recommendations  

**Severity:** Medium  
**Prevalence:** Very Common  

---

### SNK-04 — Disguised Buttons (UI Misdirection)

**What it is**  
Buttons that look identical but perform different actions — often making unwanted actions look more appealing.

**User harm**  
- Users click the wrong action  
- Hard to decline or navigate safely  
- Creates accidental purchases or downloads  

**Detection signals**  
- “Download” button placed next to a deceptive fake download  
- Buttons identical in color but with misleading labels  
- High-contrast unwanted action + low-contrast wanted action  

**Examples**  
- Software sites with fake green “DOWNLOAD” ads  
- Cookie banners where “Accept All” is primary but “Reject All” is plain text  

**Severity:** High  
**Prevalence:** Common  

---

### SNK-05 — Auto-Add to Cart

**What it is**  
Extra items or services are automatically added to the user’s cart without clear consent.

**User harm**  
- Users unknowingly purchase add-ons  
- Charge inflation  
- Loss of trust  

**Detection signals**  
- Cart includes items not clicked  
- Optional add-ons pre-selected and bundled  
- Hidden line items (warranty, insurance)  

**Examples**  
- Travel sites adding insurance automatically  
- Retailers adding accessories to a cart by default  

**Severity:** High  
**Prevalence:** Common  

---

### SNK-06 — Ghost Charges (Undisclosed Auto-Billing)

**What it is**  
Users are billed for something that was not clearly disclosed, or charged automatically after a trial without warning.

**User harm**  
- Financial harm  
- Feelings of deception  
- Difficulty getting refunds  

**Detection signals**  
- Auto-billing hidden in fine print  
- No reminder before trial ends  
- “You will not be charged” contradicted in practice  

**Examples**  
- Streaming trials converting to full price without email notice  
- Apps auto-renewing subscriptions unexpectedly  

**Severity:** High  
**Prevalence:** Widespread in subscription services  

---

### SNK-07 — Sneaky Email Subscriptions (Pre-Checked)

**What it is**  
User is subscribed to emails/newsletters without explicit consent.

**User harm**  
- Privacy erosion  
- Spam  
- Manipulates user consent  

**Detection signals**  
- Pre-checked newsletter box during checkout  
- Hidden unsubscribe wording  
- Signup disguised as required  

**Examples**  
- Retail checkout boxes automatically opting users into marketing  
- Lead forms requiring email for access  

**Severity:** Medium  
**Prevalence:** Very Common  

---

### SNK-08 — Masked Choices (Concealed Real Action)

**What it is**  
The UI disguises the real consequence of a choice, making a harmful or unwanted path seem benign.

**User harm**  
- Users make choices unintentionally  
- Difficulty understanding implications  
- Loss of transparency  

**Detection signals**  
- Buttons labeled vaguely (“Continue”) that imply consent  
- Required toggles placed in unrelated sections  
- Consequences hidden behind ambiguous text  

**Examples**  
- “Continue” = accept all tracking  
- “Skip” actually activates a free trial  

**Severity:** High  
**Prevalence:** Common  

## 4. Interface Interference  
Patterns that intentionally distort the visual hierarchy, contrast, alignment, or motion of UI elements to draw or divert user attention.

**Related labels**  
- visual-noise  
- misleading-contrast  
- hidden-buttons  
- moving-buttons  
- bait-contrast  
- confusing-hierarchy  
- layout-sabotage  
- obstruction-ui  

---

### INT-01 — Visual Noise Overload

**What it is**  
The interface floods the user with colors, banners, badges, motion, or conflicting elements to make key actions hard to find.

**User harm**  
- Cognitive overload  
- Hides important options  
- Manipulates attention toward promoted actions  

**Detection signals**  
- Excessive color saturation  
- Flashing badges or animated banners  
- Overlapping modals or stacked callouts  

**Examples**  
- Mobile games with flashing purchase prompts  
- E-commerce sites with too many popups, stickers, and sales tags  

**Severity:** Medium  
**Prevalence:** Common  

---

### INT-02 — Misleading Contrast (High vs Low Visibility)

**What it is**  
Primary and secondary actions are styled in deceptive contrast — usually the harmful action is bright and the safe action is muted.

**User harm**  
- Misleading cues  
- Users unintentionally accept things  
- Violates WCAG decision contrast guidelines  

**Detection signals**  
- Accept buttons high-contrast; decline buttons low-contrast  
- “Reject All” appearing as plain text  
- CTA disguised by ghost styling  

**Examples**  
- Cookie banners highlighting “Accept All” only  
- Email unsubscribe forms hiding “Unsubscribe”  

**Severity:** High  
**Prevalence:** Very Common  

---

### INT-03 — Hidden Buttons (Low Visibility)

**What it is**  
Decline, close, or secondary actions are hidden through styling, placement, or opacity tricks.

**User harm**  
- Users can’t decline or exit  
- Increased accidental acceptance  
- Frustration + mistrust  

**Detection signals**  
- Buttons with opacity < 60%  
- Close button blended into background  
- Required choices hidden behind multiple menus  

**Examples**  
- “X” to close modal nearly invisible  
- “No thanks” hidden behind a drop-down  

**Severity:** High  
**Prevalence:** Widespread  

---

### INT-04 — Moving Buttons (Kinetic Manipulation)

**What it is**  
Action buttons move, shift, or animate to avoid being clicked or to draw attention toward a preferred option.

**User harm**  
- Accidental taps  
- Humiliation patterns (“catch the button”)  
- Manipulation of motor behavior  

**Detection signals**  
- Button jumps on hover  
- Button repositioning after timer ends  
- “Accept” stays fixed; “Reject” moves away  

**Examples**  
- Banner ads where “close” moves when hovered  
- Surveys where “Skip” shifts position  

**Severity:** High  
**Prevalence:** Less common but severe  

---

### INT-05 — Bait Contrast (Reversal of Expected Hierarchy)

**What it is**  
The supposedly primary action is visually minimized while a secondary, harmful, or promotional action is highlighted.

**User harm**  
- Users confused about recommended action  
- Increases unwanted conversions  
- Violates mental models  

**Detection signals**  
- Destructive options overly highlighted  
- “Continue with add-on” high contrast  
- “Continue without” low contrast  

**Examples**  
- Antivirus tools highlighting paid upgrades  
- Airline seat maps pushing paid seats visually  

**Severity:** High  
**Prevalence:** Common  

---

### INT-06 — Confusing Hierarchy (Ambiguous Layout)

**What it is**  
Layout ordering intentionally disrupts expected hierarchy (putting “no” options above “yes,” or mixing unrelated actions together).

**User harm**  
- Increases misclicks  
- Users assume wrong relationship between items  
- Organizational confusion  

**Detection signals**  
- CTAs stacked in unusual order  
- Grouping unrelated options together  
- Redundant or duplicated buttons  

**Examples**  
- Cookie banners where “Manage Options” is visually grouped near ads  
- Streaming apps placing “Start Free Trial” next to “Login”  

**Severity:** Medium  
**Prevalence:** Common  

---

### INT-07 — Layout Sabotage (Intentionally Hard to Navigate)

**What it is**  
The UI layout is intentionally broken, misaligned, or spaced oddly to push the user toward a certain path.

**User harm**  
- Prevents informed navigation  
- Hard to find alternative paths  
- Creates unnecessary friction  

**Detection signals**  
- Critical actions placed too far, too small, or cut off  
- Forced scroll to access important controls  
- Z-index layering hiding functionality  

**Examples**  
- Mobile sites with tiny “continue without subscription” links  
- Layouts where decline action is pushed below the fold  

**Severity:** High  
**Prevalence:** Very Common  

---

### INT-08 — Obstruction UI (Covering or Blocking Alternatives)

**What it is**  
Popups, modals, overlays, or floating elements cover essential choices — making the safe or alternative action literally inaccessible.

**User harm**  
- User trapped in funnel  
- Forced attention on a single path  
- Accessibility violations  

**Detection signals**  
- Modals where “X” is off-screen  
- Sticky bars covering navigation  
- Videos auto-expanding to block options  

**Examples**  
- Popups covering “reject” controls  
- Cookie banners blocking the main page unless “Accept All” is chosen  

**Severity:** High  
**Prevalence:** Extremely Common  

## 5. Forced Action  
Patterns that require users to perform an action they do not want, do not expect, or should not be required to perform in order to continue using the service.

**Related labels**  
- forced-opt-in  
- mandatory-sharing  
- locked-progress  
- impossible-to-decline  
- coercive-continuation  
- data-ransom  
- gated-access  

---

### FA-01 — Forced Registration (Account Wall)

**What it is**  
Users must create an account or sign in before accessing essential functionality — even when the content does not require it.

**User harm**  
- Prevents usage without giving up data  
- Creates friction  
- Coerces users into providing PII  

**Detection signals**  
- “Continue” disabled until login  
- Required form fields irrelevant to purpose  
- Paywalls disguised as sign-in walls  

**Examples**  
- News sites requiring account creation to read an article  
- Shopping sites demanding login before checkout  

**Severity:** High  
**Prevalence:** Very Common  

---

### FA-02 — Forced Data Sharing (Data Ransom)

**What it is**  
Access to the service is blocked unless users provide personal data unrelated to the task.

**User harm**  
- Loss of privacy  
- Data misuse risk  
- Violates data minimization principles  

**Detection signals**  
- Required phone number for non-sensitive tasks  
- Social login forced rather than optional  
- Mandatory address for free downloads  

**Examples**  
- Apps requiring contacts access to continue  
- Sites forcing phone verification for simple browsing  

**Severity:** High  
**Prevalence:** Common  

---

### FA-03 — Impossible-to-Decline Choice (Coercive Compliance)

**What it is**  
The system claims a choice exists, but declining is made impossible or nearly impossible.

**User harm**  
- Fake choice  
- coerces user into unwanted commitments  

**Detection signals**  
- Decline button missing entirely  
- “No thanks” opens another modal  
- Looping decline flows  

**Examples**  
- Cookie banners with no rejection option  
- Apps where “Not now” loops back to “Enable notifications”  

**Severity:** High  
**Prevalence:** Very Common  

---

### FA-04 — Forced Continuation (Coercive Journey)

**What it is**  
Users are pushed through multiple steps or upsells that cannot be skipped.

**User harm**  
- Time waste  
- Pressure-induced decisions  
- Increased unwanted purchases  

**Detection signals**  
- Multi-step modal required to reach main content  
- Cannot exit without completing “tour” or “setup”  
- Upsells embedded in required steps  

**Examples**  
- Antivirus tools forcing upgrade flow during installation  
- Streaming services requiring full profile setup before watching  

**Severity:** Medium  
**Prevalence:** Common  

---

### FA-05 — Forced Subscription Start (Hard-to-Avoid Trials)

**What it is**  
Users cannot proceed without starting a free trial, sometimes automatically converting to paid.

**User harm**  
- Unwanted subscriptions  
- Hidden or unexpected charges  
- Regulatory risks (FTC ROSCA)  

**Detection signals**  
- “Continue” automatically starts trial  
- Payment info required for free features  
- Trial start auto-checked  

**Examples**  
- Apps that force a 7-day trial before use  
- Premium “gates” blocking basic features  

**Severity:** High  
**Prevalence:** Widespread in mobile apps  

---

### FA-06 — Gated Access (Blocking Primary Function)

**What it is**  
The core functionality is locked behind unrelated requirements (e.g., surveys, newsletters).

**User harm**  
- Prevents legitimate use  
- Coerces engagement or sign-ups  
- Violates good UX  

**Detection signals**  
- Service blocked unless user follows a social media account  
- “Unlock” features require watching ads  
- Mandatory onboarding flow with no skip  

**Examples**  
- Productivity apps requiring newsletter signup  
- Games locking content behind reward ads  

**Severity:** Medium  
**Prevalence:** Common  

---

### FA-07 — Mandatory Add-ons (Forced Bundle)

**What it is**  
Users cannot purchase a product unless they also buy an add-on, warranty, or unrelated service.

**User harm**  
- Higher cost  
- Reduced autonomy  
- Unfair purchasing  

**Detection signals**  
- Add-on pre-selected and cannot be removed  
- No path to purchase base item alone  
- Upsell integrated as “required”  

**Examples**  
- Travel sites forcing baggage upgrades  
- Retailers requiring warranty purchase  

**Severity:** High  
**Prevalence:** Less common but severe  

## 6. Social Proof Manipulation  
Patterns that distort or fabricate social indicators (reviews, ratings, activity counters) to create artificial trust or pressure.

**Related labels**  
- fake-reviews  
- fabricated-activity  
- social-pressure  
- manipulated-rating  
- fake-testimonials  
- misleading-popularity  
- activity-bait  

---

### SP-01 — Fake Reviews / Ratings Inflation

**What it is**  
Displaying reviews that are fabricated, AI-generated, purchased, or cherry-picked to create an illusion of trust.

**User harm**  
- Misleading product quality  
- Deceives users into purchases  
- Violates consumer protection laws  

**Detection signals**  
- Identical phrasing across multiple reviews  
- Unverified “5-star” ratings only  
- Hidden negative reviews  

**Examples**  
- E-commerce sellers boosting ratings with paid review farms  
- “Customer favorites” based on internal promotion, not data  

**Severity:** High  
**Prevalence:** Extremely common  

---

### SP-02 — Fake Activity Counters (“123 people are viewing this!”)

**What it is**  
Showing exaggerated or fabricated numbers for views, purchases, or active users.

**User harm**  
- Pressures rushed decisions  
- Creates false popularity  
- Misrepresents product demand  

**Detection signals**  
- Counters increasing at consistent intervals  
- “X people booked in the last hour” with no verification  
- Activity shown even when product just launched  

**Examples**  
- Travel sites showing fake booking activity  
- Retail sites showing “50 ppl near you bought this!”  

**Severity:** High  
**Prevalence:** Very common  

---

### SP-03 — Fake Scarcity From Social Cues

**What it is**  
Using social proof mechanics to imply limited supply through fabricated social triggers.

**User harm**  
- Anxiety and FOMO  
- Leads to rushed or irrational decisions  

**Detection signals**  
- “Only 2 left!” without real inventory  
- “Someone in SF just bought this”  
- “Trending in your area”  

**Examples**  
- Apparel stores showing fake stock levels  
- SaaS tools showing “spots filling fast!”  

**Severity:** Medium  
**Prevalence:** Common  

---

### SP-04 — Manipulated Testimonials

**What it is**  
Testimonials presented as genuine but written by company staff, bots, or marketing teams.

**User harm**  
- Misleads trust  
- Artificially boosts credibility  

**Detection signals**  
- Missing user photos or unverifiable identities  
- “Case studies” with stock images  
- Testimonials rewritten in identical tone  

**Examples**  
- SaaS landing pages with AI-generated quotes  
- Financial apps showcasing “success stories” that are scripted  

**Severity:** High  
**Prevalence:** Common in marketing  

---

### SP-05 — Social Pressure UI (“Join 200,000 satisfied users!”)

**What it is**  
UI elements exaggerate masses of users to pressure sign-up or conversion.

**User harm**  
- Creates false herd behavior  
- Manipulates decision-making through peer pressure  

**Detection signals**  
- No source for the “user count”  
- Identical numbers across unrelated pages  
- Claims of “top-rated” without citations  

**Examples**  
- Crypto apps claiming millions of users  
- Shopping sites using “most popular choice” badges without data  

**Severity:** Medium  
**Prevalence:** Widespread  

## 7. Urgency Manipulation  
Patterns that pressure users into taking action quickly by presenting false or exaggerated time pressure.

**Related labels**
- fake-timers  
- countdown-pressure  
- expiring-offer-bait  
- urgency-manipulation  
- forced-hurry  
- deceptive-deadlines  

---

### UR-01 — Fake Countdown Timer

**What it is**  
A timer counts down to force a rushed decision, but resets after it ends or is not tied to real availability.

**User harm**  
- Pressure to buy or sign up  
- Reduces decision quality  
- Encourages impulse behaviors  

**Detection signals**  
- Timer resets on page refresh  
- Timer appears on every product identically  
- No real expiration tied to inventory  

**Examples**  
- “Offer expires in 5:00” but refills on reload  
- Flash sales that run all day  

**Severity:** High  
**Prevalence:** Extremely common  

---

### UR-02 — Exaggerated Deadline (“Offer ends today!”)

**What it is**  
False claims that something is ending soon when the deadline is perpetual or fabricated.

**User harm**  
- Creates false stress  
- Misleads users into purchasing or upgrading  
- Violates consumer protection rules  

**Detection signals**  
- “Ends today!” shown every day  
- No timestamp or verification  
- Deadline language repeated on unrelated products  

**Examples**  
- Subscription discounts always “ending in 24 hours”  
- Retail sites with rolling holiday sales  

**Severity:** Medium  
**Prevalence:** Very common  

---

### UR-03 — Fake Limited-Time Bonuses

**What it is**  
Claiming a bonus feature, perk, or extra item will disappear soon even though it is always included.

**User harm**  
- Creates false exclusivity  
- Pushes premature conversion  
- Distorts value perception  

**Detection signals**  
- Bonus available every day  
- “Exclusive today only” banners without evidence  
- Identical bonuses across unrelated campaigns  

**Examples**  
- “Sign up now to get premium support!” (but it’s standard)  
- Courses offering “limited” modules permanently  

**Severity:** Medium  
**Prevalence:** Common  

---

### UR-04 — Inconsistent or Fabricated Time Pressure

**What it is**  
Interface hints urgency indirectly without showing a timer or real deadline.

**User harm**  
- Creates psychological FOMO  
- Pushes users to act quickly  
- Lacks transparency  

**Detection signals**  
- “Hurry!” or “Almost gone!” with no facts  
- Urgency slogans repeated on all pages  
- Vague time-based cues  

**Examples**  
- “Selling fast!”  
- “Order soon to avoid delays!”  

**Severity:** Low–Medium  
**Prevalence:** Widespread  

## 8. Scarcity Manipulation  
Patterns that create false or exaggerated limits on availability to pressure users into rushed decisions.

**Related labels**
- fake-scarcity  
- limited-stock-lies  
- inventory-deception  
- false-limits  
- manufactured-scarcity  
- slot-restriction  
- scarcity-pressure  

---

### SC-01 — Fake Low Stock Claims (“Only 2 left!”)

**What it is**  
Claims that stock is nearly depleted even when inventory is full.

**User harm**  
- Creates panic  
- Reduces decision quality  
- Manipulates purchasing urgency  

**Detection signals**  
- Same stock claims on every variant  
- Inventory shown as low even for digital goods  
- No change in stock after purchase  

**Examples**  
- Retail sites showing “only 1 left!” for made-to-order goods  
- Apps claiming “only 3 spots left” for unlimited sign-ups  

**Severity:** High  
**Prevalence:** Extremely common  

---

### SC-02 — Fake Limited Availability for Digital Products

**What it is**  
Claiming that digital items (courses, software seats, memberships) have limited inventory.

**User harm**  
- Pushes users to buy quickly  
- Creates false FOMO  
- Distorts perception of true supply  

**Detection signals**  
- Applies scarcity logic to infinite resources  
- “Limited slots” that reset daily  
- No backend inventory system  

**Examples**  
- SaaS “limited beta seats” for public release  
- Online courses with fake “capacity”  

**Severity:** Medium  
**Prevalence:** Very common  

---

### SC-03 — Artificial Constraints on Choice

**What it is**  
Restricting options artificially so users feel pressured to pick a non-optimal option.

**User harm**  
- Reduces meaningful choice  
- Forces suboptimal decisions  
- Creates pressure-based funnels  

**Detection signals**  
- “This option is not available right now” without reason  
- Forcing users to choose high-priced tiers  
- Claiming limited access unrelated to supply  

**Examples**  
- Subscription paywalls with missing “basic” tier  
- Travel sites removing cheaper flights temporarily  

**Severity:** Medium  
**Prevalence:** Common  

---

### SC-04 — Fake Waitlists or Artificial Queueing

**What it is**  
Pretending that users must “wait their turn” or join a queue, even when no queue exists.

**User harm**  
- Psychological pressure  
- Creates false exclusivity  
- Pushes users into fearing they’ll lose access  

**Detection signals**  
- Queue position jumps inconsistently  
- “Waitlist” instantly approves the user  
- Queue used for standard flows (e.g., signup)  

**Examples**  
- Fintech apps claiming “overwhelming demand”  
- Early-access products with fake join counts  

**Severity:** Medium  
**Prevalence:** Common  

---

## Pattern Schema Template (Empty)
- ID:
- Name:
- Category:
- Description:
- User Harm:
- Detection Signals:
- Examples:
- Regulations:
- Severity:
- Prevalence:

---

## Implementation Notes
This file is intentionally left as a scaffolding template.
Full taxonomy content will be added in **Phase 1.2**.
## Στόχος
Εξαργύρωση δωροκάρτας σε **οποιαδήποτε** συνδρομή, με υπολογισμό υπολοίπου, αποθήκευση credit για μελλοντική χρήση, και εμφάνιση/χρήση credit στις επόμενες συνδρομές.

---

## 1. Βάση δεδομένων — νέος πίνακας `user_credits`

```text
user_credits
------------
id                 uuid PK
user_id            uuid  → app_users.id
amount             numeric   (θετικό = πίστωση, αρνητικό = χρήση)
source             text      ('gift_card' | 'subscription_use' | 'manual_adjustment')
gift_card_id       uuid null → gift_cards.id
subscription_id    uuid null → user_subscriptions.id
notes              text
created_at         timestamptz
created_by         uuid null → app_users.id
```

- Το τρέχον υπόλοιπο = `SUM(amount)` ανά χρήστη.
- RLS: staff (coach/admin) full access, user μπορεί να δει τα δικά του.
- Helper function `get_user_credit_balance(user_id) RETURNS numeric`.

---

## 2. Ροή στο `ReceiptConfirmDialog` (νέα εμπειρία)

Το dialog γίνεται πιο έξυπνο: υπολογίζει σε πραγματικό χρόνο πόσο μένει.

```text
Συνδρομή: HYPERGYM
Τιμή:                              90,00 €

┌ Πίστωση χρήστη ─────────────────┐
│ Διαθέσιμο υπόλοιπο:      30,00 €│
│ [ ] Χρήση πίστωσης              │
└─────────────────────────────────┘

┌ Δωροκάρτα (προαιρετικό) ────────┐
│ [L5EV-U3XK-G9EB]  [Έλεγχος]     │
│ ✓ Έγκυρη — Αξία: 120,00 €       │
└─────────────────────────────────┘

──────────────────────────────────
Υπόλοιπο προς πληρωμή:     0,00 €
Νέα πίστωση προς αποθήκευση: 30,00 €
──────────────────────────────────

[Ολοκλήρωση χωρίς πληρωμή]  [Πληρωμή ✓]  [Ακύρωση]
```

Βήματα:
1. Πληκτρολογεί κωδικό → πατάει **Έλεγχος** → validation μόνο (όχι redemption).
2. Επιλέγει προαιρετικά "Χρήση πίστωσης" (αν υπάρχει υπόλοιπο).
3. Υπολογισμός: `remaining = price − giftCard.amount − appliedCredit`.
   - Αν `remaining < 0` → η διαφορά αποθηκεύεται ως νέα πίστωση.
   - Αν `remaining > 0` → πληρώνεται με μετρητά/κάρτα.
4. Πάτημα **Πληρωμή** = μαρκάρεται `is_paid = true`, εξαργυρώνεται η κάρτα, γίνονται εγγραφές στο `user_credits`.
5. Πάτημα **Ολοκλήρωση χωρίς πληρωμή** = ίδιες εγγραφές αλλά `is_paid = false` (αν έμεινε υπόλοιπο).

---

## 3. Αλλαγές στο `SubscriptionManagement.tsx`

- `validateAndRedeemGiftCard` → σπάει σε δύο:
  - `validateGiftCard(code)` (χωρίς type check — μόνο active/expired) → επιστρέφει `{ok, amount, giftCardId}`.
  - `redeemGiftCard(giftCardId, userId, subscriptionId)` → κάνει το UPDATE μόνο μετά από confirm.
- Νέες helpers: `fetchUserCreditBalance(userId)`, `applyCreditUsage(userId, amount, subscriptionId)`, `addCreditFromGiftCard(userId, amount, giftCardId)`.
- `handleCreateSubscription` / `handleRenewSubscription` δέχονται πλέον αντικείμενο:
  ```ts
  { isPaid, giftCardCode?, appliedCredit?, remainingCredit? }
  ```
  και εκτελούν στη σειρά: redeem κάρτας → user_credits εγγραφές → subscription create/renew.

---

## 4. Ένδειξη πίστωσης αλλού στο app (μικρή προσθήκη)

- Στη λίστα χρηστών του `SubscriptionManagement`, δίπλα στο όνομα εμφανίζεται μικρό badge `€X credit` αν έχει θετικό υπόλοιπο, ώστε ο admin να ξέρει ότι υπάρχει.

---

## Τεχνικές λεπτομέρειες

- **RLS `user_credits`**: staff μπορούν να διαχειρίζονται όλα (`is_coach_user(auth.uid())`), user βλέπει `WHERE user_id = get_app_user_id_for_programs(auth.uid())`.
- **Grants**: `SELECT, INSERT, UPDATE, DELETE` σε `authenticated`, `ALL` σε `service_role`.
- **Ατομικότητα**: όλες οι εγγραφές (gift_card update + user_credits inserts + subscription paid update) γίνονται από τον client μετά από επιτυχή δημιουργία συνδρομής — σε σφάλμα εμφανίζεται toast χωρίς rollback (ο admin μπορεί να διορθώσει χειροκίνητα, γιατί οι πίνακες είναι ανιχνεύσιμοι).
- **Δεν χρειάζεται νέα RPC** — όλα με απλά queries.

---

## Files που θα αλλάξουν
- `supabase/migrations/*` — νέος πίνακας `user_credits` + policies + helper function.
- `src/components/subscriptions/ReceiptConfirmDialog.tsx` — πλήρες redesign με live calc.
- `src/components/subscriptions/SubscriptionManagement.tsx` — νέα helpers + αλλαγή handlers.
- (προαιρετικά) μικρό badge πίστωσης στη λίστα χρηστών.

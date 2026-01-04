# Database Column Mapping (UI → Database)

## Explicit Mappings Implemented

### Person Creation (`people` table)

**Location**: `src/screens/LogDateScreen.tsx` → `handleCreatePerson()`

```typescript
const personInsertData = {
  user_id: user.id,           // → people.user_id
  name: newPersonName.trim(), // → people.name
  age: null,                  // → people.age
  profession: null,           // → people.profession
  how_we_met: null,           // → people.how_we_met
};
```

### Person Update (`people` table)

**Location**: `src/screens/PersonProfileScreen.tsx` → `handleSaveDetails()`

```typescript
const updateData: {
  name: string;
  age: number | null;
  profession: string | null;
  how_we_met: string | null;
} = {
  name: editingName.trim(),                    // → people.name
  age: editingAge.trim() ? parseInt(...) : null, // → people.age
  profession: editingProfession.trim() || null,   // → people.profession
  how_we_met: editingHowMet.trim() || null,      // → people.how_we_met
};
```

### Date Creation (`dates` table)

**Location**: `src/screens/LogDateScreen.tsx` → `handleSubmit()`

```typescript
const dateInsertData = {
  user_id: user.id,                    // → dates.user_id
  person_id: selectedPersonId,        // → dates.person_id
  feeling: selectedFeeling,            // → dates.feeling
  rating: rating || null,              // → dates.rating
  activity: activity.trim() || null,   // → dates.activity
  location: location.trim() || null,   // → dates.location
  emoji: emoji.trim() || null,         // → dates.emoji
  green_flag: greenFlags.trim() || null, // → dates.green_flag
  red_flag: redFlags.trim() || null,    // → dates.red_flag
};
```

## Field Mapping Reference

### Person Fields
- UI: "Person Name" → DB: `people.name`
- UI: "Age" → DB: `people.age`
- UI: "Profession" → DB: `people.profession`
- UI: "How you met" → DB: `people.how_we_met`

### Date Fields
- UI: "Feeling" (Great/Good/Meh/Bad/Awful) → DB: `dates.feeling`
- UI: "Rating" (1-5 stars) → DB: `dates.rating`
- UI: "Activity" → DB: `dates.activity`
- UI: "Location" → DB: `dates.location`
- UI: "Emoji" → DB: `dates.emoji`
- UI: "Green flag" (text) → DB: `dates.green_flag`
- UI: "Red flag" (text) → DB: `dates.red_flag`

## Key Corrections Made

1. ✅ `how_met` → `how_we_met` (database column name)
2. ✅ `green_flags` (array) → `green_flag` (text, singular)
3. ✅ `red_flags` (array) → `red_flag` (text, singular)
4. ✅ Removed `updated_at` from person updates (not in schema)
5. ✅ All inserts/updates now use explicit object mapping (no spreading)

## Assumptions

- `feeling` stores text values: 'great', 'good', 'meh', 'bad', 'awful'
- `rating` is integer 1-5 or null
- All optional fields are set to `null` when empty (not empty string)
- `person_id` is required for all dates (enforced in UI validation)


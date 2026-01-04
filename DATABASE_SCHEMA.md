# Database Schema for People & Dates

## Tables

### `people` table
Stores person profiles that users have dated.

**Required fields:**
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key to auth.users)
- `name` (text, required)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Optional fields (progressive enrichment):**
- `age` (integer)
- `profession` (text)
- `industry` (text)
- `how_met` (text) - e.g., "Hinge", "Coffee shop", "Friend intro"
- `hometown` (text)
- `hair_color` (text)
- `eye_color` (text)
- `height` (text) - e.g., "5'10\""
- `myers_briggs` (text) - e.g., "ENFP"
- `star_sign` (text) - e.g., "Leo"

### `dates` table (update existing)
Extend the existing dates table to link to people.

**Current fields:**
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key to auth.users)
- `feeling` (text) - required: 'great', 'good', 'meh', 'bad', 'awful'
- `emoji` (text, nullable)
- `created_at` (timestamp)

**New fields to add:**
- `person_id` (uuid, foreign key to people.id, nullable) - links date to a person
- `activity` (text, nullable) - e.g., "Coffee", "Dinner", "Walk"
- `location` (text, nullable)
- `time_of_day` (text, nullable) - e.g., "Morning", "Afternoon", "Evening", "Night"
- `green_flags` (text[], nullable) - array of tags
- `red_flags` (text[], nullable) - array of tags

## Relationships
- One `person` can have many `dates` (one-to-many)
- A `date` can optionally belong to a `person` (many-to-one, nullable)
- All records are scoped to `user_id` for multi-tenancy

## Indexes
- `people.user_id` (for fast user queries)
- `dates.user_id` (for fast user queries)
- `dates.person_id` (for fast person date queries)
- `dates.created_at` (for chronological sorting)


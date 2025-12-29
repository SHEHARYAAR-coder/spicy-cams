# Database Migration Instructions

## Run this migration to add the TipMenuItem model

```bash
npx prisma migrate dev --name add_tip_menu_items
```

This will create the `tip_menu_items` table with the following structure:

- id: Unique identifier
- model_id: Foreign key to users table
- icon: Emoji or icon string
- name: Activity name
- tokens: Token cost (integer)
- category: "tip", "toy", or "games"
- is_active: Boolean flag
- sort_order: Integer for custom ordering
- created_at, updated_at: Timestamps

## After migration

The system will automatically:

1. Create indexes on (model_id, is_active) and (model_id, category)
2. Set up foreign key relationship with CASCADE delete
3. Default values: category="tip", is_active=true, sort_order=0

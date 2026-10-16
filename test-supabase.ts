import { supabase } from './lib/supabase.ts';

async function testSupabase() {
  console.log('Testing Supabase connection...');
  try {
    // Try to create the table if it doesn't exist (using RPC or just checking if we can)
    // Actually, we can't easily create tables via the standard client without admin privileges
    // But we can check if we have any tables at all.
    
    console.log('Checking for tables...');
    const { data: tableData, error: tableError } = await supabase
      .from('snippets')
      .select('id')
      .limit(1);

    if (tableError) {
      console.error('Table check failed:', tableError.message);
      if (tableError.code === 'PGRST205') {
        console.log('ACTION REQUIRED: You need to create the "snippets" table in your Supabase SQL Editor.');
        console.log(`
CREATE TABLE snippets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  userId TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  code TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'typescript',
  tags JSONB DEFAULT '[]'::jsonb,
  isPublic BOOLEAN DEFAULT false,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE snippets ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can create their own snippets" ON snippets FOR INSERT WITH CHECK (auth.uid()::text = userId);
CREATE POLICY "Users can view their own snippets" ON snippets FOR SELECT USING (auth.uid()::text = userId);
CREATE POLICY "Users can update their own snippets" ON snippets FOR UPDATE USING (auth.uid()::text = userId);
CREATE POLICY "Users can delete their own snippets" ON snippets FOR DELETE USING (auth.uid()::text = userId);
CREATE POLICY "Anyone can view public snippets" ON snippets FOR SELECT USING (isPublic = true);
        `);
      }
    } else {
      console.log('Table exists. Data:', tableData);
    }
  } catch (err) {
    console.error('Unexpected Error:', err);
  }
}

testSupabase();

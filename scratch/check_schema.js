const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://fgsakxulywifmsgtehvi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnc2FreHVseXdpZm1zZ3RlaHZpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Nzc1MTAyNCwiZXhwIjoyMTAzMzI3MDI0fQ.h6IUYIeBwwbgFIzNkE7XVw-b0pdLf8TH7jMTl-7WiIY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
  const { data, error } = await supabase.from('domains').select('id, autoPublishEnabled').limit(1);
  console.log('Data:', data, 'Error:', error);
}

testQuery();

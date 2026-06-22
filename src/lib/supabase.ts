import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://irfzoraenikxpavbkrjw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZnpvcmFlbmlreHBhdmJrcmp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxMjA3NzcsImV4cCI6MjA5NzY5Njc3N30.DW7yrDm3aABZANyh5bEGkmr8kdaI4eHzHKE8pAz-CsM'
)

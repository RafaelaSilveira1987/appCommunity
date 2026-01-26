import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://kzgsnzulftscdobngltq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6Z3NuenVsZnRzY2RvYm5nbHRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MTQ3MjYsImV4cCI6MjA4NDQ5MDcyNn0.dd_9OiuEnmb2NIlzt9b2Fg4G-gtEUWK3bAb_WpZJtjk";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

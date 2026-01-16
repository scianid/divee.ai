import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import React from 'react';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        navigate('/login');
      } else {
        setLoading(false);
      }
    });
  }, [navigate]);

  if (loading) return <div>Loading...</div>;
  return children;
}

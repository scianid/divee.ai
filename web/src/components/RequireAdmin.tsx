import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import React from 'react';

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user, isAdmin, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      // Not authenticated - redirect to login
      navigate('/login');
    } else if (!isAdmin) {
      // Authenticated but not admin - redirect to dashboard
      navigate('/dashboard');
    } else {
      // Admin user - allow access
      setLoading(false);
    }
  }, [user, isAdmin, isLoading, navigate]);

  if (loading || isLoading) return <div>Loading...</div>;
  return children;
}

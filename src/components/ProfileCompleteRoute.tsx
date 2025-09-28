import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

type ProfileCompleteRouteProps = {
  children: React.ReactNode;
};

export default function ProfileCompleteRoute({ children }: ProfileCompleteRouteProps) {
  const { user } = useAuth();
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { count, error } = await supabase
          .from('school_records')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (error) {
          throw error;
        }

        if (count !== null && count > 0) {
          setIsProfileComplete(true);
        }
      } catch (error) {
        console.error('Error checking profile completion:', error);
      } finally {
        setLoading(false);
      }
    };

    checkProfile();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  if (!isProfileComplete) {
    return <Navigate to="/profile" replace />;
  }

  return <>{children}</>;
}

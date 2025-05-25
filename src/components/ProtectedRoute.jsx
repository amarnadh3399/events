import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        await axios.get('http://localhost:5001/api/verify-token', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsVerified(true);
      } catch (err) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    };

    verifyToken();
  }, [navigate]);

  return isVerified ? children : <div className="loading">Verifying session...</div>;
};

export default ProtectedRoute;
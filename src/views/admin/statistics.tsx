import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { fetchStatistics } from '../../communication/backend';
import { SLButton } from '../../components/common/sl-button';
import { View } from '../../components/common/view';
import { ErrorHandler } from '../../components/error-handler';
import ErrorContext from '../../contexts/error-context';
import PageTitleContext from '../../contexts/page-title-context';
import { useUser, useUserLoginState, UserLoginState } from '../../hook/use-user';
import { StatisticsData } from '../../types/backend';

export function Statistics() {
  const loginState = useUserLoginState();
  const { user } = useUser();
  const navigate = useNavigate();
  const { setError } = useContext(ErrorContext);
  const { setHeading } = useContext(PageTitleContext);
  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setHeading('Statistik');
  }, [setHeading]);

  useEffect(() => {
    if (loginState === UserLoginState.Loading) {
      return;
    }
    if (loginState !== UserLoginState.LoggedIn || user?.role !== 'ADMIN') {
      navigate('/');
      return;
    }
    fetchStatistics(setError).then(data => {
      setStats(data);
      setLoading(false);
    });
  }, [loginState, user, navigate, setError]);

  return (
    <View>
        <ErrorHandler />
        {loading ? (
          <p className="text-gray-600">Laddar...</p>
        ) : (
          <div className="bg-[#F1F2F3] border border-gray-200 rounded-lg shadow-sm p-4">
            <table className="w-full text-sm text-gray-800">
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-2">Delade resvägar</td>
                  <td className="py-2 text-right font-mono">{stats?.routesShared ?? '—'}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-2">AI-tolkningar</td>
                  <td className="py-2 text-right font-mono">{stats?.aiInterpretationQueries ?? '—'}</td>
                </tr>
                <tr>
                  <td className="py-2">Användare</td>
                  <td className="py-2 text-right font-mono">{stats?.userCount ?? '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        <div className="flex justify-end">
          <SLButton onClick={() => navigate('/')} thin>Tillbaka till startsidan</SLButton>
        </div>
    </View>
  );
}

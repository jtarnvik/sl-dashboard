import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { GtfsStatus } from '../../components/admin/gtfs-status';
import { SLButton } from '../../components/common/sl-button';
import { View } from '../../components/common/view';
import { ErrorHandler } from '../../components/error-handler';
import PageTitleContext from '../../contexts/page-title-context';
import { useUser, useUserLoginState, UserLoginState } from '../../hook/use-user';

export function GtfsStatusView() {
  const loginState = useUserLoginState();
  const { user } = useUser();
  const navigate = useNavigate();
  const { setHeading } = useContext(PageTitleContext);

  useEffect(() => {
    setHeading('GTFS status');
  }, [setHeading]);

  useEffect(() => {
    if (loginState === UserLoginState.Loading) {
      return;
    }
    if (loginState !== UserLoginState.LoggedIn || user?.role !== 'ADMIN') {
      navigate('/');
    }
  }, [loginState, user, navigate]);

  return (
    <View>
        <ErrorHandler />
        <GtfsStatus />
        <div className="flex justify-end">
          <SLButton onClick={() => navigate('/')} thin>Tillbaka till startsidan</SLButton>
        </div>
    </View>
  );
}

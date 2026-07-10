import { Box } from '@mui/material';
import { MyEasyHandLogo } from './MyEasyHandLogo';

/** Logo for light backgrounds (login, print, mobile sidebar) */
const LogoDark = () => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <MyEasyHandLogo variant="login" size="lg" />
  </Box>
);

export default LogoDark;

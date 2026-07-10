import { Box } from '@mui/material';
import { MyEasyHandLogo } from './MyEasyHandLogo';

/** Logo for admin header (primary bar) */
const Logo = () => (
  <Box sx={{ height: 64, display: 'flex', alignItems: 'center', px: 1 }}>
    <MyEasyHandLogo variant="onDark" size="md" />
  </Box>
);

export default Logo;

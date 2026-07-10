import Typography, { TypographyProps } from '@mui/material/Typography';
import { styled } from '@mui/material/styles';

const StyledLabel = styled(Typography)({
  marginBottom: '5px',
  marginTop: '25px',
  display: 'block',
});

const CustomFormLabel = ({ htmlFor, ...props }: TypographyProps) => (
  <StyledLabel variant="subtitle1" fontWeight={500} component="label" htmlFor={htmlFor} {...props} />
);

export default CustomFormLabel;

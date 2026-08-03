import { Checkbox, type CheckboxProps, styled } from '@mui/material'
import type { ReactNode } from 'react'

const BoxIcon = styled('span')(({ theme }) => ({
  width: 22,
  height: 22,
  borderRadius: 7,
  border: `2px solid ${theme.palette.primary.main}`,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 6px 14px rgba(47, 39, 36, 0.15)',
  background: 'linear-gradient(135deg, rgba(255,255,255,0.9), #f3ece4)',
  transition: 'transform 120ms ease, box-shadow 120ms ease',
}))

const CheckedIcon = styled(BoxIcon)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
  borderColor: theme.palette.primary.dark,
  boxShadow: '0 8px 18px rgba(47, 125, 109, 0.35)',
  '&::after': {
    content: '""',
    width: 10,
    height: 6,
    borderLeft: '2px solid #fff',
    borderBottom: '2px solid #fff',
    transform: 'rotate(-45deg) translateY(-1px)',
  },
}))

const renderIcon = (node: ReactNode) => node

const StyledCheckbox = (props: CheckboxProps) => {
  return (
    <Checkbox
      {...props}
      disableRipple
      icon={renderIcon(<BoxIcon />)}
      checkedIcon={renderIcon(<CheckedIcon />)}
      sx={{
        padding: 0.25,
        '&:hover': {
          backgroundColor: 'transparent',
        },
      }}
    />
  )
}

export default StyledCheckbox

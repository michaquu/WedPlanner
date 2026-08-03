import { CircularProgress, Stack, Typography } from '@mui/material'

const ProjectLoading = () => (
  <Stack spacing={1.5} sx={{ alignItems: 'center', paddingY: 6 }}>
    <CircularProgress size={28} />
    <Typography variant="body2" color="text.secondary">
      Ladowanie projektu...
    </Typography>
  </Stack>
)

export default ProjectLoading


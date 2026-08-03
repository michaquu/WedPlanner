import { Box, Button, Stack, Typography } from '@mui/material'

interface MissingProjectProps {
  projectId: string
  onCreate: () => void
}

const MissingProject = ({ projectId, onCreate }: MissingProjectProps) => (
  <Box className="missing-project">
    <Stack spacing={2}>
      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        Brak projektu
      </Typography>
      <Typography variant="body2" color="text.secondary">
        W bazie nie ma danych dla ID: {projectId || 'brak'}. Mozesz utworzyc nowy projekt lub
        wpisac inne ID w ustawieniach.
      </Typography>
      <Button variant="contained" onClick={onCreate}>
        Utworz projekt
      </Button>
    </Stack>
  </Box>
)

export default MissingProject


// Arranque local: levanta la app Express en un puerto (desarrollo / hosts con Node).
import app from "./app.js";

const PORT = process.env.PORT || 5173;

app.listen(PORT, () => {
  console.log(`AMJP escuchando en http://localhost:${PORT}/`);
  console.log(`Panel de administración: http://localhost:${PORT}/admin`);
});

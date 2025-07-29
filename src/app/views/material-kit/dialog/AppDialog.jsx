import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Box, Typography } from "@mui/material";
import axios from "axios";
import useAuth from "app/hooks/useAuth";

export default function ClientReservationCalendar() {
  const [events, setEvents] = useState([]);
  const { role, user } = useAuth();
  const token = localStorage.getItem("token");

  // 🔁 Charger les rendez-vous du client
  useEffect(() => {
    if (role === "CLIENT" && user?.id) {
      axios
        .get("http://localhost:4000/rendezvous/client", {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then((res) => {
          const formattedEvents = res.data.map((rdv) => ({
            title:
              rdv.status === "confirmé"
                ? "✅ RDV confirmé"
                : "⏳ En attente de confirmation",
            start: rdv.start,
            end: rdv.end,
            backgroundColor:
              rdv.status === "confirmé" ? "#4caf50" : "#ff9800", // ✅ Vert si confirmé, orange sinon
            borderColor:
              rdv.status === "confirmé" ? "#4caf50" : "#ff9800"
          }));
          setEvents(formattedEvents);
        })
        .catch((err) => {
          console.error("❌ Erreur chargement rendez-vous client:", err);
          if (err.response?.status === 403) {
            alert("⛔ Accès refusé. Vous devez être un client connecté.");
          }
        });
    }
  }, [role, user?.id, token]);

  // 🆕 Client réserve un créneau
  const handleSelect = async (info) => {
    console.log("📆 Plage sélectionnée:", info.startStr, "→", info.endStr);

    if (!token) {
      alert("🔐 Token manquant. Veuillez vous reconnecter.");
      return;
    }

    const startTime = new Date(info.startStr);
    const endTime = new Date(info.endStr);
    const dureeMinutes = (endTime - startTime) / (1000 * 60);

    try {
      const res = await axios.post(
        "http://localhost:4000/rendezvous/reserver",
        {
          dateRdv: startTime.toISOString(),
          duree: dureeMinutes
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log("✅ Réservation réussie:", res.data);

      setEvents((prev) => [
        ...prev,
        {
          title: "⏳ En attente de confirmation",
          start: startTime.toISOString(),
          end: endTime.toISOString(),
          backgroundColor: "#ff9800",
          borderColor: "#ff9800"
        }
      ]);

      alert("🗓️ Votre demande de rendez-vous a été envoyée avec succès !");
    } catch (err) {
      console.error("❌ Erreur réservation:", err);
      if (err.response) {
        alert(`Erreur: ${err.response.status} - ${err.response.data.message}`);
      } else {
        alert("Erreur lors de la réservation !");
      }
    }
  };

  return (
    <Box m={2}>
      <Typography variant="h5" gutterBottom>
        Réserver un rendez-vous
      </Typography>

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay"
        }}
        selectable={true}
        selectMirror={true}
        select={handleSelect}
        events={events}
        allDaySlot={false}
        height="auto"
      />
    </Box>
  );
}

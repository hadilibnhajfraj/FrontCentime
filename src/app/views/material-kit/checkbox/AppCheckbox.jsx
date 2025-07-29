import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Box, Typography } from "@mui/material";
import axios from "axios";
import useAuth from "app/hooks/useAuth"; // ✅ pour récupérer le rôle et l'utilisateur connecté

export default function DisponibiliteCalendar() {
  const [events, setEvents] = useState([]);
  const { role, user } = useAuth(); // ✅ récupération du rôle et de l'utilisateur connecté

  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchData = async () => {
      try {
        // ✅ 1. Charger les disponibilités (accessible à tous les rôles)
        const dispoRes = await axios.get("http://localhost:4000/disponibilite/all");
        const disponibilites = dispoRes.data.map((item) => ({
          title: `Agent ${item.agentName || item.agentId}`,
          start: item.start,
          end: item.end,
          backgroundColor: "#2196f3",
          borderColor: "#2196f3"
        }));

        // ✅ 2. Charger les RDVs uniquement si ADMIN
        let rdvs = [];
        if (role === "ADMIN") {
          const rdvRes = await axios.get("http://localhost:4000/rendezvous/admin", {
            headers: { Authorization: `Bearer ${token}` }
          });

          rdvs = rdvRes.data.map((rdv) => ({
            title: rdv.title,
            start: rdv.start,
            end: rdv.end,
            backgroundColor: rdv.backgroundColor,
            borderColor: rdv.borderColor
          }));
        }

        setEvents([...disponibilites, ...rdvs]);
      } catch (err) {
        if (err.response?.status === 403) {
          console.warn("⛔ Accès refusé : vous n'êtes pas administrateur");
        } else {
          console.error("Erreur lors du chargement :", err);
        }
      }
    };

    fetchData();
  }, [role, user]);

  // Lorsqu'un agent sélectionne un créneau
  const handleSelect = async (info) => {
    const token = localStorage.getItem("token");

    if (role !== "AGENT" || !user?.id) {
      alert("Seuls les agents connectés peuvent définir leurs disponibilités !");
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:4000/disponibilite/",
        {
          agentId: user.id,
          start: info.startStr,
          end: info.endStr
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setEvents((prev) => [
        ...prev,
        {
          title: `Agent ${user.id}`,
          start: res.data.start,
          end: res.data.end,
          backgroundColor: "#2196f3",
          borderColor: "#2196f3"
        }
      ]);
    } catch (err) {
      console.error("Erreur lors de l'enregistrement :", err);
      alert("Erreur lors de l'enregistrement de la disponibilité");
    }
  };

  return (
    <>
      <Box display="flex" gap={2} mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <Box width={12} height={12} bgcolor="#2196f3" borderRadius={1} />
          <Typography>Disponibilité Agent</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Box width={12} height={12} bgcolor="#4caf50" borderRadius={1} />
          <Typography>Réservation Client</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Box width={12} height={12} bgcolor="#ff9800" borderRadius={1} />
          <Typography>RDV Agent</Typography>
        </Box>
      </Box>

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        selectable={role === "AGENT"}
        selectMirror
        select={handleSelect}
        events={events}
        height="auto"
      />
    </>
  );
}
